import {
  Zap,
  Shield,
  FileCheck,
  RotateCcw,
  Clock,
  Eye,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Code,
  ExternalLink,
} from 'lucide-react'
import { PageHeader } from '@/components/home/PageHeader'
import { KITZ_MANIFEST } from '@/content/kitz-manifest'

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

/* ── SOPs ── */
const sopDetails = [
  {
    slug: 'new-customer-onboarding',
    title: 'New Customer Onboarding',
    owner: 'HeadGrowth',
    description: 'Automatically welcome new customers, collect key info, add to CRM, and trigger first follow-up sequence.',
    triggers: ['New WhatsApp contact', 'Form submission', 'Manual add'],
  },
  {
    slug: 'ai-battery-management',
    title: 'AI Battery Management',
    owner: 'CFO',
    description: 'Monitor daily credit usage, enforce limits, alert when running low, and recommend manual mode when ROI is insufficient.',
    triggers: ['Credit threshold reached', 'Daily limit hit', 'Low ROI detected'],
  },
  {
    slug: 'whatsapp-response-sla',
    title: 'WhatsApp Response SLA',
    owner: 'HeadCustomer',
    description: 'Ensure every WhatsApp message gets a response within the SLA. Escalate unresponded messages automatically.',
    triggers: ['Incoming message', 'SLA timer expiry', 'Escalation threshold'],
  },
  {
    slug: 'order-fulfillment',
    title: 'Order Fulfillment',
    owner: 'COO',
    description: 'Track orders from placement to delivery. Update status, notify customers, and flag delays before they become complaints.',
    triggers: ['New order', 'Status change', 'Delivery delay'],
  },
  {
    slug: 'inbox-triage',
    title: 'Inbox Triage',
    owner: 'HeadCustomer',
    description: 'Auto-classify incoming messages by urgency and type. Route to the right agent team. Flag VIP customers.',
    triggers: ['New message', 'VIP contact detected', 'Urgent keyword'],
  },
  {
    slug: 'payment-collection',
    title: 'Payment Collection',
    owner: 'CFO',
    description: 'Send payment reminders, generate checkout links, track overdue invoices, and escalate to human when needed.',
    triggers: ['Invoice overdue', 'Payment reminder schedule', 'Failed payment'],
  },
] as const

/* ── Safety guardrails ── */
const guardrails = [
  { icon: Shield, label: 'Draft-first by default', desc: 'draftOnly: true on all connectors and queues' },
  { icon: AlertTriangle, label: 'Kill switch', desc: 'KILL_SWITCH=true halts all AI execution instantly' },
  { icon: RotateCcw, label: 'Retry with DLQ', desc: '3 retries, then dead-letter queue. No silent failures' },
  { icon: Clock, label: 'ROI gate', desc: `Projected ROI must be ≥ ${KITZ_MANIFEST.governance.roiMinimum} or agent recommends manual` },
] as const

export function AutomationsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 pb-12">
      <PageHeader
        title="Automations"
        description="Every automation follows the same trust cycle — trigger, draft, review, execute"
      />

      {/* ── How it works ── */}
      <section className="mt-2">
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

      {/* ── SOPs ── */}
      <section className="mt-12 rounded-3xl bg-gray-50 p-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-bold text-black">Standard Operating Procedures</h3>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {KITZ_MANIFEST.capabilities.sops} SOPs ensure consistent quality — every customer gets the same experience
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sopDetails.map((sop) => (
            <div
              key={sop.slug}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-black">{sop.title}</h4>
                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                  {sop.owner}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-gray-500">{sop.description}</p>

              <div className="mt-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Triggers
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {sop.triggers.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
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
