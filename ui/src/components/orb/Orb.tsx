import { Sparkles } from 'lucide-react'
import { useOrbStore } from '@/stores/orbStore'
import { cn } from '@/lib/utils'

export function Orb() {
  const { open, state } = useOrbStore()

  const statusDot = {
    idle: '',
    thinking: 'bg-amber-400',
    success: 'bg-emerald-400',
    error: 'bg-red-400',
  }

  const isThinking = state === 'thinking'

  return (
    <button
      onClick={open}
      className={cn(
        'flex items-center gap-2 rounded-full px-5 py-3',
        'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
        'shadow-lg hover:shadow-xl cursor-pointer transition-all',
        isThinking && 'animate-[talk-pulse_1.5s_ease-in-out_infinite]',
      )}
    >
      <Sparkles className="h-4 w-4" />
      <span className="text-sm font-medium whitespace-nowrap">Talk to Kitz</span>
      {state !== 'idle' && (
        <span className={cn('h-2 w-2 rounded-full', statusDot[state])} />
      )}
    </button>
  )
}
