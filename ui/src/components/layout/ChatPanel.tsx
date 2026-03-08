import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Smartphone, FileText, Mail, Globe, Presentation } from 'lucide-react'
import { useOrbStore } from '@/stores/orbStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import { useAgentThinkingStore } from '@/stores/agentThinkingStore'
import { AgentThinkingBlock } from '@/components/chat/AgentThinkingBlock'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { TypingIndicator } from '@/components/chat/TypingIndicator'

const QUICK_ACTIONS = [
  { labelKey: 'chat.invoice', icon: FileText, promptKey: 'chat.createInvoice' },
  { labelKey: 'chat.emailDraft', icon: Mail, promptKey: 'chat.draftEmail' },
  { labelKey: 'chat.landingPage', icon: Globe, promptKey: 'chat.createLanding' },
  { labelKey: 'chat.deck', icon: Presentation, promptKey: 'chat.buildDeck' },
] as const

export function CommandCenter() {
  const { messages, state, sendMessage, chatFocused, blurChat, echoToWhatsApp, setEchoToWhatsApp } = useOrbStore()
  const user = useAuthStore((s) => s.user)
  const { t } = useTranslation()
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
        <span className="text-sm font-semibold text-white">{t('chat.commandCenter')}</span>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Chat messages */}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            variant="dark"
            imageUrl={msg.imageUrl}
            attachments={msg.attachments}
          />
        ))}

        {/* Typing indicator */}
        {state === 'thinking' && <TypingIndicator />}

        {/* Agent thinking block */}
        {(agentSteps.length > 0 || isAgentThinking) && <AgentThinkingBlock />}

        {/* Empty state: quick actions + suggestion chips */}
        {messages.length === 0 && (
          <div className="space-y-4 pt-2">
            {/* Quick action buttons */}
            <div className="flex items-center gap-2 overflow-x-auto" role="group" aria-label="Quick actions">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.labelKey}
                    onClick={() => {
                      setInput(t(action.promptKey))
                      inputRef.current?.focus()
                    }}
                    className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-purple-400/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 transition hover:bg-purple-500/20 hover:text-purple-200"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {t(action.labelKey)}
                  </button>
                )
              })}
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Quick questions">
              {(['chat.whoOwes', 'chat.paymentLink', 'chat.whatToDo', 'chat.weekLook'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => void sendMessage(t(key), user?.id ?? 'default')}
                  aria-label={`Ask Kitz: ${t(key)}`}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  {t(key)}
                </button>
              ))}
            </div>
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
              placeholder={t('chat.askKitz')}
              aria-label={t('chat.sendMessage')}
              className="w-full rounded-xl border border-white/40 bg-white/10 py-2.5 pl-4 pr-4 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/70 focus:ring-2 focus:ring-white/20"
            />
          </div>
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
            <span className="text-white/50">{t('chat.activeAgents')}</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">{agentSteps.filter((s) => s.status === 'active').length || 0}</span>
          </button>
          <button
            onClick={() => setEchoToWhatsApp(!echoToWhatsApp)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2 py-1 transition',
              echoToWhatsApp ? 'bg-purple-500/20 hover:bg-purple-500/30' : 'hover:bg-white/10',
            )}
            title={echoToWhatsApp ? t('chat.whatsAppEchoOn') : t('chat.whatsAppEchoOff')}
          >
            <Smartphone className={cn('h-3.5 w-3.5', echoToWhatsApp ? 'text-purple-400' : 'text-white/50')} />
            <span className={echoToWhatsApp ? 'text-purple-400' : 'text-white/50'}>{t('chat.whatsApp')}</span>
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
              echoToWhatsApp ? 'bg-purple-500/30 text-purple-300' : 'bg-white/20 text-white',
            )}>
              {echoToWhatsApp ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Tagline */}
        <p className="text-center text-[10px] italic tracking-wide text-white/40">
          {t('chat.tagline')}
        </p>
      </div>
    </div>
  )
}

/** @deprecated Use CommandCenter instead */
export const ChatPanel = CommandCenter
