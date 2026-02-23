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

/* ── Kitz bouncing physics ── */
const KITZ_WIDTH = 150
const KITZ_HEIGHT = 140
const SPEED = 0.36
const PADDING = 12

function useBouncingKitz(containerRef: React.RefObject<HTMLDivElement | null>, paused: boolean) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const vel = useRef({ dx: SPEED, dy: SPEED * 0.6 })
  const posRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number>(0)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  const animate = useCallback(() => {
    if (pausedRef.current) return

    const container = containerRef.current
    if (!container) {
      rafRef.current = requestAnimationFrame(animate)
      return
    }

    const bounds = container.getBoundingClientRect()
    const minX = PADDING
    const maxX = bounds.width - KITZ_WIDTH - PADDING
    const minY = PADDING
    const maxY = bounds.height - KITZ_HEIGHT - PADDING

    const p = posRef.current
    const v = vel.current

    let nx = p.x + v.dx
    let ny = p.y + v.dy

    if (nx <= minX || nx >= maxX) {
      v.dx *= -1
      nx = Math.max(minX, Math.min(maxX, nx))
    }
    if (ny <= minY || ny >= maxY) {
      v.dy *= -1
      ny = Math.max(minY, Math.min(maxY, ny))
    }

    posRef.current = { x: nx, y: ny }
    setPos({ x: nx, y: ny })
    rafRef.current = requestAnimationFrame(animate)
  }, [containerRef])

  useEffect(() => {
    if (paused) {
      cancelAnimationFrame(rafRef.current)
      return
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [paused, animate])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      const bounds = container.getBoundingClientRect()
      const startX = Math.min(bounds.width * 0.65, bounds.width - KITZ_WIDTH - PADDING)
      const startY = Math.max(PADDING, bounds.height * 0.15)
      posRef.current = { x: startX, y: startY }
      setPos({ x: startX, y: startY })
    }
    if (!paused) {
      rafRef.current = requestAnimationFrame(animate)
    }
    return () => cancelAnimationFrame(rafRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return pos
}

export function HomePage({ onNavigate, showKitz = true }: HomePageProps) {
  const user = useAuthStore((s) => s.user)
  const openTalk = useOrbStore((s) => s.open)
  const userName = user?.email?.split('@')[0] ?? 'there'
  const heroRef = useRef<HTMLDivElement>(null)
  const sleeping = !showKitz
  const kitzPos = useBouncingKitz(heroRef, sleeping)

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
        className="relative min-h-[220px] overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-6"
      >
        {/* Text content */}
        <div className="relative z-10">
          <p className="text-sm font-medium text-gray-400">{getGreeting()}</p>
          <h1 className="mt-1 text-2xl font-bold text-black">{userName}</h1>
          <MissionBlock />
        </div>
        {/* Kitz — bounces inside hero card, in front of content */}
        <div
          className="absolute z-20"
          style={{
            left: kitzPos.x,
            top: kitzPos.y,
            willChange: 'left, top',
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
