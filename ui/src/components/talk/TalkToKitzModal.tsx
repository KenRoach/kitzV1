import { useState, useRef, useEffect } from 'react'
import { PhoneOff, ArrowUp, Sparkles } from 'lucide-react'
import { useOrbStore } from '@/stores/orbStore'
import { useAuthStore } from '@/stores/authStore'
import { useAgentThinkingStore } from '@/stores/agentThinkingStore'
import { AgentThinkingBlock } from '@/components/chat/AgentThinkingBlock'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { cn } from '@/lib/utils'

export function TalkToKitzModal() {
  const { isOpen, close, messages, state, sendMessage } = useOrbStore()
  const isThinking = useAgentThinkingStore((s) => s.isThinking)
  const user = useAuthStore((s) => s.user)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isThinking])

  useEffect(() => {
    if (isOpen && overlayRef.current) {
      overlayRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || state === 'thinking') return
    void sendMessage(input, user?.id ?? 'default')
    setInput('')
  }

  const statusText = {
    idle: 'Talk to Kitz',
    thinking: 'Thinking...',
    success: 'Kitz is ready',
    error: 'Something went wrong',
  }

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Talk to Kitz"
      tabIndex={-1}
      onKeyDown={(e) => { if (e.key === 'Escape') close() }}
      className="fixed inset-0 z-50 flex flex-col items-center bg-black/80 backdrop-blur-sm animate-[modal-fade-in_0.3s_ease-out]"
    >
      {/* Top bar */}
      <div className="flex w-full items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium text-white/80">Kitz AI</span>
        </div>
        <span className="font-mono text-xs text-white/40">voice assistant</span>
      </div>

      {/* Center orb */}
      <div className="flex flex-col items-center pt-8">
        <div
          className={cn(
            'flex h-28 w-28 items-center justify-center rounded-full',
            'bg-gradient-to-br from-purple-500 to-purple-600',
            'shadow-[0_0_40px_rgba(168,85,247,0.4)]',
            state === 'thinking' && 'animate-[talk-pulse_1.5s_ease-in-out_infinite]',
          )}
        >
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <p className="mt-4 text-sm font-medium text-white/70">{statusText[state]}</p>
      </div>

      {/* Agent thinking block */}
      {isThinking && (
        <div className="mx-auto mt-4 w-full max-w-lg px-6">
          <AgentThinkingBlock />
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="mx-auto mt-4 flex-1 w-full max-w-lg overflow-y-auto px-6 space-y-3"
      >
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-white/30">
            Hey! I'm Kitz, your AI business assistant. How can I help?
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} variant="dark" />
        ))}
        {state === 'thinking' && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl bg-white/10 px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-white/40" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-white/40" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-white/40" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input + hang-up */}
      <div className="w-full max-w-lg px-6 pb-8 pt-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Kitz..."
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
            />
            <button
              type="submit"
              disabled={state === 'thinking'}
              aria-label="Send message"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white transition hover:bg-purple-400 disabled:opacity-50"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>

        {/* Hang-up button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={close}
            aria-label="Close"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-400 hover:shadow-xl"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
