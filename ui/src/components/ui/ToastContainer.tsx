import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useToastStore, type ToastType } from '@/stores/toastStore'
import { cn } from '@/lib/utils'

const icons: Record<ToastType, typeof Info> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
}

const styles: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-purple-200 bg-purple-50 text-purple-800',
}

const iconColors: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-purple-500',
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg',
              'animate-[fadeInUp_0.3s_ease] min-w-[280px] max-w-[400px]',
              styles[toast.type],
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', iconColors[toast.type])} />
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded-lg p-0.5 opacity-50 transition hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
