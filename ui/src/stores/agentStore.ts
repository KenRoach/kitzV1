import { create } from 'zustand'
import type { AgentInfo, Draft } from '@/types/agent'
import { getItemsByAgent } from '@/content/automation-catalog'

/** Compute monitoring count from the automation catalog */
function withMonitoring(agents: AgentInfo[]): AgentInfo[] {
  return agents.map((a) => ({
    ...a,
    monitoringCount: getItemsByAgent(a.name).length,
  }))
}

const BASE_AGENTS: AgentInfo[] = [
  { id: 'a1', name: 'Kitz Manager', role: 'Your AI business partner — strategy & priorities', group: 'manager', status: 'active', lastAction: 'Reviewed daily priorities', lastActionAt: '2026-02-23T10:30:00Z', actionsToday: 12 },
  { id: 'a2', name: 'Lead Finder', role: 'Finds new leads from WhatsApp & socials', group: 'sales', status: 'active', lastAction: 'Found 2 new Instagram leads', lastActionAt: '2026-02-23T10:25:00Z', actionsToday: 8 },
  { id: 'a3', name: 'Follow-Up Agent', role: 'Sends timely follow-ups so no lead goes cold', group: 'sales', status: 'active', lastAction: 'Drafted follow-up for Maria G.', lastActionAt: '2026-02-23T10:20:00Z', actionsToday: 5 },
  { id: 'a4', name: 'Closer Agent', role: 'Moves deals from proposal to closed', group: 'sales', status: 'idle', actionsToday: 0 },
  { id: 'a5', name: 'Checkout Agent', role: 'Creates payment links & tracks payments', group: 'sales', status: 'active', lastAction: 'Created checkout link for Carlos M.', lastActionAt: '2026-02-23T09:45:00Z', actionsToday: 3 },
  { id: 'a6', name: 'Campaign Agent', role: 'Plans & runs marketing campaigns', group: 'demand-gen', status: 'idle', actionsToday: 0 },
  { id: 'a7', name: 'Content Agent', role: 'Creates posts, ads & product copy', group: 'demand-gen', status: 'idle', actionsToday: 0 },
  { id: 'a8', name: 'Growth Agent', role: 'Finds new channels to reach customers', group: 'demand-gen', status: 'idle', actionsToday: 0 },
  { id: 'a9', name: 'Order Tracker', role: 'Tracks orders from placed to delivered', group: 'operations', status: 'active', lastAction: 'Updated order #389 to shipped', lastActionAt: '2026-02-23T09:30:00Z', actionsToday: 6 },
  { id: 'a10', name: 'Task Agent', role: 'Manages your daily to-do list', group: 'operations', status: 'active', lastAction: 'Added 3 tasks from morning briefing', lastActionAt: '2026-02-23T08:15:00Z', actionsToday: 4 },
  { id: 'a11', name: 'Scheduler', role: 'Books appointments & manages your calendar', group: 'operations', status: 'idle', actionsToday: 0 },
  { id: 'a12', name: 'Bookkeeper', role: 'Tracks income, expenses & profit', group: 'finance', status: 'active', lastAction: 'Logged $450 payment from Maria R.', lastActionAt: '2026-02-23T10:00:00Z', actionsToday: 2 },
  { id: 'a13', name: 'Invoice Agent', role: 'Creates & sends invoices automatically', group: 'finance', status: 'idle', actionsToday: 0 },
  { id: 'a14', name: 'Cash Flow Agent', role: 'Forecasts cash flow & flags issues', group: 'finance', status: 'idle', actionsToday: 0 },
]

const MOCK_DRAFTS: Draft[] = [
  { id: 'd1', agentId: 'a3', agentName: 'Follow-Up Agent', channel: 'whatsapp', recipient: 'Maria Rodriguez', preview: 'Hola Maria! Just checking in on the subscription plan we discussed...', createdAt: '2026-02-23T10:20:00Z', status: 'pending' },
  { id: 'd2', agentId: 'a9', agentName: 'Order Tracker', channel: 'whatsapp', recipient: 'Jose Linares', preview: 'Your order #127 has been shipped! Track it here...', createdAt: '2026-02-23T09:45:00Z', status: 'pending' },
  { id: 'd3', agentId: 'a5', agentName: 'Checkout Agent', channel: 'whatsapp', recipient: 'Carlos Mendez', preview: 'Here is your checkout link for the Premium plan: ...', createdAt: '2026-02-23T09:30:00Z', status: 'pending' },
]

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
  agents: withMonitoring(BASE_AGENTS),
  drafts: MOCK_DRAFTS,

  fetchAgents: async () => {
    // Future: GET /api/logs?type=agent_status
  },

  fetchDrafts: async () => {
    // Future: GET /api/logs?type=draft&status=pending
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
    // Future: POST /api/logs/:id/approve
  },

  rejectDraft: (id) => {
    set((s) => ({
      drafts: s.drafts.map((d) =>
        d.id === id ? { ...d, status: 'rejected' as const } : d,
      ),
    }))
    // Future: POST /api/logs/:id/reject
  },
}))
