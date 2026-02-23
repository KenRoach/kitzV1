import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { HomePage } from './HomePage'
import { WorkspacePage } from './WorkspacePage'
import { AgentsPage } from './AgentsPage'
import { AutomationsPage } from './AutomationsPage'
import { ActivityPage } from './ActivityPage'
import { HowItWorksPage } from './HowItWorksPage'
import { SettingsPage } from './SettingsPage'
import { Orb } from '@/components/orb/Orb'
import { ChatPanel } from '@/components/layout/ChatPanel'
import { TalkToKitzModal } from '@/components/talk/TalkToKitzModal'

export function DashboardPage() {
  const [currentNav, setCurrentNav] = useState('home')

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
        return <HomePage onNavigate={setCurrentNav} />
    }
  }

  return (
    <DashboardLayout currentNav={currentNav} onNavChange={setCurrentNav}>
      <div className="flex h-full">
        {/* Left: main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Orb — top center */}
          <div className="flex justify-center py-4">
            <Orb />
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

      {/* Voice/chat modal */}
      <TalkToKitzModal />
    </DashboardLayout>
  )
}
