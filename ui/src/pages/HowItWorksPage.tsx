import {
  MessageCircle,
  Brain,
  Zap,
  Shield,
  Users,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Globe,
} from 'lucide-react'
import { PageHeader } from '@/components/home/PageHeader'
import { KITZ_MANIFEST } from '@/data/kitz-manifest'

/* ── Steps ── */
const steps = [
  {
    number: '01',
    title: 'You talk, KITZ listens',
    description:
      'Send a message via WhatsApp or the web chat. KITZ understands your intent in your language — English or Spanish.',
    icon: MessageCircle,
  },
  {
    number: '02',
    title: 'AI agents get to work',
    description:
      'Your request is routed to the right specialist team. 100+ agents across sales, marketing, operations, and finance collaborate behind the scenes.',
    icon: Brain,
  },
  {
    number: '03',
    title: 'Draft-first, always',
    description:
      'Nothing goes out without your approval. Every message, action, and decision is drafted first — you review and decide.',
    icon: Shield,
  },
  {
    number: '04',
    title: 'Results, not busywork',
    description:
      'Invoices sent, leads scored, orders tracked, customers followed up — real business outcomes delivered in minutes, not days.',
    icon: Zap,
  },
] as const

/* ── Principles ── */
const principles = [
  {
    icon: Clock,
    title: 'Under 10 minutes to first value',
    description: 'No lengthy setup. Connect and start getting results immediately.',
  },
  {
    icon: Shield,
    title: 'You are always in control',
    description:
      'Draft-first governance means AI never acts without your approval. Kill-switch available at any time.',
  },
  {
    icon: DollarSign,
    title: 'Pay only for what you use',
    description: `AI Battery credits power everything. ${KITZ_MANIFEST.governance.aiBatteryDailyLimit} credits/day limit ensures you never overspend. ROI minimum: ${KITZ_MANIFEST.governance.roiMinimum}.`,
  },
  {
    icon: Globe,
    title: 'Built for Latin America',
    description:
      'WhatsApp-first, Spanish + English, Panama compliance, and payment methods your customers actually use.',
  },
  {
    icon: Users,
    title: 'Fortune 500 infrastructure, SMB price',
    description: `${KITZ_MANIFEST.capabilities.agentTeams} specialist teams, ${KITZ_MANIFEST.capabilities.totalAgents}+ agents, and ${KITZ_MANIFEST.capabilities.tools}+ tools — the same capabilities big companies have.`,
  },
  {
    icon: CheckCircle2,
    title: 'SOPs keep things consistent',
    description: `${KITZ_MANIFEST.capabilities.sops} standard operating procedures ensure every customer gets the same quality experience, every time.`,
  },
] as const


export function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 pb-12">
      <PageHeader
        title="How It Works"
        description="Every interaction follows the same simple path — from message to business outcome"
      />

      {/* ── 4-Step Flow ── */}
      <section className="mt-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div
                key={step.number}
                className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-5"
              >
                {/* Arrow connector (hidden on last + mobile) */}
                {i < steps.length - 1 && (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-gray-300 lg:block" />
                )}

                <span className="text-xs font-bold text-gray-300">{step.number}</span>
                <Icon className="mt-3 h-5 w-5 text-purple-500" />
                <h4 className="mt-3 text-sm font-semibold text-black">{step.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{step.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Principles ── */}
      <section className="mt-12">
        <h3 className="text-lg font-bold text-black">Our Principles</h3>
        <p className="mt-1 text-sm text-gray-500">What makes KITZ different from other tools</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map((p) => {
            const Icon = p.icon
            return (
              <div
                key={p.title}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <Icon className="h-5 w-5 text-purple-500" />
                <h4 className="mt-3 text-sm font-semibold text-black">{p.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{p.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Governance ── */}
      <section className="mt-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
        <h3 className="text-lg font-bold">Safety & Governance</h3>
        <p className="mt-1 text-sm text-white/70">
          Built-in guardrails so AI works for you, not against you
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { label: 'Draft-first', desc: 'All outbound messages require your approval' },
            { label: 'Kill switch', desc: 'Instantly halt all AI execution with one toggle' },
            { label: 'Audit trail', desc: 'Every action logged with full traceability' },
            {
              label: `ROI minimum ${KITZ_MANIFEST.governance.roiMinimum}`,
              desc: 'AI recommends manual mode if projected return is too low',
            },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 rounded-xl bg-white/10 p-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-white/80" />
              <div>
                <span className="text-sm font-semibold">{item.label}</span>
                <p className="mt-0.5 text-xs text-white/60">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
