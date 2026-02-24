import { create } from 'zustand'
import type { AgentInfo, Draft, TeamCluster, AgentStatus } from '@/types/agent'
import { getItemsByAgent } from '@/content/automation-catalog'
import { apiFetch } from '@/lib/api'
import { API } from '@/lib/constants'

const VALID_GROUPS: TeamCluster[] = ['manager', 'sales', 'demand-gen', 'operations', 'finance']
const VALID_STATUSES: AgentStatus[] = ['active', 'idle', 'paused', 'offline']

function toTeamCluster(team?: string): TeamCluster {
  if (team && VALID_GROUPS.includes(team as TeamCluster)) return team as TeamCluster
  return 'operations'
}

function toAgentStatus(status?: string): AgentStatus {
  if (status && VALID_STATUSES.includes(status as AgentStatus)) return status as AgentStatus
  return 'idle'
}

/** Compute monitoring count from the automation catalog */
function withMonitoring(agents: AgentInfo[]): AgentInfo[] {
  return agents.map((a) => ({
    ...a,
    monitoringCount: getItemsByAgent(a.name).length,
  }))
}

interface AgentStore {
  agents: AgentInfo[]
  drafts: Draft[]
  fetchAgents: () => Promise<void>
  fetchDrafts: () => Promise<void>
  toggleAgent: (id: string) => void
  approveDraft: (id: string) => void
  rejectDraft: (id: string) => void
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  drafts: [],

  fetchAgents: async () => {
    try {
      const res = await apiFetch<{ agents?: Array<{ name: string; team?: string; role?: string; status?: string }> }>(
        `${API.KITZ_OS}/agents`,
      )
      if (res.agents && Array.isArray(res.agents)) {
        const mapped: AgentInfo[] = res.agents.map((a, i) => ({
          id: `agent_${i}`,
          name: a.name,
          role: a.role ?? '',
          group: toTeamCluster(a.team),
          status: toAgentStatus(a.status),
          actionsToday: 0,
        }))
        set({ agents: withMonitoring(mapped) })
      }
    } catch {
      // Backend offline — agents list stays empty
    }
  },

  fetchDrafts: async () => {
    try {
      const res = await apiFetch<{ drafts?: Draft[] }>(
        `${API.KITZ_OS}/drafts`,
      )
      if (res.drafts && Array.isArray(res.drafts)) {
        set({ drafts: res.drafts })
      }
    } catch {
      // Backend offline — drafts stay empty
    }
  },

  toggleAgent: (id) => {
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === id
          ? { ...a, status: a.status === 'paused' ? 'active' as const : 'paused' as const }
          : a,
      ),
    }))
  },

  approveDraft: (id) => {
    set((s) => ({
      drafts: s.drafts.map((d) =>
        d.id === id ? { ...d, status: 'approved' as const } : d,
      ),
    }))
    apiFetch(`${API.KITZ_OS}/drafts/decide`, {
      method: 'POST',
      body: JSON.stringify({ trace_id: id, action: 'approve' }),
    }).catch(() => { /* local-first */ })
  },

  rejectDraft: (id) => {
    set((s) => ({
      drafts: s.drafts.map((d) =>
        d.id === id ? { ...d, status: 'rejected' as const } : d,
      ),
    }))
    apiFetch(`${API.KITZ_OS}/drafts/decide`, {
      method: 'POST',
      body: JSON.stringify({ trace_id: id, action: 'reject' }),
    }).catch(() => { /* local-first */ })
  },
}))
