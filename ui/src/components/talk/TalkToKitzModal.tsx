import { useState, useRef, useEffect, useCallback } from 'react'
import { PhoneOff, ArrowUp, Sparkles, Mic, MicOff } from 'lucide-react'
import { useOrbStore } from '@/stores/orbStore'
import { useAuthStore } from '@/stores/authStore'
import { useAgentThinkingStore } from '@/stores/agentThinkingStore'
import { AgentThinkingBlock } from '@/components/chat/AgentThinkingBlock'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { useKitzVoice } from '@/hooks/useKitzVoice'
import { cn } from '@/lib/utils'

type MicState = 'idle' | 'requesting' | 'listening' | 'denied' | 'unsupported'

/* eslint-disable @typescript-eslint/no-explicit-any */
function getSpeechRecognition(): (new () => any) | null {
  const w = window as unknown as Record<string, any>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => any) | null
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function TalkToKitzModal() {
  const { isOpen, close, messages, state, sendMessage } = useOrbStore()
  const isThinking = useAgentThinkingStore((s) => s.isThinking)
  const user = useAuthStore((s) => s.user)
  const { speak, speaking } = useKitzVoice()

  const [input, setInput] = useState('')
  const [micState, setMicState] = useState<MicState>('idle')
  const [transcript, setTranscript] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const prevMsgCountRef = useRef(messages.length)

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isThinking])

  // Focus modal on open
  useEffect(() => {
    if (isOpen && overlayRef.current) {
      overlayRef.current.focus()
    }
  }, [isOpen])

  // Auto-speak assistant responses
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg?.role === 'assistant' && isOpen) {
        void speak(lastMsg.content)
      }
    }
    prevMsgCountRef.current = messages.length
  }, [messages, isOpen, speak])

  // Cleanup recognition on unmount or close
  useEffect(() => {
    if (!isOpen && recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
      setMicState('idle')
      setTranscript('')
    }
  }, [isOpen])

  const startListening = useCallback(async () => {
    const SpeechRecognitionClass = getSpeechRecognition()
    if (!SpeechRecognitionClass) {
      setMicState('unsupported')
      return
    }

    setMicState('requesting')

    // Request mic permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Got permission — stop tracks immediately (SpeechRecognition manages its own stream)
      stream.getTracks().forEach((t) => t.stop())
    } catch {
      setMicState('denied')
      return
    }

    const recognition = new SpeechRecognitionClass()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let final = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (!result?.[0]) continue
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      if (final) {
        setTranscript('')
        setInput(final)
        // Auto-send the final transcript
        void sendMessage(final, user?.id ?? 'default')
        setInput('')
        setMicState('idle')
      } else {
        setTranscript(interim)
      }
    }

    recognition.onerror = () => {
      setMicState('idle')
      setTranscript('')
    }

    recognition.onend = () => {
      if (micState === 'listening') {
        setMicState('idle')
        setTranscript('')
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setMicState('listening')
  }, [micState, sendMessage, user?.id])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setMicState('idle')
    setTranscript('')
  }, [])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || state === 'thinking') return
    void sendMessage(input, user?.id ?? 'default')
    setInput('')
  }

  const statusText: Record<string, string> = {
    idle: speaking ? 'Kitz is speaking...' : 'Tap the mic to talk',
    thinking: 'Thinking...',
    success: speaking ? 'Kitz is speaking...' : 'Kitz is ready',
    error: 'Something went wrong',
  }

  const micLabel: Record<MicState, string> = {
    idle: 'Tap to speak',
    requesting: 'Allowing microphone...',
    listening: 'Listening...',
    denied: 'Mic access denied — check browser settings',
    unsupported: 'Voice not supported in this browser',
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

      {/* Center orb + mic button */}
      <div className="flex flex-col items-center pt-8">
        {/* Mic button — big, prominent */}
        <button
          onClick={micState === 'listening' ? stopListening : startListening}
          disabled={state === 'thinking' || micState === 'unsupported'}
          className={cn(
            'flex h-28 w-28 items-center justify-center rounded-full transition-all duration-300',
            'shadow-[0_0_40px_rgba(168,85,247,0.4)]',
            micState === 'listening'
              ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-[0_0_40px_rgba(239,68,68,0.5)] animate-[talk-pulse_1s_ease-in-out_infinite]'
              : speaking
                ? 'bg-gradient-to-br from-purple-500 to-purple-600 animate-[talk-pulse_1.5s_ease-in-out_infinite]'
                : state === 'thinking'
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600 animate-[talk-pulse_1.5s_ease-in-out_infinite]'
                  : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 hover:shadow-[0_0_60px_rgba(168,85,247,0.6)]',
          )}
        >
          {micState === 'listening' ? (
            <MicOff className="h-10 w-10 text-white" />
          ) : speaking ? (
            <Sparkles className="h-10 w-10 text-white" />
          ) : (
            <Mic className="h-10 w-10 text-white" />
          )}
        </button>

        {/* Status text */}
        <p className="mt-4 text-sm font-medium text-white/70">
          {statusText[state]}
        </p>

        {/* Mic state label */}
        <p className={cn(
          'mt-1 text-xs',
          micState === 'denied' || micState === 'unsupported' ? 'text-red-400' :
          micState === 'listening' ? 'text-green-400' :
          'text-white/40',
        )}>
          {micLabel[micState]}
        </p>

        {/* Live transcript */}
        {transcript && (
          <div className="mt-3 mx-auto max-w-sm rounded-xl bg-white/5 px-4 py-2 border border-white/10">
            <p className="text-sm text-white/80 italic">&ldquo;{transcript}&rdquo;</p>
          </div>
        )}
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
            Hey! I&apos;m Kitz, your AI business assistant.<br />
            Tap the mic and talk to me, or type below.
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
              placeholder="Or type a message..."
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
            onClick={() => {
              stopListening()
              close()
            }}
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
