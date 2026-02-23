# UI Buildout — Auto-Pilot, Activity & API Wiring

**Date:** 2026-02-23
**Status:** Approved
**Philosophy:** Agent-first, mobile-next, desktop-friendly

## Master Prompt Alignment

Every design decision below maps to KITZ Master Prompt doctrines:

| Doctrine | How This Design Aligns |
|----------|----------------------|
| **North Star KPI** (85% flow completion) | Auto-Pilot draft queue shows blocked flows; Activity tracks completion |
| **Execution Loop** (Clarify → Execute) | Agent status cards show which phase each agent is in |
| **AI Battery Rule** (ROI >= 2x) | Stats bar shows battery balance; agents show credit consumption |
| **Audit trail** (traceId) | Activity tab IS the audit trail — every event logged with traceId |
| **Draft-first** (no auto-send) | Draft Queue is the #1 element in Auto-Pilot — approve before send |
| **AX > UX** (Appendix H §4) | All UI data backed by API endpoints — agents can consume same data |
| **Dual Mode** (Appendix H §9) | Manual workspace always free; agent features show battery state |
| **Swarm compatibility** (Appendix H §7) | Activity feed shows agent-to-agent interactions, shared state |
| **Continuous improvement** (Appendix H §8) | Activity feed enables usage audit, friction point identification |
| **Growth Mindset** (Stability > Expansion) | Mock-first approach — UI works immediately, APIs wire incrementally |

## Approach: Agent-First Live Dashboard

Auto-Pilot is a real-time agent command center. Activity is a unified business timeline. Both pull from `logs-api` as the single source of truth. Mock data initially, wire real APIs as backend matures.

---

## 1. Auto-Pilot Tab

### Layout (mobile-first)

```
┌─────────────────────────────────────┐
│ 📋 Draft Queue (collapsible)        │
│ ┌─────────────────────────────────┐ │
│ │ "Follow-up to Maria G." [✓] [✗]│ │
│ │ "Order confirm to Jose" [✓] [✗]│ │
│ └─────────────────────────────────┘ │
│                                     │
│ Agent Status          [Pause All]   │
│ ┌───────────┐ ┌───────────┐        │
│ │ 🟢 Kitz   │ │ 🟢 Lead   │        │
│ │ Manager   │ │ Finder    │        │
│ │ 3 actions │ │ 2 actions │        │
│ │ 2m ago    │ │ 5m ago    │        │
│ │ [Pause]   │ │ [Pause]   │        │
│ └───────────┘ └───────────┘        │
│ ┌───────────┐ ┌───────────┐        │
│ │ ⏸ Closer  │ │ 🟢 Order  │        │
│ │ Agent     │ │ Tracker   │        │
│ │ paused    │ │ 1 action  │        │
│ └───────────┘ └───────────┘        │
└─────────────────────────────────────┘
```

### Components

- **`AutoPilotTab.tsx`** — Container: draft queue + agent status grid
- **`DraftQueue.tsx`** — Pending outbound messages/actions
  - Each draft: channel icon + recipient + preview text + approve/reject buttons
  - Collapsible with count badge (e.g., "3 pending")
  - Empty state: "All caught up — no pending drafts"
  - Maps to Master Prompt: draft-first doctrine
- **`AgentStatusCard.tsx`** — Compact card per agent
  - Name, group badge (color-coded), status dot (green/yellow/gray)
  - Last action description + relative timestamp
  - Actions count (last 24h)
  - Pause/Resume toggle button
  - Maps to Master Prompt: Execution Loop visibility
- **`agentStore.ts`** — New Zustand store
  - `agents[]` — status, last action, action count, paused state
  - `drafts[]` — pending outbound items
  - `fetchAgentStatus()` → `GET /api/logs?type=agent_status`
  - `fetchDrafts()` → `GET /api/logs?type=draft&status=pending`
  - `approveDraft(id)` → `POST /api/logs/:id/approve`
  - `rejectDraft(id)` → `POST /api/logs/:id/reject`
  - `toggleAgent(id)` → `PATCH /api/logs/agents/:id/toggle`

### Data Source

Initially: mock data (12 agents from current AgentGrid + 3 mock drafts).
Wire to `logs-api` when backend implements event ingestion.

### Responsive

- `< sm`: 1 column, draft queue full-width
- `sm`: 2 columns
- `lg+`: 3 columns
- Draft queue always full-width above grid

---

## 2. Activity Tab

### Layout

```
┌─────────────────────────────────────┐
│ [All] [Agents] [CRM] [Orders]      │
│ [Messages] [System]                 │
│─────────────────────────────────────│
│ 🤖 Lead Finder found new lead      │
│    "Maria G. — Instagram DM"       │
│    2 minutes ago                    │
│─────────────────────────────────────│
│ 👤 You moved "Jose L." to          │
│    Negotiation stage                │
│    15 minutes ago                   │
│─────────────────────────────────────│
│ 🤖 Follow-Up Agent sent draft      │
│    "Reminder: pending order #127"   │
│    1 hour ago                       │
│─────────────────────────────────────│
│ ⚙️ System: WhatsApp reconnected    │
│    3 hours ago                      │
│─────────────────────────────────────│
│         [Load more...]              │
└─────────────────────────────────────┘
```

### Components

