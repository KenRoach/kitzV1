import { cn } from '@/lib/utils'

type TeamCluster =
  | 'manager'
  | 'sales'
  | 'demand-gen'
  | 'operations'
  | 'finance'

interface AgentCardProps {
  name: string
  role: string
  group: TeamCluster
  status: 'active' | 'idle' | 'offline'
}

const dotColors = {
  active: 'bg-[#00D4AA]',
  idle: 'bg-amber-400',
  offline: 'bg-gray-300',
}

const badgeStyles: Record<TeamCluster, string> = {
  manager: 'bg-[#00D4AA]/10 text-[#00D4AA]',
  sales: 'bg-blue-100 text-blue-600',
  'demand-gen': 'bg-pink-100 text-pink-600',
  operations: 'bg-orange-100 text-orange-600',
  finance: 'bg-emerald-100 text-emerald-600',
}

export function AgentCard({ name, role, group, status }: AgentCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-md">
      <div className="flex items-center gap-2">
        <span className={cn('h-2.5 w-2.5 rounded-full', dotColors[status])} />
        <p className="font-semibold text-black">{name}</p>
      </div>
      <p className="mt-1 text-sm text-gray-500">{role}</p>
      <div className="mt-3">
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', badgeStyles[group])}>
          {group}
        </span>
      </div>
    </div>
  )
}
