import { useState } from 'react'
import { Users, ChevronRight } from 'lucide-react'
import { KITZ_MANIFEST } from '@/data/kitz-manifest'
import { cn } from '@/lib/utils'

interface AgentDocsSectionProps {
  onNavigate: (nav: string) => void
}

export function AgentDocsSection({ onNavigate }: AgentDocsSectionProps) {
  const [showAll, setShowAll] = useState(false)

  const teams = showAll
    ? KITZ_MANIFEST.agentTeams
    : KITZ_MANIFEST.agentTeams.filter((t) => t.customerFacing)

  return (
    <div className="mt-10 rounded-3xl bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-black">Your AI Team</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {KITZ_MANIFEST.capabilities.agentTeams} specialist teams,{' '}
            {KITZ_MANIFEST.capabilities.totalAgents}+ agents working for your business
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-0.5 rounded-lg bg-white p-0.5 border border-gray-200">
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

      {/* Team grid */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <button
            key={team.name}
            onClick={() => onNavigate('agents')}
            className="flex flex-col items-start rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:shadow-md cursor-pointer"
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold text-black">{team.displayName}</span>
              <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                <Users className="h-3 w-3" />
                {team.agents.length}
              </span>
            </div>

            <span className="mt-1 text-xs text-gray-400">Led by {team.lead}</span>

            {/* Capabilities */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {team.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
                >
                  {cap}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* View all link */}
      <button
        onClick={() => onNavigate('agents')}
        className="mt-4 flex items-center gap-1 text-sm font-medium text-purple-600 transition hover:text-purple-500"
      >
        View all agents
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
