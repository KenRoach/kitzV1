import {
  Users,
  ShoppingCart,
  Link,
  ListTodo,
  MessageSquare,
  Calendar,
  CreditCard,
  Bot,
  Code,
  ExternalLink,
  Hand,
} from 'lucide-react'
import { PageHeader } from '@/components/home/PageHeader'
import { KITZ_MANIFEST } from '@/data/kitz-manifest'
import { WorkspaceTabs } from '@/components/workspace/WorkspaceTabs'


/* ── Workspace modules ── */
const modules = [
  {
    icon: Users,
    title: 'CRM',
    description: 'Track every customer, conversation, and deal in one place. AI agents auto-enrich profiles from WhatsApp interactions.',
    forAgents: 'Agents read/write customer records, log interactions, and update deal stages automatically.',
  },
  {
    icon: CreditCard,
    title: 'Payments',
    description: 'See all incoming payments, track who owes what, and reconcile automatically with Stripe, PayPal, Yappy, and BAC.',
    forAgents: 'InvoiceBot and RevenueTracker create invoices, match payments, and flag overdue accounts.',
  },
  {
    icon: Users,
    title: 'Contacts',
    description: 'Your full contact list — leads, customers, suppliers. Imported from WhatsApp, forms, and manual entry.',
    forAgents: 'LeadScorer enriches contacts with scoring data. OutreachDrafter uses contacts for personalized messaging.',
  },
  {
    icon: ShoppingCart,
    title: 'Orders',
    description: 'Every order from placed to delivered. Track status, fulfill, and notify customers automatically.',
    forAgents: 'Order Tracker monitors fulfillment SLAs. EscalationBot flags delayed orders before customers complain.',
  },
  {
    icon: ListTodo,
    title: 'Tasks',
    description: 'Your daily to-do list, auto-generated from AI recommendations and manual entries. Prioritized by impact.',
    forAgents: 'SprintPlanner creates tasks from strategy decisions. ProgressTracker updates completion status.',
  },
  {
    icon: Link,
    title: 'Payment Links',
    description: 'Create shareable checkout links in seconds. Send via WhatsApp, email, or social. Track clicks and conversions.',
    forAgents: 'Checkout Agent generates links on demand. CampaignRunner embeds them in marketing flows.',
  },
  {
    icon: MessageSquare,
    title: 'Messages',
    description: 'Unified inbox for WhatsApp, email, and web chat. Every conversation in one thread, tagged by customer.',
    forAgents: 'WAFlowDesigner routes messages. MessageTemplater drafts replies. DeliveryMonitor confirms delivery.',
  },
  {
    icon: Calendar,
    title: 'Calendar',
    description: 'Appointments, follow-ups, and deadlines. Synced with your tasks and customer interactions.',
    forAgents: 'Scheduler books appointments from WhatsApp requests. Task Agent adds deadlines from AI recommendations.',
  },
] as const

/* ── API endpoints exposed to agents ── */
const endpoints = [
  { method: 'GET', path: '/api/workspace/customers', desc: 'List all customers' },
  { method: 'POST', path: '/api/workspace/orders', desc: 'Create new order' },
  { method: 'GET', path: '/api/workspace/tasks', desc: 'Fetch task queue' },
  { method: 'POST', path: '/api/workspace/checkout', desc: 'Generate payment link' },
  { method: 'GET', path: '/api/workspace/messages', desc: 'Read message inbox' },
] as const

export function WorkspacePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 pb-12">
      <PageHeader
        title="Workspace"
        description="8 modules you and your AI agents share — CRM, orders, payments, tasks, messages, and more"
      />

      {/* ── 8 Module Grid ── */}
      <section className="mt-2">

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((mod) => {
            const Icon = mod.icon
            return (
              <div
                key={mod.title}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5"
              >
                <Icon className="h-5 w-5 text-purple-500" />
                <h4 className="mt-3 text-sm font-semibold text-black">{mod.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{mod.description}</p>
                <div className="mt-3 rounded-lg bg-purple-50 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <Bot className="h-3 w-3 text-purple-500" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-purple-600">
                      For AI Agents
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-purple-700">{mod.forAgents}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Manual Workspace (Lite) ── */}
      <section className="mt-12 rounded-3xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <Hand className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-bold text-black">Manual Workspace</h3>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Your hands-on control panel — add contacts, create orders, manage tasks, and send payment
          links yourself. No AI required. Everything you do here is also visible to your AI agents.
        </p>

        <div className="mt-6">
          <WorkspaceTabs />
        </div>
      </section>

      {/* ── How Agents Use It ── */}
      <section className="mt-12 rounded-2xl bg-gray-50 p-6">
        <h3 className="text-lg font-bold text-black">How AI Agents Use the Workspace</h3>
        <p className="mt-1 text-sm text-gray-500">
          The workspace is the primary data layer for all KITZ agents
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Read',
              desc: 'Agents query workspace data — customers, orders, tasks — to understand current state before acting.',
            },
            {
              step: '02',
              title: 'Draft',
              desc: 'Agents propose changes (new orders, updated statuses, messages) as drafts. Nothing executes until you approve.',
            },
            {
              step: '03',
              title: 'Write',
              desc: 'After approval, agents commit changes to the workspace. Every write is logged with a full audit trail.',
            },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border border-gray-200 bg-white p-5">
              <span className="text-xs font-bold text-gray-300">{s.step}</span>
              <h4 className="mt-2 text-sm font-semibold text-black">{s.title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Agent API Endpoints ── */}
      <section className="mt-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-white/80" />
          <h3 className="text-lg font-bold">Workspace API for Agents</h3>
        </div>
        <p className="mt-1 text-sm text-white/70">
          External AI agents access workspace data via the MCP endpoint at{' '}
          <code className="text-white/90">{KITZ_MANIFEST.endpoints.workspace}</code>
        </p>

        <div className="mt-6 space-y-2">
          {endpoints.map((ep) => (
            <div key={ep.path} className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3">
              <span
                className="rounded-md px-2 py-0.5 font-mono text-[10px] font-bold bg-white/20 text-white/90"
              >
                {ep.method}
              </span>
              <code className="flex-1 font-mono text-xs text-white/80">{ep.path}</code>
              <span className="text-xs text-white/60">{ep.desc}</span>
            </div>
          ))}
        </div>

        <a
          href={`${window.location.origin}/.well-known/kitz.json`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/80 transition hover:text-white"
        >
          <span className="font-mono">Full API discovery</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </section>
    </div>
  )
}
