import {
  Activity,
  Bot,
  Users,
  ShoppingCart,
  MessageSquare,
  Server,
  Shield,
  Search,
  Clock,
  Eye,
  Code,
  ExternalLink,
} from 'lucide-react'
import { PageHeader } from '@/components/home/PageHeader'
import { KITZ_MANIFEST } from '@/data/kitz-manifest'
import { cn } from '@/lib/utils'

/* ── Event types tracked ── */
const eventTypes = [
  {
    icon: Bot,
    title: 'Agent Actions',
    description: 'Every agent decision, draft, execution, and recommendation is logged — who did what, when, and why.',
    examples: ['LeadScorer scored contact', 'OutreachDrafter created message', 'InvoiceBot generated invoice'],
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Users,
    title: 'CRM Events',
    description: 'Customer created, deal updated, contact enriched, follow-up scheduled — all CRM changes in real time.',
    examples: ['New customer added', 'Deal moved to closed', 'Contact merged'],
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: ShoppingCart,
    title: 'Order Events',
    description: 'Order placed, payment received, shipped, delivered, or returned — the full lifecycle of every transaction.',
    examples: ['Order #1234 placed', 'Payment confirmed', 'Delivery completed'],
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: MessageSquare,
    title: 'Message Events',
    description: 'WhatsApp messages sent/received, email drafts created, responses delivered — your complete communication log.',
    examples: ['WhatsApp received', 'Draft reply created', 'Message delivered'],
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: Server,
    title: 'System Events',
    description: 'AI Battery usage, SOP triggers, kill-switch activations, service health — infrastructure-level visibility.',
    examples: ['Battery credit spent', 'SOP triggered', 'Service restarted'],
    color: 'bg-pink-100 text-pink-600',
  },
] as const

/* ── Audit trail anatomy ── */
const traceFields = [
  { field: 'traceId', desc: 'Unique ID linking every action in a chain' },
  { field: 'orgId', desc: 'Your organization — full data isolation' },
  { field: 'userId', desc: 'Who initiated (you or which agent)' },
  { field: 'source', desc: 'Where it happened — WhatsApp, web, API, cron' },
  { field: 'event', desc: 'What happened — the action type' },
  { field: 'payload', desc: 'Full context — the data involved' },
  { field: 'ts', desc: 'Exact timestamp — millisecond precision' },
] as const

/* ── What agents see ── */
const agentCapabilities = [
  {
    icon: Search,
    title: 'Query Activity',
    description: 'Agents search the activity log to understand context before acting — "what happened with this customer last week?"',
  },
  {
    icon: Clock,
    title: 'Cadence Reports',
    description: 'Daily, weekly, monthly, and quarterly summaries auto-generated from the activity stream by scheduled AI jobs.',
  },
  {
    icon: Eye,
    title: 'Pattern Detection',
    description: 'TrendAnalyst and ChurnPredictor scan the activity feed for patterns — dropping engagement, payment delays, growth signals.',
  },
] as const

export function ActivityPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 pb-12">
      <PageHeader
        title="Activity"
        description="Every action — human or AI — creates an event in the activity stream"
      />

      {/* ── What Gets Tracked ── */}
      <section className="mt-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventTypes.map((evt) => {
            const Icon = evt.icon
            return (
              <div
                key={evt.title}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5"
              >
                <Icon className="h-5 w-5 text-purple-500" />
                <h4 className="mt-3 text-sm font-semibold text-black">{evt.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{evt.description}</p>

                <div className="mt-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Examples
                  </span>
                  <div className="mt-1 space-y-1">
                    {evt.examples.map((ex) => (
                      <div key={ex} className="flex items-center gap-1.5">
                        <Activity className="h-2.5 w-2.5 text-gray-300" />
                        <span className="text-[11px] text-gray-500">{ex}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Audit Trail Anatomy ── */}
      <section className="mt-12 rounded-2xl bg-gray-50 p-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-bold text-black">Audit Trail Anatomy</h3>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Every event follows the EventEnvelope schema — full traceability, zero gaps
        </p>

        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {traceFields.map((f, i) => (
            <div
              key={f.field}
              className={cn(
                'flex items-center gap-4 px-5 py-3',
                i < traceFields.length - 1 && 'border-b border-gray-100',
              )}
            >
              <code className="w-20 shrink-0 font-mono text-xs font-semibold text-purple-600">
                {f.field}
              </code>
              <span className="text-xs text-gray-500">{f.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How Agents Use Activity ── */}
      <section className="mt-12">
        <h3 className="text-lg font-bold text-black">How AI Agents Use the Activity Stream</h3>
        <p className="mt-1 text-sm text-gray-500">
          The activity log is the shared memory of your entire AI organization
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {agentCapabilities.map((cap) => {
            const Icon = cap.icon
            return (
              <div key={cap.title} className="rounded-xl border border-gray-200 bg-white p-5">
                <Icon className="h-5 w-5 text-purple-500" />
                <h4 className="mt-3 text-sm font-semibold text-black">{cap.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{cap.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── API for Agents ── */}
      <section className="mt-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-white/80" />
          <h3 className="text-lg font-bold">Activity API for Agents</h3>
        </div>
        <p className="mt-1 text-sm text-white/70">
          External AI agents can query the activity stream and subscribe to real-time events
        </p>

        <div className="mt-6 space-y-2">
          {[
            { method: 'GET', path: `${KITZ_MANIFEST.endpoints.api}/activity`, desc: 'Query activity events with filters' },
            { method: 'GET', path: `${KITZ_MANIFEST.endpoints.api}/activity/stream`, desc: 'SSE real-time event stream' },
            { method: 'GET', path: `${KITZ_MANIFEST.endpoints.api}/activity/cadence`, desc: 'Daily/weekly/monthly reports' },
          ].map((ep) => (
            <div key={ep.path} className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3">
              <span className="rounded-md bg-white/20 px-2 py-0.5 font-mono text-[10px] font-bold text-white/90">
                {ep.method}
              </span>
              <code className="flex-1 font-mono text-xs text-white/80">{ep.path}</code>
              <span className="text-xs text-white/60">{ep.desc}</span>
            </div>
          ))}
        </div>

        <a
          href="http://localhost:5173/.well-known/kitz.json"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/80 transition hover:text-white"
        >
          <span className="font-mono">Full API manifest</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </section>
    </div>
  )
}
