import { Check, X, Loader2, Wrench } from 'lucide-react'
import type { ThinkingStep } from '@/stores/agentThinkingStore'
import { cn } from '@/lib/utils'

interface AgentThinkingStepProps {
  step: ThinkingStep
  isLast: boolean
}

export function AgentThinkingStep({ step, isLast }: AgentThinkingStepProps) {
  const isActive = step.status === 'active'
  const isDone = step.status === 'done'

  return (
    <div
      className={cn(
        'flex items-start gap-2 py-1.5 transition-all duration-300',
        isActive && 'animate-fade-in',
        !isLast && 'border-b border-white/5',
      )}
    >
      {/* Status icon */}
      <div className="mt-0.5 flex w-4 flex-col items-center">
        {step.status === 'pending' && (
          <div className="h-3.5 w-3.5 rounded-full border border-gray-600" />
        )}
        {isActive && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
        )}
        {isDone && (
          <Check className="h-3.5 w-3.5 text-green-400" />
        )}
        {step.status === 'failed' && (
          <X className="h-3.5 w-3.5 text-red-400" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {/* Agent name + action */}
        <div className="flex items-center gap-2">
          <span className={cn(
            'shrink-0 truncate font-mono text-[11px] font-semibold',
            isActive ? 'text-purple-300' : isDone ? 'text-gray-400' : 'text-gray-600',
          )}>
            {step.agentName}
          </span>
          <span className={cn(
            'flex-1 text-[11px] truncate',
            isActive ? 'text-gray-300' : 'text-gray-500',
          )}>
            {step.action}
          </span>
          {/* Per-step duration */}
          {step.durationStr && (
            <span className="shrink-0 font-mono text-[9px] text-gray-600">
              {step.durationStr}
            </span>
          )}
        </div>

        {/* Tool badge + detail */}
        {(step.tool || step.detail) && (
          <div className="mt-0.5 flex items-center gap-1.5">
            {step.tool && (
              <span className={cn(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px]',
                isActive
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-white/5 text-purple-400/60',
              )}>
                <Wrench className="h-2.5 w-2.5" />
                {step.tool}
              </span>
            )}
            {step.detail && (
              <span className={cn(
                'text-[10px] truncate',
                isActive ? 'text-purple-400/70' : 'text-gray-600',
              )}>
                {step.detail}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
