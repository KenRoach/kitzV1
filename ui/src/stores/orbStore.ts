import { create } from 'zustand'
import { apiFetch } from '@/lib/api'
import { API } from '@/lib/constants'
import { useAgentThinkingStore } from './agentThinkingStore'
import { useOrbNavigatorStore, detectNavHint } from '@/hooks/useOrbNavigator'
import { KITZ_MANIFEST } from '@/content/kitz-manifest'

interface ChatAttachment {
  type: 'image' | 'html' | 'document'
  url?: string
  html?: string
  filename?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  imageUrl?: string
  toolsUsed?: string[]
  attachments?: ChatAttachment[]
}

type OrbState = 'idle' | 'thinking' | 'success' | 'error'

/** NDJSON event from WebSocket gateway */
interface WSEvent {
  type: 'agent.thinking' | 'tool.call' | 'tool.result' | 'text.delta' | 'text.done' | 'error' | 'connected'
  traceId?: string
  timestamp: string
  data: Record<string, unknown>
}

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
  /** AI Battery remaining credits (fetched from backend) */
  batteryRemaining: number
  /** WebSocket connection status */
  wsConnected: boolean

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
  /** Connect to WebSocket gateway for real-time streaming */
  connectWebSocket: () => void
  /** Disconnect WebSocket */
  disconnectWebSocket: () => void
}

let _glowTimer: ReturnType<typeof setTimeout> | null = null
let _ws: WebSocket | null = null
let _wsReconnectTimer: ReturnType<typeof setTimeout> | null = null
/** ID of the streaming assistant message currently being built from text.delta events */
let _streamingMsgId: string | null = null

