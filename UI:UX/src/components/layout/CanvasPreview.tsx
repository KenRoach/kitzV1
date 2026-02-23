import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatsRow } from '@/components/dashboard/StatsRow'
import { WorkspaceTabs } from '@/components/workspace/WorkspaceTabs'
import { AgentGrid } from '@/components/agents/AgentGrid'

type PreviewTab = 'workspace' | 'agents' | 'automations'

export function CanvasPreview() {
  const [activeTab, setActiveTab] = useState<PreviewTab>('workspace')

  const tabs: { id: PreviewTab; label: string }[] = [
    { id: 'workspace', label: 'Workspace' },
    { id: 'agents', label: 'Agents' },
    { id: 'automations', label: 'Automations' },
  ]

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Canvas area */}
      <div className="flex-1 overflow-y-auto">
        {/* Kitz header inside preview */}
        <div className="border-b border-gray-100 bg-white px-6 py-4">
          <div className="mx-auto max-w-5xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#00D4AA]" />
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
                  activeTab === tab.id ? 'bg-[#00D4AA]' : 'bg-gray-200',
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-5xl px-6 py-6 space-y-6">
          <StatsRow />

          {activeTab === 'workspace' && <WorkspaceTabs />}

          {activeTab === 'agents' && <AgentGrid />}

          {activeTab === 'automations' && (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <Sparkles className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <h3 className="text-lg font-bold text-black">Automations</h3>
              <p className="mt-1 text-sm text-gray-500">
                Use the chat to create your first automation.
              </p>
              <p className="mt-1 font-mono text-xs text-gray-400">
                "Create a daily report for my top leads"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
