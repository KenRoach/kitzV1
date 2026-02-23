import { create } from 'zustand'
import { apiFetch } from '@/lib/api'
import { API } from '@/lib/constants'
import { useAgentThinkingStore } from './agentThinkingStore'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

type OrbState = 'idle' | 'thinking' | 'success' | 'error'

interface OrbStore {
  isOpen: boolean
  state: OrbState
  messages: ChatMessage[]
  toggle: () => void
  open: () => void
  close: () => void
  sendMessage: (content: string, userId: string) => Promise<void>
}

export const useOrbStore = create<OrbStore>((set, get) => ({
  isOpen: false,
  state: 'idle',
  messages: [],

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  sendMessage: async (content, userId) => {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
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
        id: `msg_${Date.now()}_r`,
        role: 'assistant',
        content: res.reply ?? res.message ?? 'Done.',
        timestamp: Date.now(),
      }
      set((s) => ({ messages: [...s.messages, assistantMsg], state: 'success' }))
      // Auto-collapse thinking block when response arrives
      useAgentThinkingStore.setState({ collapsed: true })
      setTimeout(() => {
        if (get().state === 'success') set({ state: 'idle' })
      }, 2000)
    } catch (err) {
      const errMsg: ChatMessage = {
        id: `msg_${Date.now()}_e`,
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
