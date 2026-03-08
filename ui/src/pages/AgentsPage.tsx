import { useState } from 'react'
import {
  Users,
  Brain,
  Zap,
  Network,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import { PageHeader } from '@/components/home/PageHeader'
import { KITZ_MANIFEST } from '@/content/kitz-manifest'
import { useSimulationStore } from '@/stores/simulationStore'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

/* ── Agent architecture tiers ── */
const tiers = [
  {
    titleKey: 'agents.theBosses',
    count: 12,
    descKey: 'agents.theBossesDesc',
    color: 'bg-purple-500',
  },
  {
    titleKey: 'agents.theAdvisors',
    count: 9,
    descKey: 'agents.theAdvisorsDesc',
    color: 'bg-purple-400',
  },
  {
    titleKey: 'agents.theGuardrails',
    count: 9,
    descKey: 'agents.theGuardrailsDesc',
    color: 'bg-gray-400',
  },
  {
    titleKey: 'agents.theSpecialists',
    count: KITZ_MANIFEST.capabilities.totalAgents,
    descKey: '',
    color: 'bg-purple-300',
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
    color: 'bg-purple-50 text-purple-500',
  },
  {
    number: '03',
    title: 'Brainstorm',
    description: 'Pick the right tools and agents. Plan the execution strategy.',
    model: 'Claude Sonnet',
    color: 'bg-gray-100 text-gray-600',
  },
  {
    number: '04',
    title: 'Execute',
    description: 'Run tool-use loops — CRM writes, messages drafted, orders tracked.',
    model: 'GPT-4o-mini',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    number: '05',
    title: 'Voice',
    description: 'Format the response for your channel — WhatsApp, web, or email.',
    model: 'Claude Haiku',
    color: 'bg-gray-100 text-gray-500',
  },
] as const

export function AgentsPage() {
  const [showAll, setShowAll] = useState(false)
  const { running, lastResult, error: simError, startSimulation } = useSimulationStore()
  const { t } = useTranslation()

  const teams = showAll
    ? KITZ_MANIFEST.agentTeams
    : KITZ_MANIFEST.agentTeams.filter((tm) => tm.customerFacing)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 pb-12">
      <PageHeader
        title={t('agents.title')}
        description={`${KITZ_MANIFEST.capabilities.totalAgents}+ agents organized like a real company — leadership, governance, and ${KITZ_MANIFEST.capabilities.agentTeams} specialist teams`}
      />

      {/* ── Agent Architecture ── */}
      <section className="mt-2">
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <div key={tier.titleKey} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <Network className="h-5 w-5 text-purple-500" />
                <div>
                  <h4 className="text-sm font-semibold text-black">{t(tier.titleKey)}</h4>
                  <span className="text-xs text-gray-400">{tier.count} {t('agents.agents')}</span>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                {tier.descKey ? t(tier.descKey) : `${KITZ_MANIFEST.capabilities.agentTeams} ${t('agents.teams')} covering every business function.`}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5-Phase Semantic Router ── */}
      <section className="mt-12">
        <h3 className="text-lg font-bold text-black">{t('agents.howAgentsThink')}</h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('agents.howAgentsThinkDesc')}
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-5">
          {phases.map((phase) => (
            <div key={phase.number} className="rounded-2xl border border-gray-200 bg-white p-5">
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
            <h3 className="text-lg font-bold text-black">{t('agents.teamDirectory')}</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {KITZ_MANIFEST.capabilities.agentTeams} {t('agents.teams')},{' '}
              {KITZ_MANIFEST.capabilities.totalAgents}+ {t('agents.agents')}
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
              {t('home.customerTeams')}
            </button>
            <button
              onClick={() => setShowAll(true)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                showAll ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t('home.allTeams')}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <div
              key={team.name}
              className="flex flex-col items-start rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-semibold text-black">{team.name}</span>
                <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                  <Users className="h-3 w-3" />
                  {team.agents.length}
                </span>
              </div>

              <span className="mt-1 text-xs text-gray-400">{t('home.ledBy')} {team.agents[0]}</span>

              {/* Agent roster */}
              <div className="mt-3 w-full space-y-1.5">
                {team.agents.map((agent) => (
                  <div key={agent} className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2">
                    <code className="shrink-0 rounded-md bg-gray-900 px-1.5 py-0.5 font-mono text-[10px] text-gray-300">
                      {agent}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Swarm Simulation ── */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-black">{t('agents.swarmSimulation')}</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              Run all {KITZ_MANIFEST.capabilities.totalAgents} {t('agents.agents')} across {KITZ_MANIFEST.capabilities.agentTeams} {t('agents.teams')}
            </p>
          </div>
          <button
            onClick={() => startSimulation()}
            disabled={running}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition',
              running
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-purple-600 hover:bg-purple-700',
            )}
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('agents.running')}
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                {t('agents.runSwarm')}
              </>
            )}
          </button>
        </div>

        {simError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {simError}
          </div>
        )}

        {lastResult && (
          <div className="mt-4 space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                <div className={cn(
                  'text-xs font-bold uppercase',
                  lastResult.status === 'completed' ? 'text-purple-600' : lastResult.status === 'partial' ? 'text-gray-500' : 'text-gray-400',
                )}>
                  {lastResult.status}
                </div>
                <div className="mt-1 text-lg font-bold text-black">{lastResult.teamsCompleted}/{lastResult.teamsTotal}</div>
                <div className="text-[10px] text-gray-400">{t('agents.teams')}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                <Clock className="mx-auto h-4 w-4 text-gray-400" />
                <div className="mt-1 text-lg font-bold text-black">{(lastResult.durationMs / 1000).toFixed(1)}s</div>
                <div className="text-[10px] text-gray-400">{t('agents.duration')}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                <Zap className="mx-auto h-4 w-4 text-purple-500" />
                <div className="mt-1 text-lg font-bold text-black">{lastResult.agentResults.length}</div>
                <div className="text-[10px] text-gray-400">{t('agents.agentsRun')}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                <Network className="mx-auto h-4 w-4 text-purple-500" />
                <div className="mt-1 text-lg font-bold text-black">{lastResult.handoffCount}</div>
                <div className="text-[10px] text-gray-400">{t('agents.handoffs')}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                <Brain className="mx-auto h-4 w-4 text-purple-500" />
                <div className="mt-1 text-lg font-bold text-black">{lastResult.knowledgeWritten}</div>
                <div className="text-[10px] text-gray-400">{t('agents.knowledge')}</div>
              </div>
            </div>

            {/* Per-team results */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {lastResult.teamResults.map((tr) => (
                <div key={tr.team} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    {tr.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-purple-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-xs font-medium text-black">{tr.team}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span>{tr.agentResults.filter(a => a.success).length}/{tr.agentResults.length} {t('agents.agents')}</span>
                    <span>{(tr.durationMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

    </div>
  )
}
