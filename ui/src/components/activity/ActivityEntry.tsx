import { Bot, User, ShoppingBag, MessageSquare, Settings } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import type { ActivityEntry as ActivityEntryType, ActivityType } from '@/types/activity'

const typeIcons: Record<ActivityType, typeof Bot> = {
  agent: Bot,
  crm: User,
  order: ShoppingBag,
  message: MessageSquare,
  system: Settings,
}

const typeStyles: Record<ActivityType, string> = {
  agent: 'bg-purple-50 text-purple-600',
  crm: 'bg-purple-50 text-purple-500',
  order: 'bg-gray-100 text-gray-600',
  message: 'bg-purple-100 text-purple-600',
  system: 'bg-gray-100 text-gray-500',
}

interface ActivityEntryProps {
  entry: ActivityEntryType
}

export function ActivityEntry({ entry }: ActivityEntryProps) {
  const Icon = typeIcons[entry.type]

  return (
    <div className="flex gap-3 border-b border-gray-50 py-3 last:border-b-0">
      <Icon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', typeStyles[entry.type].replace(/bg-\S+/g, '').trim())} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-black">
          <span className="font-medium">{entry.actor.name}</span>
          {' '}
          {entry.action}
        </p>
        {entry.detail && (
          <p className="mt-0.5 text-xs text-gray-500">{entry.detail}</p>
        )}
      </div>
      <span className="flex-shrink-0 font-mono text-[10px] text-gray-400 mt-0.5">
        {timeAgo(entry.timestamp)}
      </span>
    </div>
  )
}
