# Auto-Pilot, Activity & API Wiring — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Auto-Pilot tab (agent command center + draft queue), Activity tab (unified business timeline), wire remaining workspace APIs, bootstrap engine services, add UI to CI, and prepare production deploy.

**Architecture:** Agent-first dashboard. New Zustand stores (`agentStore`, `activityStore`) with mock data that mirrors future `logs-api` shape. Local-first pattern: show mock immediately, async API sync. All new components are mobile-first (single-col → multi-col). Engine services get real Fastify servers with in-memory storage.

**Tech Stack:** React 19, TypeScript 5.9, Zustand 5, Tailwind CSS 4, Vite 7, Fastify 4, Lucide React icons.

**Design doc:** `docs/plans/2026-02-23-ui-autopilot-activity-design.md`

**⚠️ Known API Gaps (from engineering review):**
- The workspace backend (`workspace/src/index.ts`) is a server-rendered HTML app with form-based POST routes (`/leads/add`, `/leads/delete`), NOT a REST JSON API. The UI's `workspaceStore` calls already fail silently and fall back to local state. Task 8 adds more local-first operations with async API calls that will also fail silently until the workspace backend gets proper JSON REST endpoints. This is **planned tech debt** — the local-first pattern handles it gracefully.
- There is no `GET /payments` endpoint anywhere in the backend. PaymentsTab will use mock data only until a payment query API exists.
- The `logs-api` backend uses type `'agent_action'` while the UI uses `'agent'`. These will be aligned when wired together.

---

## Task 0: Extract timeAgo Utility + Add API Constants

**Files:**
- Modify: `ui/src/lib/utils.ts`
- Modify: `ui/src/lib/constants.ts`

**Step 1: Add timeAgo to utils**

In `ui/src/lib/utils.ts`, add at the end:

```ts
export function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return 'no activity'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}
```

**Step 2: Add LOGS and COMMS constants**

In `ui/src/lib/constants.ts`, add to the API object:

```ts
  COMMS: '/api/comms',
  LOGS: '/api/logs',
```

**Step 3: Commit**

```bash
git add ui/src/lib/utils.ts ui/src/lib/constants.ts
git commit -m "feat(ui): extract timeAgo utility, add COMMS/LOGS API constants"
```

---

## Task 1: Agent Types + Store

**Files:**
- Create: `ui/src/types/agent.ts`
- Create: `ui/src/stores/agentStore.ts`

**Step 1: Create agent types**

Create `ui/src/types/agent.ts`:

```ts
export type TeamCluster = 'manager' | 'sales' | 'demand-gen' | 'operations' | 'finance'
export type AgentStatus = 'active' | 'idle' | 'paused' | 'offline'

export interface AgentInfo {
  id: string
  name: string
  role: string
  group: TeamCluster
  status: AgentStatus
  lastAction?: string
  lastActionAt?: string
  actionsToday: number
}

export interface Draft {
  id: string
  agentId: string
  agentName: string
  channel: 'whatsapp' | 'email' | 'sms'
  recipient: string
  preview: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
}
```

**Step 2: Create agent store with mock data**

Create `ui/src/stores/agentStore.ts`:

```ts
import { create } from 'zustand'
import type { AgentInfo, Draft } from '@/types/agent'

const MOCK_AGENTS: AgentInfo[] = [
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
  agents: MOCK_AGENTS,
  drafts: MOCK_DRAFTS,

  fetchAgents: async () => {
    // Future: GET /api/logs?type=agent_status
    // For now, use mock data
  },

  fetchDrafts: async () => {
    // Future: GET /api/logs?type=draft&status=pending
    // For now, use mock data
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
```

**Step 3: Verify typecheck**

Run: `cd /Users/fliaroach/kitzV1/ui && npx tsc --noEmit`
Expected: no errors

**Step 4: Commit**

```bash
git add ui/src/types/agent.ts ui/src/stores/agentStore.ts
git commit -m "feat(ui): add agent types and store with mock data"
```

---

## Task 2: DraftQueue Component

**Files:**
- Create: `ui/src/components/autopilot/DraftQueue.tsx`

**Step 1: Build the DraftQueue component**

Create `ui/src/components/autopilot/DraftQueue.tsx`:

