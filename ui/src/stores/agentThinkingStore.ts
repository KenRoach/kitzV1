import { create } from 'zustand'
import { classifyScenario } from '@/lib/agentScenarios'

export type StepStatus = 'pending' | 'active' | 'done' | 'failed'

export interface ThinkingStep {
  id: string
  agentName: string
  action: string
  tool?: string
  detail?: string
  status: StepStatus
  startedAt: number
  completedAt?: number
  /** Duration string shown after completion, e.g. "0.3s" */
  durationStr?: string
}

interface AgentThinkingStore {
  steps: ThinkingStep[]
  isThinking: boolean
  collapsed: boolean
  totalTimeMs: number
  toggleCollapsed: () => void
  /** Start progressive agent chain — steps appear and animate one by one */
  startThinking: (userInput: string) => void
  /** Called when backend response arrives — resolves remaining steps with real tools */
  resolveThinking: (toolsUsed?: string[]) => void
  reset: () => void
}

/** Clear any running timers */
let _stepTimers: ReturnType<typeof setTimeout>[] = []

export const useAgentThinkingStore = create<AgentThinkingStore>((set, get) => ({
  steps: [],
  isThinking: false,
  collapsed: false,
  totalTimeMs: 0,

  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),

  startThinking: (userInput: string) => {
    // Clear any previous timers
    _stepTimers.forEach((t) => clearTimeout(t))
    _stepTimers = []

    const chain = classifyScenario(userInput)
    const startTime = Date.now()

    // Start with empty steps — we'll add them progressively
    set({ steps: [], isThinking: true, collapsed: false, totalTimeMs: 0 })

    // Progressively reveal each step with staggered timing
    chain.forEach((a, i) => {
      const revealDelay = i * 800 + 200 // First step at 200ms, then every 800ms

      // Step appears as "active" (spinning)
      const revealTimer = setTimeout(() => {
        const step: ThinkingStep = {
          id: `step_${startTime}_${i}`,
          agentName: a.agent,
          action: a.action,
          tool: a.tool,
          detail: a.detail,
          status: 'active',
          startedAt: Date.now(),
        }
        set((s) => ({ steps: [...s.steps, step] }))
      }, revealDelay)
      _stepTimers.push(revealTimer)

      // Step transitions to "done" after processing time (if backend hasn't responded yet)
      const doneDelay = revealDelay + 600 + Math.random() * 1200 // 0.6-1.8s processing per step
      const doneTimer = setTimeout(() => {
        const { isThinking } = get()
        if (!isThinking) return // Backend already resolved

        const now = Date.now()
        set((s) => ({
          steps: s.steps.map((step) =>
            step.id === `step_${startTime}_${i}` && step.status === 'active'
              ? {
                  ...step,
                  status: 'done' as StepStatus,
                  completedAt: now,
                  durationStr: `${((now - step.startedAt) / 1000).toFixed(1)}s`,
                }
              : step,
          ),
          totalTimeMs: now - startTime,
        }))
      }, doneDelay)
      _stepTimers.push(doneTimer)
    })
  },

  resolveThinking: (toolsUsed?: string[]) => {
    // Clear pending timers — backend has responded
    _stepTimers.forEach((t) => clearTimeout(t))
    _stepTimers = []

    const { steps } = get()
    const now = Date.now()
    const startTime = steps[0]?.startedAt ?? now

    // Resolve all steps — mark active/pending as done
    const resolved = steps.map((step) => {
      if (step.status === 'done') return step // Already resolved by timer
      return {
        ...step,
        status: 'done' as StepStatus,
        completedAt: now,
        durationStr: `${((now - step.startedAt) / 1000).toFixed(1)}s`,
      }
    })

    // If backend returned tools_used that aren't in our chain, add them
    if (toolsUsed) {
      const existingTools = new Set(resolved.map((s) => s.tool).filter(Boolean))
      const extraTools = toolsUsed.filter((t) => !existingTools.has(t))
      extraTools.forEach((tool, i) => {
        resolved.push({
          id: `real_${now}_${i}`,
          agentName: 'KITZ Engine',
          action: 'Tool execution',
          tool,
          detail: 'Executed by backend',
          status: 'done',
          startedAt: startTime,
          completedAt: now,
          durationStr: `${((now - startTime) / 1000).toFixed(1)}s`,
        })
      })
    }

    set({
      steps: resolved,
      isThinking: false,
      totalTimeMs: now - startTime,
    })
  },

  reset: () => {
    _stepTimers.forEach((t) => clearTimeout(t))
    _stepTimers = []
    set({ steps: [], isThinking: false, collapsed: false, totalTimeMs: 0 })
  },
}))
