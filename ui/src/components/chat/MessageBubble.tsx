import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  variant?: 'dark' | 'light'
}

export function MessageBubble({ role, content, variant = 'light' }: MessageBubbleProps) {
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
    <div className={cn(
      'text-sm leading-relaxed',
      variant === 'dark' ? 'text-gray-300' : 'text-gray-700',
    )}>
      {content}
    </div>
  )
}