```tsx
import { useState } from 'react'
import { Check, X, ChevronDown, ChevronUp, MessageSquare, Mail, Phone } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import { useAgentStore } from '@/stores/agentStore'
import type { Draft } from '@/types/agent'

const channelIcons: Record<Draft['channel'], typeof MessageSquare> = {
  whatsapp: MessageSquare,
  email: Mail,
  sms: Phone,
}

const channelColors: Record<Draft['channel'], string> = {
  whatsapp: 'text-green-600 bg-green-50',
  email: 'text-blue-600 bg-blue-50',
  sms: 'text-purple-600 bg-purple-50',
}

export function DraftQueue() {
  const [isExpanded, setIsExpanded] = useState(true)
  const drafts = useAgentStore((s) => s.drafts)
  const approveDraft = useAgentStore((s) => s.approveDraft)
  const rejectDraft = useAgentStore((s) => s.rejectDraft)

  const pendingDrafts = drafts.filter((d) => d.status === 'pending')

  if (pendingDrafts.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">All caught up — no pending drafts</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-500">
            Draft Queue
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 font-mono text-[10px] font-bold text-white">
            {pendingDrafts.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100">
          {pendingDrafts.map((draft) => {
            const Icon = channelIcons[draft.channel]
            return (
              <div
                key={draft.id}
                className="flex items-start gap-3 border-b border-gray-50 px-4 py-3 last:border-b-0"
              >
                <div className={cn('mt-0.5 flex h-7 w-7 items-center justify-center rounded-full', channelColors[draft.channel])}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">{draft.agentName}</span>
                    <span className="text-xs text-gray-300">→</span>
                    <span className="text-xs font-medium text-black">{draft.recipient}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-gray-600">{draft.preview}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-gray-400">{timeAgo(draft.createdAt)}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => approveDraft(draft.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-green-600 transition hover:bg-green-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => rejectDraft(draft.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-red-500 transition hover:bg-red-50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify typecheck**

Run: `cd /Users/fliaroach/kitzV1/ui && npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add ui/src/components/autopilot/DraftQueue.tsx
git commit -m "feat(ui): add DraftQueue component with approve/reject"
```

---

## Task 3: AgentStatusCard Component

**Files:**
- Create: `ui/src/components/autopilot/AgentStatusCard.tsx`

**Step 1: Build the AgentStatusCard component**

Create `ui/src/components/autopilot/AgentStatusCard.tsx`:

```tsx
import { Pause, Play } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import type { AgentInfo, TeamCluster } from '@/types/agent'

interface AgentStatusCardProps {
  agent: AgentInfo
  onToggle: (id: string) => void
}

const statusDot: Record<AgentInfo['status'], string> = {
  active: 'bg-purple-500',
  idle: 'bg-amber-400',
  paused: 'bg-gray-400',
  offline: 'bg-gray-300',
}

const badgeStyles: Record<TeamCluster, string> = {
  manager: 'bg-purple-500/10 text-purple-500',
  sales: 'bg-blue-100 text-blue-600',
  'demand-gen': 'bg-pink-100 text-pink-600',
  operations: 'bg-orange-100 text-orange-600',
  finance: 'bg-emerald-100 text-emerald-600',
}

