import { useState, useEffect, useRef, useCallback } from 'react'
import { UserPlus, Link, Receipt, MessageCircle, TrendingUp, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useOrbStore } from '@/stores/orbStore'
import { Orb } from '@/components/orb/Orb'
import { FeatureCard } from '@/components/home/FeatureCard'
import { MissionBlock } from '@/components/home/MissionBlock'
import { AgentDocsSection } from '@/components/home/AgentDocsSection'
import { AgentDiscoveryBanner } from '@/components/home/AgentDiscoveryBanner'
import type { FeatureColor } from '@/components/home/FeatureCard'
import type { LucideIcon } from 'lucide-react'

interface HomePageProps {
  onNavigate: (nav: string) => void
  showKitz?: boolean
}

interface QuickAction {
  icon: LucideIcon
  title: string
  description: string
  color: FeatureColor
  action: string
}

const quickActions: QuickAction[] = [
  {
    icon: UserPlus,
    title: 'Add a Customer',
    description: 'Import your first contact and start building your pipeline',
    color: 'purple',
    action: 'workspace',
  },
  {
    icon: Link,
    title: 'Create Checkout Link',
    description: 'Generate a payment link and send it via WhatsApp in seconds',
    color: 'blue',
    action: 'workspace',
  },
  {
    icon: Receipt,
    title: 'Track an Order',
    description: 'Log a sale and let AI agents handle fulfillment updates',
    color: 'pink',
    action: 'workspace',
  },
  {
    icon: MessageCircle,
    title: 'Connect WhatsApp',
    description: 'Link your business WhatsApp and let AI draft your replies',
    color: 'emerald',
    action: 'talk',
  },
  {
    icon: TrendingUp,
    title: 'See What\'s Happening',
    description: 'View real-time activity from your AI agents and business',
    color: 'orange',
    action: 'activity',
  },
  {
    icon: ShieldCheck,
    title: 'Review AI Drafts',
    description: 'Approve or edit messages your agents have prepared for you',
    color: 'amber',
    action: 'automations',
  },
]

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/* ── Kitz graceful floating ── */
// Kitz floats ONLY in the RIGHT portion of the hero card (the empty white space).
// He must never drift over the text/mission content on the left.
const SPEED = 0.18        // very gentle drift — graceful (in % per frame)
const PAD_RIGHT = 14      // % horizontal padding from right edge (bubble + aura clearance)
const PAD_TOP = 28        // % top padding (thought bubble extends above center)
const PAD_BOTTOM = 22     // % bottom padding (feet + aura extend below center)
const RIGHT_ZONE_START = 0.60  // Kitz zone starts at 60% of card width (well clear of text)

// Sleep position as fraction of container (center of right-zone white space)
const SLEEP_X_FRAC = 0.76
const SLEEP_Y_FRAC = 0.48  // slightly above center to keep feet within card
const WAKE_DELAY = 4200  // ms Kitz pauses at sleep spot before drifting (~matches 4s wake-up in Orb)

function useFloatingKitz(_containerRef: React.RefObject<HTMLDivElement | null>, paused: boolean) {
  // pos stores percentages (0–100) of container, NOT pixels
  // This keeps sleeping (CSS %) and awake (JS %) in the same coordinate space
  const [pos, setPos] = useState({ x: SLEEP_X_FRAC * 100, y: SLEEP_Y_FRAC * 100 })
  const velRef = useRef({ dx: SPEED, dy: SPEED * 0.6 })
  const posRef = useRef({ x: SLEEP_X_FRAC * 100, y: SLEEP_Y_FRAC * 100 })
  const rafRef = useRef<number>(0)
  const pausedRef = useRef(paused)
  const timeRef = useRef(0)
  const wasPausedRef = useRef(paused)
  const wakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  pausedRef.current = paused

  // Compute bounds as percentages — asymmetric padding for thought bubble (top) and feet (bottom)
  const getBoundsPercent = useCallback(() => {
    return {
      minX: RIGHT_ZONE_START * 100,
      maxX: 100 - PAD_RIGHT,
      minY: PAD_TOP,
      maxY: 100 - PAD_BOTTOM,
    }
  }, [])

  const animate = useCallback(() => {
    if (pausedRef.current) return

    const b = getBoundsPercent()
    if (!b) {
      rafRef.current = requestAnimationFrame(animate)
      return
    }

    const p = posRef.current
    const v = velRef.current

    // Gentle sine wave for organic motion
    timeRef.current += 0.008
    const waveDx = Math.sin(timeRef.current * 1.3) * 0.02
    const waveDy = Math.cos(timeRef.current * 0.9) * 0.015

    let nx = p.x + v.dx + waveDx
    let ny = p.y + v.dy + waveDy

    // Soft bounce at edges
    if (nx <= b.minX || nx >= b.maxX) {
      v.dx *= -0.95
    }
    if (ny <= b.minY || ny >= b.maxY) {
      v.dy *= -0.95
    }

    // Hard clamp — Kitz can never exceed bounds (including wave displacement)
    nx = Math.max(b.minX, Math.min(b.maxX, nx))
    ny = Math.max(b.minY, Math.min(b.maxY, ny))

    posRef.current = { x: nx, y: ny }
    setPos({ x: nx, y: ny })
    rafRef.current = requestAnimationFrame(animate)
  }, [getBoundsPercent])

  // Handle wake/sleep transitions
  useEffect(() => {
    const wasPaused = wasPausedRef.current
    wasPausedRef.current = paused

    if (wakeTimerRef.current) {
      clearTimeout(wakeTimerRef.current)
      wakeTimerRef.current = null
    }

    if (paused) {
      cancelAnimationFrame(rafRef.current)
      return
    }

    if (wasPaused && !paused) {
      // Waking up — start from the exact sleep position (same % coords)
      const sleepX = SLEEP_X_FRAC * 100
      const sleepY = SLEEP_Y_FRAC * 100
      posRef.current = { x: sleepX, y: sleepY }
      setPos({ x: sleepX, y: sleepY })

      // Fresh gentle velocity — bias rightward so Kitz doesn't drift into text
      const angle = (Math.random() - 0.5) * Math.PI  // -90° to +90° (rightward half)
      velRef.current = { dx: Math.cos(angle) * SPEED * 0.3, dy: Math.sin(angle) * SPEED * 0.2 }

      // Pause at sleep spot while waking up visually, then start drifting
      wakeTimerRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(animate)
      }, WAKE_DELAY)
      return () => {
        if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current)
        cancelAnimationFrame(rafRef.current)
      }
    }

    // Normal start
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [paused, animate])

  // Initial position on mount
  useEffect(() => {
    posRef.current = { x: SLEEP_X_FRAC * 100, y: SLEEP_Y_FRAC * 100 }
    setPos({ x: SLEEP_X_FRAC * 100, y: SLEEP_Y_FRAC * 100 })
    if (!paused) {
      wakeTimerRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(animate)
      }, WAKE_DELAY)
    }
    return () => {
      cancelAnimationFrame(rafRef.current)
      if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { pos }
}

