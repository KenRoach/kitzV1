import { Home, Briefcase, Bot, Zap, Activity, HelpCircle, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/stores/settingsStore'
import type { Language } from '@/stores/settingsStore'

interface TopNavBarProps {
  currentNav: string
  onNavChange: (nav: string) => void
  userName: string
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'how-it-works', label: 'How it Works', icon: HelpCircle },
  { id: 'workspace', label: 'Workspace', icon: Briefcase },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'automations', label: 'Automations', icon: Zap },
  { id: 'activity', label: 'Activity', icon: Activity },
] as const

const LANG_OPTIONS: { code: string; full: Language }[] = [
  { code: 'en', full: 'English' },
  { code: 'es', full: 'Español' },
  { code: 'pt', full: 'Português' },
]

export function TopNavBar({ currentNav, onNavChange, userName }: TopNavBarProps) {
  const initial = userName.charAt(0).toUpperCase()
  const { interfaceLang, setInterfaceLang } = useSettingsStore()
  const activeLangCode = LANG_OPTIONS.find((l) => l.full === interfaceLang)?.code ?? 'en'

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="px-4 py-5">
        <h1 className="bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-lg font-extrabold uppercase tracking-wide text-transparent">
          KITZ v0.1
        </h1>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = currentNav === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-purple-50 text-purple-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="space-y-3 border-t border-gray-200 px-3 py-3">
        {/* Language selector */}
        <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
          {LANG_OPTIONS.map((l) => (
            <button
              key={l.code}
              onClick={() => setInterfaceLang(l.full)}
              className={cn(
                'flex-1 rounded-md px-2 py-1 text-center font-mono text-[10px] font-medium uppercase transition',
                activeLangCode === l.code
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600',
              )}
            >
              {l.code}
            </button>
          ))}
        </div>

        {/* Settings */}
        <button
          onClick={() => onNavChange('settings')}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            currentNav === 'settings'
              ? 'bg-purple-50 text-purple-600'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-sm font-semibold text-white">
            {initial}
          </div>
          <span className="text-sm font-medium text-gray-700">{userName}</span>
        </div>
      </div>
    </aside>
  )
}