export function AgentStatusCard({ agent, onToggle }: AgentStatusCardProps) {
  const canToggle = agent.status === 'active' || agent.status === 'paused'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', statusDot[agent.status])} />
          <p className="font-semibold text-black text-sm">{agent.name}</p>
        </div>
        {canToggle && (
          <button
            onClick={() => onToggle(agent.id)}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-lg transition',
              agent.status === 'paused'
                ? 'text-purple-500 hover:bg-purple-50'
                : 'text-gray-400 hover:bg-gray-50',
            )}
          >
            {agent.status === 'paused' ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {agent.lastAction ? (
        <p className="mt-1.5 text-xs text-gray-500 line-clamp-1">{agent.lastAction}</p>
      ) : (
        <p className="mt-1.5 text-xs text-gray-400 italic">No recent activity</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', badgeStyles[agent.group])}>
          {agent.group}
        </span>
        <div className="flex items-center gap-2">
          {agent.actionsToday > 0 && (
            <span className="font-mono text-[10px] text-gray-400">
              {agent.actionsToday} today
            </span>
          )}
          <span className="font-mono text-[10px] text-gray-400">
            {timeAgo(agent.lastActionAt)}
          </span>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify typecheck**

Run: `cd /Users/fliaroach/kitzV1/ui && npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add ui/src/components/autopilot/AgentStatusCard.tsx
git commit -m "feat(ui): add AgentStatusCard with pause/resume toggle"
```

---

## Task 4: AutoPilotTab Container + Wire into CanvasPreview

**Files:**
- Create: `ui/src/components/autopilot/AutoPilotTab.tsx`
- Modify: `ui/src/components/layout/CanvasPreview.tsx`

**Step 1: Build the AutoPilotTab**

Create `ui/src/components/autopilot/AutoPilotTab.tsx`:

```tsx
import { useAgentStore } from '@/stores/agentStore'
import { DraftQueue } from './DraftQueue'
import { AgentStatusCard } from './AgentStatusCard'
import type { TeamCluster } from '@/types/agent'

const CLUSTER_LABELS: Record<TeamCluster, string> = {
  manager: 'Your Manager',
  sales: 'Sales',
  'demand-gen': 'Demand Gen',
  operations: 'Operations',
  finance: 'Finance',
}

const CLUSTER_ORDER: TeamCluster[] = ['manager', 'sales', 'demand-gen', 'operations', 'finance']

export function AutoPilotTab() {
  const agents = useAgentStore((s) => s.agents)
  const toggleAgent = useAgentStore((s) => s.toggleAgent)

  const activeCount = agents.filter((a) => a.status === 'active').length

  const grouped = CLUSTER_ORDER
    .map((cluster) => ({
      cluster,
      label: CLUSTER_LABELS[cluster],
      agents: agents.filter((a) => a.group === cluster),
    }))
    .filter((g) => g.agents.length > 0)

  return (
    <div className="space-y-6">
      {/* Draft Queue */}
      <DraftQueue />

      {/* Agent Status */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-black">Agent Status</h3>
          <span className="text-sm text-gray-500">
            {activeCount} active / {agents.length} total
          </span>
        </div>

        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.cluster}>
              <div className="mb-3 flex items-center gap-2">
                <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {g.label}
                </h4>
                <span className="font-mono text-[10px] text-gray-400">
                  {g.agents.filter((a) => a.status === 'active').length}/{g.agents.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.agents.map((agent) => (
                  <AgentStatusCard
                    key={agent.id}
                    agent={agent}
                    onToggle={toggleAgent}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Wire AutoPilotTab into CanvasPreview**

In `ui/src/components/layout/CanvasPreview.tsx`, replace the autopilot placeholder block.

Find:
```tsx
import { Sparkles, Zap, ScrollText } from 'lucide-react'
```
Replace with:
```tsx
import { Sparkles, ScrollText } from 'lucide-react'
```

Find:
```tsx
import { AgentGrid } from '@/components/agents/AgentGrid'
```
Replace with:
```tsx
import { AgentGrid } from '@/components/agents/AgentGrid'
import { AutoPilotTab } from '@/components/autopilot/AutoPilotTab'
```

Find:
```tsx
          {activeTab === 'autopilot' && (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <Zap className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <h3 className="text-lg font-bold text-black">Auto-Pilot</h3>
              <p className="mt-1 text-sm text-gray-500">
                Set rules for your agents. They'll handle the rest.
              </p>
              <p className="mt-1 font-mono text-xs text-gray-400">
                "Follow up with leads after 3 days" · "Auto-reply to returns" · "Daily sales report"
              </p>
            </div>
          )}
```
Replace with:
```tsx
          {activeTab === 'autopilot' && <AutoPilotTab />}
```

**Step 3: Verify typecheck**

Run: `cd /Users/fliaroach/kitzV1/ui && npx tsc --noEmit`
Expected: no errors (Zap import removed since it was only used in the placeholder)

**Step 4: Commit**

```bash
git add ui/src/components/autopilot/AutoPilotTab.tsx ui/src/components/layout/CanvasPreview.tsx
git commit -m "feat(ui): wire AutoPilotTab with DraftQueue + AgentStatusCards"
```

---

## Task 5: Activity Types + Store

**Files:**
- Create: `ui/src/types/activity.ts`
- Create: `ui/src/stores/activityStore.ts`

**Step 1: Create activity types**

Create `ui/src/types/activity.ts`:

```ts
export type ActivityType = 'agent' | 'crm' | 'order' | 'message' | 'system'

export interface ActivityEntry {
  id: string
  type: ActivityType
  actor: { name: string; isAgent: boolean }
  action: string
  detail?: string
  timestamp: string
  traceId?: string
}
```

**Step 2: Create activity store with mock data**

Create `ui/src/stores/activityStore.ts`:

```ts
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

export const useActivityStore = create<ActivityStore>((set, get) => ({
  entries: MOCK_ACTIVITY,
  filter: 'all',
  hasMore: false, // mock has all data

  setFilter: (filter) => set({ filter }),

  fetchActivity: async () => {
    // Future: GET /api/logs?type=<filter>&limit=50&offset=0
    // For now, use mock data
  },

  loadMore: async () => {
    // Future: append more results from API
    set({ hasMore: false })
  },
}))
```

**Step 3: Verify typecheck**

Run: `cd /Users/fliaroach/kitzV1/ui && npx tsc --noEmit`
Expected: no errors

**Step 4: Commit**

```bash
git add ui/src/types/activity.ts ui/src/stores/activityStore.ts
git commit -m "feat(ui): add activity types and store with 15 mock entries"
```

---

## Task 6: ActivityEntry + ActivityFeed Components

**Files:**
- Create: `ui/src/components/activity/ActivityEntry.tsx`
- Create: `ui/src/components/activity/ActivityFeed.tsx`

**Step 1: Build ActivityEntry**

Create `ui/src/components/activity/ActivityEntry.tsx`:

```tsx
import { Bot, User, ShoppingBag, MessageSquare, Settings } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import type { ActivityEntry as ActivityEntryType, ActivityType } from '@/types/activity'

const typeIcons: Record<ActivityType, typeof Bot> = {
  agent: Bot,
  crm: User,
  order: ShoppingBag,
  message: MessageSquare,
  system: Settings,
}

const typeStyles: Record<ActivityType, string> = {
  agent: 'bg-purple-50 text-purple-600',
  crm: 'bg-blue-50 text-blue-600',
  order: 'bg-orange-50 text-orange-600',
  message: 'bg-green-50 text-green-600',
  system: 'bg-gray-100 text-gray-500',
}

interface ActivityEntryProps {
  entry: ActivityEntryType
}

export function ActivityEntry({ entry }: ActivityEntryProps) {
  const Icon = typeIcons[entry.type]

  return (
    <div className="flex gap-3 border-b border-gray-50 py-3 last:border-b-0">
      <div className={cn('mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full', typeStyles[entry.type])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-black">
          <span className="font-medium">{entry.actor.name}</span>
          {' '}
          {entry.action}
        </p>
        {entry.detail && (
          <p className="mt-0.5 text-xs text-gray-500">{entry.detail}</p>
        )}
      </div>
      <span className="flex-shrink-0 font-mono text-[10px] text-gray-400 mt-0.5">
        {timeAgo(entry.timestamp)}
      </span>
    </div>
  )
}
```

**Step 2: Build ActivityFeed**

Create `ui/src/components/activity/ActivityFeed.tsx`:

```tsx
import { useActivityStore } from '@/stores/activityStore'
import { ActivityEntry } from './ActivityEntry'

export function ActivityFeed() {
  const entries = useActivityStore((s) => s.entries)
  const filter = useActivityStore((s) => s.filter)
  const hasMore = useActivityStore((s) => s.hasMore)
  const loadMore = useActivityStore((s) => s.loadMore)

  const filtered = filter === 'all'
    ? entries
    : entries.filter((e) => e.type === filter)

  if (filtered.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500">No activity yet</p>
      </div>
    )
  }

  return (
    <div>
      {filtered.map((entry) => (
        <ActivityEntry key={entry.id} entry={entry} />
      ))}
      {hasMore && (
        <button
          onClick={loadMore}
          className="mt-4 w-full rounded-lg border border-gray-200 py-2 text-center font-mono text-xs text-gray-500 transition hover:bg-gray-50"
        >
          Load more...
        </button>
      )}
    </div>
  )
}
```

**Step 3: Verify typecheck**

Run: `cd /Users/fliaroach/kitzV1/ui && npx tsc --noEmit`
Expected: no errors

**Step 4: Commit**

```bash
git add ui/src/components/activity/ActivityEntry.tsx ui/src/components/activity/ActivityFeed.tsx
git commit -m "feat(ui): add ActivityEntry and ActivityFeed components"
```

---

## Task 7: ActivityTab Container + Wire into CanvasPreview

**Files:**
- Create: `ui/src/components/activity/ActivityTab.tsx`
- Modify: `ui/src/components/layout/CanvasPreview.tsx`

**Step 1: Build ActivityTab**

Create `ui/src/components/activity/ActivityTab.tsx`:

```tsx
import { cn } from '@/lib/utils'
import { useActivityStore } from '@/stores/activityStore'
import { ActivityFeed } from './ActivityFeed'
import type { ActivityType } from '@/types/activity'

const filters: { id: ActivityType | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'agent', label: 'Agents' },
  { id: 'crm', label: 'CRM' },
  { id: 'order', label: 'Orders' },
  { id: 'message', label: 'Messages' },
  { id: 'system', label: 'System' },
]

export function ActivityTab() {
  const filter = useActivityStore((s) => s.filter)
  const setFilter = useActivityStore((s) => s.setFilter)

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Filter chips */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 px-4 py-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1.5 font-mono text-xs font-medium transition-colors',
              filter === f.id
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="px-4">
        <ActivityFeed />
      </div>
    </div>
  )
}
```

**Step 2: Wire ActivityTab into CanvasPreview**

In `ui/src/components/layout/CanvasPreview.tsx`:

Find:
```tsx
import { AutoPilotTab } from '@/components/autopilot/AutoPilotTab'
```
Replace with:
```tsx
import { AutoPilotTab } from '@/components/autopilot/AutoPilotTab'
import { ActivityTab } from '@/components/activity/ActivityTab'
```

Find:
```tsx
          {activeTab === 'activity' && (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <ScrollText className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <h3 className="text-lg font-bold text-black">Activity</h3>
              <p className="mt-1 text-sm text-gray-500">
                Everything your agents did, in one place.
              </p>
              <p className="mt-1 font-mono text-xs text-gray-400">
                Follow-ups sent, orders tracked, payments received.
              </p>
            </div>
          )}
```
Replace with:
```tsx
          {activeTab === 'activity' && <ActivityTab />}
```

Also remove the now-unused `ScrollText` import:

Find:
```tsx
import { Sparkles, ScrollText } from 'lucide-react'
```
Replace with:
```tsx
import { Sparkles } from 'lucide-react'
```

**Step 3: Verify typecheck**

Run: `cd /Users/fliaroach/kitzV1/ui && npx tsc --noEmit`
Expected: no errors

**Step 4: Verify build**

Run: `cd /Users/fliaroach/kitzV1/ui && npm run build`
Expected: build succeeds

**Step 5: Commit**

```bash
git add ui/src/components/activity/ActivityTab.tsx ui/src/components/layout/CanvasPreview.tsx
git commit -m "feat(ui): wire ActivityTab with filters + unified timeline"
```

---

## Task 8: Wire workspaceStore API Gaps

**Files:**
- Modify: `ui/src/stores/workspaceStore.ts`

**Step 1: Wire updateLeadStage to API**

In `ui/src/stores/workspaceStore.ts`, find:

```ts
  updateLeadStage: (id, stage) => {
    set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, stage } : l) }))
  },
