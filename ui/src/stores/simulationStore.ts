import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

export interface AgentResult {
  agent: string
  team: string
  tool: string
  success: boolean
  durationMs: number
  error?: string
}

export interface TeamResult {
  team: string
  status: 'completed' | 'failed' | 'timeout'
  agentResults: AgentResult[]
  durationMs: number
  error?: string
}

export interface SwarmResult {
  id: string
  status: 'completed' | 'failed' | 'partial'
  startedAt: string
  completedAt: string
  teamsCompleted: number
  teamsTotal: number
  teamResults: TeamResult[]
  handoffCount: number
  knowledgeWritten: number
  agentResults: AgentResult[]
  durationMs: number
}

interface SimulationStore {
  running: boolean
  lastResult: SwarmResult | null
  error: string | null

  startSimulation: (options?: { teams?: string[]; dryRun?: boolean }) => Promise<void>
  clearResult: () => void
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  running: false,
  lastResult: null,
  error: null,

  startSimulation: async (options) => {
    set({ running: true, error: null })
    try {
      const result = await apiFetch<SwarmResult>('/api/kitz/swarm/run', {
        method: 'POST',
        body: JSON.stringify({
          teams: options?.teams,
          dryRun: options?.dryRun ?? false,
          concurrency: 6,
          timeoutMs: 60_000,
        }),
      })
      set({ running: false, lastResult: result })
    } catch (err) {
      set({ running: false, error: (err as Error).message })
    }
  },

  clearResult: () => set({ lastResult: null, error: null }),
}))
