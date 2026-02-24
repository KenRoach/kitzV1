import { Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useKitzVoice } from '@/hooks/useKitzVoice'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  variant?: 'dark' | 'light'
}

/**
 * Parse KITZ markdown-style content into React nodes.
 * Handles: **bold**, *italic*, `code`, \n, • bullets, numbered lists, links, emojis.
 * No external deps — lightweight inline parser.
 */
function renderRichContent(text: string, variant: 'dark' | 'light') {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''

    // Empty line = spacer
    if (line.trim() === '') {
      elements.push(<div key={`sp-${i}`} className="h-2" />)
      continue
    }

    // Bullet lines (• or - prefix)
    if (/^\s*[•\-]\s/.test(line)) {
      const bulletContent = line.replace(/^\s*[•\-]\s*/, '')
      elements.push(
        <div key={`b-${i}`} className="flex items-start gap-2 pl-1">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
          <span>{parseInline(bulletContent, variant)}</span>
        </div>,
      )
      continue
    }

    // Numbered list (1. 2. 3.)
    if (/^\s*\d+\.\s/.test(line)) {
      const match = line.match(/^\s*(\d+)\.\s*(.*)/)
      if (match) {
        elements.push(
          <div key={`n-${i}`} className="flex items-start gap-2 pl-1">
            <span className="mt-0.5 shrink-0 rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
              {match[1]}
            </span>
            <span>{parseInline(match[2] ?? '', variant)}</span>
          </div>,
        )
        continue
      }
    }

    // Regular line
    elements.push(
      <div key={`l-${i}`}>{parseInline(line, variant)}</div>,
    )
  }

  return <>{elements}</>
}

/**
 * Parse inline formatting: **bold**, *italic*, `code`, [links](url)
 */
function parseInline(text: string, variant: 'dark' | 'light'): React.ReactNode {
  // Regex to match: **bold**, *italic*, `code`, [text](url)
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Try **bold** first
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/)
    if (boldMatch) {
      parts.push(
        <span key={key++} className="font-semibold text-white">
          {boldMatch[1]}
        </span>,
      )
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Try *italic*
    const italicMatch = remaining.match(/^\*(.+?)\*/)
    if (italicMatch) {
      parts.push(
        <span key={key++} className="font-medium text-purple-300 italic">
          {italicMatch[1]}
        </span>,
      )
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Try `code`
    const codeMatch = remaining.match(/^`(.+?)`/)
    if (codeMatch) {
      parts.push(
        <code
          key={key++}
          className={cn(
            'rounded px-1.5 py-0.5 text-xs font-mono',
            variant === 'dark'
              ? 'bg-white/10 text-purple-300'
              : 'bg-purple-100 text-purple-700',
          )}
        >
          {codeMatch[1]}
        </code>,
      )
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    // Try [text](url) links
    const linkMatch = remaining.match(/^\[(.+?)\]\((.+?)\)/)
    if (linkMatch) {
      parts.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 underline decoration-purple-400/40 hover:text-purple-300 hover:decoration-purple-300/60 transition"
        >
          {linkMatch[1]}
        </a>,
      )
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    // No match — take next char and continue
    // Batch plain text for efficiency
    const plainMatch = remaining.match(/^[^*`[\n]+/)
    if (plainMatch) {
      parts.push(<span key={key++}>{plainMatch[0]}</span>)
      remaining = remaining.slice(plainMatch[0].length)
    } else {
      // Single special char that didn't match any pattern
      parts.push(<span key={key++}>{remaining[0]}</span>)
      remaining = remaining.slice(1)
    }
  }

  return <>{parts}</>
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
        'text-sm leading-relaxed space-y-1',
        variant === 'dark' ? 'text-gray-300' : 'text-gray-700',
      )}>
        {renderRichContent(content, variant)}
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
