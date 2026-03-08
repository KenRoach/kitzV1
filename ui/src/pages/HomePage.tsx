import { UserPlus, Link, Receipt, MessageCircle, TrendingUp, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useOrbStore } from '@/stores/orbStore'
import { useTranslation } from '@/lib/i18n'
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
  titleKey: string
  descKey: string
  color: FeatureColor
  action: string
}

const quickActions: QuickAction[] = [
  { icon: UserPlus, titleKey: 'home.addCustomer', descKey: 'home.addCustomerDesc', color: 'purple', action: 'workspace' },
  { icon: Link, titleKey: 'home.createCheckout', descKey: 'home.createCheckoutDesc', color: 'blue', action: 'workspace' },
  { icon: Receipt, titleKey: 'home.trackOrder', descKey: 'home.trackOrderDesc', color: 'pink', action: 'workspace' },
  { icon: MessageCircle, titleKey: 'home.connectWhatsApp', descKey: 'home.connectWhatsAppDesc', color: 'emerald', action: 'talk' },
  { icon: TrendingUp, titleKey: 'home.seeWhatsHappening', descKey: 'home.seeWhatsHappeningDesc', color: 'orange', action: 'activity' },
  { icon: ShieldCheck, titleKey: 'home.reviewDrafts', descKey: 'home.reviewDraftsDesc', color: 'amber', action: 'automations' },
]

function getGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours()
  if (hour < 12) return t('home.goodMorning')
  if (hour < 18) return t('home.goodAfternoon')
  return t('home.goodEvening')
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { t } = useTranslation()
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
      <div className="relative min-h-[200px] overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-6">
        <div className="relative z-10">
          <p className="text-sm font-medium text-gray-400">{getGreeting(t)}</p>
          <h1 className="mt-1 text-2xl font-bold text-black">{userName}</h1>
          <MissionBlock />
        </div>
      </div>

      {/* Quick actions */}
      <h2 className="mt-10 text-lg font-semibold text-black">{t('home.quickStart')}</h2>
      <p className="mt-0.5 text-sm text-gray-500">{t('home.quickStartDesc')}</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((qa) => (
          <FeatureCard
            key={qa.titleKey}
            icon={qa.icon}
            title={t(qa.titleKey)}
            description={t(qa.descKey)}
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
