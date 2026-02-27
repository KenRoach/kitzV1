import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type SelectSize = 'sm' | 'md' | 'lg'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  helpText?: string
  error?: string
  size?: SelectSize
  options: SelectOption[]
  placeholder?: string
}

const sizeStyles: Record<SelectSize, string> = {
  sm: 'h-8 px-3 pr-8 text-xs rounded-[var(--radius-md)]',
  md: 'h-10 px-3.5 pr-9 text-sm rounded-[var(--radius-md)]',
  lg: 'h-12 px-4 pr-10 text-base rounded-[var(--radius-md)]',
}

const chevronSizes: Record<SelectSize, number> = {
  sm: 14,
  md: 16,
  lg: 18,
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helpText, error, size = 'md', options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="ml-0.5 text-error">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full appearance-none border bg-white text-gray-900',
              'transition-all duration-[var(--transition-fast)]',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 focus:border-purple-500',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
              error
                ? 'border-error focus:ring-error'
                : 'border-gray-200 hover:border-gray-300',
              sizeStyles[size],
              className,
            )}
            aria-invalid={error ? 'true' : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={chevronSizes[size]}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
        {error && (
          <p className="text-xs text-error" role="alert">
            {error}
          </p>
        )}
        {!error && helpText && (
          <p className="text-xs text-gray-400">
            {helpText}
          </p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'