```

Replace with:

```ts
  updateLeadStage: (id, stage) => {
    set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, stage } : l) }))
    // Async API sync (local-first)
    apiFetch(`${API.WORKSPACE}/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    }).catch(() => { /* local-first: keep local state on failure */ })
  },
```

**Step 2: Wire addLeadNote to API**

Find:

```ts
  addLeadNote: (id, note) => {
    set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, notes: [...l.notes, note] } : l) }))
  },
```

Replace with:

```ts
  addLeadNote: (id, note) => {
    set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, notes: [...l.notes, note] } : l) }))
    apiFetch(`${API.WORKSPACE}/leads/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }).catch(() => { /* local-first */ })
  },
```

**Step 3: Wire addLeadTag and removeLeadTag to API**

Find:

```ts
  addLeadTag: (id, tag) => {
    set((s) => ({ leads: s.leads.map((l) => l.id === id && !l.tags.includes(tag) ? { ...l, tags: [...l.tags, tag] } : l) }))
  },
  removeLeadTag: (id, tag) => {
    set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, tags: l.tags.filter((t) => t !== tag) } : l) }))
  },
```

Replace with:

```ts
  addLeadTag: (id, tag) => {
    set((s) => ({ leads: s.leads.map((l) => l.id === id && !l.tags.includes(tag) ? { ...l, tags: [...l.tags, tag] } : l) }))
    apiFetch(`${API.WORKSPACE}/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ addTag: tag }),
    }).catch(() => { /* local-first */ })
  },
  removeLeadTag: (id, tag) => {
    set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, tags: l.tags.filter((t) => t !== tag) } : l) }))
    apiFetch(`${API.WORKSPACE}/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ removeTag: tag }),
    }).catch(() => { /* local-first */ })
  },