/** Derive WebSocket URL from the kitz_os base URL */
function getWSUrl(): string {
  const kitzOsUrl = import.meta.env.VITE_KITZ_OS_URL as string | undefined
  if (kitzOsUrl) {
    // Replace http(s) with ws(s)
    return kitzOsUrl.replace(/^http/, 'ws') + '/ws'
  }
  // Same-origin: derive from current page location
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/ws`
}

function handleWSEvent(event: WSEvent): void {
  const thinkingStore = useAgentThinkingStore.getState()

  switch (event.type) {
    case 'agent.thinking': {
      const { phase, agent } = event.data as { phase?: string; agent?: string }
      // Add a real-time thinking step from the backend
      thinkingStore.addLiveStep(
        agent || 'KITZ Engine',
        phase || 'Processing',
        undefined,
        event.traceId,
      )
      break
    }

    case 'tool.call': {
      const { tool } = event.data as { tool?: string; args?: Record<string, unknown> }
      if (tool) {
        thinkingStore.addLiveStep('KITZ Engine', `Calling ${tool}`, tool, event.traceId)
      }
      break
    }

    case 'tool.result': {
      const { tool } = event.data as { tool?: string }
      if (tool) {
        thinkingStore.completeLiveStep(tool)
      }
      break
    }

    case 'text.delta': {
      const { text } = event.data as { text?: string }
      if (!text) break

      // Append delta to the current streaming message
      if (!_streamingMsgId) {
        _streamingMsgId = crypto.randomUUID()
        const streamMsg: ChatMessage = {
          id: _streamingMsgId,
          role: 'assistant',
          content: text,
          timestamp: Date.now(),
        }
        useOrbStore.setState((s) => ({
          messages: [...s.messages, streamMsg],
          state: 'thinking',
        }))
      } else {
        const msgId = _streamingMsgId
        useOrbStore.setState((s) => ({
          messages: s.messages.map((m) =>
            m.id === msgId ? { ...m, content: m.content + text } : m,
          ),
        }))
      }
      break
    }

    case 'text.done': {
      const { text, toolsUsed } = event.data as { text?: string; toolsUsed?: string[] }
      // Finalize the streaming message or create one if we missed deltas
      if (_streamingMsgId) {
        const msgId = _streamingMsgId
        useOrbStore.setState((s) => ({
          messages: s.messages.map((m) =>
            m.id === msgId
              ? { ...m, content: text || m.content, toolsUsed: toolsUsed }
              : m,
          ),
          state: 'success',
        }))
      }
      _streamingMsgId = null
      // Resolve thinking with real tools
      if (toolsUsed) {
        thinkingStore.resolveThinking(toolsUsed)
        useAgentThinkingStore.setState({ collapsed: true })
      }
      setTimeout(() => {
        if (useOrbStore.getState().state === 'success') {
          useOrbStore.setState({ state: 'idle' })
        }
      }, 2000)
      break
    }

    case 'error': {
      const { message } = event.data as { message?: string }
      console.warn('[WS] Server error:', message)
      break
    }

    case 'connected':
      // Server confirmed connection
      break
  }
}

export const useOrbStore = create<OrbStore>((set, get) => ({
  isOpen: false,
  chatFocused: false,
  chatGlowing: false,
  chatShaking: false,
  welcomeInjected: false,
  speaking: false,
  teleportSeq: 0,
  echoToWhatsApp: false,
  batteryRemaining: KITZ_MANIFEST.governance.aiBatteryDailyLimit,
  wsConnected: false,
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
      content: `${timeGreet} boss 👋\n\nKITZ is locked in. ${tools} tools loaded — CRM, orders, storefronts, payments, the works.\n\n🤖 ${totalAgents} agents ready\n🟢 Connecting...\n\nWhat are we building today?`,
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
      { skipAuthRedirect: true },
    ).then((status) => {
      const liveTools = status.tools_registered ?? tools
      const batteryUsed = status.battery?.todayCredits ?? 0
      const batteryLimit = status.battery?.dailyLimit ?? dailyLimit

      const updatedContent = `${timeGreet} boss 👋\n\nKITZ is locked in. ${liveTools} tools loaded — CRM, orders, storefronts, payments, the works.\n\n🤖 ${totalAgents} agents ready\n🟢 All systems go\n\nWhat are we building today?`

      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === welcomeMsg.id ? { ...m, content: updatedContent } : m,
        ),
        batteryRemaining: batteryLimit - batteryUsed,
      }))
    }).catch(() => {
      // If backend is down, update status to reflect that
      const offlineContent = `${timeGreet} boss 👋\n\nKITZ is warming up. ${tools} tools available — CRM, orders, storefronts, payments, the works.\n\n🤖 ${totalAgents} agents ready\n🟡 Backend connecting — hang tight\n\nWhat are we building today?`

      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === welcomeMsg.id ? { ...m, content: offlineContent } : m,
        ),
      }))
    })
  },
  setSpeaking: (val) => set({ speaking: val }),
  setEchoToWhatsApp: (val) => set({ echoToWhatsApp: val }),

  connectWebSocket: () => {
    if (_ws && (_ws.readyState === WebSocket.OPEN || _ws.readyState === WebSocket.CONNECTING)) {
      return // Already connected or connecting
    }

    const url = getWSUrl()
    try {
      _ws = new WebSocket(url)
    } catch {
      console.warn('[WS] Failed to create WebSocket connection')
      return
    }

    _ws.onopen = () => {
      set({ wsConnected: true })
      if (_wsReconnectTimer) {
        clearTimeout(_wsReconnectTimer)
        _wsReconnectTimer = null
      }
    }

    _ws.onmessage = (raw) => {
      // NDJSON — each line is a separate JSON event
      const lines = raw.data.split('\n').filter(Boolean)
      for (const line of lines) {
        try {
          const event = JSON.parse(line) as WSEvent
          handleWSEvent(event)
        } catch {
          // Ignore malformed events
        }
      }
    }

    _ws.onclose = () => {
      set({ wsConnected: false })
      _ws = null
      // Auto-reconnect after 3 seconds
      if (!_wsReconnectTimer) {
        _wsReconnectTimer = setTimeout(() => {
          _wsReconnectTimer = null
          get().connectWebSocket()
        }, 3000)
      }
    }

    _ws.onerror = () => {
      // onclose will fire after onerror — reconnect handled there
    }
  },

  disconnectWebSocket: () => {
    if (_wsReconnectTimer) {
      clearTimeout(_wsReconnectTimer)
      _wsReconnectTimer = null
    }
    if (_ws) {
      _ws.close()
      _ws = null
    }
    set({ wsConnected: false })
  },

  sendMessage: async (content, userId) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    set((s) => ({ messages: [...s.messages, userMsg], state: 'thinking' }))

    // Reset streaming message ID for this request
    _streamingMsgId = null

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
      const res = await apiFetch<{
        reply?: string
        response?: string
        message?: string
        tools_used?: string[]
        image_url?: string
        attachments?: ChatAttachment[]
      }>(
        `${API.KITZ_OS}`,
        {
          method: 'POST',
          body: JSON.stringify({ message: content, channel: 'web', user_id: userId, chat_history: chatHistory, echo_channels: echoChannels }),
          skipAuthRedirect: true, // Show errors in chat, don't kick to login
        },
      )

      // If WS already streamed the response via text.done, skip adding a duplicate
      if (_streamingMsgId) {
        // WS handled it — just ensure final content/metadata is correct
        const msgId = _streamingMsgId
        _streamingMsgId = null
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  content: res.reply ?? res.response ?? res.message ?? m.content,
                  imageUrl: res.image_url,
                  toolsUsed: res.tools_used,
                  attachments: res.attachments,
                }
              : m,
          ),
          state: 'success',
        }))
      } else {
        // No WS stream — add the full response as before
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: res.reply ?? res.response ?? res.message ?? 'Done.',
          timestamp: Date.now(),
          imageUrl: res.image_url,
          toolsUsed: res.tools_used,
          attachments: res.attachments,
        }
        set((s) => ({ messages: [...s.messages, assistantMsg], state: 'success' }))
      }

      // Resolve thinking steps with real tools used from backend
      useAgentThinkingStore.getState().resolveThinking(res.tools_used)
      useAgentThinkingStore.setState({ collapsed: true })
      // Detect navigation hints in the response and guide the Orb
      const lastMsg = get().messages[get().messages.length - 1]
      if (lastMsg) {
        const navHint = detectNavHint(lastMsg.content)
        if (navHint) {
          useOrbNavigatorStore.getState().navigateTo(navHint.navId, navHint.label)
        }
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
