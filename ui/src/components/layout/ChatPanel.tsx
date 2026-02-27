import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Smartphone } from 'lucide-react'
import { useOrbStore } from '@/stores/orbStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { useAgentThinkingStore } from '@/stores/agentThinkingStore'
import { AgentThinkingBlock } from '@/components/chat/AgentThinkingBlock'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { TypingIndicator } from '@/components/chat/TypingIndicator'

export function ChatPanel() {
  const { messages, state, sendMessage, chatFocused, blurChat, chatGlowing, chatShaking, echoToWhatsApp, setEchoToWhatsApp } = useOrbStore()
  const user = useAuthStore((s) => s.user)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const agentSteps = useAgentThinkingStore((s) => s.steps)
  const isAgentThinking = useAgentThinkingStore((s) => s.isThinking)

  // When Kitz is tapped, focus the chat input
  useEffect(() => {
    if (chatFocused && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      blurChat()
    }
  }, [chatFocused, blurChat])

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
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-purple-950 to-purple-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Command Center</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar: input + stats */}
      <div className="border-t border-white/20 px-4 py-3 space-y-3">
        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2" data-orb-chatbox>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Kitz..."
              aria-label="Send message to Kitz"
              className={cn(
                "w-full rounded-xl border border-white/40 bg-white/10 py-2.5 pl-4 pr-4 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/70 focus:ring-2 focus:ring-white/20",
                chatGlowing && "kitz-chatbox-glow",
                chatShaking && "kitz-chatbox-shake",
              )}
            />
          </div>
          {/* Send */}
          <button
            type="submit"
            disabled={!input.trim() || state === 'thinking'}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl transition',
              input.trim() && state !== 'thinking'
                ? 'bg-white text-purple-900 hover:bg-white/90'
                : 'bg-white/10 text-white/30',
            )}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>

        {/* Stats bar */}
        <div className="flex items-center justify-center gap-5 font-mono text-[11px]">
          <button className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-white/10">
            <span className="text-white/50">AI Battery</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">5</span>
          </button>
          <button className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-white/10">
            <span className="text-white/50">Active Agents</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">{agentSteps.filter((s) => s.status === 'active').length || 0}</span>
          </button>
          <button
            onClick={() => setEchoToWhatsApp(!echoToWhatsApp)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2 py-1 transition',
              echoToWhatsApp ? 'bg-green-500/20 hover:bg-green-500/30' : 'hover:bg-white/10',
            )}
            title={echoToWhatsApp ? 'WhatsApp echo ON — responses also sent to WhatsApp' : 'WhatsApp echo OFF'}
          >
            <Smartphone className={cn('h-3.5 w-3.5', echoToWhatsApp ? 'text-green-400' : 'text-white/50')} />
            <span className={echoToWhatsApp ? 'text-green-400' : 'text-white/50'}>WhatsApp</span>
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
              echoToWhatsApp ? 'bg-green-500/30 text-green-300' : 'bg-white/20 text-white',
            )}>
              {echoToWhatsApp ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Tagline */}
        <p className="text-center text-[10px] italic tracking-wide text-white/40">
          Your hustle deserves infrastructure
        </p>
      </div>
    </div>
  )
}
