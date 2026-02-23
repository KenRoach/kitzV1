import { useState } from 'react'
import { cn } from '@/lib/utils'
import { AgentCard } from './AgentCard'

type TeamCluster =
  | 'manager'
  | 'sales'
  | 'demand-gen'
  | 'operations'
  | 'finance'

type AgentStatus = 'active' | 'idle' | 'offline'

interface Agent {
  name: string
  role: string
  group: TeamCluster
  status: AgentStatus
}

const AGENTS: Agent[] = [
  // Kitz Manager — your AI business partner
  { name: 'Kitz Manager', role: 'Your AI business partner — strategy & priorities', group: 'manager', status: 'active' },

  // Sales — find leads, close deals, get paid
  { name: 'Lead Finder', role: 'Finds new leads from WhatsApp & socials', group: 'sales', status: 'active' },
  { name: 'Follow-Up Agent', role: 'Sends timely follow-ups so no lead goes cold', group: 'sales', status: 'active' },
  { name: 'Closer Agent', role: 'Moves deals from proposal to closed', group: 'sales', status: 'idle' },
  { name: 'Checkout Agent', role: 'Creates payment links & tracks payments', group: 'sales', status: 'active' },

  // Demand Gen — attract, convert, grow
  { name: 'Campaign Agent', role: 'Plans & runs marketing campaigns', group: 'demand-gen', status: 'idle' },
  { name: 'Content Agent', role: 'Creates posts, ads & product copy', group: 'demand-gen', status: 'idle' },
  { name: 'Growth Agent', role: 'Finds new channels to reach customers', group: 'demand-gen', status: 'idle' },

  // Operations — keep the business running
  { name: 'Order Tracker', role: 'Tracks orders from placed to delivered', group: 'operations', status: 'active' },
  { name: 'Task Agent', role: 'Manages your daily to-do list', group: 'operations', status: 'active' },
  { name: 'Scheduler', role: 'Books appointments & manages your calendar', group: 'operations', status: 'idle' },

  // Finance — know your numbers
  { name: 'Bookkeeper', role: 'Tracks income, expenses & profit', group: 'finance', status: 'active' },
  { name: 'Invoice Agent', role: 'Creates & sends invoices automatically', group: 'finance', status: 'idle' },
  { name: 'Cash Flow Agent', role: 'Forecasts cash flow & flags issues', group: 'finance', status: 'idle' },
]

const CLUSTER_LABELS: Record<TeamCluster, string> = {
  manager: 'Your Manager',
  sales: 'Sales',
  'demand-gen': 'Demand Gen',
  operations: 'Operations',
  finance: 'Finance',
}

const filters = [
  { id: 'all', label: 'All' },
  { id: 'manager', label: 'Manager' },
  { id: 'sales', label: 'Sales' },
  { id: 'demand-gen', label: 'Demand Gen' },
  { id: 'operations', label: 'Ops' },
  { id: 'finance', label: 'Finance' },
] as const

type FilterId = (typeof filters)[number]['id']

export function AgentGrid() {
  const [filter, setFilter] = useState<FilterId>('all')

  const activeCount = AGENTS.filter((a) => a.status === 'active').length

  const grouped = filter === 'all'
    ? (Object.keys(CLUSTER_LABELS) as TeamCluster[])
        .map((cluster) => ({
          cluster,
          label: CLUSTER_LABELS[cluster],
          agents: AGENTS.filter((a) => a.group === cluster),
        }))
        .filter((g) => g.agents.length > 0)
    : [{
        cluster: filter as TeamCluster,
        label: CLUSTER_LABELS[filter as TeamCluster],
        agents: AGENTS.filter((a) => a.group === filter),
      }]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold text-black">Your AI Team</h3>
        <span className="text-sm text-gray-500">{activeCount} active / {AGENTS.length} total</span>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-gray-200 pb-px">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'whitespace-nowrap px-3 py-2 text-xs font-medium transition-colors',
              filter === f.id
                ? 'border-b-2 border-[#00D4AA] text-black'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {f.label}
          </button>
        ))}
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
                <AgentCard key={agent.name} {...agent} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
