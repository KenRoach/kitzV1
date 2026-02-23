import { useState } from 'react'
import {
  Users,
  Bot,
  Brain,
  Shield,
  Zap,
  Code,
  ExternalLink,
  Network,
} from 'lucide-react'
import { PageHeader } from '@/components/home/PageHeader'
import { KITZ_MANIFEST } from '@/data/kitz-manifest'
import { cn } from '@/lib/utils'

/* ── Agent architecture tiers ── */
const tiers = [
  {
    title: 'C-Suite',
    count: 12,
    description: 'CEO, CFO, CMO, COO, CPO, CRO, CTO — executive decision-making and strategy. Each C-Suite agent owns a domain and delegates to specialist teams.',
    color: 'bg-purple-500',
  },
  {
    title: 'Board',
    count: 9,
    description: 'Risk analysis, ethics, growth vision, operational realism. The board reviews high-impact decisions before execution.',
    color: 'bg-blue-500',
  },
  {
    title: 'Governance',
    count: 9,
    description: 'Capital allocation, focus capacity, incentive alignment, institutional memory. Guardrails that keep the AI org accountable.',
    color: 'bg-emerald-500',
  },
  {
    title: 'Specialist Teams',
    count: KITZ_MANIFEST.capabilities.totalAgents,
    description: `${KITZ_MANIFEST.capabilities.agentTeams} teams covering every business function — from sales and marketing to engineering and compliance.`,
    color: 'bg-amber-500',
  },
] as const

/* ── How agents think ── */
const phases = [
  {
    number: '01',
    title: 'Read',
    description: 'Understand intent from your message — what do you need?',
    model: 'Claude Haiku',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    number: '02',
    title: 'Comprehend',
    description: 'Classify the request, extract entities, identify urgency.',
    model: 'Claude Haiku',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    number: '03',
    title: 'Brainstorm',
    description: 'Pick the right tools and agents. Plan the execution strategy.',
    model: 'Claude Sonnet',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    number: '04',
    title: 'Execute',
    description: 'Run tool-use loops — CRM writes, messages drafted, orders tracked.',
    model: 'GPT-4o-mini',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    number: '05',
    title: 'Voice',
    description: 'Format the response for your channel — WhatsApp, web, or email.',
    model: 'Claude Haiku',
    color: 'bg-pink-100 text-pink-600',
  },
] as const

export function AgentsPage() {
  const [showAll, setShowAll] = useState(false)

  const teams = showAll
    ? KITZ_MANIFEST.agentTeams
    : KITZ_MANIFEST.agentTeams.filter((t) => t.customerFacing)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 pb-12">
      <PageHeader
        title="AI Agents"
        description={`${KITZ_MANIFEST.capabilities.totalAgents}+ agents organized like a real company — leadership, governance, and ${KITZ_MANIFEST.capabilities.agentTeams} specialist teams`}
      />

      {/* ── Agent Architecture ── */}
      <section className="mt-2">
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <div key={tier.title} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <Network className="h-5 w-5 text-purple-500" />
                <div>
                  <h4 className="text-sm font-semibold text-black">{tier.title}</h4>
                  <span className="text-xs text-gray-400">{tier.count} agents</span>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">{tier.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5-Phase Semantic Router ── */}
      <section className="mt-12">
        <h3 className="text-lg font-bold text-black">How Agents Think</h3>
        <p className="mt-1 text-sm text-gray-500">
          Every request passes through a 5-phase semantic router — the AI brain
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-5">
          {phases.map((phase) => (
            <div key={phase.number} className="rounded-xl border border-gray-200 bg-white p-4">
              <span className="text-xs font-bold text-gray-300">{phase.number}</span>
              <Brain className="mt-2 h-5 w-5 text-purple-500" />
              <h4 className="mt-2 text-sm font-semibold text-black">{phase.title}</h4>
              <p className="mt-1 text-[11px] leading-relaxed text-gray-500">{phase.description}</p>
              <span className="mt-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                {phase.model}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Team Directory ── */}
      <section className="mt-12 rounded-3xl bg-gray-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-black">Team Directory</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {KITZ_MANIFEST.capabilities.agentTeams} specialist teams,{' '}
              {KITZ_MANIFEST.capabilities.totalAgents}+ agents
            </p>
          </div>

          <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => setShowAll(false)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                !showAll ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              Customer Teams
            </button>
            <button
              onClick={() => setShowAll(true)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                showAll ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              All Teams
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <div
              key={team.name}
              className="flex flex-col items-start rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-semibold text-black">{team.displayName}</span>
                <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                  <Users className="h-3 w-3" />
                  {team.agents.length}
                </span>
              </div>

              <span className="mt-1 text-xs text-gray-400">Led by {team.lead}</span>

              {/* Agent roster with functions */}
              <div className="mt-3 w-full space-y-1.5">
                {team.agents.map((agent) => (
                  <div key={agent.name} className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2">
                    <code className="shrink-0 rounded-md bg-gray-900 px-1.5 py-0.5 font-mono text-[10px] text-gray-300">
                      {agent.name}
                    </code>
                    <span className="text-[11px] leading-relaxed text-gray-500">{agent.fn}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tools + Integration ── */}
      <section className="mt-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-white/80" />
          <h3 className="text-lg font-bold">Agent Integration</h3>
        </div>
        <p className="mt-1 text-sm text-white/70">
          External AI agents can discover and interact with KITZ agents through the manifest
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-4">
            <Zap className="h-5 w-5 text-white/80" />
            <h4 className="mt-2 text-sm font-semibold">{KITZ_MANIFEST.capabilities.tools}+ Tools</h4>
            <p className="mt-1 text-xs text-white/60">
              CRM operations, payment processing, message drafting, order management, and more — all callable by agents.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <Shield className="h-5 w-5 text-white/80" />
            <h4 className="mt-2 text-sm font-semibold">Draft-First Governance</h4>
            <p className="mt-1 text-xs text-white/60">
              Every agent action is a draft until approved. Audit trail on every operation. Kill-switch available.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <Bot className="h-5 w-5 text-white/80" />
            <h4 className="mt-2 text-sm font-semibold">Agent-to-Agent OS</h4>
            <p className="mt-1 text-xs text-white/60">
              Event bus, ledger persistence, approval policies. Agents collaborate via structured artifacts: Task → Proposal → Decision → Outcome.
            </p>
          </div>
        </div>

        <a
          href="http://localhost:5173/.well-known/kitz.json"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/80 transition hover:text-white"
        >
          <span className="font-mono">View full agent manifest</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </section>
    </div>
  )
}
