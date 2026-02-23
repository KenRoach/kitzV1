import { useAgentStore } from '@/stores/agentStore'
import { DraftQueue } from './DraftQueue'
import { AgentStatusCard } from './AgentStatusCard'
import type { TeamCluster } from '@/types/agent'

const CLUSTER_LABELS: Record<TeamCluster, string> = {
  manager: 'Your Manager',
  sales: 'Sales',
  'demand-gen': 'Demand Gen',
  operations: 'Operations',
  finance: 'Finance',
}

const CLUSTER_ORDER: TeamCluster[] = ['manager', 'sales', 'demand-gen', 'operations', 'finance']

export function AutoPilotTab() {
  const agents = useAgentStore((s) => s.agents)
  const toggleAgent = useAgentStore((s) => s.toggleAgent)

  const activeCount = agents.filter((a) => a.status === 'active').length

  const grouped = CLUSTER_ORDER
    .map((cluster) => ({
      cluster,
      label: CLUSTER_LABELS[cluster],
      agents: agents.filter((a) => a.group === cluster),
    }))
    .filter((g) => g.agents.length > 0)

  return (
    <div className="space-y-6">
      {/* Draft Queue */}
      <DraftQueue />

      {/* Agent Status */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-black">Agent Status</h3>
          <span className="text-sm text-gray-500">
            {activeCount} active / {agents.length} total
          </span>
        </div>

        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.cluster}>
              <div className="mb-3 flex items-center gap-2">
                <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {g.label}
                </h4>
                <span className="font-mono text-[10px] text-gray-400">
                  {g.agents.filter((a) => a.status === 'active').length}/{g.agents.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.agents.map((agent) => (
                  <AgentStatusCard
                    key={agent.id}
                    agent={agent}
                    onToggle={toggleAgent}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
