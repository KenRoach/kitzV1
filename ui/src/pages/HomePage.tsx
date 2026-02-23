import { UserPlus, Link, Receipt, MessageCircle, TrendingUp, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useOrbStore } from '@/stores/orbStore'
import { FeatureCard } from '@/components/home/FeatureCard'
import { MissionBlock } from '@/components/home/MissionBlock'
import { AgentDocsSection } from '@/components/home/AgentDocsSection'
import { AgentDiscoveryBanner } from '@/components/home/AgentDiscoveryBanner'
import type { FeatureColor } from '@/components/home/FeatureCard'
import type { LucideIcon } from 'lucide-react'

interface HomePageProps {
  onNavigate: (nav: string) => void
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

export function HomePage({ onNavigate }: HomePageProps) {
  const user = useAuthStore((s) => s.user)
  const openTalk = useOrbStore((s) => s.open)
  const userName = user?.email?.split('@')[0] ?? 'there'

  const handleAction = (action: string) => {
    if (action === 'talk') {
      openTalk()
    } else {
      onNavigate(action)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 pb-12">
      {/* Hero — greeting + mission */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-6">
        <p className="text-sm font-medium text-gray-400">{getGreeting()}</p>
        <h1 className="mt-1 text-2xl font-bold text-black">{userName}</h1>
        <MissionBlock />
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
