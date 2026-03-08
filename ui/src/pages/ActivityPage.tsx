import { useEffect } from 'react'
import { useActivityStore } from '@/stores/activityStore'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { ActivityEntry } from '@/components/activity/ActivityEntry'
import { Loader2 } from 'lucide-react'
import type { ActivityType } from '@/types/activity'

const FILTERS: { id: ActivityType | 'all'; labelKey: string }[] = [
  { id: 'all', labelKey: 'activity.all' },
  { id: 'agent', labelKey: 'activity.agents' },
  { id: 'crm', labelKey: 'activity.crm' },
  { id: 'order', labelKey: 'activity.orders' },
  { id: 'message', labelKey: 'activity.messages' },
  { id: 'system', labelKey: 'activity.system' },
]

export function ActivityPage() {
  const { t } = useTranslation()
  const entries = useActivityStore((s) => s.entries)
  const filter = useActivityStore((s) => s.filter)
  const setFilter = useActivityStore((s) => s.setFilter)
  const hasMore = useActivityStore((s) => s.hasMore)
  const isLoading = useActivityStore((s) => s.isLoading)
  const loadMore = useActivityStore((s) => s.loadMore)
  const fetchActivity = useActivityStore((s) => s.fetchActivity)

  useEffect(() => {
    void fetchActivity()
  }, [fetchActivity])

  const filtered = filter === 'all'
    ? entries
    : entries.filter((e) => e.type === filter)

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">{t('activity.title')}</h2>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-3">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors',
              filter === f.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
            )}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {/* Log entries */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {isLoading && filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">{t('activity.noActivity')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 px-4">
            {filtered.map((entry) => (
              <ActivityEntry key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="border-t border-gray-100 px-4 py-3">
            <button
              onClick={loadMore}
              className="w-full rounded-lg bg-gray-50 py-2 text-center text-xs font-medium text-gray-500 transition hover:bg-gray-100"
            >
              {t('activity.loadMore')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
