import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  TrendingUp, MessageSquare, Megaphone, Receipt, Users, Settings,
  BarChart3, Palette, BookOpen, Plug,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AutomationCard } from './AutomationCard'
import { getCategoryColor } from '@/content/automation-catalog'
import type { AutomationGroup } from '@/content/automation-catalog'

interface AutomationCategoryGroupProps {
  group: AutomationGroup
  defaultExpanded?: boolean
}

const iconMap: Record<string, typeof TrendingUp> = {
  TrendingUp,
  MessageSquare,
  Megaphone,
  Receipt,
  Users,
  Settings,
  BarChart3,
  Palette,
  BookOpen,
  Plug,
}

export function AutomationCategoryGroup({ group, defaultExpanded = false }: AutomationCategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const colors = getCategoryColor(group.color)
  const Icon = iconMap[group.icon] ?? Settings

  const liveCount = group.items.filter((i) => i.status === 'live').length
  const soonCount = group.items.filter((i) => i.status === 'coming-soon').length

  return (
    <div className={cn('rounded-2xl border', colors.border, 'bg-white overflow-hidden')}>
      {/* Header — always visible, clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-gray-50/50"
      >
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', colors.bg)}>
            <Icon className={cn('h-4.5 w-4.5', colors.text)} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-black">{group.label}</h3>
            <p className="text-xs text-gray-500">{group.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {liveCount > 0 && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                {liveCount} live
              </span>
            )}
            {soonCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                {soonCount} soon
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Items grid */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <AutomationCard key={item.id} item={item} colorDot={colors.dot} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
