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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/home/PageHeader'
import { AutoPilotTab } from '@/components/autopilot/AutoPilotTab'
import { AutomationCategoryGroup } from '@/components/autopilot/AutomationCategoryGroup'
import { KITZ_MANIFEST } from '@/content/kitz-manifest'
import { AUTOMATION_CATALOG, getAutomationStats } from '@/content/automation-catalog'

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

type StatusFilter = 'all' | 'live' | 'coming-soon'

export function AutomationsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const stats = getAutomationStats()

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
