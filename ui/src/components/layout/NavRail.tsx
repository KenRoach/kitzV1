import { useState } from 'react'
import {
  LayoutDashboard,
  Briefcase,
  BookOpen,
  Zap,
  Activity,
  MoreHorizontal,
  Settings,
  Bot,
  HelpCircle,
  GraduationCap,
  Gamepad2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCanvasStore, type CanvasTab } from '@/stores/canvasStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from '@/lib/i18n'
import type { Language } from '@/stores/settingsStore'

const primaryItems: { id: CanvasTab; icon: typeof LayoutDashboard; tooltipKey: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, tooltipKey: 'nav.dashboard' },
  { id: 'workspace', icon: Briefcase, tooltipKey: 'nav.workspace' },
  { id: 'knowledge', icon: BookOpen, tooltipKey: 'nav.knowledge' },
  { id: 'automations', icon: Zap, tooltipKey: 'nav.automations' },
  { id: 'activity', icon: Activity, tooltipKey: 'nav.activity' },
]

const overflowItems: { id: CanvasTab; icon: typeof Bot; labelKey: string }[] = [
  { id: 'agents', icon: Bot, labelKey: 'nav.agents' },
  { id: 'how-it-works', icon: HelpCircle, labelKey: 'nav.howItWorks' },
  { id: 'learn', icon: GraduationCap, labelKey: 'nav.learn' },
  { id: 'game', icon: Gamepad2, labelKey: 'nav.game' },
]

const LANG_OPTIONS: { code: string; full: Language }[] = [
  { code: 'en', full: 'English' },
  { code: 'es', full: 'Español' },
  { code: 'pt', full: 'Português' },
]

export function NavRail() {
  const activeTab = useCanvasStore((s) => s.activeTab)
  const setActiveTab = useCanvasStore((s) => s.setActiveTab)
  const [showOverflow, setShowOverflow] = useState(false)
  const { interfaceLang, setInterfaceLang } = useSettingsStore()
  const user = useAuthStore((s) => s.user)
  const { t } = useTranslation()
  const activeLangCode = LANG_OPTIONS.find((l) => l.full === interfaceLang)?.code ?? 'en'
  const initial = (user?.email?.split('@')[0] ?? 'U').charAt(0).toUpperCase()

  return (
    <aside className="flex h-full w-14 shrink-0 flex-col items-center border-r border-gray-200 bg-white py-3">
      {/* Primary nav icons */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {primaryItems.map((item) => {
          const isActive = activeTab === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              data-nav={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              title={t(item.tooltipKey)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                isActive
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600',
              )}
            >
              <Icon className="h-5 w-5" />
            </button>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="flex flex-col items-center gap-1.5">
        {/* Overflow menu */}
        <div className="relative">
          <button
            onClick={() => setShowOverflow(!showOverflow)}
            title={t('nav.more')}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
              showOverflow
                ? 'bg-purple-100 text-purple-600'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600',
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          {showOverflow && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowOverflow(false)} />
              <div className="absolute bottom-0 left-full z-50 ml-2 w-44 rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
                {overflowItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id)
                        setShowOverflow(false)
                      }}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-purple-50 text-purple-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {t(item.labelKey)}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Settings */}
        <button
          data-nav="settings"
          onClick={() => setActiveTab('settings')}
          title={t('nav.settings')}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
            activeTab === 'settings'
              ? 'bg-purple-100 text-purple-600'
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600',
          )}
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* Compact language pills */}
        <div className="flex flex-col items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
          {LANG_OPTIONS.map((l) => (
            <button
              key={l.code}
              onClick={() => setInterfaceLang(l.full)}
              className={cn(
                'w-8 rounded-md py-0.5 text-center font-mono text-[9px] font-medium uppercase transition',
                activeLangCode === l.code
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600',
              )}
            >
              {l.code}
            </button>
          ))}
        </div>

        {/* User avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-xs font-semibold text-white">
          {initial}
        </div>
      </div>
    </aside>
  )
}
