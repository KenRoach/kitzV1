import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Bookmark, ThumbsUp, MessageCircle, Copy, MoreHorizontal } from 'lucide-react'
import { useOrbStore } from '@/stores/orbStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface BuildLogEntry {
  id: string
  title: string
  items: string[]
}

type Lang = 'en' | 'es' | 'ps'

export function ChatPanel() {
  const { messages, state, sendMessage } = useOrbStore()
  const user = useAuthStore((s) => s.user)
  const [input, setInput] = useState('')
  const [lang, setLang] = useState<Lang>('en')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Mock build log for demo
  const [buildLog] = useState<BuildLogEntry[]>([
    {
      id: '1',
      title: 'Set up workspace',
      items: [
        'CRM pipeline with drag-and-drop stages',
        'Contact management with notes and tags',
        'Order tracking and checkout links',
        '15 AI agents managing your business',
      ],
    },
  ])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || state === 'thinking') return
    void sendMessage(input, user?.id ?? 'default')
    setInput('')
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#0A0A0A]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Kitz OS</span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-gray-400">v0.1</span>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg bg-white/5 p-0.5">
          {(['en', 'es', 'ps'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                'rounded-md px-2 py-1 font-mono text-[10px] font-medium uppercase transition',
                lang === l
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Build log entries */}
        {buildLog.map((entry) => (
          <div key={entry.id} className="space-y-3">
            {/* Card-style build summary */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{entry.title}</span>
                <Bookmark className="h-4 w-4 text-gray-500" />
              </div>
              {/* Toggle: Details / Preview */}
              <div className="mt-3 flex rounded-lg bg-white/5 p-0.5">
                <button className="flex-1 rounded-md bg-transparent px-3 py-1.5 text-xs font-medium text-gray-400">
                  Details
                </button>
                <button className="flex-1 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                  Preview
                </button>
              </div>
            </div>

            {/* Build items */}
            <div className="text-sm text-gray-300 leading-relaxed">
              <p className="mb-2">Done! Here's what was added:</p>
              <ul className="space-y-2">
                {entry.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-gray-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-1">
              <button className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-gray-300 transition">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
              </button>
              <button className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-gray-300 transition">
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-gray-300 transition">
                <MessageCircle className="h-4 w-4" />
              </button>
              <button className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-gray-300 transition">
                <Copy className="h-4 w-4" />
              </button>
              <button className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-gray-300 transition">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Chat messages */}
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'user' ? (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-white/10 px-4 py-2.5 text-sm text-white">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-300 leading-relaxed">
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {state === 'thinking' && (
          <div className="flex gap-1 py-2">
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: '0ms' }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: '150ms' }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {/* Suggestion chips */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => void sendMessage('Who hasn\'t paid me yet?', user?.id ?? 'default')}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-white/10 hover:text-white"
            >
              Who hasn't paid me yet?
            </button>
            <button
              onClick={() => void sendMessage('Create a payment link', user?.id ?? 'default')}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-white/10 hover:text-white"
            >
              Create a payment link
            </button>
            <button
              onClick={() => void sendMessage('What should I do today?', user?.id ?? 'default')}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-white/10 hover:text-white"
            >
              What should I do today?
            </button>
            <button
              onClick={() => void sendMessage('How\'s my week looking?', user?.id ?? 'default')}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-white/10 hover:text-white"
            >
              How's my week looking?
            </button>
          </div>
        )}
      </div>

      {/* Bottom bar: input + stats */}
      <div className="border-t border-white/10 px-4 py-3 space-y-3">
        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Kitz..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#00D4AA]/50"
            />
          </div>
          {/* Send */}
          <button
            type="submit"
            disabled={!input.trim() || state === 'thinking'}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl transition',
              input.trim() && state !== 'thinking'
                ? 'bg-[#00D4AA] text-white hover:bg-[#00E8BB]'
                : 'bg-white/5 text-gray-600',
            )}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>

        {/* Stats bar */}
        <div className="flex items-center justify-center gap-5 font-mono text-[11px]">
          <button className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-white/5">
            <span className="text-gray-500">AI Battery</span>
            <span className="text-red-400">5</span>
          </button>
          <button className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-white/5">
            <span className="text-gray-500">Active Agents</span>
            <span className="text-amber-400">8</span>
          </button>
          <button className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-white/5">
            <span className="text-gray-500">WhatsApp</span>
            <span className="text-[#00D4AA]">⚡</span>
          </button>
        </div>
      </div>
    </div>
  )
}
