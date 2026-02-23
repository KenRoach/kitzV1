import { Check, X, Loader2 } from 'lucide-react'
import type { ThinkingStep } from '@/stores/agentThinkingStore'

interface AgentThinkingStepProps {
  step: ThinkingStep
  isLast: boolean
}

export function AgentThinkingStep({ step, isLast: _isLast }: AgentThinkingStepProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      {/* Status icon */}
      <div className="flex w-4 flex-col items-center">
        {step.status === 'pending' && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
        )}
        {step.status === 'done' && (
          <Check className="h-3.5 w-3.5 text-green-400" />
        )}
        {step.status === 'failed' && (
          <X className="h-3.5 w-3.5 text-red-400" />
        )}
      </div>

      {/* Agent name */}
      <span className="w-28 shrink-0 truncate font-mono text-[11px] font-medium text-gray-400">
        {step.agentName}
      </span>

      {/* Action phrase */}
      <span className="text-[11px] text-gray-500">
        {step.action}
      </span>
    </div>
  )
}
