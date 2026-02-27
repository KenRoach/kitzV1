import { Volume2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useKitzVoice } from '@/hooks/useKitzVoice'
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/Table'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  variant?: 'dark' | 'light'
  imageUrl?: string
  attachments?: Array<{ type: string; url?: string; html?: string; filename?: string }>
}

// ── Code block extraction (must run before line splitting) ──
interface CodeBlock {
  lang: string
  code: string
}

function extractCodeBlocks(text: string): { processed: string; blocks: CodeBlock[] } {
  const blocks: CodeBlock[] = []
  const processed = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const idx = blocks.length
    blocks.push({ lang: lang || '', code: code.trimEnd() })
    return `__CODEBLOCK_${idx}__`
  })
  return { processed, blocks }
}

// ── Table parsing ──
function parseMarkdownTable(lines: string[]): { headers: string[]; rows: string[][] } | null {
  if (lines.length < 2) return null
  const parseLine = (l: string) =>
    l
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim())
  const headers = parseLine(lines[0]!)
  if (headers.length === 0) return null
  // lines[1] should be the separator (---|---)
  if (lines.length >= 2 && !/^[\s|:-]+$/.test(lines[1]!)) return null
  const rows = lines.slice(2).map(parseLine)
  return { headers, rows }
}

/**
 * Parse KITZ markdown-style content into React nodes.
 * Handles: **bold**, *italic*, `code`, ```code blocks```, | tables |,
 * ![images](url), bare image URLs, \n, • bullets, numbered lists, links, emojis.
 * No external deps — lightweight inline parser.
 */
