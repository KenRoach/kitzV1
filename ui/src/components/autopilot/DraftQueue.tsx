import { useState } from 'react'
import { Check, X, ChevronDown, ChevronUp, MessageSquare, Mail, Phone } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import { useAgentStore } from '@/stores/agentStore'
import type { Draft } from '@/types/agent'

const channelIcons: Record<Draft['channel'], typeof MessageSquare> = {
  whatsapp: MessageSquare,
  email: Mail,
  sms: Phone,
}

const channelColors: Record<Draft['channel'], string> = {
  whatsapp: 'text-green-600 bg-green-50',
  email: 'text-blue-600 bg-blue-50',
  sms: 'text-purple-600 bg-purple-50',
}

export function DraftQueue() {
  const [isExpanded, setIsExpanded] = useState(true)
  const drafts = useAgentStore((s) => s.drafts)
  const approveDraft = useAgentStore((s) => s.approveDraft)
  const rejectDraft = useAgentStore((s) => s.rejectDraft)

  const pendingDrafts = drafts.filter((d) => d.status === 'pending')

  if (pendingDrafts.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">All caught up — no pending drafts</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-500">
            Draft Queue
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 font-mono text-[10px] font-bold text-white">
            {pendingDrafts.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100">
          {pendingDrafts.map((draft) => {
            const Icon = channelIcons[draft.channel]
            return (
              <div
                key={draft.id}
                className="flex items-start gap-3 border-b border-gray-50 px-4 py-3 last:border-b-0"
              >
                <div className={cn('mt-0.5 flex h-7 w-7 items-center justify-center rounded-full', channelColors[draft.channel])}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">{draft.agentName}</span>
                    <span className="text-xs text-gray-300">&rarr;</span>
                    <span className="text-xs font-medium text-black">{draft.recipient}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-gray-600">{draft.preview}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-gray-400">{timeAgo(draft.createdAt)}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => approveDraft(draft.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-green-600 transition hover:bg-green-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => rejectDraft(draft.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-red-500 transition hover:bg-red-50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
