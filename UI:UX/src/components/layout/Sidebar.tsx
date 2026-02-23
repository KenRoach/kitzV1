import { Home, Briefcase, Bot, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  currentNav: string
  onNavChange: (nav: string) => void
  userName: string
  userEmail: string
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'workspace', label: 'Workspace', icon: Briefcase },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'automations', label: 'Automations', icon: Zap },
] as const

const recentItems = ['Kitz Services', 'Business Flow', 'Sales Automation']

export function Sidebar({ currentNav, onNavChange, userName, userEmail }: SidebarProps) {
  const initial = userName.charAt(0).toUpperCase()

  return (
    <aside className="flex h-full w-64 flex-col bg-[#0A0A0A]">
      <div className="px-5 pt-6 pb-4">
        <h1 className="bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-2xl font-extrabold text-transparent">
          KITZ
        </h1>
      </div>

      <nav className="flex-1 px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentNav === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onNavChange(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-l-2 border-purple-500 bg-white/5 text-purple-500'
                    : 'border-l-2 border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200',
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="mt-8">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-600">
            Recents
          </p>
          <div className="mt-2 space-y-0.5">
            {recentItems.map((item) => (
              <button
                key={item}
                className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-sm font-semibold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-200">{userName}</p>
            <p className="truncate text-xs text-gray-500">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
