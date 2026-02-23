import { Sparkles } from 'lucide-react'
import { useOrbStore } from '@/stores/orbStore'
import { cn } from '@/lib/utils'

export function Orb() {
  const { toggle, state } = useOrbStore()

  const shadowMap = {
    idle: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
    thinking: 'shadow-[0_0_25px_rgba(147,51,234,0.5)]',
    success: 'shadow-[0_0_25px_rgba(168,85,247,0.6)]',
    error: 'shadow-[0_0_25px_rgba(239,68,68,0.5)]',
  }

  const pulseSpeed = state === 'thinking' ? 'animate-[orb-pulse_1s_ease-in-out_infinite]' : 'animate-[orb-pulse_3s_ease-in-out_infinite]'

  return (
    <div className="flex justify-center py-4">
      <button
        onClick={toggle}
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full',
          'bg-gradient-to-br from-purple-500 to-purple-600 text-white',
          'cursor-pointer transition-all',
          pulseSpeed,
          shadowMap[state],
        )}
      >
        <Sparkles className="h-7 w-7" />
      </button>
    </div>
  )
}
