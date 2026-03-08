import { lazy, Suspense } from 'react'
import { cn } from '@/lib/utils'
import { useCanvasStore, type CanvasTab } from '@/stores/canvasStore'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { DashboardCards } from './DashboardCards'
import { CanvasPreview } from './CanvasPreview'
import { WorkspaceTabs } from '@/components/workspace/WorkspaceTabs'
import { AutomationsPage } from '@/pages/AutomationsPage'
import { ActivityPage } from '@/pages/ActivityPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { AgentsPage } from '@/pages/AgentsPage'
import { HowItWorksPage } from '@/pages/HowItWorksPage'
import { KnowledgePage } from '@/pages/KnowledgePage'

const LearnPage = lazy(() => import('@/pages/LearnPage').then((m) => ({ default: m.LearnPage })))
const GamePage = lazy(() => import('@/pages/GamePage').then((m) => ({ default: m.GamePage })))

const TAB_LABELS: Partial<Record<CanvasTab, string>> = {
  dashboard: 'Dashboard',
  preview: 'Preview',
  workspace: 'Workspace',
  knowledge: 'Knowledge',
  automations: 'Automations',
  activity: 'Activity',
  settings: 'Settings',
  agents: 'Agents',
  learn: 'Learn',
  game: 'Game',
  'how-it-works': 'How It Works',
}

const ALWAYS_VISIBLE: CanvasTab[] = ['dashboard']

function SuspenseFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  )
}

export function Canvas() {
  const { activeTab, setActiveTab, artifacts, hasNewPreview } = useCanvasStore()

  // Show tabs that are always visible + the active tab
  const visibleTabs = [...new Set([...ALWAYS_VISIBLE, ...(artifacts.length > 0 ? ['preview' as CanvasTab] : []), activeTab])]

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-4 pt-2">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'relative px-3 py-2 text-xs font-medium transition-colors rounded-t-lg',
              activeTab === tab
                ? 'text-purple-600 border-b-2 border-purple-500 bg-gray-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            )}
          >
            {TAB_LABELS[tab] ?? tab}
            {tab === 'preview' && hasNewPreview && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-purple-500" />
            )}
          </button>
        ))}
      </div>

      {/* Canvas content — wrapped in error boundary so page crashes don't kill the whole app */}
      <div className="flex-1 overflow-y-auto">
        <ErrorBoundary key={activeTab}>
          {activeTab === 'dashboard' && (
            <div className="mx-auto max-w-4xl p-6">
              <DashboardCards />
            </div>
          )}
          {activeTab === 'preview' && <CanvasPreview />}
          {activeTab === 'workspace' && (
            <div className="mx-auto max-w-6xl p-6">
              <WorkspaceTabs />
            </div>
          )}
          {activeTab === 'knowledge' && <KnowledgePage />}
          {activeTab === 'automations' && <AutomationsPage />}
          {activeTab === 'activity' && <ActivityPage />}
          {activeTab === 'settings' && <SettingsPage />}
          {activeTab === 'agents' && <AgentsPage />}
          {activeTab === 'how-it-works' && <HowItWorksPage />}
          {activeTab === 'learn' && (
            <Suspense fallback={<SuspenseFallback />}>
              <LearnPage />
            </Suspense>
          )}
          {activeTab === 'game' && (
            <Suspense fallback={<SuspenseFallback />}>
              <GamePage />
            </Suspense>
          )}
        </ErrorBoundary>
      </div>
    </div>
  )
}