function renderRichContent(text: string, variant: 'dark' | 'light') {
  // 1. Extract fenced code blocks before splitting into lines
  const { processed, blocks: codeBlocks } = extractCodeBlocks(text)
  const lines = processed.split('\n')
  const elements: React.ReactNode[] = []

  let tableAccum: string[] = []
  let tableStartIdx = 0

  const flushTable = () => {
    if (tableAccum.length === 0) return
    const parsed = parseMarkdownTable(tableAccum)
    if (parsed) {
      elements.push(
        <div key={`tbl-${tableStartIdx}`} className="my-2 overflow-x-auto rounded-lg border border-white/10">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="border-b border-white/10">
                {parsed.headers.map((h, hi) => (
                  <TableHead
                    key={hi}
                    className={cn(
                      'text-xs px-3 py-2 font-semibold',
                      variant === 'dark'
                        ? 'bg-purple-500/20 text-purple-200'
                        : 'bg-purple-50 text-purple-700',
                    )}
                  >
                    {parseInline(h, variant)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsed.rows.map((row, ri) => (
                <TableRow key={ri} className="border-b border-white/5 hover:bg-white/5">
                  {row.map((cell, ci) => (
                    <TableCell
                      key={ci}
                      className={cn(
                        'text-xs px-3 py-1.5',
                        variant === 'dark' ? 'text-gray-300' : 'text-gray-600',
                      )}
                    >
                      {parseInline(cell, variant)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>,
      )
    } else {
      // Not a valid table — render lines as plain text
      for (const tl of tableAccum) {
        elements.push(
          <div key={`tl-${elements.length}`}>{parseInline(tl, variant)}</div>,
        )
      }
    }
    tableAccum = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''

    // ── Code block placeholder ──
    const cbMatch = line.match(/^__CODEBLOCK_(\d+)__$/)
    if (cbMatch) {
      flushTable()
      const block = codeBlocks[Number(cbMatch[1])]
      if (block) {
        elements.push(
          <pre
            key={`cb-${i}`}
            className={cn(
              'my-2 rounded-lg p-3 overflow-x-auto text-xs font-mono',
              variant === 'dark' ? 'bg-black/40 text-green-300' : 'bg-gray-100 text-gray-800',
            )}
          >
            {block.lang && (
              <div className="mb-1 text-[10px] uppercase tracking-wider text-gray-500">
                {block.lang}
              </div>
            )}
            <code className="whitespace-pre">{block.code}</code>
          </pre>,
        )
      }
      continue
    }

    // ── Table line accumulation ──
    if (/^\|.+\|/.test(line.trim())) {
      if (tableAccum.length === 0) tableStartIdx = i
      tableAccum.push(line.trim())
      continue
    } else {
      flushTable()
    }

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

  // Flush any remaining table
  flushTable()

  return <>{elements}</>
}

// ── Image URL patterns ──
const IMAGE_EXT_RE = /^(https?:\/\/\S+\.(?:png|jpe?g|gif|webp)(?:\?\S*)?)(\s|$)/i
const DALLE_URL_RE = /^(https:\/\/oaidalleapiprodscus\.blob\.core\.windows\.net\/\S+?)(\s|$)/

/**
 * Parse inline formatting: **bold**, *italic*, `code`, [links](url), ![images](url), bare image URLs
 */
function parseInline(text: string, variant: 'dark' | 'light'): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // ── Markdown image: ![alt](url) ──
    const imgMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
    if (imgMatch) {
      parts.push(
        <img
          key={key++}
          src={imgMatch[2]}
          alt={imgMatch[1] || 'Generated image'}
          className="rounded-lg max-w-full my-2 max-h-80 object-contain"
          loading="lazy"
        />,
      )
      remaining = remaining.slice(imgMatch[0].length)
      continue
    }

    // ── Bare DALL-E URL ──
    const dalleMatch = remaining.match(DALLE_URL_RE)
    if (dalleMatch) {
      parts.push(
        <img
          key={key++}
          src={dalleMatch[1]}
          alt="Generated image"
          className="rounded-lg max-w-full my-2 max-h-80 object-contain"
          loading="lazy"
        />,
      )
      remaining = remaining.slice(dalleMatch[1]!.length)
      continue
    }

    // ── Bare image URL (.png, .jpg, etc.) ──
    const imgUrlMatch = remaining.match(IMAGE_EXT_RE)
    if (imgUrlMatch) {
      parts.push(
        <img
          key={key++}
          src={imgUrlMatch[1]}
          alt="Image"
          className="rounded-lg max-w-full my-2 max-h-80 object-contain"
          loading="lazy"
        />,
      )
      remaining = remaining.slice(imgUrlMatch[1]!.length)
      continue
    }

    // ── **bold** ──
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

    // ── *italic* ──
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

    // ── `code` ──
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

    // ── [text](url) links ──
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

    // ── Plain text batch ──
    const plainMatch = remaining.match(/^[^*`![\n]+/)
    if (plainMatch) {
      parts.push(<span key={key++}>{plainMatch[0]}</span>)
      remaining = remaining.slice(plainMatch[0].length)
    } else {
      parts.push(<span key={key++}>{remaining[0]}</span>)
      remaining = remaining.slice(1)
    }
  }

  return <>{parts}</>
}

export function MessageBubble({ role, content, variant = 'light', imageUrl, attachments }: MessageBubbleProps) {
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

        {/* Structured image from API response */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Generated image"
            className="rounded-lg max-w-full my-2 max-h-80 object-contain"
            loading="lazy"
          />
        )}

        {/* Attachments (HTML documents, etc.) */}
        {attachments?.map((att, idx) => (
          <div key={`att-${idx}`} className="my-2">
            {att.type === 'html' && att.html && (
              <details className="rounded-lg border border-white/10 overflow-hidden">
                <summary className="cursor-pointer px-3 py-2 bg-purple-500/10 text-purple-300 text-xs font-medium hover:bg-purple-500/20 transition">
                  {att.filename || 'Document'} — click to preview
                </summary>
                <iframe
                  srcDoc={att.html}
                  className="w-full h-64 bg-white"
                  sandbox="allow-same-origin"
                  title={att.filename || 'Document preview'}
                />
                {att.html && (
                  <div className="px-3 py-1.5 border-t border-white/10 flex justify-end">
                    <button
                      onClick={() => {
                        const blob = new Blob([att.html!], { type: 'text/html' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = att.filename || 'document.html'
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </button>
                  </div>
                )}
              </details>
            )}
            {att.type === 'image' && att.url && (
              <img
                src={att.url}
                alt={att.filename || 'Attachment'}
                className="rounded-lg max-w-full my-1 max-h-80 object-contain"
                loading="lazy"
              />
            )}
          </div>
        ))}
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
