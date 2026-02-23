import { useActivityStore } from '@/stores/activityStore'
import { ActivityEntry } from './ActivityEntry'

export function ActivityFeed() {
  const entries = useActivityStore((s) => s.entries)
  const filter = useActivityStore((s) => s.filter)
  const hasMore = useActivityStore((s) => s.hasMore)
  const loadMore = useActivityStore((s) => s.loadMore)

  const filtered = filter === 'all'
    ? entries
    : entries.filter((e) => e.type === filter)

  if (filtered.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500">No activity yet</p>
      </div>
    )
  }

  return (
    <div>
      {filtered.map((entry) => (
        <ActivityEntry key={entry.id} entry={entry} />
      ))}
      {hasMore && (
        <button
          onClick={loadMore}
          className="mt-4 w-full rounded-lg border border-gray-200 py-2 text-center font-mono text-xs text-gray-500 transition hover:bg-gray-50"
        >
          Load more...
        </button>
      )}
    </div>
  )
}
