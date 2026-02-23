import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FeatureColor = 'purple' | 'blue' | 'pink' | 'orange' | 'emerald' | 'amber'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  color: FeatureColor
  onClick?: () => void
}

export function FeatureCard({ icon: Icon, title, description, onClick }: FeatureCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-start rounded-2xl border border-gray-200 bg-white p-6 text-left',
        'transition-all hover:shadow-lg hover:border-gray-300 cursor-pointer',
      )}
    >
      <Icon className="h-5 w-5 text-purple-500" />
      <h3 className="mt-4 text-lg font-semibold text-black">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </button>
  )
}
