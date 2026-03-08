import { useState, useRef, useEffect, useCallback } from 'react'
import { PhoneOff, ArrowUp, Zap, Mic, MicOff, Globe, Loader } from 'lucide-react'
import { useOrbStore } from '@/stores/orbStore'
import { useAuthStore } from '@/stores/authStore'
import { useAgentThinkingStore } from '@/stores/agentThinkingStore'
import { AgentThinkingBlock } from '@/components/chat/AgentThinkingBlock'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { useKitzVoice } from '@/hooks/useKitzVoice'
import { cn } from '@/lib/utils'

type MicState = 'idle' | 'requesting' | 'listening' | 'transcribing' | 'denied' | 'unsupported'

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'auto', label: 'Auto-detect' },
]

/* eslint-disable @typescript-eslint/no-explicit-any */
function getSpeechRecognition(): (new () => any) | null {
  const w = window as unknown as Record<string, any>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => any) | null
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Convert audio blob to base64 string */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1] || ''
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/** Transcribe audio via Whisper API endpoint */
async function transcribeAudio(audioBlob: Blob, language: string): Promise<string> {
  const base64 = await blobToBase64(audioBlob)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || ''
  const token = localStorage.getItem('kitz_token') || ''
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${apiBase}/api/kitz/voice/transcribe`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      audio_base64: base64,
      language: language === 'auto' ? undefined : language,
      format: 'webm',
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error((err as { error?: string }).error || 'Transcription failed')
  }
  const data = await res.json() as { transcript: string }
  return data.transcript
}

export function TalkToKitzModal() {
  const { isOpen, close, messages, state, sendMessage } = useOrbStore()
  const isThinking = useAgentThinkingStore((s) => s.isThinking)
  const user = useAuthStore((s) => s.user)
  const { speak, speaking } = useKitzVoice()

  const [input, setInput] = useState('')
  const [micState, setMicState] = useState<MicState>('idle')
  const [transcript, setTranscript] = useState('')
  const [language, setLanguage] = useState('es')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [useWhisper, setUseWhisper] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
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

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      setMicState('idle')
      setTranscript('')
    }
  }, [isOpen])

  // ── Whisper-based recording (MediaRecorder → server-side STT) ──
  const startWhisperRecording = useCallback(async () => {
    setMicState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      audioChunksRef.current = []

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null

        if (audioChunksRef.current.length === 0) {
          setMicState('idle')
          return
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioChunksRef.current = []

        setMicState('transcribing')
        setTranscript('Transcribing...')
        try {
          const text = await transcribeAudio(audioBlob, language)
          setTranscript('')
          if (text.trim()) {
            void sendMessage(text.trim(), user?.id ?? 'default')
          }
        } catch (err) {
          setTranscript(`Error: ${(err as Error).message}`)
          setTimeout(() => setTranscript(''), 3000)
        }
        setMicState('idle')
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setMicState('listening')
    } catch {
      setMicState('denied')
    }
  }, [language, sendMessage, user?.id])

  const stopWhisperRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  // ── Browser SpeechRecognition (fallback) ──
  const startBrowserRecognition = useCallback(async () => {
    const SpeechRecognitionClass = getSpeechRecognition()
    if (!SpeechRecognitionClass) {
      setUseWhisper(true)
      await startWhisperRecording()
      return
    }

    setMicState('requesting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
    } catch {
      setMicState('denied')
      return
    }

    const recognition = new SpeechRecognitionClass()
    recognition.continuous = false
    recognition.interimResults = true

    const langMap: Record<string, string> = {
      es: 'es-419', en: 'en-US', pt: 'pt-BR', auto: 'es-419',
    }
    recognition.lang = langMap[language] || 'es-419'

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
  }, [language, micState, sendMessage, startWhisperRecording, user?.id])

  // ── Unified start/stop ──
  const startListening = useCallback(async () => {
    if (useWhisper) {
      await startWhisperRecording()
    } else {
      await startBrowserRecognition()
    }
  }, [useWhisper, startWhisperRecording, startBrowserRecognition])

  const stopListening = useCallback(() => {
    if (useWhisper) {
      stopWhisperRecording()
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
      setMicState('idle')
      setTranscript('')
    }
  }, [useWhisper, stopWhisperRecording])

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
    transcribing: 'Transcribing with Whisper...',
    denied: 'Mic access denied — check browser settings',
    unsupported: 'Voice not supported in this browser',
  }

  const currentLang = LANGUAGES.find((l) => l.code === language)

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
          <Zap className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium text-white/80">Kitz AI</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Language picker */}
          <div className="relative">
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/60 transition hover:bg-white/10"
            >
              <Globe className="h-3 w-3" />
              {currentLang?.label}
            </button>
            {showLangPicker && (
              <div className="absolute right-0 top-8 z-10 rounded-lg border border-white/20 bg-gray-900 py-1 shadow-xl">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code)
                      setShowLangPicker(false)
                    }}
                    className={cn(
                      'block w-full px-4 py-1.5 text-left text-xs transition hover:bg-white/10',
                      language === lang.code ? 'text-purple-400' : 'text-white/60',
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Whisper toggle */}
          <button
            onClick={() => setUseWhisper(!useWhisper)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition',
              useWhisper
                ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                : 'border-white/20 bg-white/5 text-white/40 hover:bg-white/10',
            )}
            title={useWhisper ? 'Using Whisper AI (more accurate)' : 'Using browser speech (faster)'}
          >
            {useWhisper ? 'Whisper AI' : 'Browser STT'}
          </button>

          <span className="font-mono text-xs text-white/40">voice assistant</span>
        </div>
      </div>

      {/* Center orb + mic button */}
      <div className="flex flex-col items-center pt-8">
        <button
          onClick={micState === 'listening' ? stopListening : startListening}
          disabled={state === 'thinking' || micState === 'unsupported' || micState === 'transcribing'}
          className={cn(
            'flex h-28 w-28 items-center justify-center rounded-full transition-all duration-300',
            'shadow-[0_0_40px_rgba(168,85,247,0.4)]',
            micState === 'listening'
              ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-[0_0_40px_rgba(239,68,68,0.5)] animate-[talk-pulse_1s_ease-in-out_infinite]'
              : micState === 'transcribing'
                ? 'bg-gradient-to-br from-yellow-500 to-orange-500 animate-[talk-pulse_0.8s_ease-in-out_infinite]'
                : speaking
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600 animate-[talk-pulse_1.5s_ease-in-out_infinite]'
                  : state === 'thinking'
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 animate-[talk-pulse_1.5s_ease-in-out_infinite]'
                    : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 hover:shadow-[0_0_60px_rgba(168,85,247,0.6)]',
          )}
        >
          {micState === 'listening' ? (
            <MicOff className="h-10 w-10 text-white" />
          ) : micState === 'transcribing' ? (
            <Loader className="h-10 w-10 text-white animate-spin" />
          ) : speaking ? (
            <Mic className="h-10 w-10 text-white" />
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
          micState === 'transcribing' ? 'text-yellow-400' :
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