- **`ActivityTab.tsx`** — Container: filter chips + feed
- **`ActivityFeed.tsx`** — Renders list of entries with load-more pagination
- **`ActivityEntry.tsx`** — Single event row
  - Icon (agent robot / user / system gear)
  - Actor name (bold) + action description
  - Detail line (gray, optional — e.g., lead name, order number)
  - Relative timestamp (right-aligned)
  - Maps to Master Prompt: Audit trail, every action logged immutably
- **`activityStore.ts`** — New Zustand store
  - `entries[]` — reverse-chronological
  - `filter: ActivityType | 'all'`
  - `hasMore: boolean`
  - `fetchActivity(filter, offset)` → `GET /api/logs?type=<filter>&limit=50&offset=<n>`
  - `loadMore()` → increment offset, append results

### Types

```typescript
type ActivityType = 'agent' | 'crm' | 'order' | 'message' | 'system'

interface ActivityEntry {
  id: string
  type: ActivityType
  actor: { name: string; isAgent: boolean }
  action: string
  detail?: string
  timestamp: string
  traceId?: string  // Maps to Master Prompt: traceId propagation
}
```

### Data Source

Initially: 15-20 mock entries (realistic Panama SMB context).
Wire to `logs-api` when backend implements event ingestion.

### Responsive

- Full-width feed (no columns needed)
- Filter chips: horizontal scroll on mobile
- Entries: stack naturally, no layout changes needed

---

## 3. API Wiring Fixes

### workspaceStore — Complete API Coverage

Currently local-only operations that need API wiring:

| Operation | Current | Target |
|-----------|---------|--------|
| `updateLeadStage()` | Local state only | `PATCH /api/workspace/leads/:id` |
| `addLeadNote()` | Local state only | `POST /api/workspace/leads/:id/notes` |
| `addLeadTag()` | Local state only | `PATCH /api/workspace/leads/:id` |
| `removeLeadTag()` | Local state only | `PATCH /api/workspace/leads/:id` |

Pattern: local-first (optimistic update) + async API call. Same pattern as existing `addLead()`.

Maps to Master Prompt: AX > UX (§4) — everything accessible via API, no hidden state.

### PaymentsTab — Replace Mock Data

Replace `MOCK_PAYMENTS` array with:
- `fetchPayments()` → `GET /api/gateway/payments`
- Local-first: show mock on failure, API data when available
- Add to `workspaceStore` as `payments[]` + `fetchPayments()`

### Error Handling

- Add simple toast notification component (CSS-only, no library)
- Show on API failure: "Couldn't save — changes kept locally"
- Show on success for destructive actions: "Lead deleted"

### Loading States

- Skeleton pulse placeholders for tab content
- Replace bare "Loading..." text

---

## 4. Infrastructure (Parallel Tasks)

### 4a. Engine Services — Fastify Bootstrap

**logs-api (port 3014):**
- `GET /logs` — Query logs with filters (type, limit, offset, agentId)
- `POST /logs` — Ingest new log entry
- `PATCH /logs/:id/approve` — Approve draft
- `PATCH /logs/:id/reject` — Reject draft
- In-memory array initially (same pattern as workspace)

**comms-api (port 3013):**
- `POST /talk` — Voice routing stub
- `POST /text` — SMS routing stub
- `POST /email` — Email routing stub
- Fastify server with health check

**docker-compose entries** for both services.

### 4b. UI in CI

Add to `.github/workflows/ci.yml`:

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
    - run: npx tsc --noEmit
      working-directory: ui
    - run: npm run build
      working-directory: ui
```

### 4c. Production Deploy

- Add Dockerfile for UI (multi-stage: build Vite → serve with `serve` package)
- Railway deployment config
- Environment variables for API base URLs

---

## 5. New File Inventory

### UI Components (8 new files)
- `ui/src/components/autopilot/AutoPilotTab.tsx`
- `ui/src/components/autopilot/DraftQueue.tsx`
- `ui/src/components/autopilot/AgentStatusCard.tsx`
- `ui/src/components/activity/ActivityTab.tsx`
- `ui/src/components/activity/ActivityFeed.tsx`
- `ui/src/components/activity/ActivityEntry.tsx`
- `ui/src/components/ui/Toast.tsx`
- `ui/src/components/ui/Skeleton.tsx`

### Stores (2 new files)
- `ui/src/stores/agentStore.ts`
- `ui/src/stores/activityStore.ts`

### Types (2 new files)
- `ui/src/types/agent.ts`
- `ui/src/types/activity.ts`

### Modified Files
- `ui/src/components/layout/CanvasPreview.tsx` — Import + render AutoPilotTab, ActivityTab
- `ui/src/stores/workspaceStore.ts` — Wire remaining local-only ops to API
- `ui/src/components/workspace/PaymentsTab.tsx` — Replace mock with API
- `engine/logs-api/src/index.ts` — Full Fastify server
- `engine/comms-api/src/index.ts` — Full Fastify server
- `docker-compose.yml` — Add comms-api, logs-api, ui services
- `.github/workflows/ci.yml` — Add ui job

---

## 6. Implementation Order

1. **S1: Auto-Pilot tab** — agentStore + DraftQueue + AgentStatusCard + AutoPilotTab
2. **S2: Activity tab** — activityStore + ActivityFeed + ActivityEntry + ActivityTab
3. **S3: API wiring** — workspaceStore fixes + PaymentsTab + Toast + Skeleton
4. **S4: Engine services** — logs-api + comms-api Fastify bootstrap + docker-compose
5. **S5: CI + Deploy** — UI job in CI + Dockerfile + Railway config

S1-S3 are UI-only (parallelizable). S4 is backend. S5 is infra.
