import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Conversation {
  id: string
  name: string
  lastMessage: string
  time: string
  unread: number
  channel: 'whatsapp' | 'email' | 'instagram'
}

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: '1', name: 'Maria Rodriguez', lastMessage: 'Perfect, I will send the payment today', time: '10 min', unread: 2, channel: 'whatsapp' },
  { id: '2', name: 'Carlos Mendez', lastMessage: 'Can you send me the invoice?', time: '1h', unread: 1, channel: 'whatsapp' },
  { id: '3', name: 'Ana Gutierrez', lastMessage: 'Thanks for the quick response!', time: '2h', unread: 0, channel: 'whatsapp' },
  { id: '4', name: 'Pedro Silva', lastMessage: 'When will my order arrive?', time: '3h', unread: 1, channel: 'whatsapp' },
  { id: '5', name: 'Laura Chen', lastMessage: 'I saw your post on Instagram...', time: '5h', unread: 0, channel: 'instagram' },
  { id: '6', name: 'Diego Ramirez', lastMessage: 'Re: Partnership proposal', time: '1d', unread: 0, channel: 'email' },
]

const channelColors = {
  whatsapp: 'text-green-500',
  email: 'text-blue-500',
  instagram: 'text-pink-500',
}

export function MessagesTab() {
  const totalUnread = MOCK_CONVERSATIONS.reduce((sum, c) => sum + c.unread, 0)

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

      {/* Conversation list */}
      <div className="space-y-1">
        {MOCK_CONVERSATIONS.map((convo) => (
          <button
            key={convo.id}
            className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-left transition hover:border-gray-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 shrink-0">
                <MessageCircle className={cn('h-4 w-4', channelColors[convo.channel])} />
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
    </div>
  )
}
