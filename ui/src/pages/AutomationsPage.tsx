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

/* ── How Autopilot Works ── */
const autopilotSteps = [
  {
    number: '01',
    title: 'Trigger',
    description: 'A business event fires — new message, new order, scheduled task, or an agent recommendation.',
    icon: Zap,
  },
  {
    number: '02',
    title: 'Draft',
    description: 'The responsible agent creates a draft action — reply, invoice, status update, follow-up — never executes directly.',
    icon: FileCheck,
  },
  {
    number: '03',
    title: 'Review',
    description: 'You see the draft in your queue. Approve, edit, or reject. One tap on WhatsApp or the web dashboard.',
    icon: Eye,
  },
  {
    number: '04',
    title: 'Execute',
    description: 'Approved actions fire immediately. Rejected ones are logged. Every outcome updates the audit trail.',
    icon: CheckCircle2,
  },
] as const

/* ── Safety guardrails ── */
const guardrails = [
  { icon: Shield, label: 'Draft-first by default', desc: 'Nothing sends without your approval' },
  { icon: AlertTriangle, label: 'Kill switch', desc: 'One tap halts all AI execution instantly' },
  { icon: RotateCcw, label: 'Retry with DLQ', desc: '3 retries, then dead-letter queue. No silent failures' },
  { icon: Clock, label: 'ROI gate', desc: `Projected ROI must be ≥ ${KITZ_MANIFEST.governance.roiMinimum} or agent recommends manual` },
] as const

/* ── What KITZ Can Do — showcase cards ── */
const kitzCapabilities = [
  {
    icon: MessageSquare,
    title: 'Talk to Your Customers',
    description: 'WhatsApp, email, SMS — all from one place. AI drafts replies, you approve with one tap.',
    example: '"Send a WhatsApp to Maria about her order"',
    color: 'from-green-500 to-emerald-600',
    stats: '7 automations',
  },
  {
    icon: Receipt,
    title: 'Get Paid Faster',
    description: 'Generate invoices, send payment links, track who owes you. Auto-invoice when orders confirm.',
    example: '"Create an invoice for Carlos — 3 t-shirts at $25"',
    color: 'from-emerald-500 to-teal-600',
    stats: '6 automations',
  },
  {
    icon: Palette,
    title: 'Create Marketing Content',
    description: 'Pitch decks, flyers, landing pages, emails, bio links — all branded with your colors.',
    example: '"Build me a landing page for my new product"',
    color: 'from-rose-500 to-pink-600',
    stats: '7 automations',
  },
  {
    icon: TrendingUp,
    title: 'Grow Your Pipeline',
    description: 'Score leads, track conversions, get AI recommendations on your next best move.',
    example: '"Who should I follow up with today?"',
    color: 'from-blue-500 to-indigo-600',
    stats: '7 automations',
  },
  {
    icon: Megaphone,
    title: 'Run Campaigns',
    description: 'Multi-touch campaigns across WhatsApp, email, and SMS. A/B test and track ROI.',
    example: '"Launch a promo blast for Black Friday"',
    color: 'from-pink-500 to-fuchsia-600',
    stats: '6 automations',
  },
  {
    icon: Users,
    title: 'Know Your Customers',
    description: 'Auto-tag contacts, build segments, personalize every message with CRM data.',
    example: '"Show me all VIP customers who bought last month"',
    color: 'from-purple-500 to-violet-600',
    stats: '6 automations',
  },
  {
    icon: Globe,
    title: 'Deploy to the Web',
    description: 'Push landing pages and catalogs live. Generate bio links for Instagram.',
    example: '"Deploy my catalog as a website"',
    color: 'from-cyan-500 to-blue-600',
    stats: '4 automations',
  },
  {
    icon: Sparkles,
    title: 'AI That Works for You',
    description: '15 agents monitor your business 24/7. Reports delivered to WhatsApp on schedule.',
    example: '"How\'s my week looking?"',
    color: 'from-amber-500 to-orange-600',
    stats: '5 automations',
  },
] as const

type StatusFilter = 'all' | 'live' | 'coming-soon'

export function AutomationsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const stats = getAutomationStats()
  const sendMessage = useOrbStore((s) => s.sendMessage)

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
        title="Automations"
        description="Every automation follows the same trust cycle — trigger, draft, review, execute"
      />

      {/* ── What KITZ Can Do — Capability Showcase ── */}
      <section className="mt-6 mb-10">
        <div className="mb-5 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-bold text-black">What KITZ Can Do</h3>
        </div>
        <p className="mb-5 text-sm text-gray-500">
          Tap any example to try it — KITZ handles the rest
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kitzCapabilities.map((cap) => {
            const Icon = cap.icon
            return (
              <div
                key={cap.title}
                className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Icon + title */}
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br', cap.color)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h4 className="mt-3 text-sm font-bold text-black">{cap.title}</h4>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-gray-500">{cap.description}</p>

                {/* Try it example — clickable */}
                <button
                  onClick={() => void sendMessage(cap.example.replace(/"/g, ''), 'default')}
                  className="mt-3 rounded-lg bg-purple-50 px-3 py-2 text-left text-[11px] font-medium text-purple-700 transition hover:bg-purple-100 group-hover:ring-1 group-hover:ring-purple-200"
                >
                  <span className="text-purple-400">Try: </span>
                  {cap.example}
                </button>

                {/* Stats */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-gray-400">{cap.stats}</span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">Ready</span>
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
            <p className="mt-0.5 text-xs text-gray-500">Total Automations</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.live}</p>
            <p className="mt-0.5 text-xs text-gray-500">Live Now</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.comingSoon}</p>
            <p className="mt-0.5 text-xs text-gray-500">Coming Soon</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.agents}</p>
            <p className="mt-0.5 text-xs text-gray-500">Agents Monitoring</p>
          </div>
        </div>
      </section>

      {/* ── Automation Catalog ── */}
      <section className="mt-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-black">Automated Workflows</h3>
            <p className="text-sm text-gray-500">
              {stats.categories} categories of workflows — agents monitor and manage each one
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
                {f === 'all' ? 'All' : f === 'live' ? 'Live' : 'Coming Soon'}
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
        <h3 className="text-lg font-bold text-black mb-4">How Automations Work</h3>
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
                <h4 className="mt-3 text-sm font-semibold text-black">{step.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{step.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Guardrails ── */}
      <section className="mt-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
        <h3 className="text-lg font-bold">Safety Guardrails</h3>
        <p className="mt-1 text-sm text-white/70">
          Built-in protections ensure automations never act beyond their authority
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {guardrails.map((g) => {
            const Icon = g.icon
            return (
              <div key={g.label} className="flex items-start gap-3 rounded-xl bg-white/10 p-4">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/80" />
                <div>
                  <span className="text-sm font-semibold">{g.label}</span>
                  <p className="mt-0.5 text-xs text-white/60">{g.desc}</p>
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
          <h3 className="text-lg font-bold text-black">For External AI Agents</h3>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          External agents can trigger KITZ automations via the API. All requests go through the
          same draft-first governance — no external agent can bypass human approval.
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
          <span className="font-mono">Full automation manifest</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </section>
    </div>
  )
}
