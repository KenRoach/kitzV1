import {
  MessageCircle,
  Brain,
  Shield,
  Users,
  ArrowDown,
  CheckCircle2,
  Clock,
  DollarSign,
  Globe,
  Cpu,
  FileText,
  Send,
  Eye,
  Layers,
  Bot,
} from 'lucide-react'
import { PageHeader } from '@/components/home/PageHeader'
import { KITZ_MANIFEST } from '@/content/kitz-manifest'

/* ── End-to-End Flow ── */
const e2eSteps = [
  {
    phase: 'INPUT',
    title: 'You send a message',
    description: 'Type in the Command Center (left panel) or send a WhatsApp message. KITZ understands English and Spanish.',
    icon: MessageCircle,
    detail: 'Web chat, WhatsApp, or voice — all channels feed into the same AI engine.',
  },
  {
    phase: 'READ',
    title: 'Intent recognition',
    description: 'Claude Haiku reads your message and understands what you need — create an invoice, follow up with a lead, draft an email, etc.',
    icon: Eye,
    detail: 'Phase 1 of the 5-phase semantic router. Fast, accurate intent classification.',
  },
  {
    phase: 'COMPREHEND',
    title: 'Entity extraction',
    description: 'KITZ extracts names, amounts, dates, and context from your message. It pulls in your CRM data, order history, and business context.',
    icon: Layers,
    detail: 'Phase 2. Enriches the request with data from your workspace (contacts, orders, products).',
  },
  {
    phase: 'BRAINSTORM',
    title: 'Tool strategy',
    description: 'The AI plans which tools to use — CRM lookups, invoice generation, email drafting, payment links, and more. Complex requests use Claude Sonnet.',
    icon: Brain,
    detail: `Phase 3. Picks from ${KITZ_MANIFEST.capabilities.tools}+ tools across ${KITZ_MANIFEST.capabilities.agentTeams} domains.`,
  },
  {
    phase: 'EXECUTE',
    title: 'Agents do the work',
    description: 'Tools are called in sequence — real API calls to your CRM, Google Sheets, Shopify, Stripe, Gmail, and more. Results are collected and formatted.',
    icon: Cpu,
    detail: 'Phase 4. Uses OpenAI gpt-4o-mini for tool routing (fastest + cheapest). Falls back to Claude.',
  },
  {
    phase: 'CANVAS',
    title: 'Artifact generated',
    description: 'The output becomes a branded HTML artifact — invoice, email, landing page, plan, report. It appears in the Canvas (right panel) with action buttons.',
    icon: FileText,
    detail: 'Every meaningful output gets Save PDF, Send Email, Send WhatsApp action buttons.',
  },
  {
    phase: 'REVIEW',
    title: 'You approve or edit',
    description: 'Nothing goes out without your say. Review the artifact, click Approve to send, or ask KITZ to edit it. Draft-first, always.',
    icon: Shield,
    detail: 'Draft-first governance. Kill-switch available. Full audit trail on every action.',
  },
  {
    phase: 'DELIVER',
    title: 'Real business outcome',
    description: 'Invoice sent. Lead scored. Order tracked. Email delivered. Payment link live. Your business moved forward in seconds, not hours.',
    icon: Send,
    detail: 'Results flow back to WhatsApp, email, or wherever your customers are.',
  },
] as const

/* ── How the AI Battery Works ── */
const batteryFacts = [
  { label: '1 credit', value: '≈ 1,000 LLM tokens or 500 voice characters' },
  { label: 'Daily limit', value: `${KITZ_MANIFEST.governance.aiBatteryDailyLimit} credits (configurable)` },
  { label: 'ROI rule', value: `If projected ROI < ${KITZ_MANIFEST.governance.roiMinimum}, KITZ recommends manual mode` },
  { label: 'Pricing', value: '100 credits / $5 — 500 / $20 — 2,000 / $60' },
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
    description: 'Draft-first governance means AI never acts without your approval. Kill-switch available at any time.',
  },
  {
    icon: DollarSign,
    title: 'Pay only for what you use',
    description: `AI Battery credits power everything. ${KITZ_MANIFEST.governance.aiBatteryDailyLimit} credits/day limit ensures you never overspend.`,
  },
  {
    icon: Globe,
    title: 'Built for Latin America',
    description: 'WhatsApp-first, Spanish + English, Panama compliance, and payment methods your customers actually use.',
  },
  {
    icon: Users,
    title: 'Fortune 500 infrastructure, SMB price',
    description: `${KITZ_MANIFEST.capabilities.agentTeams} specialist teams, ${KITZ_MANIFEST.capabilities.totalAgents}+ agents, and ${KITZ_MANIFEST.capabilities.tools}+ tools.`,
  },
  {
    icon: Bot,
    title: `${KITZ_MANIFEST.capabilities.totalAgents}+ AI agents`,
    description: 'Sales, marketing, operations, finance, compliance — specialist agents collaborate behind the scenes on every request.',
  },
] as const


export function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 pb-12">
      <PageHeader
        title="How KITZ Works"
        description="End-to-end: from your message to real business outcomes — every step explained"
      />

      {/* ── End-to-End Pipeline ── */}
      <section className="mt-2">
        <div className="space-y-3">
          {e2eSteps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.phase}>
                <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <span className="font-mono text-[10px] font-bold text-purple-400">{step.phase}</span>
                    <Icon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-black">{step.title}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{step.description}</p>
                    <p className="mt-1.5 text-[11px] text-gray-400 italic">{step.detail}</p>
                  </div>
                </div>
                {/* Arrow connector */}
                {i < e2eSteps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="h-4 w-4 text-gray-300" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── AI Battery ── */}
      <section className="mt-12">
        <h3 className="text-lg font-bold text-black">AI Battery — Credit System</h3>
        <p className="mt-1 text-sm text-gray-500">Every AI action consumes credits. You control how they're spent.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {batteryFacts.map((f) => (
            <div key={f.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <span className="text-xs font-bold text-purple-600">{f.label}</span>
              <p className="mt-1 text-sm text-gray-700">{f.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Principles ── */}
      <section className="mt-12">
        <h3 className="text-lg font-bold text-black">Principles</h3>
        <p className="mt-1 text-sm text-gray-500">What makes KITZ different from other tools</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map((p) => {
            const Icon = p.icon
            return (
              <div key={p.title} className="rounded-2xl border border-gray-200 bg-white p-5">
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
