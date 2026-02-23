import { Pause, Play } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import type { AgentInfo, TeamCluster } from '@/types/agent'

interface AgentStatusCardProps {
  agent: AgentInfo
  onToggle: (id: string) => void
}

const statusDot: Record<AgentInfo['status'], string> = {
  active: 'bg-purple-500',
  idle: 'bg-amber-400',
  paused: 'bg-gray-400',
  offline: 'bg-gray-300',
}

const badgeStyles: Record<TeamCluster, string> = {
  manager: 'bg-purple-500/10 text-purple-500',
  sales: 'bg-blue-100 text-blue-600',
  'demand-gen': 'bg-pink-100 text-pink-600',
  operations: 'bg-orange-100 text-orange-600',
  finance: 'bg-emerald-100 text-emerald-600',
}

export function AgentStatusCard({ agent, onToggle }: AgentStatusCardProps) {
  const canToggle = agent.status === 'active' || agent.status === 'paused'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', statusDot[agent.status])} />
          <p className="font-semibold text-black text-sm">{agent.name}</p>
        </div>
        {canToggle && (
          <button
            onClick={() => onToggle(agent.id)}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-lg transition',
              agent.status === 'paused'
                ? 'text-purple-500 hover:bg-purple-50'
                : 'text-gray-400 hover:bg-gray-50',
            )}
          >
            {agent.status === 'paused' ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {agent.lastAction ? (
        <p className="mt-1.5 text-xs text-gray-500 line-clamp-1">{agent.lastAction}</p>
      ) : (
        <p className="mt-1.5 text-xs text-gray-400 italic">No recent activity</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', badgeStyles[agent.group])}>
          {agent.group}
        </span>
        <div className="flex items-center gap-2">
          {agent.actionsToday > 0 && (
            <span className="font-mono text-[10px] text-gray-400">
              {agent.actionsToday} today
            </span>
          )}
          <span className="font-mono text-[10px] text-gray-400">
            {timeAgo(agent.lastActionAt)}
          </span>
        </div>
      </div>
    </div>
  )
}
