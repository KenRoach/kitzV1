import { AlertTriangle, XCircle, Wrench, X } from 'lucide-react'
import { useStatusStore, type StatusLevel } from '@/stores/statusStore'
import { cn } from '@/lib/utils'

const BANNER_CONFIG: Record<Exclude<StatusLevel, 'none'>, {
  icon: typeof AlertTriangle
  bg: string
  border: string
  text: string
}> = {
  degraded: {
    icon: AlertTriangle,
    bg: 'bg-red-900/90',
    border: 'border-red-700/50',
    text: 'text-red-100',
  },
  outage: {
    icon: XCircle,
    bg: 'bg-red-950/95',
    border: 'border-red-800/60',
    text: 'text-red-50',
  },
  maintenance: {
    icon: Wrench,
    bg: 'bg-amber-900/90',
    border: 'border-amber-700/50',
    text: 'text-amber-100',
  },
}

export function StatusBanner() {
  const { level, message, clear } = useStatusStore()

  if (level === 'none' || !message) return null

  const config = BANNER_CONFIG[level]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex w-full items-center justify-center gap-2 border-b px-4 py-2 text-center text-sm font-medium',
        config.bg,
        config.border,
        config.text,
      )}
      role="alert"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{message}</span>
      <button
        onClick={clear}
        aria-label="Dismiss"
        className="ml-2 shrink-0 rounded p-0.5 transition hover:bg-white/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
