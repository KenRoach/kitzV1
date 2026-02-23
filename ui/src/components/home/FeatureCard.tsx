import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FeatureColor = 'purple' | 'blue' | 'pink' | 'orange' | 'emerald' | 'amber'

const colorMap: Record<FeatureColor, { border: string }> = {
  purple:  { border: 'hover:border-purple-300' },
  blue:    { border: 'hover:border-purple-300' },
  pink:    { border: 'hover:border-purple-300' },
  orange:  { border: 'hover:border-purple-300' },
  emerald: { border: 'hover:border-purple-300' },
  amber:   { border: 'hover:border-purple-300' },
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
        'flex flex-col items-start rounded-2xl border border-gray-200 bg-white p-5 text-left',
        'transition-all hover:shadow-lg cursor-pointer',
        c.border,
      )}
    >
      <Icon className="h-5 w-5 text-purple-500" />
      <h3 className="mt-3 text-sm font-semibold text-black">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>
    </button>
  )
}
