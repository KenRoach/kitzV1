import { useState, useRef, useEffect } from 'react'
import { X, ArrowUp } from 'lucide-react'
import { useOrbStore } from '@/stores/orbStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

export function OrbChat() {
  const { isOpen, close, messages, state, sendMessage } = useOrbStore()
  const user = useAuthStore((s) => s.user)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || state === 'thinking') return
    void sendMessage(input, user?.id ?? 'default')
    setInput('')
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#00D4AA]" />
            <h3 className="text-sm font-semibold text-black">Kitz AI</h3>
            <span className="font-mono text-[10px] text-gray-400">voice assistant</span>
          </div>
          <button onClick={close} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="space-y-3 overflow-y-auto px-5 py-4" style={{ maxHeight: 320 }}>
          {messages.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">
              Hey! I'm Kitz, your AI business assistant. How can I help?
            </p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2 text-sm',
                  msg.role === 'user'
                    ? 'bg-[#00D4AA] text-white'
                    : 'bg-gray-100 text-black',
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {state === 'thinking' && (
            <div className="flex justify-start">
              <div className="flex gap-1 rounded-2xl bg-gray-100 px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-gray-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Kitz..."
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-black placeholder-gray-400 outline-none transition focus:border-[#00D4AA]"
            />
            <button
              type="submit"
              disabled={state === 'thinking'}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00D4AA] text-white transition hover:bg-[#00E8BB] disabled:opacity-50"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
