import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { HomePage } from './HomePage'
import { WorkspacePage } from './WorkspacePage'
import { AgentsPage } from './AgentsPage'
import { AutomationsPage } from './AutomationsPage'
import { ActivityPage } from './ActivityPage'
import { HowItWorksPage } from './HowItWorksPage'
import { SettingsPage } from './SettingsPage'
import { ChatPanel } from '@/components/layout/ChatPanel'
import { TalkToKitzModal } from '@/components/talk/TalkToKitzModal'
import { FloatingOrb } from '@/components/orb/FloatingOrb'
import { cn } from '@/lib/utils'

type Mode = 'manual' | 'kitz'

export function DashboardPage() {
  const [currentNav, setCurrentNav] = useState('home')
  const [mode, setMode] = useState<Mode>('manual')

  const renderPage = () => {
    switch (currentNav) {
      case 'workspace':
        return <WorkspacePage />
      case 'agents':
        return <AgentsPage />
      case 'automations':
        return <AutomationsPage />
      case 'activity':
        return <ActivityPage />
      case 'how-it-works':
        return <HowItWorksPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <HomePage onNavigate={setCurrentNav} showKitz={mode === 'kitz'} />
    }
  }

  return (
    <DashboardLayout currentNav={currentNav} onNavChange={setCurrentNav}>
      <div className="flex h-full">
        {/* Left: main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mode toggle — static center */}
          <div className="flex items-center justify-center pt-3 pb-1">
            <div className="relative flex items-center rounded-full bg-gray-100 p-0.5">
              {/* Sliding background pill */}
              <div
                className={cn(
                  'absolute top-0.5 bottom-0.5 rounded-full transition-all duration-300 ease-in-out',
                  mode === 'manual'
                    ? 'left-0.5 w-[72px] bg-white shadow-sm'
                    : 'left-[76px] w-[130px] bg-gradient-to-r from-purple-500 to-purple-600 shadow-sm',
                )}
              />
              <button
                onClick={() => setMode('manual')}
                className={cn(
                  'relative z-10 rounded-full px-4 py-1.5 text-xs font-medium transition-colors duration-300',
                  mode === 'manual' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600',
                )}
              >
                Manual
              </button>
              <button
                onClick={() => setMode('kitz')}
                className={cn(
                  'relative z-10 rounded-full px-4 py-1.5 text-xs font-medium transition-colors duration-300',
                  mode === 'kitz' ? 'text-white' : 'text-gray-400 hover:text-gray-600',
                )}
              >
                Powered by KITZ
              </button>
            </div>
          </div>

          {/* Page content — scrollable */}
          <div className="flex-1 overflow-y-auto">
            {renderPage()}
          </div>
        </div>

        {/* Right: dark chat panel — always visible */}
        <div className="hidden lg:flex w-[420px] shrink-0 border-l border-white/10">
          <ChatPanel />
        </div>
      </div>

      {/* Floating Orb — moves toward nav targets */}
      {mode === 'kitz' && <FloatingOrb />}

      {/* Voice/chat modal */}
      <TalkToKitzModal />
    </DashboardLayout>
  )
}