```

**Step 4: Verify typecheck**

Run: `cd /Users/fliaroach/kitzV1/ui && npx tsc --noEmit`
Expected: no errors

**Step 5: Commit**

```bash
git add ui/src/stores/workspaceStore.ts
git commit -m "feat(ui): wire lead stage/notes/tags to workspace API (local-first)"
```

---

## Task 9: Wire PaymentsTab to API

**Files:**
- Modify: `ui/src/stores/workspaceStore.ts`
- Modify: `ui/src/components/workspace/PaymentsTab.tsx`

**Step 1: Add payments to workspaceStore**

In `ui/src/stores/workspaceStore.ts`, add the Payment interface after the CheckoutLink interface:

Find:
```ts
export interface CheckoutLink {
  id: string; slug: string; amount: number; label: string; active: boolean; createdAt: string
}
```
Replace with:
```ts
export interface CheckoutLink {
  id: string; slug: string; amount: number; label: string; active: boolean; createdAt: string
}

export interface Payment {
  id: string
  type: 'incoming' | 'outgoing'
  description: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  date: string
  method: string
}
```

Add `payments` to the state interface — find:
```ts
interface WorkspaceState {
  leads: Lead[]; orders: Order[]; tasks: Task[]; checkoutLinks: CheckoutLink[]
```
Replace with:
```ts
interface WorkspaceState {
  leads: Lead[]; orders: Order[]; tasks: Task[]; checkoutLinks: CheckoutLink[]; payments: Payment[]
```

Add `fetchPayments` to the state interface — find:
```ts
  // Checkout
  fetchCheckoutLinks: () => Promise<void>
  addCheckoutLink: (data: { label: string; amount: number }) => Promise<void>
}
```
Replace with:
```ts
  // Checkout
  fetchCheckoutLinks: () => Promise<void>
  addCheckoutLink: (data: { label: string; amount: number }) => Promise<void>
  // Payments
  fetchPayments: () => Promise<void>
}
```

Add mock payments and the fetchPayments implementation — find:
```ts
  leads: MOCK_LEADS, orders: [], tasks: [], checkoutLinks: [],
```
Replace with:
```ts
  leads: MOCK_LEADS, orders: [], tasks: [], checkoutLinks: [],
  payments: [
    { id: 'p1', type: 'incoming', description: 'Maria Rodriguez — Invoice #1042', amount: 450, status: 'completed', date: '2026-02-23', method: 'Yappy' },
    { id: 'p2', type: 'incoming', description: 'Carlos Mendez — Checkout link', amount: 120, status: 'completed', date: '2026-02-22', method: 'Stripe' },
    { id: 'p3', type: 'incoming', description: 'Ana Gutierrez — Invoice #1041', amount: 800, status: 'pending', date: '2026-02-22', method: 'PayPal' },
    { id: 'p4', type: 'outgoing', description: 'AI Battery — 100 credits', amount: 5, status: 'completed', date: '2026-02-21', method: 'Stripe' },
    { id: 'p5', type: 'incoming', description: 'Pedro Silva — Order #389', amount: 275, status: 'completed', date: '2026-02-20', method: 'BAC' },
    { id: 'p6', type: 'incoming', description: 'Laura Chen — Checkout link', amount: 650, status: 'failed', date: '2026-02-19', method: 'Stripe' },
  ],
