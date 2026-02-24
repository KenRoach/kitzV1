import { useState, useEffect } from 'react'
import { Bot, ChevronDown, ChevronRight } from 'lucide-react'
import { useAgentThinkingStore } from '@/stores/agentThinkingStore'
import { AgentThinkingStep } from './AgentThinkingStep'

export function AgentThinkingBlock() {
  const steps = useAgentThinkingStore((s) => s.steps)
  const isThinking = useAgentThinkingStore((s) => s.isThinking)
  const collapsed = useAgentThinkingStore((s) => s.collapsed)
  const totalTimeMs = useAgentThinkingStore((s) => s.totalTimeMs)
  const toggleCollapsed = useAgentThinkingStore((s) => s.toggleCollapsed)

  // Live elapsed timer while thinking
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!isThinking || steps.length === 0) {
      setElapsed(0)
      return
    }
    const start = steps[0]?.startedAt ?? Date.now()
    const interval = setInterval(() => {
      setElapsed(Date.now() - start)
    }, 100)
    return () => clearInterval(interval)
  }, [isThinking, steps])

  if (steps.length === 0) return null

  const doneCount = steps.filter((s) => s.status === 'done').length
  const activeCount = steps.filter((s) => s.status === 'active').length
  const totalCount = steps.length
  const displayTime = isThinking
    ? `${(elapsed / 1000).toFixed(1)}s`
    : totalTimeMs > 0
      ? `${(totalTimeMs / 1000).toFixed(1)}s`
      : ''

  return (
    <div className="my-2 rounded-lg border border-purple-500/20 bg-purple-950/50 overflow-hidden">
      {/* Header — always visible, clickable */}
      <button
        onClick={toggleCollapsed}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-purple-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-purple-400" />
        )}
        <Bot className="h-3.5 w-3.5 text-purple-400" />
        <span className="flex-1 text-xs font-medium text-purple-300">
          {isThinking ? (
            <>
              {activeCount > 0 && (
                <span className="text-purple-400">{activeCount} agent{activeCount > 1 ? 's' : ''} working</span>
              )}
              {doneCount > 0 && (
                <span className="text-gray-500"> · {doneCount} done</span>
              )}
            </>
          ) : (
            <span>{totalCount} agent{totalCount > 1 ? 's' : ''} done</span>
          )}
        </span>
        {displayTime && (
          <span className={`font-mono text-[10px] ${isThinking ? 'text-purple-400' : 'text-gray-500'}`}>
            {displayTime}
          </span>
        )}
      </button>

      {/* Steps — collapsible, with scroll for long chains */}
      {!collapsed && (
        <div className="border-t border-purple-500/10 px-3 py-1 max-h-[200px] overflow-y-auto">
          {steps.map((step, i) => (
            <AgentThinkingStep
              key={step.id}
              step={step}
              isLast={i === steps.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