export function HomePage({ onNavigate, showKitz = true }: HomePageProps) {
  const user = useAuthStore((s) => s.user)
  const openTalk = useOrbStore((s) => s.open)
  const orbState = useOrbStore((s) => s.state)
  const teleportToChat = useOrbStore((s) => s.teleportToChat)
  const loadChat = useOrbStore((s) => s.loadChat)
  const [orbTeleporting, setOrbTeleporting] = useState(false)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userName = user?.email?.split('@')[0] ?? 'there'
  const heroRef = useRef<HTMLDivElement>(null)
  const sleeping = !showKitz
  const { pos: kitzPos } = useFloatingKitz(heroRef, sleeping)

  const handleAction = (action: string) => {
    if (action === 'talk') {
      openTalk()
    } else {
      onNavigate(action)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 pb-12">
      {/* Hero — greeting + mission + Kitz bouncing */}
      <div
        ref={heroRef}
        data-orb-home
        className="relative min-h-[200px] overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-6"
      >
        {/* Text content */}
        <div className="relative z-10">
          <p className="text-sm font-medium text-gray-400">{getGreeting()}</p>
          <h1 className="mt-1 text-2xl font-bold text-black">{userName}</h1>
          <MissionBlock />
        </div>
        {/* Kitz — puffs out when teleporting to chatbox, clickable to focus chat */}
        <div
          className={`absolute z-20 ${(orbState === 'thinking' || orbTeleporting) ? 'kitz-puff-out' : ''}`}
          style={{
            left: sleeping ? `${SLEEP_X_FRAC * 100}%` : `${kitzPos.x}%`,
            top: sleeping ? `${SLEEP_Y_FRAC * 100}%` : `${kitzPos.y}%`,
            transform: 'translate(-50%, -50%)',
            cursor: sleeping ? undefined : 'pointer',
            transition: sleeping
              ? 'left 1s cubic-bezier(0.4, 0, 0.2, 1), top 1s cubic-bezier(0.4, 0, 0.2, 1)'
              : 'left 0.35s cubic-bezier(0.25, 0.1, 0.25, 1), top 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
            willChange: sleeping ? undefined : 'left, top',
          }}
          onClick={() => {
            if (sleeping) return
            // Single click: full puff teleport to chatbox. Double click handled below.
            if (clickTimerRef.current) return // double-click pending, skip
            clickTimerRef.current = setTimeout(() => {
              clickTimerRef.current = null
              // Trigger the full puff teleport (smoke + sparkles + PUFF text + glow)
              setOrbTeleporting(true)
              teleportToChat()
              // Hide hero Kitz while FloatingOrb handles the animation
              setTimeout(() => setOrbTeleporting(false), 3500)
            }, 250) // wait 250ms to rule out double-click
          }}
          onDoubleClick={() => {
            if (sleeping) return
            // Double click: puff teleport + exaggerated loading bar in chatbox
            if (clickTimerRef.current) {
              clearTimeout(clickTimerRef.current)
              clickTimerRef.current = null
            }
            setOrbTeleporting(true)
            teleportToChat()
            loadChat()
            setTimeout(() => setOrbTeleporting(false), 3500)
          }}
        >
          <Orb sleeping={sleeping} disableClick />
        </div>
      </div>

      {/* Quick actions */}
      <h2 className="mt-10 text-lg font-semibold text-black">Quick Start</h2>
      <p className="mt-0.5 text-sm text-gray-500">Get running in under 10 minutes</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((qa) => (
          <FeatureCard
            key={qa.title}
            icon={qa.icon}
            title={qa.title}
            description={qa.description}
            color={qa.color}
            onClick={() => handleAction(qa.action)}
          />
        ))}
      </div>

      {/* Agent documentation */}
      <AgentDocsSection onNavigate={onNavigate} />

      {/* AI agent discovery */}
      <AgentDiscoveryBanner />
    </div>
  )
}