```

Add fetchPayments implementation right before the closing `}))`:

Find (the last method before closing):
```ts
  addCheckoutLink: async (data) => {
    await apiFetch(`${API.WORKSPACE}/checkout-links`, { method: 'POST', body: JSON.stringify(data) })
    await get().fetchCheckoutLinks()
  },
}))
```
Replace with:
```ts
  addCheckoutLink: async (data) => {
    await apiFetch(`${API.WORKSPACE}/checkout-links`, { method: 'POST', body: JSON.stringify(data) })
    await get().fetchCheckoutLinks()
  },

  fetchPayments: async () => {
    // No payment query endpoint exists yet — keep mock data
    // Future: apiFetch<Payment[]>(`${API.LOGS}/logs?type=payment`)
  },
}))
```

**Step 2: Update PaymentsTab to use store**

Replace the entire content of `ui/src/components/workspace/PaymentsTab.tsx` with:

```tsx
import { useEffect } from 'react'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/stores/workspaceStore'

const statusStyles = {
  completed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-700',
}

export function PaymentsTab() {
  const payments = useWorkspaceStore((s) => s.payments)
  const fetchPayments = useWorkspaceStore((s) => s.fetchPayments)

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const totalIncoming = payments
    .filter((p) => p.type === 'incoming' && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-4">
        <div className="flex-1 rounded-xl border border-gray-200 p-4">
          <p className="font-mono text-xs text-gray-500">Received this week</p>
          <p className="mt-1 text-2xl font-bold text-purple-500">${totalIncoming.toLocaleString()}</p>
        </div>
        <div className="flex-1 rounded-xl border border-gray-200 p-4">
          <p className="font-mono text-xs text-gray-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-500">${pendingAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Payment list */}
      <div className="space-y-1">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 transition hover:border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                payment.type === 'incoming' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500',
              )}>
                {payment.type === 'incoming'
                  ? <ArrowDownLeft className="h-4 w-4" />
                  : <ArrowUpRight className="h-4 w-4" />
                }
              </div>
              <div>
                <p className="text-sm font-medium text-black">{payment.description}</p>
                <p className="font-mono text-xs text-gray-400">{payment.date} · {payment.method}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn(
                'rounded-full px-2 py-0.5 font-mono text-[10px] font-medium',
                statusStyles[payment.status],
              )}>
                {payment.status}
              </span>
              <span className={cn(
                'font-mono text-sm font-semibold',
                payment.type === 'incoming' ? 'text-purple-500' : 'text-gray-500',
              )}>
                {payment.type === 'incoming' ? '+' : '-'}${payment.amount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 3: Verify typecheck**

Run: `cd /Users/fliaroach/kitzV1/ui && npx tsc --noEmit`
Expected: no errors

**Step 4: Commit**

```bash
git add ui/src/stores/workspaceStore.ts ui/src/components/workspace/PaymentsTab.tsx
git commit -m "feat(ui): wire PaymentsTab to store with API fallback"
```

---

## Task 10: Add tsconfig.json to Engine Services

**Files:**
- Create: `engine/logs-api/tsconfig.json`
- Create: `engine/comms-api/tsconfig.json`

Both engine services need a tsconfig.json for typechecking. Must be created BEFORE the Fastify server code (P0-4 fix).

**Step 1: Create logs-api tsconfig**

Create `engine/logs-api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "noEmit": false,
    "isolatedModules": true
  },
  "include": ["src"]
}
```

**Step 2: Create comms-api tsconfig**

Create `engine/comms-api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "noEmit": false,
    "isolatedModules": true
  },
  "include": ["src"]
}
```

**Step 3: Commit**

```bash
git add engine/logs-api/tsconfig.json engine/comms-api/tsconfig.json
git commit -m "chore: add tsconfig.json to engine services"
```

---

## Task 11: Bootstrap logs-api Fastify Server

**Files:**
- Modify: `engine/logs-api/package.json`
- Rewrite: `engine/logs-api/src/index.ts`

**Step 1: Add Fastify dependency to logs-api**

Replace `engine/logs-api/package.json`:

```json
{
  "name": "logs-api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "fastify": "^4.28.0",
    "kitz-schemas": "file:../../kitz-schemas",
    "tsx": "^4.7.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

**Step 2: Build the Fastify server**

Replace `engine/logs-api/src/index.ts`:

```ts
import Fastify from 'fastify'

const app = Fastify({ logger: true })
const PORT = Number(process.env.PORT) || 3014

// In-memory log store
interface LogEntry {
  id: string
  type: 'agent_action' | 'crm' | 'order' | 'message' | 'system' | 'draft'
  actor: { name: string; isAgent: boolean }
  action: string
  detail?: string
  timestamp: string
  traceId?: string
  status?: 'pending' | 'approved' | 'rejected'
  meta?: Record<string, unknown>
}

const logs: LogEntry[] = []

// Health check
app.get('/health', async () => ({ status: 'ok', service: 'logs-api', entries: logs.length }))

// Ingest a new log entry
app.post<{ Body: Omit<LogEntry, 'id'> }>('/logs', async (req, reply) => {
  const entry: LogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ...req.body,
    timestamp: req.body.timestamp || new Date().toISOString(),
  }
  logs.unshift(entry) // newest first
  if (logs.length > 10000) logs.length = 10000 // cap at 10k
  reply.status(201)
  return entry
})

