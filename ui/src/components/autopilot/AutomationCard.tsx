import { cn } from '@/lib/utils'
import { Clock, Zap, Globe, Webhook } from 'lucide-react'
import type { AutomationItem, AutomationStatus, AutomationTrigger } from '@/content/automation-catalog'

interface AutomationCardProps {
  item: AutomationItem
  colorDot: string
}

const triggerIcon: Record<AutomationTrigger, typeof Clock> = {
  realtime: Zap,
  scheduled: Clock,
  'on-demand': Globe,
  webhook: Webhook,
}

const triggerLabel: Record<AutomationTrigger, string> = {
  realtime: 'Real-time',
  scheduled: 'Scheduled',
  'on-demand': 'On demand',
  webhook: 'Webhook',
}

const statusStyles: Record<AutomationStatus, string> = {
  live: 'bg-green-100 text-green-700',
  'coming-soon': 'bg-amber-100 text-amber-700',
}

export function AutomationCard({ item, colorDot }: AutomationCardProps) {
  const TriggerIcon = triggerIcon[item.trigger]

  return (
    <div className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-md">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', colorDot)} />
          <h4 className="text-sm font-semibold text-black leading-tight">{item.name}</h4>
        </div>
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', statusStyles[item.status])}>
          {item.status === 'live' ? 'Live' : 'Soon'}
        </span>
      </div>

      {/* Description */}
      <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{item.description}</p>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] font-medium text-gray-400">
          {item.monitoredBy}
        </span>
        <div className="flex items-center gap-1 text-gray-400">
          <TriggerIcon className="h-3 w-3" />
          <span className="text-[10px]">{triggerLabel[item.trigger]}</span>
        </div>
      </div>
    </div>
  )
}
