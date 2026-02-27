import { create } from 'zustand'
import { apiFetch } from '@/lib/api'
import { API } from '@/lib/constants'
import { useAgentThinkingStore } from './agentThinkingStore'
import { useOrbNavigatorStore, detectNavHint } from '@/hooks/useOrbNavigator'
import { KITZ_MANIFEST } from '@/content/kitz-manifest'

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
  /* Chatbox shake animation — phone-vibration rattle on puff arrival */
  chatShaking: boolean
  /* Welcome message injected flag — prevents duplicate welcomes */
  welcomeInjected: boolean
  /* TTS speaking state — Orb shows talking mood */
  speaking: boolean
  /** Incremented each time user clicks Kitz to puff-teleport to chatbox */
  teleportSeq: number
  /** Echo responses to WhatsApp when enabled */
  echoToWhatsApp: boolean

  state: OrbState
  messages: ChatMessage[]

  toggle: () => void
  open: () => void
  close: () => void
  focusChat: () => void
  blurChat: () => void
  /** Trigger the chatbox glow + shake animation */
  glowChat: () => void
  /** Inject welcome + status message into chatbox (like WhatsApp greeting) */
  injectWelcome: () => void
  /** Signal a puff-teleport to chatbox (FloatingOrb listens) */
  teleportToChat: () => void
  setSpeaking: (val: boolean) => void
  setEchoToWhatsApp: (val: boolean) => void
  sendMessage: (content: string, userId: string) => Promise<void>
}

let _glowTimer: ReturnType<typeof setTimeout> | null = null

export const useOrbStore = create<OrbStore>((set, get) => ({
  isOpen: false,
  chatFocused: false,
  chatGlowing: false,
  chatShaking: false,
  welcomeInjected: false,
  speaking: false,
  teleportSeq: 0,
  echoToWhatsApp: false,
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
    set({ chatGlowing: true, chatShaking: true })
    // Shake is short — 0.4s vibration then stop
    setTimeout(() => set({ chatShaking: false }), 400)
    _glowTimer = setTimeout(() => {
      set({ chatGlowing: false })
      _glowTimer = null
    }, 1800)
  },
  injectWelcome: () => {
    const { welcomeInjected } = get()
    if (welcomeInjected) {
      set({ chatFocused: true })
      return
    }

    const hour = new Date().getHours()
    const timeGreet = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'
    const { tools, totalAgents } = KITZ_MANIFEST.capabilities
    const dailyLimit = KITZ_MANIFEST.governance.aiBatteryDailyLimit

    // Show static welcome immediately, then update with live status
    const welcomeMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `${timeGreet} boss 👋\n\nKITZ is locked in. ${tools} tools loaded — CRM, orders, storefronts, payments, the works.\n\n⚡ Battery: ${dailyLimit} credits/day · 🤖 ${totalAgents} agents ready\n🟢 Connecting...\n\nWhat are we building today?`,
      timestamp: Date.now(),
    }

    set((s) => ({
      messages: [...s.messages, welcomeMsg],
      chatFocused: true,
      welcomeInjected: true,
    }))

    // Fetch live status from backend and update welcome message
    apiFetch<{ status?: string; tools_registered?: number; battery?: { todayCredits?: number; dailyLimit?: number } }>(
      `${API.KITZ_OS}/status`,
    ).then((status) => {
      const liveTools = status.tools_registered ?? tools
      const batteryUsed = status.battery?.todayCredits ?? 0
      const batteryLimit = status.battery?.dailyLimit ?? dailyLimit

      const updatedContent = `${timeGreet} boss 👋\n\nKITZ is locked in. ${liveTools} tools loaded — CRM, orders, storefronts, payments, the works.\n\n⚡ Battery: ${batteryUsed}/${batteryLimit} credits used · 🤖 ${totalAgents} agents ready\n🟢 All systems go\n\nWhat are we building today?`

      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === welcomeMsg.id ? { ...m, content: updatedContent } : m,
        ),
      }))
    }).catch(() => {
      // If backend is down, update status to reflect that
      const offlineContent = `${timeGreet} boss 👋\n\nKITZ is warming up. ${tools} tools available — CRM, orders, storefronts, payments, the works.\n\n⚡ Battery: ${dailyLimit} credits/day · 🤖 ${totalAgents} agents ready\n🟡 Backend connecting — hang tight\n\nWhat are we building today?`

      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === welcomeMsg.id ? { ...m, content: offlineContent } : m,
        ),
      }))
    })
  },
  setSpeaking: (val) => set({ speaking: val }),
  setEchoToWhatsApp: (val) => set({ echoToWhatsApp: val }),

  sendMessage: async (content, userId) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    set((s) => ({ messages: [...s.messages, userMsg], state: 'thinking' }))

    // Show agent chain while waiting for backend
    useAgentThinkingStore.getState().startThinking(content)

    // Build conversation history for backend context (last 10 messages, excluding the one we just added)
    const currentMessages = get().messages
    const chatHistory = currentMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      const echoChannels = get().echoToWhatsApp ? ['whatsapp'] : []
      const res = await apiFetch<{ reply?: string; response?: string; message?: string; tools_used?: string[] }>(
        `${API.KITZ_OS}`,
        {
          method: 'POST',
          body: JSON.stringify({ message: content, channel: 'web', user_id: userId, chat_history: chatHistory, echo_channels: echoChannels }),
        },
      )
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.reply ?? res.response ?? res.message ?? 'Done.',
        timestamp: Date.now(),
      }
      set((s) => ({ messages: [...s.messages, assistantMsg], state: 'success' }))
      // Resolve thinking steps with real tools used from backend
      useAgentThinkingStore.getState().resolveThinking(res.tools_used)
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
