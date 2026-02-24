import { Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useKitzVoice } from '@/hooks/useKitzVoice'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  variant?: 'dark' | 'light'
}

export function MessageBubble({ role, content, variant = 'light' }: MessageBubbleProps) {
  const { speak, speaking } = useKitzVoice()

  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
          variant === 'dark' ? 'bg-white/10 text-white' : 'bg-purple-500 text-white',
        )}>
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="group relative">
      <div className={cn(
        'text-sm leading-relaxed',
        variant === 'dark' ? 'text-gray-300' : 'text-gray-700',
      )}>
        {content}
      </div>
      <button
        onClick={() => speak(content)}
        disabled={speaking}
        className={cn(
          'absolute -right-1 top-0 rounded-full p-1 transition-opacity',
          'opacity-0 group-hover:opacity-100',
          speaking ? 'text-purple-500 animate-pulse' : 'text-gray-400 hover:text-purple-500',
        )}
        title="Listen to Kitz"
      >
        <Volume2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
