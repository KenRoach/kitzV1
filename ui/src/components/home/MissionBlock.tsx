import { Users, Wrench, BookOpen, Clock } from 'lucide-react'
import { KITZ_MANIFEST } from '@/content/kitz-manifest'

const stats = [
  { label: `${KITZ_MANIFEST.capabilities.totalAgents}+ AI Agents`, icon: Users },
  { label: `${KITZ_MANIFEST.capabilities.tools}+ Tools`, icon: Wrench },
  { label: `${KITZ_MANIFEST.capabilities.sops} SOPs`, icon: BookOpen },
  { label: '< 10 min setup', icon: Clock },
] as const

export function MissionBlock() {
  return (
    <div className="mt-4">
      {/* Tagline */}
      <p className="bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-lg font-extrabold text-transparent">
        {KITZ_MANIFEST.tagline}
      </p>

      {/* Mission */}
      <p className="mt-0.5 text-xs text-gray-400">
        {KITZ_MANIFEST.mission}
      </p>

      {/* Divider */}
      <div className="mt-3 h-px bg-gray-100" />

      {/* Stat pills */}
      <div className="mt-3 flex flex-wrap gap-2">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <span
              key={stat.label}
              className="flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50/60 px-2.5 py-1 text-[11px] font-medium text-purple-600"
            >
              <Icon className="h-3 w-3" />
              {stat.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
