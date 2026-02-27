import { useEffect, useRef, type ReactNode, type HTMLAttributes } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ModalSize = 'sm' | 'md' | 'lg' | 'full'

interface ModalProps {
  open: boolean
  onClose: () => void
  size?: ModalSize
  children: ReactNode
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  full: 'max-w-4xl',
}

export function Modal({ open, onClose, size = 'md', children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-[fadeIn_200ms_ease]" />

      {/* Panel */}
      <div
        className={cn(
          'relative w-full rounded-[var(--radius-xl)] bg-white shadow-[var(--shadow-xl)]',
          'animate-[modal-fade-in_200ms_ease]',
          'flex max-h-[85vh] flex-col',
          sizeStyles[size],
        )}
      >
        {children}
      </div>
    </div>
  )
}

/* ── Modal Header ── */

interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  onClose?: () => void
}

export function ModalHeader({ title, onClose, className, children, ...props }: ModalHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-gray-100 px-6 py-4',
        className,
      )}
      {...props}
    >
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {children}
      {onClose && (
        <button
          onClick={onClose}
          className="rounded-[var(--radius-md)] p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
}

/* ── Modal Body ── */

export function ModalBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-6 py-4', className)} {...props}>
      {children}
    </div>
  )
}

/* ── Modal Footer ── */

export function ModalFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
