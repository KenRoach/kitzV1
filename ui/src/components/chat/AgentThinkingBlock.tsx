import { Bot, ChevronDown, ChevronRight } from 'lucide-react'
import { useAgentThinkingStore } from '@/stores/agentThinkingStore'
import { AgentThinkingStep } from './AgentThinkingStep'

export function AgentThinkingBlock() {
  const steps = useAgentThinkingStore((s) => s.steps)
  const isThinking = useAgentThinkingStore((s) => s.isThinking)
  const collapsed = useAgentThinkingStore((s) => s.collapsed)
  const totalTimeMs = useAgentThinkingStore((s) => s.totalTimeMs)
  const toggleCollapsed = useAgentThinkingStore((s) => s.toggleCollapsed)

  if (steps.length === 0) return null

  const doneCount = steps.filter((s) => s.status === 'done').length
  const totalCount = steps.length
  const timeStr = totalTimeMs > 0 ? `${(totalTimeMs / 1000).toFixed(1)}s` : ''

  return (
    <div className="my-2 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2">
      {/* Header — always visible, clickable */}
      <button
        onClick={toggleCollapsed}
        className="flex w-full items-center gap-2 text-left"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-purple-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-purple-400" />
        )}
        <Bot className="h-3.5 w-3.5 text-purple-400" />
        <span className="flex-1 text-xs font-medium text-purple-300">
          {isThinking
            ? `${doneCount}/${totalCount} agents working...`
            : `${totalCount} agents done`}
        </span>
        {timeStr && (
          <span className="font-mono text-[10px] text-gray-500">{timeStr}</span>
        )}
      </button>

      {/* Steps — collapsible */}
      {!collapsed && (
        <div className="mt-1.5 ml-1 border-l border-purple-500/20 pl-2">
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
