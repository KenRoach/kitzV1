import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type InputSize = 'sm' | 'md' | 'lg'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  helpText?: string
  error?: string
  size?: InputSize
  leadingIcon?: ReactNode
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-[var(--radius-md)]',
  md: 'h-10 px-3.5 text-sm rounded-[var(--radius-md)]',
  lg: 'h-12 px-4 text-base rounded-[var(--radius-md)]',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helpText, error, size = 'md', leadingIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="ml-0.5 text-error">*</span>}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full border bg-white text-gray-900 placeholder:text-gray-400',
              'transition-all duration-[var(--transition-fast)]',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 focus:border-purple-500',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
              error
                ? 'border-error focus:ring-error'
                : 'border-gray-200 hover:border-gray-300',
              sizeStyles[size],
              leadingIcon && 'pl-10',
              className,
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined
            }
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-error" role="alert">
            {error}
          </p>
        )}
        {!error && helpText && (
          <p id={`${inputId}-help`} className="text-xs text-gray-400">
            {helpText}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
