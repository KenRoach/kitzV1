import { create } from 'zustand'
import { apiFetch } from '@/lib/api'
import { API } from '@/lib/constants'
import { useAgentThinkingStore } from './agentThinkingStore'
import { useOrbNavigatorStore, detectNavHint } from '@/hooks/useOrbNavigator'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

type OrbState = 'idle' | 'thinking' | 'success' | 'error'

interface OrbStore {
  /* Voice modal (TalkToKitzModal) */
  isOpen: boolean
  /* Text chatbox focus signal — ChatPanel listens for this */
  chatFocused: boolean
  /* Chatbox glow animation — stays true for ~1.5s after puff arrival */
  chatGlowing: boolean
  /* Chatbox loading bar animation — exaggerated fill effect on double-click */
  chatLoading: boolean
  /* TTS speaking state — Orb shows talking mood */
  speaking: boolean
  /** Incremented each time user clicks Kitz to puff-teleport to chatbox */
  teleportSeq: number

  state: OrbState
  messages: ChatMessage[]

  toggle: () => void
  open: () => void
  close: () => void
  focusChat: () => void
  blurChat: () => void
  /** Trigger the chatbox glow animation (auto-clears after 1.8s) */
  glowChat: () => void
  /** Trigger the exaggerated chatbox loading bar (auto-clears after 2.5s) */
  loadChat: () => void
  /** Signal a puff-teleport to chatbox (FloatingOrb listens) */
  teleportToChat: () => void
  setSpeaking: (val: boolean) => void
  sendMessage: (content: string, userId: string) => Promise<void>
}

let _glowTimer: ReturnType<typeof setTimeout> | null = null
let _loadTimer: ReturnType<typeof setTimeout> | null = null

export const useOrbStore = create<OrbStore>((set, get) => ({
  isOpen: false,
  chatFocused: false,
  chatGlowing: false,
  chatLoading: false,
  speaking: false,
  teleportSeq: 0,
  state: 'idle',
  messages: [],

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  focusChat: () => set({ chatFocused: true }),
  blurChat: () => set({ chatFocused: false }),
  teleportToChat: () => set((s) => ({ teleportSeq: s.teleportSeq + 1 })),
  glowChat: () => {
    if (_glowTimer) clearTimeout(_glowTimer)
    set({ chatGlowing: true })
    _glowTimer = setTimeout(() => {
      set({ chatGlowing: false })
      _glowTimer = null
    }, 1800)
  },
  loadChat: () => {
    if (_loadTimer) clearTimeout(_loadTimer)
    set({ chatLoading: true, chatFocused: true })
    _loadTimer = setTimeout(() => {
      set({ chatLoading: false })
      _loadTimer = null
    }, 2500)
  },
  setSpeaking: (val) => set({ speaking: val }),

  sendMessage: async (content, userId) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    set((s) => ({ messages: [...s.messages, userMsg], state: 'thinking' }))

    // Trigger agent thinking simulation
    useAgentThinkingStore.getState().simulateThinking(content)

    try {
      const res = await apiFetch<{ reply?: string; message?: string }>(
        `${API.KITZ_OS}`,
        {
          method: 'POST',
          body: JSON.stringify({ message: content, channel: 'web', userId }),
        },
      )
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.reply ?? res.message ?? 'Done.',
        timestamp: Date.now(),
      }
      set((s) => ({ messages: [...s.messages, assistantMsg], state: 'success' }))
      // Auto-collapse thinking block when response arrives
      useAgentThinkingStore.setState({ collapsed: true })
      // Detect navigation hints in the response and guide the Orb
      const navHint = detectNavHint(assistantMsg.content)
      if (navHint) {
        useOrbNavigatorStore.getState().navigateTo(navHint.navId, navHint.label)
      }
      setTimeout(() => {
        if (get().state === 'success') set({ state: 'idle' })
      }, 2000)
    } catch (err) {
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Something went wrong.',
        timestamp: Date.now(),
      }
      set((s) => ({ messages: [...s.messages, errMsg], state: 'error' }))
      setTimeout(() => {
        if (get().state === 'error') set({ state: 'idle' })
      }, 3000)
    }
  },
}))
