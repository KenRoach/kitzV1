import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'primary' | 'success' | 'error' | 'warning'
type BadgeSize = 'sm' | 'md'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-600',
  primary: 'bg-purple-100 text-purple-700',
  success: 'bg-success-light text-green-700',
  error: 'bg-error-light text-red-700',
  warning: 'bg-warning-light text-amber-700',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[11px]',
  md: 'px-2 py-0.5 text-xs',
}

export function Badge({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-[var(--radius-sm)]',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
