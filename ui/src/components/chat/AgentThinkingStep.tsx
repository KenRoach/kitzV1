import { Check, X, Loader2, Wrench } from 'lucide-react'
import type { ThinkingStep } from '@/stores/agentThinkingStore'

interface AgentThinkingStepProps {
  step: ThinkingStep
  isLast: boolean
}

export function AgentThinkingStep({ step, isLast: _isLast }: AgentThinkingStepProps) {
  return (
    <div className="flex items-start gap-2 py-1">
      {/* Status icon */}
      <div className="mt-0.5 flex w-4 flex-col items-center">
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

      <div className="min-w-0 flex-1">
        {/* Agent name + action */}
        <div className="flex items-center gap-2">
          <span className="shrink-0 truncate font-mono text-[11px] font-medium text-gray-400">
            {step.agentName}
          </span>
          <span className="text-[11px] text-gray-500 truncate">
            {step.action}
          </span>
        </div>

        {/* Tool badge + detail — shown when available */}
        {(step.tool || step.detail) && (
          <div className="mt-0.5 flex items-center gap-1.5">
            {step.tool && (
              <span className="inline-flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-purple-400">
                <Wrench className="h-2.5 w-2.5" />
                {step.tool}
              </span>
            )}
            {step.detail && (
              <span className="text-[10px] text-gray-600 truncate">
                {step.detail}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
