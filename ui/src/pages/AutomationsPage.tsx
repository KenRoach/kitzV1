import { useState } from 'react'
import {
  Zap,
  Shield,
  FileCheck,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Code,
  ExternalLink,
  Filter,
  MessageSquare,
  Receipt,
  Palette,
  TrendingUp,
  Globe,
  Users,
  Megaphone,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/home/PageHeader'
import { AutoPilotTab } from '@/components/autopilot/AutoPilotTab'
import { AutomationCategoryGroup } from '@/components/autopilot/AutomationCategoryGroup'
import { KITZ_MANIFEST } from '@/content/kitz-manifest'
import { AUTOMATION_CATALOG, getAutomationStats } from '@/content/automation-catalog'
import { useOrbStore } from '@/stores/orbStore'
import { useTranslation } from '@/lib/i18n'

/* ── How Autopilot Works ── */
const autopilotSteps = [
  { number: '01', titleKey: 'automations.trigger', descKey: 'automations.triggerDesc', icon: Zap },
  { number: '02', titleKey: 'automations.draftStep', descKey: 'automations.draftStepDesc', icon: FileCheck },
  { number: '03', titleKey: 'automations.review', descKey: 'automations.reviewDesc', icon: Eye },
  { number: '04', titleKey: 'automations.execute', descKey: 'automations.executeDesc', icon: CheckCircle2 },
] as const

/* ── Safety guardrails ── */
const guardrails = [
  { icon: Shield, labelKey: 'automations.draftFirst', descKey: 'automations.draftFirstDesc' },
  { icon: AlertTriangle, labelKey: 'automations.killSwitch', descKey: 'automations.killSwitchDesc' },
  { icon: RotateCcw, labelKey: 'automations.retryDLQ', descKey: 'automations.retryDLQFullDesc' },
  { icon: Clock, labelKey: 'automations.roiGate', descKey: '' },
] as const

/* ── What KITZ Can Do — showcase cards ── */
const kitzCapabilities = [
  {
    icon: MessageSquare,
    titleKey: 'automations.talkToCustomers',
    descKey: 'automations.talkToCustomersDesc',
    example: '"Send a WhatsApp to Maria about her order"',
    color: 'from-purple-500 to-purple-600',
    statsCount: '7',
  },
  {
    icon: Receipt,
    titleKey: 'automations.getPaidFaster',
    descKey: 'automations.getPaidFasterDesc',
    example: '"Create an invoice for Carlos — 3 t-shirts at $25"',
    color: 'from-purple-400 to-purple-600',
    statsCount: '6',
  },
  {
    icon: Palette,
    titleKey: 'automations.createMarketing',
    descKey: 'automations.createMarketingDesc',
    example: '"Build me a landing page for my new product"',
    color: 'from-purple-600 to-purple-700',
    statsCount: '7',
  },
  {
    icon: TrendingUp,
    titleKey: 'automations.growPipeline',
    descKey: 'automations.growPipelineDesc',
    example: '"Who should I follow up with today?"',
    color: 'from-gray-500 to-gray-600',
    statsCount: '7',
  },
  {
    icon: Megaphone,
    titleKey: 'automations.runCampaigns',
    descKey: 'automations.runCampaignsDesc',
    example: '"Launch a promo blast for Black Friday"',
    color: 'from-purple-500 to-purple-700',
    statsCount: '6',
  },
  {
    icon: Users,
    titleKey: 'automations.knowCustomers',
    descKey: 'automations.knowCustomersDesc',
    example: '"Show me all VIP customers who bought last month"',
    color: 'from-gray-400 to-gray-600',
    statsCount: '6',
  },
  {
    icon: Globe,
    titleKey: 'automations.deployWeb',
    descKey: 'automations.deployWebDesc',
    example: '"Deploy my catalog as a website"',
    color: 'from-purple-500 to-purple-700',
    statsCount: '4',
  },
  {
    icon: Sparkles,
    titleKey: 'automations.aiWorksForYou',
    descKey: 'automations.aiWorksForYouDesc',
    example: '"How\'s my week looking?"',
    color: 'from-purple-400 to-purple-500',
    statsCount: '5',
  },
] as const

type StatusFilter = 'all' | 'live' | 'coming-soon'

export function AutomationsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const stats = getAutomationStats()
  const sendMessage = useOrbStore((s) => s.sendMessage)
  const { t } = useTranslation()

  const filteredCatalog = AUTOMATION_CATALOG
    .map((group) => ({
      ...group,
      items: statusFilter === 'all'
        ? group.items
        : group.items.filter((i) => i.status === statusFilter),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 pb-12">
      <PageHeader
        title={t('automations.title')}
        description={t('automations.description')}
      />

      {/* ── What KITZ Can Do — Capability Showcase ── */}
      <section className="mt-6 mb-10">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-black">{t('automations.whatKitzCanDo')}</h3>
        </div>
        <p className="mb-5 text-sm text-gray-500">
          {t('automations.tapToTry')}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kitzCapabilities.map((cap) => {
            const Icon = cap.icon
            return (
              <div
                key={cap.titleKey}
                className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Icon + title */}
                <Icon className="h-5 w-5 text-purple-600" />
                <h4 className="mt-3 text-sm font-bold text-black">{t(cap.titleKey)}</h4>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-gray-500">{t(cap.descKey)}</p>

                {/* Try it example — clickable */}
                <button
                  onClick={() => void sendMessage(cap.example.replace(/"/g, ''), 'default')}
                  className="mt-3 rounded-lg bg-purple-50 px-3 py-2 text-left text-[11px] font-medium text-purple-700 transition hover:bg-purple-100 group-hover:ring-1 group-hover:ring-purple-200"
                >
                  <span className="text-purple-400">{t('try')}: </span>
                  {cap.example}
                </button>

                {/* Stats */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-gray-400">{cap.statsCount} {t('automations.automations')}</span>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">{t('ready')}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Live Auto-Pilot Command Center ── */}
      <section className="mt-2 mb-10">
        <AutoPilotTab />
      </section>

      {/* ── Stats bar ── */}
      <section className="mt-2 mb-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-black">{stats.total}</p>
            <p className="mt-0.5 text-xs text-gray-500">{t('automations.totalAutomations')}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.live}</p>
            <p className="mt-0.5 text-xs text-gray-500">{t('automations.liveNow')}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-gray-500">{stats.comingSoon}</p>
            <p className="mt-0.5 text-xs text-gray-500">{t('comingSoon')}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.agents}</p>
            <p className="mt-0.5 text-xs text-gray-500">{t('automations.agentsMonitoring')}</p>
          </div>
        </div>
      </section>

      {/* ── Automation Catalog ── */}
      <section className="mt-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-black">{t('automations.automatedWorkflows')}</h3>
            <p className="text-sm text-gray-500">
              {stats.categories} {t('automations.categories')}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
            <Filter className="ml-2 h-3.5 w-3.5 text-gray-400" />
            {(['all', 'live', 'coming-soon'] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition',
                  statusFilter === f
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-500 hover:bg-gray-100',
                )}
              >
                {f === 'all' ? t('all') : f === 'live' ? t('live') : t('comingSoon')}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredCatalog.map((group, i) => (
            <AutomationCategoryGroup
              key={group.category}
              group={group}
              defaultExpanded={i === 0}
            />
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mt-12">
        <h3 className="text-lg font-bold text-black mb-4">{t('automations.howAutomationsWork')}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {autopilotSteps.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.number}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5"
              >
                <span className="text-xs font-bold text-gray-300">{step.number}</span>
                <Icon className="mt-3 h-5 w-5 text-purple-500" />
                <h4 className="mt-3 text-sm font-semibold text-black">{t(step.titleKey)}</h4>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{t(step.descKey)}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Guardrails ── */}
      <section className="mt-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
        <h3 className="text-lg font-bold">{t('automations.safetyGuardrails')}</h3>
        <p className="mt-1 text-sm text-white/70">
          {t('automations.safetyGuardrailsDesc')}
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {guardrails.map((g) => {
            const Icon = g.icon
            return (
              <div key={g.labelKey} className="flex items-start gap-3 rounded-xl bg-white/10 p-4">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/80" />
                <div>
                  <span className="text-sm font-semibold">{t(g.labelKey)}</span>
                  <p className="mt-0.5 text-xs text-white/60">
                    {g.descKey ? t(g.descKey) : `Projected ROI must be >= ${KITZ_MANIFEST.governance.roiMinimum} or agent recommends manual`}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── For External Agents ── */}
      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-bold text-black">{t('automations.forExternalAgents')}</h3>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {t('automations.forExternalAgentsDesc')}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="rounded-lg bg-gray-50 px-4 py-2">
            <span className="font-mono text-xs text-gray-600">POST {KITZ_MANIFEST.endpoints.api}/automations/trigger</span>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-2">
            <span className="font-mono text-xs text-gray-600">GET {KITZ_MANIFEST.endpoints.api}/automations/drafts</span>
          </div>
        </div>
        <a
          href={`${window.location.origin}/.well-known/kitz.json`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-purple-500 transition hover:text-purple-400"
        >
          <span className="font-mono">{t('automations.fullManifest')}</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </section>
    </div>
  )
}
