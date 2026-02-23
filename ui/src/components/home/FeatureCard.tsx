import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FeatureColor = 'purple' | 'blue' | 'pink' | 'orange' | 'emerald' | 'amber'

const colorMap: Record<FeatureColor, { icon: string; bg: string; border: string }> = {
  purple:  { icon: 'text-purple-500',  bg: 'bg-purple-50',  border: 'hover:border-purple-300' },
  blue:    { icon: 'text-blue-500',    bg: 'bg-blue-50',    border: 'hover:border-blue-300' },
  pink:    { icon: 'text-pink-500',    bg: 'bg-pink-50',    border: 'hover:border-pink-300' },
  orange:  { icon: 'text-orange-500',  bg: 'bg-orange-50',  border: 'hover:border-orange-300' },
  emerald: { icon: 'text-emerald-500', bg: 'bg-emerald-50', border: 'hover:border-emerald-300' },
  amber:   { icon: 'text-amber-500',   bg: 'bg-amber-50',   border: 'hover:border-amber-300' },
}

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  color: FeatureColor
  onClick?: () => void
}

export function FeatureCard({ icon: Icon, title, description, color, onClick }: FeatureCardProps) {
  const c = colorMap[color]
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-start rounded-2xl border border-gray-200 bg-white p-6 text-left',
        'transition-all hover:shadow-lg cursor-pointer',
        c.border,
      )}
    >
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', c.bg)}>
        <Icon className={cn('h-5 w-5', c.icon)} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-black">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </button>
  )
}
