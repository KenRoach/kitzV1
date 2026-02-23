import { useState } from 'react'
import { Sparkles, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkspaceTabs } from '@/components/workspace/WorkspaceTabs'
import { AgentGrid } from '@/components/agents/AgentGrid'
import { TeamDirectory } from '@/components/team/TeamDirectory'
import { SkillsGrid } from '@/components/skills/SkillsGrid'
import { LogsFeed } from '@/components/logs/LogsFeed'

type PreviewTab = 'workspace' | 'agents' | 'autopilot' | 'team' | 'skills' | 'logs'

export function CanvasPreview() {
  const [activeTab, setActiveTab] = useState<PreviewTab>('workspace')

  const tabs: { id: PreviewTab; label: string }[] = [
    { id: 'workspace', label: 'Workspace' },
    { id: 'agents', label: 'Agents' },
    { id: 'autopilot', label: 'Auto-Pilot' },
    { id: 'team', label: 'Team' },
    { id: 'skills', label: 'Skills' },
    { id: 'logs', label: 'Logs' },
  ]

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Canvas area */}
      <div className="flex-1 overflow-y-auto">
        {/* Kitz header inside preview */}
        <div className="border-b border-gray-100 bg-white px-6 py-4">
          <div className="mx-auto max-w-5xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <span className="text-lg font-extrabold tracking-tight text-black">kitz</span>
            </div>
            {/* Tab navigation */}
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'rounded-lg px-4 py-2 font-mono text-xs font-medium uppercase tracking-wider transition',
                    activeTab === tab.id
                      ? 'bg-gray-100 text-black'
                      : 'text-gray-400 hover:text-gray-600',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="w-20" />
          </div>
        </div>

        {/* Progress bar under tabs */}
        <div className="mx-auto max-w-5xl px-6 pt-1">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  activeTab === tab.id ? 'bg-purple-500' : 'bg-gray-200',
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-5xl px-6 py-6 space-y-6">

          {activeTab === 'workspace' && <WorkspaceTabs />}

          {activeTab === 'agents' && <AgentGrid />}

          {activeTab === 'autopilot' && (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <Zap className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <h3 className="text-lg font-bold text-black">Auto-Pilot</h3>
              <p className="mt-1 text-sm text-gray-500">
                Let Kitz handle the repetitive stuff for you.
              </p>
              <p className="mt-1 font-mono text-xs text-gray-400">
                "Follow up with leads who haven't replied in 3 days"
              </p>
            </div>
          )}

          {activeTab === 'team' && <TeamDirectory />}

          {activeTab === 'skills' && <SkillsGrid />}

          {activeTab === 'logs' && <LogsFeed />}
        </div>
      </div>
    </div>
  )
}
