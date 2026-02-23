import { Users, Wrench, BookOpen, Clock } from 'lucide-react'
import { KITZ_MANIFEST } from '@/data/kitz-manifest'

const stats = [
  {
    label: `${KITZ_MANIFEST.capabilities.totalAgents}+ AI Agents`,
    icon: Users,
  },
  {
    label: `${KITZ_MANIFEST.capabilities.tools}+ Tools`,
    icon: Wrench,
  },
  {
    label: `${KITZ_MANIFEST.capabilities.sops} SOPs`,
    icon: BookOpen,
  },
  {
    label: '< 10 min setup',
    icon: Clock,
  },
] as const

export function MissionBlock() {
  return (
    <div className="mt-6">
      <p className="bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
        {KITZ_MANIFEST.tagline}
      </p>
      <p className="mt-1 text-sm text-gray-500">
        {KITZ_MANIFEST.mission}
      </p>

      {/* Stat pills */}
      <div className="mt-4 flex flex-wrap gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <span
              key={stat.label}
              className="flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700"
            >
              <Icon className="h-3.5 w-3.5" />
              {stat.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
