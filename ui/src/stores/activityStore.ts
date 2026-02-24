import { create } from 'zustand'
import type { ActivityEntry, ActivityType } from '@/types/activity'

const MOCK_ACTIVITY: ActivityEntry[] = [
  { id: 'act1', type: 'agent', actor: { name: 'Lead Finder', isAgent: true }, action: 'Found 2 new leads from Instagram DMs', detail: 'Sofia Chen, Isabella Torres', timestamp: '2026-02-23T10:25:00Z', traceId: 'tr_1708689900_abc123' },
  { id: 'act2', type: 'agent', actor: { name: 'Follow-Up Agent', isAgent: true }, action: 'Drafted follow-up message', detail: 'Maria Rodriguez — subscription check-in', timestamp: '2026-02-23T10:20:00Z', traceId: 'tr_1708689600_def456' },
  { id: 'act3', type: 'crm', actor: { name: 'You', isAgent: false }, action: 'Moved lead to Negotiation stage', detail: 'Carlos Mendez', timestamp: '2026-02-23T10:15:00Z' },
  { id: 'act4', type: 'order', actor: { name: 'Order Tracker', isAgent: true }, action: 'Updated order #389 to shipped', detail: 'Pedro Silva — 2 items', timestamp: '2026-02-23T09:30:00Z', traceId: 'tr_1708686600_ghi789' },
  { id: 'act5', type: 'agent', actor: { name: 'Checkout Agent', isAgent: true }, action: 'Created checkout link', detail: 'Carlos Mendez — Premium plan $120', timestamp: '2026-02-23T09:45:00Z', traceId: 'tr_1708687500_jkl012' },
  { id: 'act6', type: 'message', actor: { name: 'Follow-Up Agent', isAgent: true }, action: 'Sent approved follow-up', detail: 'Diego Vargas via WhatsApp', timestamp: '2026-02-23T09:00:00Z', traceId: 'tr_1708684800_mno345' },
  { id: 'act7', type: 'crm', actor: { name: 'You', isAgent: false }, action: 'Added new lead', detail: 'Roberto Flores — food truck, WhatsApp', timestamp: '2026-02-23T08:30:00Z' },
  { id: 'act8', type: 'agent', actor: { name: 'Bookkeeper', isAgent: true }, action: 'Logged incoming payment', detail: 'Maria Rodriguez — $450 via Yappy', timestamp: '2026-02-23T10:00:00Z', traceId: 'tr_1708688400_pqr678' },
  { id: 'act9', type: 'system', actor: { name: 'System', isAgent: false }, action: 'WhatsApp session reconnected', timestamp: '2026-02-23T07:00:00Z' },
  { id: 'act10', type: 'agent', actor: { name: 'Task Agent', isAgent: true }, action: 'Created 3 tasks from morning briefing', detail: 'Review orders, Follow up leads, Check inventory', timestamp: '2026-02-23T08:15:00Z', traceId: 'tr_1708683300_stu901' },
  { id: 'act11', type: 'order', actor: { name: 'You', isAgent: false }, action: 'Created new order', detail: 'Ana Castillo — beauty products $600', timestamp: '2026-02-22T16:00:00Z' },
  { id: 'act12', type: 'system', actor: { name: 'System', isAgent: false }, action: 'AI Battery recharged', detail: '100 credits added — Stripe payment', timestamp: '2026-02-22T14:00:00Z' },
  { id: 'act13', type: 'message', actor: { name: 'Kitz Manager', isAgent: true }, action: 'Sent daily summary', detail: '8 leads active, 3 orders pending, $1,645 revenue', timestamp: '2026-02-22T20:00:00Z', traceId: 'tr_1708632000_vwx234' },
  { id: 'act14', type: 'crm', actor: { name: 'Lead Finder', isAgent: true }, action: 'Updated lead source', detail: 'Isabella Torres — Website → Instagram', timestamp: '2026-02-22T12:00:00Z', traceId: 'tr_1708624800_yza567' },
  { id: 'act15', type: 'agent', actor: { name: 'Cash Flow Agent', isAgent: true }, action: 'Generated weekly forecast', detail: 'Projected: $3,200 revenue, $800 expenses', timestamp: '2026-02-22T09:00:00Z', traceId: 'tr_1708614000_bcd890' },
]

interface ActivityStore {
  entries: ActivityEntry[]
  filter: ActivityType | 'all'
  hasMore: boolean
  setFilter: (filter: ActivityType | 'all') => void
  fetchActivity: () => Promise<void>
  loadMore: () => Promise<void>
}

export const useActivityStore = create<ActivityStore>((set) => ({
  entries: MOCK_ACTIVITY,
  filter: 'all',
  hasMore: false,

  setFilter: (filter) => set({ filter }),

  fetchActivity: async () => {
    // Future: GET /api/logs?type=<filter>&limit=50&offset=0
  },

  loadMore: async () => {
    // Future: append more results from API
    set({ hasMore: false })
  },
}))
