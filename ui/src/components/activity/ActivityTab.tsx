import { cn } from '@/lib/utils'
import { useActivityStore } from '@/stores/activityStore'
import { ActivityFeed } from './ActivityFeed'
import type { ActivityType } from '@/types/activity'

const filters: { id: ActivityType | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'agent', label: 'Agents' },
  { id: 'crm', label: 'CRM' },
  { id: 'order', label: 'Orders' },
  { id: 'message', label: 'Messages' },
  { id: 'system', label: 'System' },
]

export function ActivityTab() {
  const filter = useActivityStore((s) => s.filter)
  const setFilter = useActivityStore((s) => s.setFilter)

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Filter chips */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 px-4 py-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1.5 font-mono text-xs font-medium transition-colors',
              filter === f.id
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="px-4">
        <ActivityFeed />
      </div>
    </div>
  )
}