// Query logs with filters
app.get<{
  Querystring: { type?: string; limit?: string; offset?: string; agentId?: string; status?: string }
}>('/logs', async (req) => {
  let filtered = [...logs]
  const { type, limit: limitStr, offset: offsetStr, agentId, status } = req.query

  if (type) filtered = filtered.filter((l) => l.type === type)
  if (agentId) filtered = filtered.filter((l) => l.meta?.agentId === agentId)
  if (status) filtered = filtered.filter((l) => l.status === status)

  const offset = Number(offsetStr) || 0
  const limit = Number(limitStr) || 50

  const page = filtered.slice(offset, offset + limit)
  return { entries: page, total: filtered.length, hasMore: offset + limit < filtered.length }
})

// Approve a draft
app.patch<{ Params: { id: string } }>('/logs/:id/approve', async (req, reply) => {
  const entry = logs.find((l) => l.id === req.params.id)
  if (!entry) { reply.status(404); return { error: 'Not found' } }
  entry.status = 'approved'
  return entry
})

// Reject a draft
app.patch<{ Params: { id: string } }>('/logs/:id/reject', async (req, reply) => {
  const entry = logs.find((l) => l.id === req.params.id)
  if (!entry) { reply.status(404); return { error: 'Not found' } }
  entry.status = 'rejected'
  return entry
})

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { app.log.error(err); process.exit(1) }
  app.log.info(`logs-api listening on :${PORT}`)
})
```

**Step 3: Install dependencies**

Run: `cd /Users/fliaroach/kitzV1/engine/logs-api && npm install`
Expected: fastify and kitz-schemas installed

**Step 4: Verify typecheck**

Run: `cd /Users/fliaroach/kitzV1/engine/logs-api && npx tsc --noEmit`
Expected: no errors (or only warnings about missing tsconfig — create one if needed)

**Step 5: Commit**

```bash
git add engine/logs-api/package.json engine/logs-api/src/index.ts
git commit -m "feat(logs-api): bootstrap Fastify server with in-memory log store"
```

---

## Task 11: Bootstrap comms-api Fastify Server

**Files:**
- Modify: `engine/comms-api/package.json`
- Rewrite: `engine/comms-api/src/index.ts`

**Step 1: Add Fastify dependency**

Replace `engine/comms-api/package.json`:

```json
{
  "name": "comms-api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "fastify": "^4.28.0",
    "kitz-schemas": "file:../../kitz-schemas",
    "tsx": "^4.7.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

**Step 2: Build the Fastify server**

Replace `engine/comms-api/src/index.ts`:

```ts
import Fastify from 'fastify'

const app = Fastify({ logger: true })
const PORT = Number(process.env.PORT) || 3013

// Health check
app.get('/health', async () => ({ status: 'ok', service: 'comms-api' }))

// Voice routing stub (Twilio)
app.post<{ Body: { to: string; message: string; channel?: string } }>('/talk', async (req, reply) => {
  const { to, message } = req.body
  app.log.info({ to, message }, 'Voice request received (stub)')
  reply.status(202)
  return { status: 'queued', channel: 'voice', to, draftOnly: true }
})

// SMS routing stub
app.post<{ Body: { to: string; message: string } }>('/text', async (req, reply) => {
  const { to, message } = req.body
  app.log.info({ to, message }, 'SMS request received (stub)')
  reply.status(202)
  return { status: 'queued', channel: 'sms', to, draftOnly: true }
})

// Email routing stub
app.post<{ Body: { to: string; subject: string; body: string } }>('/email', async (req, reply) => {
  const { to, subject } = req.body
  app.log.info({ to, subject }, 'Email request received (stub)')
  reply.status(202)
  return { status: 'queued', channel: 'email', to, draftOnly: true }
})

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { app.log.error(err); process.exit(1) }
  app.log.info(`comms-api listening on :${PORT}`)
})
```

**Step 3: Install dependencies**

Run: `cd /Users/fliaroach/kitzV1/engine/comms-api && npm install`
Expected: fastify and kitz-schemas installed

**Step 4: Commit**

```bash
git add engine/comms-api/package.json engine/comms-api/src/index.ts
git commit -m "feat(comms-api): bootstrap Fastify server with talk/text/email stubs"
```

---

## Task 12: Add Engine Services to docker-compose

**Files:**
- Modify: `docker-compose.yml`

**Step 1: Add comms-api and logs-api services**

In `docker-compose.yml`, find the workspace service block and add after it (before the brain service):

Find:
```yaml
  # ── Brain (cron — no port) ──
```

Add before that line:

```yaml
  # ── Comms API (port 3013) ──
  comms-api:
    <<: *service-defaults
    build:
      args:
        SERVICE_DIR: engine/comms-api
    ports:
      - "3013:3013"
    environment:
      <<: *env-common
      PORT: 3013

  # ── Logs API (port 3014) ──
  logs-api:
    <<: *service-defaults
    build:
      args:
        SERVICE_DIR: engine/logs-api
    ports:
      - "3014:3014"
    environment:
      <<: *env-common
      PORT: 3014

```

**Step 2: Commit**

```bash
git add docker-compose.yml
git commit -m "infra: add comms-api and logs-api to docker-compose"
```

---

## Task 13: Add UI + Engine Services to CI

**Files:**
- Modify: `.github/workflows/ci.yml`

**Step 1: Add ui job**

In `.github/workflows/ci.yml`, add after the `workspace` job:

```yaml
  ui:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
        working-directory: ui
      - run: npm run build
        working-directory: ui
```

Note: `npm run build` runs `tsc -b && vite build`, so typecheck is included. No separate `tsc --noEmit` needed.

**Step 2: Add logs-api job**

```yaml
  logs-api:
    needs: kitz-schemas
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
        working-directory: kitz-schemas
      - run: npm install
        working-directory: engine/logs-api
      - run: npx tsc --noEmit
        working-directory: engine/logs-api
```

**Step 3: Add comms-api job**

```yaml
  comms-api:
    needs: kitz-schemas
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
        working-directory: kitz-schemas
      - run: npm install
        working-directory: engine/comms-api
      - run: npx tsc --noEmit
        working-directory: engine/comms-api
```

**Step 4: Verify the full CI file looks correct**

Read the file back and confirm all jobs are present and properly indented.

**Step 5: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add ui build + typecheck, logs-api, comms-api to pipeline"
```

---

## Task 14: Clean Up Orphaned Engine Service Files

**Files:**
- Delete: `engine/logs-api/src/routes/logs.ts`
- Delete: `engine/logs-api/src/services/logIngestion.ts`
- Delete: `engine/comms-api/src/routes/talk.ts`
- Delete: `engine/comms-api/src/routes/text.ts`
- Delete: `engine/comms-api/src/routes/email.ts`
- Delete: `engine/comms-api/src/services/twilioService.ts`
- Delete: `engine/comms-api/src/services/emailService.ts`
- Delete: `engine/comms-api/src/services/channelRouter.ts`

**Step 1: Remove orphaned stub files**

The engine services had placeholder route/service files that are now superseded by the inline Fastify server in `src/index.ts`.

Run:
```bash
rm -rf engine/logs-api/src/routes engine/logs-api/src/services
rm -rf engine/comms-api/src/routes engine/comms-api/src/services
```

**Step 2: Commit**

```bash
git add -A engine/
git commit -m "chore: remove orphaned engine service stub files"
```

---

## Task 15: Production Dockerfile for UI

**Files:**
- Create: `ui/Dockerfile`

**Step 1: Create multi-stage Dockerfile**

Create `ui/Dockerfile`:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json .
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve
FROM node:20-alpine
WORKDIR /app

RUN npm install -g serve@14

COPY --from=builder /app/dist ./dist

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
```

**Step 2: Commit**

```bash
git add ui/Dockerfile
git commit -m "infra: add production Dockerfile for UI (Vite build + serve)"
```

---

## Task 16: Final Typecheck + Build Verification

**Step 1: Run UI typecheck**

Run: `cd /Users/fliaroach/kitzV1/ui && npx tsc --noEmit`
Expected: no errors

**Step 2: Run UI build**

Run: `cd /Users/fliaroach/kitzV1/ui && npm run build`
Expected: build succeeds, `dist/` folder created

**Step 3: Run engine typecheck**

Run: `cd /Users/fliaroach/kitzV1/engine/logs-api && npx tsc --noEmit`
Run: `cd /Users/fliaroach/kitzV1/engine/comms-api && npx tsc --noEmit`
Expected: no errors on both

**Step 4: Verify no uncommitted changes**

Run: `cd /Users/fliaroach/kitzV1 && git status`
Expected: clean working tree

---

## Task Summary

| Task | Component | Files | Estimated |
|------|-----------|-------|-----------|
| 0 | timeAgo util + API constants | 2 mod | 2 min |
| 1 | Agent types + store | 2 new | 3 min |
| 2 | DraftQueue | 1 new | 3 min |
| 3 | AgentStatusCard | 1 new | 3 min |
| 4 | AutoPilotTab + wire | 1 new, 1 mod | 3 min |
| 5 | Activity types + store | 2 new | 3 min |
| 6 | ActivityEntry + Feed | 2 new | 3 min |
| 7 | ActivityTab + wire | 1 new, 1 mod | 3 min |
| 8 | workspaceStore local-first ops | 1 mod | 3 min |
| 9 | PaymentsTab store-wired | 2 mod | 3 min |
| 10 | Engine tsconfigs | 2 new | 2 min |
| 11 | logs-api Fastify | 2 mod | 5 min |
| 12 | comms-api Fastify | 2 mod | 5 min |
| 13 | docker-compose | 1 mod | 2 min |
| 14 | Clean orphaned files | 8 del | 2 min |
| 15 | UI Dockerfile | 1 new | 2 min |
| 16 | Final verification | 0 | 3 min |
| **Total** | | **17 new, 10 mod, 8 del** | **~47 min** |

## Engineering Review Fixes Applied

- **P0-1**: Workspace API calls documented as planned tech debt (local-first handles failures)
- **P0-2**: Removed broken `fetchPayments` API call — mock data only until endpoint exists
- **P0-3**: Moved `tsx` from devDependencies to dependencies in engine service packages
- **P0-4**: Reordered — tsconfigs (Task 10) now before Fastify servers (Tasks 11-12)
- **P1-1**: Extracted `timeAgo` to shared utility (Task 0) — all components import from `@/lib/utils`
- **P1-6**: Documented type mismatch (`agent_action` vs `agent`) in Known API Gaps header
- **P2-7**: Added Task 14 to clean orphaned route/service stub files
