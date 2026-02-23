import { create } from 'zustand'
import { classifyScenario } from '@/lib/agentScenarios'
import { useActivityStore } from './activityStore'

export type StepStatus = 'pending' | 'done' | 'failed'

export interface ThinkingStep {
  id: string
  agentName: string
  action: string
  status: StepStatus
  detail?: string
  startedAt: number
  completedAt?: number
}

interface AgentThinkingStore {
  steps: ThinkingStep[]
  isThinking: boolean
  collapsed: boolean
  totalTimeMs: number
  toggleCollapsed: () => void
  /** Kicks off a simulated agent chain based on user input */
  simulateThinking: (userInput: string) => void
  reset: () => void
}

export const useAgentThinkingStore = create<AgentThinkingStore>((set, _get) => ({
  steps: [],
  isThinking: false,
  collapsed: false,
  totalTimeMs: 0,

  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),

  simulateThinking: (userInput: string) => {
    const chain = classifyScenario(userInput)
    const startTime = Date.now()

    // Initialize all steps as pending
    const steps: ThinkingStep[] = chain.map((a, i) => ({
      id: `step_${startTime}_${i}`,
      agentName: a.agent,
      action: a.action,
      status: 'pending' as StepStatus,
      startedAt: startTime,
    }))

    set({ steps, isThinking: true, collapsed: false, totalTimeMs: 0 })

    // Simulate each step completing with a staggered delay
    chain.forEach((_, i) => {
      const delay = (i + 1) * (300 + Math.random() * 500) // 300-800ms per step
      setTimeout(() => {
        set((s) => {
          const updated = s.steps.map((step, j) =>
            j === i ? { ...step, status: 'done' as StepStatus, completedAt: Date.now() } : step,
          )
          const allDone = updated.every((st) => st.status === 'done')
          const elapsed = Date.now() - startTime

          // If all done, push completed steps to activity store
          if (allDone) {
            const activityStore = useActivityStore.getState()
            const newEntries = updated.map((st) => ({
              id: `act_${st.id}`,
              type: 'agent' as const,
              actor: { name: st.agentName, isAgent: true },
              action: st.action,
              timestamp: new Date().toISOString(),
            }))
            // Prepend to activity entries
            useActivityStore.setState({
              entries: [...newEntries, ...activityStore.entries],
            })
          }

          return {
            steps: updated,
            isThinking: !allDone,
            totalTimeMs: elapsed,
          }
        })
      }, delay)
    })
  },

  reset: () => set({ steps: [], isThinking: false, collapsed: false, totalTimeMs: 0 }),
}))
