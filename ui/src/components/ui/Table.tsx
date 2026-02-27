import { type ReactNode, type ThHTMLAttributes, type TdHTMLAttributes, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown } from 'lucide-react'

/* ── Table ── */

export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  )
}

/* ── Table Header ── */

export function TableHeader({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('bg-gray-50', className)} {...props}>
      {children}
    </thead>
  )
}

/* ── Table Head Cell ── */

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean
  sortDirection?: 'asc' | 'desc' | null
  onSort?: () => void
}

export function TableHead({
  sortable,
  sortDirection,
  onSort,
  className,
  children,
  ...props
}: TableHeadProps) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500',
        sortable && 'cursor-pointer select-none hover:text-gray-700',
        className,
      )}
      onClick={sortable ? onSort : undefined}
      aria-sort={
        sortDirection === 'asc'
          ? 'ascending'
          : sortDirection === 'desc'
            ? 'descending'
            : undefined
      }
      {...props}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && (
          <span className="flex flex-col">
            <ChevronUp
              size={12}
              className={cn(
                '-mb-0.5',
                sortDirection === 'asc' ? 'text-purple-500' : 'text-gray-300',
              )}
            />
            <ChevronDown
              size={12}
              className={cn(
                '-mt-0.5',
                sortDirection === 'desc' ? 'text-purple-500' : 'text-gray-300',
              )}
            />
          </span>
        )}
      </span>
    </th>
  )
}

/* ── Table Body ── */

export function TableBody({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('divide-y divide-gray-100', className)} {...props}>
      {children}
    </tbody>
  )
}

/* ── Table Row ── */

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean
}

export function TableRow({ selected, className, children, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        'transition-colors duration-[var(--transition-fast)]',
        'hover:bg-gray-50',
        selected && 'bg-purple-50',
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  )
}

/* ── Table Cell ── */

export function TableCell({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 text-gray-700', className)} {...props}>
      {children}
    </td>
  )
}

/* ── Empty State ── */

interface TableEmptyProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  colSpan: number
}

export function TableEmpty({ icon, title, description, action, colSpan }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16 text-center">
        <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
          {icon && <div className="text-gray-300">{icon}</div>}
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {description && <p className="text-xs text-gray-400">{description}</p>}
          {action && <div className="mt-2">{action}</div>}
        </div>
      </td>
    </tr>
  )
}
