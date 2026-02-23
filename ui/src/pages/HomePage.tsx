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
// Kitz floats only in the RIGHT half of the hero card (the empty space).
const SPEED = 0.18        // very gentle drift — graceful (in % per frame)
const PADDING_PCT = 4     // % from edges to keep Kitz away from borders
const RIGHT_HALF_START = 0.48  // Kitz zone starts at 48% of card width

// Sleep position as fraction of container (center of right-half white space)
const SLEEP_X_FRAC = 0.74
const SLEEP_Y_FRAC = 0.50
const WAKE_DELAY = 800  // ms Kitz pauses at sleep spot before drifting

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

  // Compute bounds as percentages — pure %, no pixel math needed
  const getBoundsPercent = useCallback(() => {
    return {
      minX: RIGHT_HALF_START * 100,
      maxX: 100 - PADDING_PCT,
      minY: PADDING_PCT,
      maxY: 100 - PADDING_PCT,
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
      nx = Math.max(b.minX, Math.min(b.maxX, nx))
    }
    if (ny <= b.minY || ny >= b.maxY) {
      v.dy *= -0.95
      ny = Math.max(b.minY, Math.min(b.maxY, ny))
    }

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

      // Fresh gentle velocity in a random direction
      const angle = Math.random() * Math.PI * 2
      velRef.current = { dx: Math.cos(angle) * SPEED * 0.4, dy: Math.sin(angle) * SPEED * 0.25 }

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
        className="relative min-h-[200px] overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-6"
      >
        {/* Text content */}
        <div className="relative z-10">
          <p className="text-sm font-medium text-gray-400">{getGreeting()}</p>
          <h1 className="mt-1 text-2xl font-bold text-black">{userName}</h1>
          <MissionBlock />
        </div>
        {/* Kitz — both states use % + translate(-50%,-50%) so transitions are seamless */}
        <div
          className="absolute z-20"
          style={{
            left: sleeping ? `${SLEEP_X_FRAC * 100}%` : `${kitzPos.x}%`,
            top: sleeping ? `${SLEEP_Y_FRAC * 100}%` : `${kitzPos.y}%`,
            transform: 'translate(-50%, -50%)',
            transition: sleeping
              ? 'left 1s cubic-bezier(0.4, 0, 0.2, 1), top 1s cubic-bezier(0.4, 0, 0.2, 1)'
              : 'left 0.35s cubic-bezier(0.25, 0.1, 0.25, 1), top 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
            willChange: sleeping ? undefined : 'left, top',
          }}
        >
          <Orb sleeping={sleeping} />
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
