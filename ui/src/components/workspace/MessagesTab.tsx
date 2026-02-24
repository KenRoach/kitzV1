import { useState, useEffect } from 'react'
import { MessageCircle, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'
import { API } from '@/lib/constants'

interface Conversation {
  id: string
  name: string
  lastMessage: string
  time: string
  unread: number
  channel: 'whatsapp' | 'email' | 'instagram'
}

const channelColors = {
  whatsapp: 'text-green-500',
  email: 'text-blue-500',
  instagram: 'text-pink-500',
}

export function MessagesTab() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchConversations() {
      setIsLoading(true)
      try {
        const res = await apiFetch<{ conversations?: Conversation[]; data?: Conversation[] } | Conversation[]>(
          `${API.KITZ_OS}`,
          {
            method: 'POST',
            body: JSON.stringify({ message: 'list recent conversations', channel: 'api', user_id: 'default' }),
          },
        )
        const data = Array.isArray(res) ? res : (
          (res as { conversations?: Conversation[] }).conversations ??
          (res as { data?: Conversation[] }).data ??
          []
        )
        setConversations(data)
      } catch {
        // Backend offline — leave empty
      }
      setIsLoading(false)
    }
    void fetchConversations()
  }, [])

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-black">Messages</h3>
          {totalUnread > 0 && (
            <span className="rounded-full bg-purple-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {totalUnread}
            </span>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && conversations.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 py-12">
          <Inbox className="h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">No conversations yet</p>
          <p className="text-xs text-gray-300">Messages from WhatsApp, email, and Instagram will appear here</p>
        </div>
      )}

      {/* Conversation list */}
      {!isLoading && conversations.length > 0 && (
        <div className="space-y-1">
          {conversations.map((convo) => (
            <button
              key={convo.id}
              className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-left transition hover:border-gray-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 shrink-0">
                  <MessageCircle className={cn('h-4 w-4', channelColors[convo.channel] ?? 'text-gray-400')} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm font-medium truncate', convo.unread > 0 ? 'text-black font-semibold' : 'text-gray-700')}>
                      {convo.name}
                    </p>
                    <span className="font-mono text-[10px] text-gray-400 shrink-0">{convo.channel}</span>
                  </div>
                  <p className={cn('text-xs truncate', convo.unread > 0 ? 'text-gray-600' : 'text-gray-400')}>
                    {convo.lastMessage}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="font-mono text-[10px] text-gray-400">{convo.time}</span>
                {convo.unread > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
                    {convo.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
