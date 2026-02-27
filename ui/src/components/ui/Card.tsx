import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type CardVariant = 'default' | 'elevated' | 'interactive'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  action?: ReactNode
}

const variantStyles: Record<CardVariant, string> = {
  default: 'border border-gray-200 bg-white',
  elevated: 'bg-white shadow-[var(--shadow-md)]',
  interactive:
    'border border-gray-200 bg-white transition-shadow duration-[var(--transition-normal)] hover:shadow-[var(--shadow-md)] cursor-pointer',
}

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] overflow-hidden',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, action, className, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-gray-100 px-5 py-4',
        className,
      )}
      {...props}
    >
      {title ? (
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      ) : null}
      {children}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  )
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center border-t border-gray-100 px-5 py-3',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
