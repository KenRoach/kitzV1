import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Bookmark, ThumbsUp, MessageCircle, Copy, MoreHorizontal } from 'lucide-react'
import { useOrbStore } from '@/stores/orbStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { useAgentThinkingStore } from '@/stores/agentThinkingStore'
import { AgentThinkingBlock } from '@/components/chat/AgentThinkingBlock'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { TypingIndicator } from '@/components/chat/TypingIndicator'

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
  const agentSteps = useAgentThinkingStore((s) => s.steps)
  const isAgentThinking = useAgentThinkingStore((s) => s.isThinking)

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
  }, [messages, agentSteps, state])

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
          <span className="text-sm font-semibold text-white">Command Center</span>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg bg-white/5 p-0.5">
          {(['en', 'es', 'ps'] as const).map((l) => {
            const langLabel: Record<Lang, string> = {
              en: 'Switch to English',
              es: 'Switch to Spanish',
              ps: 'Switch to Pashtun',
            }
            return (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-label={langLabel[l]}
                className={cn(
                  'rounded-md px-2 py-1 font-mono text-[10px] font-medium uppercase transition',
                  lang === l
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-300',
                )}
              >
                {l}
              </button>
            )
          })}
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
              <button aria-label="Undo" className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-gray-300 transition">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
              </button>
              <button aria-label="Like" className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-gray-300 transition">
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button aria-label="Reply" className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-gray-300 transition">
                <MessageCircle className="h-4 w-4" />
              </button>
              <button aria-label="Copy" className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-gray-300 transition">
                <Copy className="h-4 w-4" />
              </button>
              <button aria-label="More options" className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-gray-300 transition">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Chat messages */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} variant="dark" />
        ))}

        {/* Typing indicator — bouncing dots while KITZ is thinking */}
        {state === 'thinking' && <TypingIndicator />}

        {/* Agent thinking block — shows between user message and response */}
        {(agentSteps.length > 0 || isAgentThinking) && <AgentThinkingBlock />}

        {/* Suggestion chips */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-2" role="group" aria-label="Quick questions">
            {[
              "Who hasn't paid me yet?",
              'Create a payment link',
              'What should I do today?',
              "How's my week looking?",
            ].map((q) => (
              <button
                key={q}
                onClick={() => void sendMessage(q, user?.id ?? 'default')}
                aria-label={`Ask Kitz: ${q}`}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              >
                {q}
              </button>
            ))}
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
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-purple-500/50"
            />
          </div>
          {/* Send */}
          <button
            type="submit"
            disabled={!input.trim() || state === 'thinking'}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl transition',
              input.trim() && state !== 'thinking'
                ? 'bg-purple-500 text-white hover:bg-purple-400'
                : 'bg-white/5 text-gray-600',
            )}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>

        {/* Stats bar */}
        <div className="flex items-center justify-center gap-5 font-mono text-[11px]">
          <button className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-white/5">
            <span className="text-gray-400">AI Battery</span>
            <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-400">5</span>
          </button>
          <button className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-white/5">
            <span className="text-gray-400">Active Agents</span>
            <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-400">{agentSteps.filter((s) => s.status === 'pending').length || 0}</span>
          </button>
          <button className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-white/5">
            <span className="text-gray-400">WhatsApp</span>
            <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-400">⚡</span>
          </button>
        </div>

        {/* Tagline */}
        <p className="text-center text-[10px] italic tracking-wide text-gray-600">
          Your hustle deserves infrastructure
        </p>
      </div>
    </div>
  )
}
