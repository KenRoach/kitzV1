import { useState, useEffect } from 'react'
import { MessageCircle, Inbox, Mail, Phone, Globe } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import { apiFetch } from '@/lib/api'
import { API } from '@/lib/constants'
import { useTranslation } from '@/lib/i18n'

interface InboxThread {
  id: string
  channel: 'whatsapp' | 'email' | 'sms' | 'web' | 'voice' | 'instagram' | 'messenger'
  direction: 'inbound' | 'outbound'
  sender_id: string
  recipient_id: string
  content: string
  thread_id: string
  status: string
  created_at: string
  metadata?: Record<string, unknown>
}

const channelIcon: Record<string, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  email: Mail,
  sms: Phone,
  voice: Phone,
  web: Globe,
  instagram: MessageCircle,
  messenger: MessageCircle,
}

const channelColors: Record<string, string> = {
  whatsapp: 'text-green-600',
  email: 'text-blue-500',
  sms: 'text-orange-500',
  voice: 'text-purple-500',
  web: 'text-gray-500',
  instagram: 'text-pink-500',
  messenger: 'text-blue-600',
}

export function MessagesTab() {
  const { t } = useTranslation()
  const [threads, setThreads] = useState<InboxThread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [channelFilter, setChannelFilter] = useState<string>('all')

  useEffect(() => {
    async function fetchThreads() {
      setIsLoading(true)
      try {
        // Try unified inbox first
        const params = new URLSearchParams({ limit: '50' })
        if (channelFilter !== 'all') params.set('channel', channelFilter)
        const res = await apiFetch<InboxThread[]>(
          `${API.KITZ_OS}/inbox/threads?${params.toString()}`,
        )
        setThreads(Array.isArray(res) ? res : [])
      } catch {
        // Inbox API not available — leave empty
        setThreads([])
      }
      setIsLoading(false)
    }
    void fetchThreads()
  }, [channelFilter])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-black">{t('messages.title')}</h3>
          {threads.length > 0 && (
            <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-600">
              {threads.length}
            </span>
          )}
        </div>
      </div>

      {/* Channel filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {['all', 'whatsapp', 'email', 'sms', 'web'].map((ch) => (
          <button
            key={ch}
            onClick={() => setChannelFilter(ch)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition whitespace-nowrap',
              channelFilter === ch
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
            )}
          >
            {ch === 'all' ? t('messages.allChannels') : ch}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && threads.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 py-12">
          <Inbox className="h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">{t('messages.noConversations')}</p>
          <p className="text-xs text-gray-300">{t('messages.channelHelp')}</p>
        </div>
      )}

      {/* Thread list */}
      {!isLoading && threads.length > 0 && (
        <div className="space-y-1">
          {threads.map((thread) => {
            const ChannelIcon = channelIcon[thread.channel] ?? MessageCircle
            const colorClass = channelColors[thread.channel] ?? 'text-gray-400'
            const contactId = thread.direction === 'inbound' ? thread.sender_id : thread.recipient_id
            const displayName = contactId?.replace(/@s\.whatsapp\.net$/, '') || t('messages.unknown')

            return (
              <button
                key={thread.id}
                className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-left transition hover:border-gray-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ChannelIcon className={cn('h-4 w-4 shrink-0', colorClass)} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate text-gray-700">
                        {displayName}
                      </p>
                      <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-medium', colorClass, 'bg-opacity-10 bg-current')}>
                        {thread.channel}
                      </span>
                    </div>
                    <p className="text-xs truncate text-gray-400">
                      {thread.direction === 'outbound' ? '↗ ' : ''}{thread.content?.slice(0, 80)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="font-mono text-[10px] text-gray-400">
                    {timeAgo(thread.created_at)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
