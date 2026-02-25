# Kitz UI Patterns Specification

> **Kitz** -- AI-native small business operating system.
> **Stack:** React 19 + Tailwind CSS v4 + TypeScript
> **Brand:** Premium, minimal, modern. Purple primary. Inter font.
> **Companion documents:** `DESIGN_SYSTEM.md` (tokens + primitives), `UX_RUBRIC.md` (quality checklist), `UI_INVENTORY.md` (current state audit)

This document specifies every major Kitz surface with enough detail for an engineer to implement it. Each surface includes a text-diagram layout, component decomposition, TypeScript data shapes, state handling (empty, loading, error), and mobile responsiveness notes.

All surfaces share the following conventions unless stated otherwise:

- **Shell:** 3-column layout. Fixed sidebar (w-56, `surface-secondary`), scrollable main content (flex-1, max-w-5xl centered), optional right chat panel (w-[420px], `surface-dark`).
- **Page padding:** `px-6 py-8` on the main content area.
- **Section spacing:** `gap-8` between major page sections.
- **Card padding:** `p-6` (spacious) for standalone cards, `p-4` (default) for cards within grids.
- **Typography:** Headings use `text-gray-900 font-semibold tracking-tight`. Body uses `text-gray-700 font-normal`. Secondary text uses `text-gray-500 text-sm`.
- **Borders:** `border border-gray-200 rounded-lg` on cards and containers.
- **Transitions:** `transition-colors duration-150` on interactive elements.
- **Icons:** Lucide React. Inline icons 16px, navigation icons 20px, feature/hero icons 24px.

---

## Table of Contents

1. [Dashboard KPI Header + Activity Feed](#1-dashboard-kpi-header--activity-feed)
2. [Leads Pipeline (CRM Board + List Views)](#2-leads-pipeline-crm-board--list-views)
3. [Order List + Order Detail Timeline](#3-order-list--order-detail-timeline)
4. [Task Queue with Approvals](#4-task-queue-with-approvals)
5. [Invoices / Receipt Preview + Download](#5-invoices--receipt-preview--download)
6. [Inbox (Chat Thread + Composer + Internal Notes)](#6-inbox-chat-thread--composer--internal-notes)
7. [Integrations Page](#7-integrations-page)
8. [AI Battery / Credits Page](#8-ai-battery--credits-page)
9. [Cross-Cutting Patterns](#9-cross-cutting-patterns)

---

## 1. Dashboard KPI Header + Activity Feed

The dashboard is the default landing surface after login. It provides a high-level business health snapshot and a chronological activity log of recent system and agent events.

### 1.1 Layout

```
+------------------------------------------------------------------------+
| Greeting Bar                                                            |
| "Good morning, [Name]"                     [Feb 24, 2026]  [Period v]  |
+------------------------------------------------------------------------+
|                                                                         |
| +------------+ +------------+ +------------+ +------------+ +--------+ |
| | Revenue    | | Orders     | | Leads      | | Open Tasks | | AI     | |
| | $4,200.00  | | 12         | | 28         | | 5          | |Battery | |
| | ^ +12.4%   | | ^ +3       | | ^ +8       | | v -2       | | 3/5   | |
| +------------+ +------------+ +------------+ +------------+ | [||||o]| |
|                                                              +--------+ |
+------------------------------------------------------------------------+
|                                                                         |
| Recent Activity                                     [View All ->]      |
| -----------------------------------------------------------------      |
| [order-icon]  Order #1042 completed by Sales Bot         2m ago        |
| [lead-icon]   New lead: Maria Garcia from WhatsApp       15m ago       |
| [invoice-icon] Invoice #INV-089 sent to Maria Garcia     1h ago        |
| [agent-icon]  CMO drafted Instagram campaign             2h ago        |
| [system-icon] Daily backup completed                     6h ago        |
| -----------------------------------------------------------------      |
|                                                                         |
+------------------------------------------------------------------------+
```

### 1.2 Component Decomposition

| Component | Location | Description |
|-----------|----------|-------------|
| `DashboardGreeting` | Top bar | Displays time-aware greeting ("Good morning/afternoon/evening"), user first name, current date formatted as `MMM DD, YYYY`, and a period selector dropdown (Today, This Week, This Month, This Quarter). |
| `KPICardGrid` | Below greeting | Horizontal row of 4-5 metric cards using CSS Grid: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4`. |
| `KPICard` | Inside grid | Individual metric card. Displays label (text-xs uppercase tracking-wide text-gray-500), value (text-h2 font-bold text-gray-900), and trend line (text-xs with colored arrow + percentage). |
| `AIBatteryCard` | Last card in grid | Special KPI card variant showing used/limit ratio, a segmented progress bar (filled segments = used, empty = remaining), and countdown to reset. |
| `ActivityFeedSection` | Below KPI grid | Section with header ("Recent Activity" + "View All" link), containing a list of `ActivityFeedItem` components. Max 8 items visible; "View All" navigates to the full Activity page. |
| `ActivityFeedItem` | Inside feed | Row with colored icon circle (type-coded), description text, and relative timestamp. Matches existing `ActivityEntry` component pattern. |

### 1.3 Data Shapes

```typescript
/** Period selector options */
type DashboardPeriod = 'today' | 'this_week' | 'this_month' | 'this_quarter';

/** Single KPI metric for the header cards */
interface KPIMetric {
  /** Machine-readable key: 'revenue' | 'orders' | 'leads' | 'open_tasks' */
  key: string;
  /** Human-readable label displayed below the value */
  label: string;
  /** Formatted display value (e.g., "$4,200.00", "12", "28") */
  value: string;
  /** Raw numeric value for calculations */
  rawValue: number;
  /** Absolute change from previous period (e.g., +12.4, -2) */
  trend: number;
  /** Direction of the trend */
  trendDirection: 'up' | 'down' | 'flat';
  /** Trend formatted for display (e.g., "+12.4%", "+3", "-2") */
  trendLabel: string;
}

/** AI Battery status shown in the special KPI card */
interface BatteryStatus {
  /** Number of actions used today */
  used: number;
  /** Maximum actions allowed per day on current plan */
  limit: number;
  /** ISO 8601 timestamp when the counter resets */
  resetAt: string;
  /** Current plan name */
  planName: string;
}

/** Activity feed entry -- extends existing ActivityEntry type */
interface DashboardActivity {
  id: string;
  /** Event type determines the icon and color */
  type: 'agent' | 'crm' | 'order' | 'message' | 'system' | 'invoice';
  /** Actor who performed the action */
  actor: { name: string; isAgent: boolean };
  /** Human-readable description of the action */
  action: string;
  /** Optional secondary detail line */
  detail?: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Trace ID for audit linking */
  traceId?: string;
}
```

### 1.4 KPI Card Visual Specification

```
+-------------------------------------------+
|  REVENUE                                   |  <-- text-xs font-medium uppercase
|                                            |      tracking-wide text-gray-500
|  $4,200.00                                 |  <-- text-h2 font-bold text-gray-900
|                                            |      font-variant-numeric: tabular-nums
|  [ArrowUpRight 14px] +12.4%               |  <-- text-xs font-medium
|                                            |      text-success (up) or text-error (down)
+-------------------------------------------+

Card container:
  rounded-lg border border-gray-200 bg-white p-4
  hover:shadow-sm transition-shadow duration-150
```

Trend colors:
- **Up (positive):** `text-success` (#22c55e), `ArrowUpRight` icon
- **Down (negative):** `text-error` (#ef4444), `ArrowDownRight` icon
- **Flat (zero change):** `text-gray-400`, `Minus` icon

### 1.5 AI Battery Card Visual Specification

```
+-------------------------------------------+
|  AI BATTERY                    [Recharge]  |  <-- label + ghost button (text-xs)
|                                            |
|  3 of 5 actions                            |  <-- text-h3 font-bold text-gray-900
|                                            |
|  [||||||||||||ooooo]  60%                  |  <-- segmented bar, 5 segments
|                                            |      filled: bg-purple-500
|                                            |      empty: bg-gray-200
|  Resets in 14h 23m                         |  <-- text-xs text-gray-400
+-------------------------------------------+

Card container:
  rounded-lg border border-gray-200 bg-white p-4
  Same dimensions as other KPI cards.
  The segmented bar uses a flex row of rounded rectangles:
    flex gap-1
    Each segment: h-2 flex-1 rounded-full
```

### 1.6 States

**Loading state:**
- Greeting bar: single skeleton line (h-6 w-48 rounded-md bg-gray-200 animate-pulse).
- KPI cards: 5 skeleton cards matching card dimensions. Each contains 3 stacked skeleton lines (label, value, trend).
- Activity feed: 5 skeleton rows with circle (h-8 w-8) + two lines (h-4 w-3/4, h-3 w-1/2).

**Empty state (no activity yet):**
```
+-------------------------------------------+
|  [ActivityIcon, 40px, text-gray-400]       |
|                                            |
|  No activity yet                           |  <-- text-h3 font-semibold text-gray-900
|                                            |
|  Activity from your team and AI agents     |  <-- text-sm text-gray-500
|  will appear here as they work.            |
|                                            |
|  [Create Your First Lead]                  |  <-- Button variant="primary" size="md"
+-------------------------------------------+
```

**Error state:**
```
+-------------------------------------------+
|  [AlertTriangle, 40px, text-error]         |
|                                            |
|  Unable to load dashboard                  |  <-- text-h3 font-semibold text-gray-900
|                                            |
|  We could not retrieve your dashboard      |  <-- text-sm text-gray-500
|  data. Please check your connection.       |
|                                            |
|  [Retry]                                   |  <-- Button variant="secondary" size="md"
+-------------------------------------------+
```

KPI cards in error state show a `--` placeholder for value and hide the trend indicator.

### 1.7 Mobile Responsiveness

- **Below 768px (md):** KPI grid switches to `grid-cols-2`. The AI Battery card spans full width as the 5th item (`col-span-2`). Period selector moves to a full-width dropdown below the greeting text.
- **Below 640px (sm):** KPI grid remains `grid-cols-2`. Greeting font size reduces from `text-h2` to `text-h3`. Activity feed items stack description and timestamp vertically instead of inline.
- **Touch targets:** All interactive elements (period dropdown, "View All" link, Recharge button) maintain minimum 44px tap targets via padding.

---

## 2. Leads Pipeline (CRM Board + List Views)

The CRM surface manages the sales pipeline with two view modes: a Kanban board for visual pipeline management and a sortable table for data-heavy workflows. Both views share the same data source and filter state.

### 2.1 Layout -- Board View

```
+------------------------------------------------------------------------+
| Leads Pipeline                    [+ Add Lead]  [Filters]  [Board|List]|
+------------------------------------------------------------------------+
| Pipeline Value: $12,400.00               28 leads across 6 stages      |
| [===========|||||||||||||===========|||||===]  stage progress bar       |
+------------------------------------------------------------------------+
|                                                                         |
| +--New (12)--------+ +--Contacted (8)--+ +--Qualified (5)--+ +--Prop.+ |
| |                  | |                 | |                  | |       | |
| | +==============+ | | +============+ | | +==============+ | | +===+ | |
| | | Maria Garcia | | | | Diego V.   | | | | Maria R.     | | | |   | | |
| | | Cafe Bonito  | | | | Surf Shack | | | | $450         | | | |   | | |
| | | $1,200       | | | | $800       | | | | [qualified]  | | | |   | | |
| | | [new] 2d ago | | | | [contacted]| | | | 4d ago       | | | +===+ | |
| | +==============+ | | +============+ | | +==============+ | |       | |
| |                  | |                 | |                  | |       | |
| | +==============+ | | +============+ | |                  | |       | |
| | | Sofia Chen   | | | | Roberto F. | | |                  | |       | |
| | | Bakery       | | | | Food Truck | | |                  | |       | |
| | | $200         | | | |            | | |                  | |       | |
| | +==============+ | | +============+ | |                  | |       | |
| |                  | |                 | |                  | |       | |
| +------------------+ +-----------------+ +------------------+ +-------+ |
|                                                                         |
| +--Won (3)-----------------------------+ +--Lost (1)-----------------+ |
| | [Ana C.] [pill]  [Carlos M.] [pill]  | | [Luis M.] [pill]         | |
| +---------------------------------------+ +---------------------------+ |
+------------------------------------------------------------------------+
```

### 2.2 Layout -- List View

```
+------------------------------------------------------------------------+
| Leads Pipeline                    [+ Add Lead]  [Filters]  [Board|List]|
+------------------------------------------------------------------------+
| [Search leads...]                                                       |
+------------------------------------------------------------------------+
| [ ]  NAME          COMPANY       STAGE       VALUE      LAST ACTIVITY  |
+------------------------------------------------------------------------+
| [ ]  Maria Garcia  Cafe Bonito   [New]       $1,200.00  2 days ago     |
| [ ]  Carlos M.     FitZone       [Proposal]  $1,200.00  3 days ago     |
| [ ]  Sofia Chen    --            [New]       $200.00    4 days ago     |
| [ ]  Diego Vargas  Surf Shack    [Contacted] $800.00    5 days ago     |
| [ ]  Ana Castillo  Belleza       [Won]       $600.00    Yesterday      |
| [ ]  Roberto F.    --            [Contacted] --         6 days ago     |
| [ ]  Isabella T.   Moda Panama   [New]       $350.00    2 days ago     |
| [ ]  Luis Morales  --            [Lost]      --         14 days ago    |
+------------------------------------------------------------------------+
| Showing 1-8 of 8 leads                          [< Previous] [Next >]  |
+------------------------------------------------------------------------+
```

### 2.3 Component Decomposition

| Component | Description |
|-----------|-------------|
| `LeadsPipelinePage` | Top-level page component. Manages view mode toggle state, filter state, and selected lead. Renders either `PipelineBoardView` or `PipelineListView`. |
| `PipelineHeader` | Page header row: title ("Leads Pipeline"), total pipeline value, lead count, and action buttons (Add Lead, Filters, View Toggle). |
| `PipelineProgressBar` | Horizontal bar showing proportional representation of leads across stages. Each stage segment is colored per `STAGE_COLORS`. |
| `ViewToggle` | Two-segment toggle button: Board icon and List icon. Active segment: `bg-purple-500 text-white`. Inactive: `bg-gray-100 text-gray-600`. `rounded-md h-8`. |
| `PipelineBoardView` | Horizontal scroll container (`flex gap-4 overflow-x-auto pb-2`) with one `PipelineColumn` per active stage (New, Contacted, Qualified, Proposal). Closed stages (Won, Lost) render as compact rows below. |
| `PipelineColumn` | Vertical column: stage header (dot + label + count + value sum), droppable card container (`min-h-[120px] bg-gray-50/50 rounded-xl p-2`). Accepts drag-and-drop. |
| `PipelineCard` | Draggable lead card within a column. Shows name, company (if present), value (with DollarSign icon), contact icons (Phone, Mail), and tags (max 2, pill badges). `rounded-xl border border-gray-200 bg-white p-4`. Hover: `hover:shadow-md hover:border-purple-500/30`. |
| `PipelineListView` | Standard data table with checkbox column, sortable headers, stage badge cells, and row-click to open lead detail. Uses the Table pattern from `DESIGN_SYSTEM.md`. |
| `LeadFilterBar` | Filter controls: search input (with Search icon), stage multi-select dropdown, value range (min/max inputs), date range picker, source dropdown. Rendered in a collapsible row below the header. |
| `LeadDetailDrawer` | Slide-in right drawer (or modal on mobile) showing full lead profile. Matches existing `ContactDetail` component: name, phone, email, source, stage badge, value, tags, notes, last contact. Edit and delete actions in footer. |
| `AddLeadModal` | Modal form (size `md`) for creating a new lead: Name (required), Email, Phone, Company, Source (dropdown), Stage (dropdown, default "New"), Value (currency input), Tags (tag input). |

### 2.4 Data Shapes

```typescript
/** Pipeline stages used across the CRM */
type PipelineStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';

const PIPELINE_STAGES: readonly PipelineStage[] = [
  'new', 'contacted', 'qualified', 'proposal', 'won', 'lost'
] as const;

const STAGE_LABELS: Record<PipelineStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
};

const STAGE_COLORS: Record<PipelineStage, { bg: string; text: string; dot: string }> = {
  new:       { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  contacted: { bg: 'bg-cyan-50',    text: 'text-cyan-700',    dot: 'bg-cyan-500' },
  qualified: { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500' },
  proposal:  { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  won:       { bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-500' },
  lost:      { bg: 'bg-gray-100',   text: 'text-gray-500',    dot: 'bg-gray-300' },
};

/** Lead record */
interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  stage: PipelineStage;
  /** Estimated deal value in cents (display as currency) */
  value?: number;
  tags: string[];
  notes: string[];
  lastContact?: string;  // ISO 8601
  createdAt: string;      // ISO 8601
}

/** Filter state for the leads pipeline */
interface LeadFilters {
  search: string;
  stages: PipelineStage[];
  valueMin?: number;
  valueMax?: number;
  dateFrom?: string;
  dateTo?: string;
  sources: string[];
}
```

### 2.5 Stage Badge Component

Rendered inline in both board and list views:

```
[dot] Label

Container: inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5
Dot: h-1.5 w-1.5 rounded-full {STAGE_COLORS[stage].dot}
Text: text-xxs font-medium {STAGE_COLORS[stage].text}
Background: {STAGE_COLORS[stage].bg}
```

### 2.6 Drag-and-Drop Behavior

- Cards are `draggable` with `cursor-grab` (default) and `cursor-grabbing` (while dragging).
- Columns act as drop targets via `onDragOver` (prevent default) and `onDrop` (read `leadId` from `dataTransfer`).
- On drop, `updateLeadStage(leadId, newStage)` is called on the workspace store.
- Drop zones show a dashed border placeholder when empty: `border-2 border-dashed border-gray-200 rounded-xl py-8`.
- During drag, the source card reduces opacity to 50%.

### 2.7 States

**Empty state (no leads):**
```
+-------------------------------------------+
|  [Users, 40px, text-gray-400]              |
|                                            |
|  No leads yet                              |  <-- text-h3 font-semibold text-gray-900
|                                            |
|  Import contacts or create your first      |  <-- text-sm text-gray-500
|  lead to start tracking your pipeline.     |
|                                            |
|  [Create Lead]                             |  <-- Button variant="primary" size="md"
+-------------------------------------------+
```

**Empty column (board view):**
A dashed placeholder inside the column: `border-2 border-dashed border-gray-200 rounded-xl py-8` with centered text "drag here" in `font-mono text-xs text-gray-300`.

**Loading state:**
- Board view: 4 skeleton columns, each with 2-3 skeleton cards (rounded-xl bg-gray-200 animate-pulse h-24 w-full).
- List view: skeleton table with 6 rows matching column layout.

**Error state:**
Standard error pattern with retry button (see Section 9).

### 2.8 Mobile Responsiveness

- **Board view below 768px:** Columns stack vertically. Each column renders as a full-width section with a horizontal scrollable card row inside. Stage headers become sticky.
- **List view below 768px:** Table collapses to a card list. Each lead renders as a stacked card: name + company on line 1, stage badge + value on line 2, last activity timestamp on line 3. Checkbox and bulk actions are hidden. Row tap opens the detail drawer as a full-screen modal.
- **Filters below 768px:** Filter bar collapses to a single "Filters" button that opens a bottom sheet with all filter controls stacked vertically.
- **Add Lead modal below 640px:** Renders as a full-screen slide-up panel instead of a centered modal.

---

## 3. Order List + Order Detail Timeline

The orders surface provides a searchable, filterable list of all orders and a detail view with full order information and a chronological timeline of events.

### 3.1 Layout -- Order List

```
+------------------------------------------------------------------------+
| Orders                                    [+ Create Order]  [Filters]  |
+------------------------------------------------------------------------+
| [Search orders...]                                                      |
+------------------------------------------------------------------------+
| [ ]  ORDER #   CUSTOMER       ITEMS    TOTAL      STATUS     DATE      |
+------------------------------------------------------------------------+
| [ ]  #1042     Maria Garcia   3 items  $486.00    [Paid]     Feb 24    |
| [ ]  #1041     Carlos Mendez  1 item   $1,200.00  [Pending]  Feb 23    |
| [ ]  #1040     Diego Vargas   2 items  $350.00    [Fulfilled] Feb 22   |
| [ ]  #1039     Ana Castillo   5 items  $890.00    [Refunded] Feb 21    |
+------------------------------------------------------------------------+
| Showing 1-4 of 4 orders                         [< Previous] [Next >]  |
+------------------------------------------------------------------------+
```

### 3.2 Layout -- Order Detail

```
+------------------------------------------------------------------------+
| [< Back to Orders]                                                      |
+------------------------------------------------------------------------+
|                                                                         |
| +--Order Information (left, ~60%)--+ +--Sidebar (right, ~40%)--------+ |
| |                                  | |                               | |
| | Order #1042                      | | Status                       | |
| | Created Feb 24, 2026             | | [Paid] badge (large)         | |
| |                                  | |                               | |
| | Customer                         | | Actions                      | |
| | Maria Garcia                     | | [Send Receipt]  primary      | |
| | maria@example.com                | | [Create Refund] secondary    | |
| | +507 6234-5678                   | | [Print Order]   ghost        | |
| |                                  | | [Cancel Order]  danger       | |
| | Items                            | |                               | |
| | +-----+-------+-----+--------+  | | Timeline                     | |
| | | Qty | Item  |Price| Total  |  | | [*] Order created            | |
| | +-----+-------+-----+--------+  | |     Feb 24, 10:30 AM         | |
| | |  2  |Wdgt A |$100 | $200   |  | |     by Sales Bot             | |
| | |  1  |Wdgt B |$250 | $250   |  | | [|]                          | |
| | +-----+-------+-----+--------+  | | [*] Payment received         | |
| |                                  | |     Feb 24, 10:32 AM         | |
| | Subtotal:          $450.00       | |     via Stripe               | |
| | Tax (8%):           $36.00       | | [|]                          | |
| | Total:             $486.00       | | [*] Receipt sent             | |
| |                                  | |     Feb 24, 10:33 AM         | |
| +----------------------------------+ |     by Finance Bot           | |
|                                      +-------------------------------+ |
+------------------------------------------------------------------------+
```

### 3.3 Component Decomposition

| Component | Description |
|-----------|-------------|
| `OrdersPage` | Top-level page. Manages list/detail view state. Renders `OrderList` or `OrderDetail` based on selected order. |
| `OrderListHeader` | Page title ("Orders"), create button, filter button. |
| `OrderSearchBar` | Search input with Search icon. Searches across order number, customer name, and item names. |
| `OrderTable` | Data table following the Table pattern from `DESIGN_SYSTEM.md`. Columns: checkbox, order number (monospace), customer, items (count), total (right-aligned, tabular-nums), status (badge), date. Sortable on: order number, total, status, date. |
| `OrderStatusBadge` | Status-colored pill badge. Colors defined below. |
| `OrderDetail` | Two-column layout at desktop. Left: order metadata, customer info, line items table, totals. Right: status display, action buttons, timeline. |
| `OrderItemsTable` | Compact table within the detail view: Qty, Item Name, Unit Price, Line Total. No checkboxes. Footer row with subtotal, tax, and total. |
| `OrderTimeline` | Vertical timeline with connected dots and lines. Each event shows: status dot, description, timestamp, actor name. |
| `OrderActionBar` | Stack of action buttons in the sidebar. Actions vary by order status (see below). |
| `CreateOrderModal` | Modal form (size `lg`): customer selector (searchable dropdown linked to leads), line item rows (product picker + quantity), auto-calculated subtotal/tax/total, status selector, notes field. |

### 3.4 Data Shapes

```typescript
/** Order statuses with display properties */
type OrderStatus = 'draft' | 'pending' | 'paid' | 'fulfilled' | 'refunded' | 'cancelled';

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  draft:     { label: 'Draft',     bg: 'bg-gray-100',     text: 'text-gray-600' },
  pending:   { label: 'Pending',   bg: 'bg-warning-light', text: 'text-amber-700' },
  paid:      { label: 'Paid',      bg: 'bg-success-light', text: 'text-green-700' },
  fulfilled: { label: 'Fulfilled', bg: 'bg-blue-50',      text: 'text-blue-700' },
  refunded:  { label: 'Refunded',  bg: 'bg-purple-50',    text: 'text-purple-700' },
  cancelled: { label: 'Cancelled', bg: 'bg-error-light',  text: 'text-red-700' },
};

/** Line item within an order */
interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  /** Unit price in dollars */
  unitPrice: number;
  /** Line total: quantity * unitPrice */
  total: number;
}

/** Timeline event for order history */
interface TimelineEvent {
  id: string;
  /** Event type for icon selection */
  type: 'created' | 'payment' | 'fulfilled' | 'refunded' | 'cancelled' | 'note' | 'email_sent';
  /** Human-readable description */
  description: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Who performed the action (user name or agent name) */
  actor: string;
  /** Whether the actor is an AI agent */
  actorIsAgent: boolean;
}

/** Full order record */
interface Order {
  id: string;
  /** Display number (e.g., "#1042") */
  number: string;
  /** ID of the associated customer/lead */
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: OrderItem[];
  /** Sum of all item totals */
  subtotal: number;
  /** Tax amount */
  tax: number;
  /** Tax rate as a decimal (e.g., 0.08 for 8%) */
  taxRate: number;
  /** subtotal + tax */
  total: number;
  status: OrderStatus;
  /** Optional notes */
  notes?: string;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601, set when status transitions to 'paid' */
  paidAt?: string;
  /** ISO 8601, set when status transitions to 'fulfilled' */
  fulfilledAt?: string;
  /** Chronological event log */
  timeline: TimelineEvent[];
}
```

### 3.5 Order Status Badge

```
Badge container: inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5
Dot: h-1.5 w-1.5 rounded-full (color per status)
Text: text-xxs font-medium (color per status)
Background: (color per status)
```

### 3.6 Timeline Visual Specification

```
[*]----  Event description                    <-- dot: h-2.5 w-2.5 rounded-full bg-purple-500
  |      Feb 24, 2026 at 10:30 AM            <-- text-xs text-gray-500
  |      by Sales Bot                         <-- text-xs text-gray-400 italic (if agent)
  |
[*]----  Payment received via Stripe
  |      Feb 24, 2026 at 10:32 AM
  |      System
  |
[o]----  (most recent -- purple-500 ring)

Line between dots: w-0.5 bg-gray-200, absolute left-[4px] (centered on dot)
Active/latest dot: ring-4 ring-purple-100
Completed dots: bg-purple-500
Future/pending dots: bg-gray-300
```

### 3.7 Available Actions by Status

| Status | Available Actions |
|--------|-------------------|
| Draft | Edit Order, Send to Customer, Delete Order |
| Pending | Send Reminder, Edit Order, Cancel Order |
| Paid | Send Receipt, Create Refund, Print Order |
| Fulfilled | Send Receipt, Print Order |
| Refunded | Print Order (read-only) |
| Cancelled | Duplicate Order (read-only) |

### 3.8 States

**Empty state (no orders):**
```
+-------------------------------------------+
|  [ShoppingBag, 40px, text-gray-400]       |
|                                            |
|  No orders yet                             |
|                                            |
|  Create your first order to start          |
|  tracking sales and revenue.               |
|                                            |
|  [Create Order]                            |
+-------------------------------------------+
```

**Loading state:** Skeleton table with 5 rows.

**Error state:** Standard error pattern with retry button.

### 3.9 Mobile Responsiveness

- **Order list below 768px:** Table collapses to card list. Each card shows: order number + status badge on line 1, customer name on line 2, total + date on line 3. Bulk select hidden.
- **Order detail below 768px:** Sidebar stacks below the main content. Timeline renders below action buttons. Action buttons use full-width layout. Items table scrolls horizontally.
- **Create order modal below 640px:** Full-screen slide-up panel. Line item rows stack vertically (product, qty, price each on their own line).

---

## 4. Task Queue with Approvals

The task queue is the human-in-the-loop control surface where users review, approve, and manage tasks created by AI agents. Tasks requiring approval display prominent Approve/Reject controls.

### 4.1 Layout

```
+------------------------------------------------------------------------+
| Tasks                                        [+ New Task]  [Filters]   |
+------------------------------------------------------------------------+
| [All (24)] [Pending (8)] [In Review (3)] [Approved (5)] [Done (8)]     |
+------------------------------------------------------------------------+
|                                                                         |
| +--------------------------------------------------------------------+ |
| | [ ] Send proposal to Maria Garcia         [In Review]  [High]     | |
| |     Assigned to: Sales Bot                Due: Feb 25, 2026       | |
| |     "Draft a competitive proposal for the cafe supply contract."  | |
| |                                                                    | |
| |     [Approve]  [Edit]  [Reject]                                   | |
| +--------------------------------------------------------------------+ |
|                                                                         |
| +--------------------------------------------------------------------+ |
| | [ ] Follow up on Invoice #INV-089         [Pending]    [Medium]    | |
| |     Assigned to: CRM Bot                  Due: Feb 26, 2026       | |
| |     "Send a follow-up email about the outstanding invoice."       | |
| +--------------------------------------------------------------------+ |
|                                                                         |
| +--------------------------------------------------------------------+ |
| | [x] Generate weekly sales report          [Done]       [Low]      | |
| |     Assigned to: Finance Bot              Completed: Feb 24       | |
| |     "Compile revenue, order, and lead metrics for this week."     | |
| +--------------------------------------------------------------------+ |
|                                                                         |
+------------------------------------------------------------------------+
```

### 4.2 Component Decomposition

| Component | Description |
|-----------|-------------|
| `TaskQueuePage` | Top-level page. Manages status tab state, filter state, task list. |
| `TaskQueueHeader` | Title ("Tasks"), "New Task" button (primary), "Filters" button (secondary). |
| `TaskStatusTabs` | Horizontal tab bar with counts per status. Active tab: `border-b-2 border-purple-500 text-purple-600 font-semibold`. Inactive: `text-gray-500 hover:text-gray-700`. Tab values: All, Pending, In Review, Approved, Done. |
| `TaskCard` | Full-width card for each task. Contains: checkbox, title, status badge, priority badge, assignee, due date, description (truncated to 2 lines), and conditional approval actions. |
| `TaskStatusBadge` | Status pill badge with status-specific colors. |
| `TaskPriorityBadge` | Priority pill badge with priority-specific colors. |
| `TaskApprovalActions` | Button group rendered only when task status is "in_review". Contains: Approve (primary/green), Edit (secondary), Reject (danger/ghost). |
| `CreateTaskModal` | Modal form (size `md`): title (required), description (textarea), priority (select), assignee (select from agents list), due date (date picker), approval required (toggle). |
| `TaskDetailDrawer` | Slide-in drawer for full task view. Shows all fields, full description, approval history, and action buttons. |

### 4.3 Data Shapes

```typescript
/** Task status workflow: draft -> pending -> in_review -> approved -> executed -> done */
type TaskStatus = 'draft' | 'pending' | 'in_review' | 'approved' | 'executed' | 'done';

const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; bg: string; text: string }> = {
  draft:     { label: 'Draft',      bg: 'bg-gray-100',      text: 'text-gray-600' },
  pending:   { label: 'Pending',    bg: 'bg-warning-light',  text: 'text-amber-700' },
  in_review: { label: 'In Review',  bg: 'bg-info-light',     text: 'text-blue-700' },
  approved:  { label: 'Approved',   bg: 'bg-success-light',  text: 'text-green-700' },
  executed:  { label: 'Executed',   bg: 'bg-purple-50',      text: 'text-purple-700' },
  done:      { label: 'Done',       bg: 'bg-gray-100',       text: 'text-gray-500' },
};

/** Task priority levels */
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; bg: string; text: string }> = {
  low:    { label: 'Low',    bg: 'bg-gray-100',      text: 'text-gray-600' },
  medium: { label: 'Medium', bg: 'bg-info-light',     text: 'text-blue-700' },
  high:   { label: 'High',   bg: 'bg-warning-light',  text: 'text-amber-700' },
  urgent: { label: 'Urgent', bg: 'bg-error-light',    text: 'text-red-700' },
};

/** Task record */
interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Agent or user assigned to execute the task */
  assignee: {
    id: string;
    name: string;
    isAgent: boolean;
  };
  /** ISO 8601 due date */
  dueDate?: string;
  /** Whether the task requires human approval before execution */
  approvalRequired: boolean;
  /** Who approved the task (null if not yet approved) */
  approvedBy?: {
    id: string;
    name: string;
    approvedAt: string;
  };
  /** Who rejected the task (null if not rejected) */
  rejectedBy?: {
    id: string;
    name: string;
    rejectedAt: string;
    reason?: string;
  };
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601, set when status transitions to 'done' */
  completedAt?: string;
}
```

### 4.4 Task Card Visual Specification

```
+----------------------------------------------------------------------+
| [checkbox]  Task title text here               [Status Badge] [Prio] |
|             Assigned to: Agent Name            Due: Feb 25, 2026     |
|             "Description text truncated to two lines with an         |
|              ellipsis overflow..."                                    |
|                                                                      |
|             [Approve] [Edit] [Reject]   <-- only when in_review      |
+----------------------------------------------------------------------+

Card container:
  rounded-lg border border-gray-200 bg-white p-4
  hover:border-gray-300 transition-colors duration-150

Title: text-body font-semibold text-gray-900
Assignee: text-xs text-gray-500
  Agent names styled with Bot icon (h-3 w-3) prefix
Due date: text-xs text-gray-500
  Overdue dates: text-error font-medium
Description: text-sm text-gray-600 line-clamp-2

Approval buttons:
  Approve: h-8 px-3 text-xs bg-success text-white rounded-md
  Edit: h-8 px-3 text-xs border border-gray-200 text-gray-700 rounded-md
  Reject: h-8 px-3 text-xs text-error bg-transparent hover:bg-error-light rounded-md
```

### 4.5 Approval Workflow

1. Agent creates a task with `approvalRequired: true`. Status starts at `pending`.
2. Agent completes its work and sets status to `in_review`. The task appears in the "In Review" tab with approval buttons visible.
3. **Approve:** Sets status to `approved`. Records `approvedBy`. Agent proceeds to `executed`, then `done`.
4. **Reject:** Opens a confirmation modal with an optional reason textarea. Sets `rejectedBy`. Status returns to `pending` for the agent to revise.
5. **Edit:** Opens the task detail drawer in edit mode. User can modify the task before approving.

### 4.6 States

**Empty state (no tasks):**
```
+-------------------------------------------+
|  [CheckSquare, 40px, text-gray-400]        |
|                                            |
|  No tasks yet                              |
|                                            |
|  Tasks from your AI agents and manual      |
|  to-dos will appear here.                  |
|                                            |
|  [Create Task]                             |
+-------------------------------------------+
```

**Empty state (filtered tab with no results):**
```
+-------------------------------------------+
|  [Filter, 40px, text-gray-400]             |
|                                            |
|  No [status] tasks                         |
|                                            |
|  There are no tasks with this status       |
|  right now. Check other tabs or create     |
|  a new task.                               |
+-------------------------------------------+
```

**Loading state:** 4 skeleton task cards (h-24 rounded-lg bg-gray-200 animate-pulse).

**Error state:** Standard error pattern with retry button.

### 4.7 Mobile Responsiveness

- **Below 768px:** Status tabs become horizontally scrollable (overflow-x-auto) with `snap-x snap-mandatory`. Tab counts may be hidden to save space; only show the active tab count.
- **Task cards:** Full-width, no changes needed. Approval buttons stack if the card width is too narrow.
- **Create Task modal:** Full-screen slide-up panel.
- **Task detail drawer:** Full-screen modal instead of side drawer.
- **Due date display:** Switches from absolute to relative when space is tight ("in 2d" instead of "Feb 26, 2026").

---

## 5. Invoices / Receipt Preview + Download

The invoicing surface manages the full lifecycle of invoices: creation, preview, sending, payment tracking, and receipt generation. It includes a document-style preview that matches the eventual PDF output.

### 5.1 Layout -- Invoice List

```
+------------------------------------------------------------------------+
| Invoices                                  [+ Create Invoice] [Filters] |
+------------------------------------------------------------------------+
| [Search invoices...]                                                    |
+------------------------------------------------------------------------+
| [ ]  INVOICE #   CUSTOMER       AMOUNT      DUE DATE   STATUS         |
+------------------------------------------------------------------------+
| [ ]  INV-089     Maria Garcia   $486.00     Mar 1      [Sent]         |
| [ ]  INV-088     Carlos Mendez  $1,200.00   Feb 28     [Overdue]      |
| [ ]  INV-087     Ana Castillo   $600.00     Feb 25     [Paid]         |
| [ ]  INV-086     Diego Vargas   $350.00     Feb 20     [Paid]         |
+------------------------------------------------------------------------+
| Showing 1-4 of 4 invoices                       [< Previous] [Next >] |
+------------------------------------------------------------------------+
```

### 5.2 Layout -- Invoice Preview (Document Style)

```
+------------------------------------------------------------------------+
| [< Back to Invoices]        [Download PDF]  [Send to Customer]  [Edit] |
+------------------------------------------------------------------------+
|                                                                         |
| +====================================================================+ |
| |                                                                    | |
| |  KITZ                                           INVOICE            | |
| |  Your Company Name                              #INV-089           | |
| |  123 Business Street                            Date: Feb 24, 2026 | |
| |  Panama City, Panama                            Due: Mar 1, 2026   | |
| |                                                                    | |
| |  ---------------------------------------------------------------  | |
| |                                                                    | |
| |  BILL TO:                                                          | |
| |  Maria Garcia                                                     | |
| |  maria@example.com                                                 | |
| |  +507 6234-5678                                                    | |
| |                                                                    | |
| |  ---------------------------------------------------------------  | |
| |                                                                    | |
| |  ITEM                    QTY       PRICE          TOTAL            | |
| |  ---------------------------------------------------------------  | |
| |  Widget A                 2        $100.00        $200.00          | |
| |  Widget B                 1        $250.00        $250.00          | |
| |                                                                    | |
| |  ---------------------------------------------------------------  | |
| |                                       Subtotal:   $450.00          | |
| |                                       Tax (8%):    $36.00          | |
| |                                       ----------------------       | |
| |                                       TOTAL:      $486.00          | |
| |                                                                    | |
| |  ---------------------------------------------------------------  | |
| |                                                                    | |
| |  [Pay Now]   <- purple button linking to checkout                  | |
| |                                                                    | |
| |  Payment terms: Due within 7 days.                                 | |
| |  Thank you for your business.                                      | |
| |                                                                    | |
| +====================================================================+ |
|                                                                         |
+------------------------------------------------------------------------+
```

### 5.3 Component Decomposition

| Component | Description |
|-----------|-------------|
| `InvoicesPage` | Top-level page. Manages list/preview view state. |
| `InvoiceListHeader` | Page title ("Invoices"), create button, filter button. |
| `InvoiceTable` | Data table: checkbox, invoice number (monospace), customer, amount (right-aligned, tabular-nums), due date, status badge. Sortable on: number, amount, due date, status. |
| `InvoiceStatusBadge` | Status-colored pill badge. |
| `InvoicePreview` | The document-style preview component. Renders as a centered, white, bordered, shadowed container (`max-w-2xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-8 md:p-12`) that visually resembles a printed invoice. |
| `InvoicePreviewHeader` | Company logo/name + "INVOICE" title + invoice number + dates. Two-column layout within the preview. |
| `InvoiceBillTo` | Customer billing information block. |
| `InvoiceLineItems` | Table of line items within the preview. Styled differently from the standard Table component: lighter borders, more compact, document-like. |
| `InvoiceTotals` | Right-aligned summary: subtotal, tax (with rate), total (bold, larger). |
| `InvoicePayButton` | "Pay Now" button linking to the checkout URL. Only shown on sent/viewed invoices that are unpaid. `bg-purple-500 text-white rounded-md h-12 px-8 text-h4 font-semibold`. |
| `InvoiceActionBar` | Toolbar above the preview: back button, Download PDF, Send to Customer, Edit. |
| `CreateInvoiceModal` | Modal form (size `lg`): customer selector, line items (add/remove rows), tax rate input, due date, notes, payment terms. Auto-calculates totals. |

### 5.4 Data Shapes

```typescript
/** Invoice statuses */
type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';

const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; bg: string; text: string }> = {
  draft:     { label: 'Draft',     bg: 'bg-gray-100',      text: 'text-gray-600' },
  sent:      { label: 'Sent',      bg: 'bg-info-light',     text: 'text-blue-700' },
  viewed:    { label: 'Viewed',    bg: 'bg-purple-50',      text: 'text-purple-700' },
  paid:      { label: 'Paid',      bg: 'bg-success-light',  text: 'text-green-700' },
  overdue:   { label: 'Overdue',   bg: 'bg-error-light',    text: 'text-red-700' },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-100',       text: 'text-gray-500' },
};

/** Invoice line item */
interface InvoiceItem {
  id: string;
  /** Product or service name */
  name: string;
  /** Optional description */
  description?: string;
  quantity: number;
  /** Unit price in dollars */
  unitPrice: number;
  /** Line total: quantity * unitPrice */
  total: number;
}

/** Full invoice record */
interface Invoice {
  id: string;
  /** Display number (e.g., "INV-089") */
  number: string;
  /** Associated customer/lead */
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  /** Company issuing the invoice */
  companyName: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  /** Line items */
  items: InvoiceItem[];
  /** Sum of all item totals */
  subtotal: number;
  /** Tax amount */
  tax: number;
  /** Tax rate as a percentage (e.g., 8 for 8%) */
  taxRate: number;
  /** subtotal + tax */
  total: number;
  status: InvoiceStatus;
  /** ISO 8601 issue date */
  issuedAt: string;
  /** ISO 8601 due date */
  dueDate: string;
  /** ISO 8601, set when payment is received */
  paidAt?: string;
  /** URL for the customer-facing payment checkout page */
  checkoutLink?: string;
  /** Payment terms text (e.g., "Due within 7 days") */
  paymentTerms?: string;
  /** Optional notes displayed on the invoice */
  notes?: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
}
```

### 5.5 Invoice Preview Styling

The preview container is designed to look like a physical document:

```
Container:
  max-w-2xl mx-auto
  bg-white rounded-lg shadow-lg border border-gray-200
  p-8 md:p-12
  font-sans

"INVOICE" header text:
  text-h1 font-bold text-gray-900 uppercase tracking-wide

Company name:
  text-h3 font-bold text-purple-600

Section dividers:
  border-t border-gray-200 my-6

"BILL TO" label:
  text-xs font-medium uppercase tracking-wide text-gray-500

Line items table:
  No outer border. Header row: text-xs uppercase tracking-wide text-gray-500 border-b border-gray-300.
  Data rows: text-body text-gray-900 border-b border-gray-100 py-3.
  Right-aligned number columns.

Totals block:
  Right-aligned. Subtotal and tax in text-body text-gray-700.
  Total in text-h3 font-bold text-gray-900.
  Total row separated by border-t border-gray-900.

"Pay Now" button:
  Only on sent/viewed invoices (not draft, not paid).
  Centered, bg-purple-500, rounded-md, text-white, h-12 px-8.
```

### 5.6 States

**Empty state (no invoices):**
```
+-------------------------------------------+
|  [FileText, 40px, text-gray-400]           |
|                                            |
|  No invoices yet                           |
|                                            |
|  Create and send professional invoices     |
|  to get paid faster.                       |
|                                            |
|  [Create Invoice]                          |
+-------------------------------------------+
```

**Loading state:**
- List: skeleton table with 4 rows.
- Preview: skeleton document (max-w-2xl centered, rounded-lg bg-gray-200 animate-pulse h-[600px]).

**Error state:** Standard error pattern with retry button.

### 5.7 Mobile Responsiveness

- **Invoice list below 768px:** Table collapses to card list. Each card: invoice number + status badge on line 1, customer on line 2, amount + due date on line 3.
- **Invoice preview below 768px:** Full-width with reduced padding (`p-4`). The two-column header (company + invoice info) stacks vertically. Line items table scrolls horizontally if needed. Action bar becomes a sticky bottom bar with icon-only buttons.
- **Create invoice modal below 640px:** Full-screen panel. Line item rows stack vertically.
- **Download PDF:** On mobile, triggers the device's native share sheet via the Web Share API when available.

---

## 6. Inbox (Chat Thread + Composer + Internal Notes)

The unified inbox aggregates conversations from WhatsApp, email, and SMS into a single interface. It features a conversation list, a message thread, a composer with template support, and an internal notes system for team collaboration.

### 6.1 Layout

```
+------------------------------------------------------------------------+
| Conversations            [Search conversations]         [+ New]         |
+---------------------------+--------------------------------------------+
| Conversation List (w-80)  | Message Thread                             |
|                           |                                            |
| +=======================+ | Maria Garcia                 [WhatsApp]   |
| | [WhatsApp] Maria G.   | |                                            |
| | "Thanks for the..."   | | [Maria avatar]                             |
| | 2m ago          [*2]  | | Hi, I'd like to order more widgets.        |
| +=======================+ | 10:30 AM                                    |
|                           |                                            |
| +-----------------------+ |                    [Kitz avatar]            |
| | [Email] John Smith    | |        Sure! I can help with that.         |
| | "Re: Invoice #089"    | |        How many would you like?            |
| | 1h ago                | |                           10:31 AM         |
| +-----------------------+ |                                            |
|                           | [Maria avatar]                             |
| +-----------------------+ | 5 of Widget A please.                      |
| | [WhatsApp] Ana C.     | | 10:32 AM                                    |
| | "When will my..."     | |                                            |
| | 3h ago                | | +--Internal Note (yellow)--+               |
| +-----------------------+ | | Customer prefers Express   |              |
|                           | | shipping. -- Sales Bot     |              |
|                           | +----------------------------+              |
|                           |                                            |
+---------------------------+--------------------------------------------+
|                           | [Type a message...]            [Send]      |
|                           | [Internal Note] [Template] [Attach]        |
+---------------------------+--------------------------------------------+
```

### 6.2 Component Decomposition

| Component | Description |
|-----------|-------------|
| `InboxPage` | Top-level page. Two-panel layout at desktop, single-panel with navigation at mobile. Manages selected conversation state. |
| `ConversationList` | Left panel (w-80). Contains search input and scrollable list of `ConversationListItem` components. Sorted by `lastMessageAt` descending. |
| `ConversationListItem` | Row showing: channel icon (WhatsApp/Email/SMS), contact name, message preview (truncated to 1 line), relative timestamp, unread count badge. Active: `bg-purple-50 border-l-2 border-purple-500`. Hover: `bg-gray-50`. |
| `ChannelIcon` | Channel-specific icon component. WhatsApp: green MessageCircle. Email: blue Mail. SMS: gray Smartphone. Each wrapped in a colored circle (h-8 w-8 rounded-full). |
| `MessageThread` | Right panel. Header with contact name + channel badge, scrollable message list, and composer at bottom. Auto-scrolls to latest message. |
| `MessageThreadHeader` | Contact name, channel badge, contact info (email/phone), action buttons (Call, View Contact, Mark Resolved). |
| `MessageBubble` | Chat bubble component. Outgoing (from Kitz/user): aligned right, `bg-purple-500 text-white rounded-2xl rounded-br-md`. Incoming (from contact): aligned left, `bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md`. Timestamp below bubble in `text-xs text-gray-400`. |
| `InternalNoteBubble` | Special bubble for internal notes: `bg-amber-50 border border-amber-200 rounded-lg`. Label: "Internal Note" in `text-xxs font-medium uppercase text-amber-600`. Not visible to the external customer. |
| `MessageComposer` | Bottom bar: text input (auto-grow textarea), send button (purple, icon-only), and action bar below with: Internal Note toggle, Template picker button, Attachment button. |
| `InternalNoteToggle` | Toggle button that switches the composer between normal message mode and internal note mode. When active: `bg-amber-50 text-amber-700 border border-amber-200`. |
| `TemplatePicker` | Dropdown panel listing predefined message templates. Each template shows: name, preview text, and an "Insert" button. Templates are inserted into the composer textarea. |
| `UnreadBadge` | Small badge showing unread count. `bg-purple-500 text-white text-xxs font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center`. |

### 6.3 Data Shapes

```typescript
/** Supported communication channels */
type Channel = 'whatsapp' | 'email' | 'sms';

const CHANNEL_CONFIG: Record<Channel, { label: string; icon: string; color: string }> = {
  whatsapp: { label: 'WhatsApp', icon: 'MessageCircle', color: 'text-green-600 bg-green-50' },
  email:    { label: 'Email',    icon: 'Mail',          color: 'text-blue-600 bg-blue-50' },
  sms:      { label: 'SMS',      icon: 'Smartphone',    color: 'text-gray-600 bg-gray-100' },
};

/** Conversation summary for the list view */
interface Conversation {
  id: string;
  /** Associated contact/lead ID */
  contactId: string;
  contactName: string;
  contactAvatar?: string;
  /** Primary channel for this conversation */
  channel: Channel;
  /** Preview text of the last message */
  lastMessage: string;
  /** ISO 8601 timestamp of the last message */
  lastMessageAt: string;
  /** Number of unread messages */
  unreadCount: number;
  /** Whether the conversation is resolved/closed */
  isResolved: boolean;
}

/** Individual message within a conversation */
interface Message {
  id: string;
  conversationId: string;
  /** Who sent the message */
  sender: {
    id: string;
    name: string;
    /** 'contact' = external customer, 'user' = human user, 'agent' = AI agent */
    type: 'contact' | 'user' | 'agent';
  };
  /** Message content (plain text or markdown) */
  content: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Channel through which the message was sent */
  channel: Channel;
  /** Whether this is an internal note (not visible to customer) */
  isInternal: boolean;
  /** Attachment URLs if any */
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  /** Delivery status for outgoing messages */
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

/** Message template for quick replies */
interface MessageTemplate {
  id: string;
  name: string;
  /** Template content with optional {{variable}} placeholders */
  content: string;
  /** Channel(s) this template is available for */
  channels: Channel[];
  /** Category for organization */
  category: string;
}
```

### 6.4 Message Bubble Visual Specification

**Incoming message (from contact):**
```
[Avatar 32px]  Message content text here that can
               wrap to multiple lines.
               10:30 AM

Avatar: h-8 w-8 rounded-full bg-gray-200 (initials fallback)
Bubble: bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[75%]
Timestamp: text-xs text-gray-400 mt-1
```

**Outgoing message (from Kitz/user):**
```
               Message content text here that can
               wrap to multiple lines.
                                        10:31 AM  [Avatar 32px]

Bubble: bg-purple-500 text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[75%]
  Agent messages: bg-purple-600 (slightly darker to distinguish from user)
Timestamp: text-xs text-gray-400 mt-1 text-right
```

**Internal note:**
```
+-- Internal Note -----------------------------------------+
|  Customer prefers Express shipping. Notes from the       |
|  conversation with the supplier indicate they can        |
|  deliver within 3 days.                                  |
|                                  -- Sales Bot, 10:45 AM  |
+----------------------------------------------------------+

Container: bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 max-w-[85%] mx-auto
Label: text-xxs font-medium uppercase tracking-wide text-amber-600 mb-1
Content: text-sm text-amber-900
Attribution: text-xs text-amber-600 mt-2 text-right
```

### 6.5 Delivery Status Indicators

For outgoing messages, show a delivery status icon below the timestamp:

| Status | Icon | Style |
|--------|------|-------|
| `sending` | Clock | `text-gray-300 h-3 w-3` |
| `sent` | Check | `text-gray-400 h-3 w-3` |
| `delivered` | CheckCheck | `text-gray-400 h-3 w-3` |
| `read` | CheckCheck | `text-blue-500 h-3 w-3` |
| `failed` | AlertCircle | `text-error h-3 w-3` + "Retry" link |

### 6.6 States

**Empty state (no conversations):**
```
+-------------------------------------------+
|  [MessageSquare, 40px, text-gray-400]      |
|                                            |
|  No conversations yet                      |
|                                            |
|  When customers message you via WhatsApp,  |
|  email, or SMS, conversations will appear  |
|  here.                                     |
|                                            |
|  [Connect WhatsApp]                        |
+-------------------------------------------+
```

**Empty state (no messages in selected conversation):**
```
+-------------------------------------------+
|  Start the conversation with              |
|  [Contact Name].                          |
+-------------------------------------------+
```
Displayed in the center of the message thread area.

**Loading state:**
- Conversation list: 5 skeleton list items (circle + two lines).
- Message thread: 4 alternating skeleton bubbles (left/right aligned, varying widths).

**Error state:** Standard error pattern within the relevant panel.

### 6.7 Mobile Responsiveness

- **Below 768px:** The two-panel layout is replaced by a navigation pattern. The conversation list takes the full screen. Tapping a conversation navigates to a full-screen message thread view with a back button in the header. The composer remains fixed at the bottom.
- **Conversation list items:** Full-width. Touch targets are the entire row (min-height 64px).
- **Message bubbles:** `max-w-[85%]` on mobile (wider than desktop's 75%).
- **Composer:** Text input takes full width. Action buttons (Internal Note, Template, Attach) collapse into a "+" menu button to save horizontal space.
- **Template picker:** Opens as a bottom sheet instead of a dropdown.

---

## 7. Integrations Page

The integrations page allows users to connect external services (WhatsApp, Stripe, Google Calendar, etc.) and manage their connected integrations.

### 7.1 Layout

```
+------------------------------------------------------------------------+
| Integrations                                          [Browse All]     |
+------------------------------------------------------------------------+
|                                                                         |
| Connected (3)                                                           |
| +------------------+ +------------------+ +------------------+          |
| | [WhatsApp icon]  | | [Stripe icon]    | | [Google icon]    |          |
| |                  | |                  | |                  |          |
| | WhatsApp         | | Stripe           | | Google Calendar  |          |
| | Business API     | | Payments         | | Scheduling       |          |
| |                  | |                  | |                  |          |
| | [*] Connected    | | [*] Connected    | | [*] Connected    |          |
| | since Feb 10     | | since Jan 20     | | since Feb 15     |          |
| |                  | |                  | |                  |          |
| | [Settings]       | | [Settings]       | | [Settings]       |          |
| +------------------+ +------------------+ +------------------+          |
|                                                                         |
| Available (12)                                                          |
| +------------------+ +------------------+ +------------------+          |
| | [Zapier icon]    | | [Slack icon]     | | [Shopify icon]   |          |
| |                  | |                  | |                  |          |
| | Zapier           | | Slack            | | Shopify          |          |
| | Automate any     | | Team messaging   | | E-commerce       |          |
| | workflow         | | and alerts       | | sync             |          |
| |                  | |                  | |                  |          |
| | [Connect]        | | [Connect]        | | [Connect]        |          |
| +------------------+ +------------------+ +------------------+          |
|                                                                         |
| +------------------+ +------------------+ +------------------+          |
| | [QuickBooks]     | | [Mailchimp]      | | [Instagram]      |          |
| | ...              | | ...              | | ...              |          |
| +------------------+ +------------------+ +------------------+          |
|                                                                         |
+------------------------------------------------------------------------+
```

### 7.2 Component Decomposition

| Component | Description |
|-----------|-------------|
| `IntegrationsPage` | Top-level page. Fetches integration data. Renders connected section and available section. |
| `IntegrationsHeader` | Title ("Integrations"), "Browse All" button (navigates to a searchable grid view of all integrations). |
| `IntegrationSection` | Section wrapper with title and count (e.g., "Connected (3)"). Contains a responsive card grid. |
| `IntegrationCard` | Card for each integration. Shows: icon (32x32 or 40x40), name, description, status indicator, action button. Two variants: connected and available. |
| `IntegrationStatusIndicator` | Connected: green dot + "Connected" text + "since [date]". Available: no dot, no status text. |
| `IntegrationSettingsModal` | Modal (size `md`) for managing a connected integration: permissions list, connection status, disconnect button (danger), last sync timestamp, sync now button. |
| `IntegrationConnectFlow` | Multi-step flow for connecting a new integration. Step 1: overview + permissions. Step 2: OAuth redirect or API key input. Step 3: confirmation. Renders in a modal (size `md`). |
| `IntegrationCategoryFilter` | Horizontal chip bar for filtering available integrations by category: All, Communication, Payments, Productivity, E-commerce, Analytics. |

### 7.3 Data Shapes

```typescript
/** Integration categories */
type IntegrationCategory = 'communication' | 'payments' | 'productivity' | 'ecommerce' | 'analytics';

/** Integration connection status */
type IntegrationStatus = 'connected' | 'available' | 'coming_soon';

/** Integration record */
interface Integration {
  id: string;
  name: string;
  /** Short description of what the integration does */
  description: string;
  /** URL to the integration's icon/logo */
  icon: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  /** ISO 8601, when the integration was connected (null if not connected) */
  connectedAt?: string;
  /** List of permissions/scopes the integration requires */
  permissions: string[];
  /** ISO 8601, last time data was synced */
  lastSyncAt?: string;
  /** Configuration options specific to this integration */
  config?: Record<string, unknown>;
}

/** Category display configuration */
const INTEGRATION_CATEGORIES: Record<IntegrationCategory, { label: string; icon: string }> = {
  communication: { label: 'Communication', icon: 'MessageSquare' },
  payments:      { label: 'Payments',      icon: 'CreditCard' },
  productivity:  { label: 'Productivity',  icon: 'Zap' },
  ecommerce:     { label: 'E-commerce',    icon: 'ShoppingCart' },
  analytics:     { label: 'Analytics',     icon: 'BarChart3' },
};
```

### 7.4 Integration Card Visual Specification

**Connected variant:**
```
+-------------------------------------------+
|  [Integration Icon, 40x40]                 |
|                                            |
|  WhatsApp Business API                     |  <-- text-body font-semibold text-gray-900
|  Send and receive messages via             |  <-- text-sm text-gray-500
|  WhatsApp Business.                        |
|                                            |
|  [*] Connected since Feb 10, 2026          |  <-- text-xs text-success
|                                            |
|  [Settings]                                |  <-- Button variant="secondary" size="sm"
+-------------------------------------------+

Card: rounded-lg border border-gray-200 bg-white p-6
  hover:shadow-sm transition-shadow duration-150
  border-l-4 border-l-success (green left border to indicate connected)
```

**Available variant:**
```
+-------------------------------------------+
|  [Integration Icon, 40x40]                 |
|                                            |
|  Zapier                                    |
|  Automate workflows between Kitz           |
|  and 5000+ apps.                           |
|                                            |
|  [Connect]                                 |  <-- Button variant="primary" size="sm"
+-------------------------------------------+

Card: rounded-lg border border-gray-200 bg-white p-6
  hover:shadow-sm hover:border-purple-200 transition-all duration-150
```

**Coming soon variant:**
```
Card: same as available but with opacity-60
Button replaced with text: "Coming Soon" in text-xs text-gray-400
```

### 7.5 States

**Empty state (no connected integrations):**
```
+-------------------------------------------+
|  [Plug, 40px, text-gray-400]               |
|                                            |
|  No integrations connected yet             |
|                                            |
|  Browse available integrations to          |
|  connect your favorite tools with Kitz.    |
|                                            |
|  [Browse Integrations]                     |
+-------------------------------------------+
```

**Loading state:** Grid of 6 skeleton cards (h-48 rounded-lg bg-gray-200 animate-pulse) in a 3-column layout.

**Error state:** Standard error pattern with retry button.

### 7.6 Mobile Responsiveness

- **Card grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`.
- **Below 640px:** Cards stack as full-width. Category filter chips become horizontally scrollable.
- **Settings modal:** Full-screen panel on mobile.
- **Connect flow:** Full-screen panel on mobile.

---

## 8. AI Battery / Credits Page

The AI Battery page provides visibility into AI action usage, individual action history, agent performance metrics, and plan upgrade options.

### 8.1 Layout

```
+------------------------------------------------------------------------+
| AI Battery                                              [Recharge]     |
+------------------------------------------------------------------------+
|                                                                         |
| +====================================================================+ |
| |                                                                    | |
| |  Daily Usage                               3 of 5 actions used    | |
| |                                                                    | |
| |  [||||||||||||||||||||||||||||ooooooooooooooo]         60%          | |
| |                                                                    | |
| |  Resets in 14h 23m                                                 | |
| |                                                                    | |
| +====================================================================+ |
|                                                                         |
| +====================================================================+ |
| | Today's Actions                                                    | |
| +--------------------------------------------------------------------+ |
| | 1. Generated sales proposal for Maria    [Sales Bot]    10:30 AM   | |
| | 2. Sent WhatsApp campaign (50 contacts)  [CMO]          11:15 AM   | |
| | 3. Created invoice #INV-089              [Finance Bot]  2:00 PM    | |
| +====================================================================+ |
|                                                                         |
| +====================================================================+ |
| | Top Agents This Week                                               | |
| +--------------------------------------------------------------------+ |
| | #  AGENT          ACTIONS    IMPACT                                | |
| +--------------------------------------------------------------------+ |
| | 1  Sales Bot      12         $2,400 revenue generated              | |
| | 2  CMO            8          1,200 reach                           | |
| | 3  Support Bot    6          4.8 avg CSAT                          | |
| +====================================================================+ |
|                                                                         |
| +====================================================================+ |
| | Current Plan: Starter (5 actions/day)                              | |
| |                                                                    | |
| | [Upgrade to Pro: 25 actions/day -- $29/mo]                         | |
| +====================================================================+ |
|                                                                         |
+------------------------------------------------------------------------+
```

### 8.2 Component Decomposition

| Component | Description |
|-----------|-------------|
| `AIBatteryPage` | Top-level page. Fetches battery status, action history, and agent stats. |
| `BatteryPageHeader` | Title ("AI Battery"), Recharge button (primary, opens upgrade modal or purchase flow). |
| `BatteryGauge` | Large usage display card. Contains: usage label, count text ("3 of 5 actions used"), progress bar (continuous gradient, not segmented like the KPI card), percentage, reset countdown timer. |
| `BatteryProgressBar` | Full-width progress bar. Filled portion: `bg-gradient-to-r from-purple-400 to-purple-600 rounded-full h-3`. Empty portion: `bg-gray-200 rounded-full h-3`. Container: `bg-gray-200 rounded-full h-3 overflow-hidden`. |
| `TodaysActionsSection` | Card with header ("Today's Actions") and numbered list of actions taken today. |
| `ActionHistoryItem` | Row in the actions list: numbered index, description, agent badge, timestamp. |
| `AgentBadge` | Small badge identifying which agent performed an action: `inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-700 px-2 py-0.5 text-xxs font-medium`. Bot icon (h-3 w-3) prefix. |
| `TopAgentsSection` | Card with header ("Top Agents This Week") and a compact table/list showing top-performing agents. |
| `AgentStatsRow` | Row in the agents table: rank (#), agent name + icon, action count, impact metric (varies by agent type). |
| `PlanSection` | Bottom card showing current plan name, daily action limit, and upgrade CTA button. |
| `UpgradeModal` | Modal (size `md`) showing plan comparison: Starter vs. Pro vs. Business. Feature comparison table. Pricing. Upgrade button links to Stripe checkout. |

### 8.3 Data Shapes

```typescript
/** Battery status for the usage gauge */
interface BatteryStatus {
  /** Number of actions used today */
  used: number;
  /** Maximum actions per day on current plan */
  limit: number;
  /** ISO 8601 timestamp when the counter resets (next midnight) */
  resetAt: string;
  /** Current plan name */
  planName: string;
  /** Current plan tier for UI differentiation */
  planTier: 'starter' | 'pro' | 'business';
}

/** Individual AI action log entry */
interface AIAction {
  id: string;
  /** Human-readable description of what the agent did */
  description: string;
  /** Name of the agent that performed the action */
  agentName: string;
  /** Agent's team cluster for color coding */
  agentGroup: 'manager' | 'sales' | 'demand-gen' | 'operations' | 'finance';
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Optional result or outcome description */
  result?: string;
  /** Credits consumed (usually 1, but some actions cost more) */
  creditsCost: number;
}

/** Agent performance stats for the leaderboard */
interface AgentStats {
  agentId: string;
  agentName: string;
  agentGroup: 'manager' | 'sales' | 'demand-gen' | 'operations' | 'finance';
  /** Total actions performed in the period */
  actionCount: number;
  /** Impact metric label (e.g., "$2,400 revenue", "1,200 reach") */
  impactLabel: string;
  /** Raw impact value for sorting */
  impactValue: number;
}

/** Plan comparison data for the upgrade modal */
interface PlanOption {
  id: string;
  name: string;
  tier: 'starter' | 'pro' | 'business';
  /** Actions per day */
  actionsPerDay: number;
  /** Monthly price in dollars */
  priceMonthly: number;
  /** Feature list */
  features: string[];
  /** Whether this is the user's current plan */
  isCurrent: boolean;
}
```

### 8.4 Battery Gauge Visual Specification

```
+====================================================================+
|                                                                    |
|  Daily Usage                               3 of 5 actions used    |
|  ^-- text-xs font-medium uppercase          ^-- text-h3 font-bold |
|      tracking-wide text-gray-500                text-gray-900     |
|                                                                    |
|  [||||||||||||||||||||||||||||ooooooooooooooo]         60%          |
|  ^-- h-3 rounded-full bg-gray-200 overflow-hidden     ^-- text-sm |
|      Inner fill: h-3 rounded-full                    text-gray-500|
|        bg-gradient-to-r from-purple-400 to-purple-600             |
|        width: calc(used/limit * 100%)                             |
|        transition-all duration-500 ease-out                       |
|                                                                    |
|  Resets in 14h 23m                                                 |
|  ^-- text-xs text-gray-400                                         |
|      Uses a live countdown timer (updates every minute)            |
|                                                                    |
+====================================================================+

Card container:
  rounded-lg border border-gray-200 bg-white p-6

Color thresholds for the progress bar:
  0-50% used:  from-purple-400 to-purple-600 (normal)
  51-80% used: from-amber-400 to-amber-600 (warning)
  81-100% used: from-red-400 to-red-600 (critical)
```

### 8.5 States

**Empty state (no actions today):**
```
+-------------------------------------------+
|  [Zap, 40px, text-gray-400]               |
|                                            |
|  No actions today                          |
|                                            |
|  Your AI agents have not performed any     |
|  actions yet today. Actions will appear    |
|  here as agents work on your behalf.       |
+-------------------------------------------+
```

**Empty state (no agents active):**
For the Top Agents section:
```
+-------------------------------------------+
|  [Bot, 40px, text-gray-400]               |
|                                            |
|  No agent activity this week              |
|                                            |
|  Agent performance stats will appear       |
|  here once agents start completing tasks.  |
+-------------------------------------------+
```

**Loading state:**
- Battery gauge: skeleton bar (h-3 rounded-full bg-gray-200 animate-pulse w-full) inside skeleton card.
- Actions list: 3 skeleton rows.
- Agent stats: 3 skeleton rows.

**Error state:** Standard error pattern with retry button.

### 8.6 Mobile Responsiveness

- **Below 768px:** All sections stack vertically at full width. Battery gauge card stretches to fill. Agent stats table collapses to a stacked card list (rank + name on line 1, actions + impact on line 2).
- **Actions list:** Timestamps move to a second line below the description on small screens.
- **Plan section:** Upgrade button becomes full-width.
- **Upgrade modal:** Full-screen panel. Plan comparison changes from a horizontal table to vertical stacked cards.

---

## 9. Cross-Cutting Patterns

These patterns apply to all surfaces described above and should be implemented as shared, reusable components or utilities.

### 9.1 Empty States

Every list, table, grid, or content area that can be empty implements a consistent empty state:

```
+-------------------------------------------+
|  [Icon, 40px, text-gray-400]              |  <-- Lucide icon, contextual to the content
|                                            |
|  [Title]                                   |  <-- text-h3 font-semibold text-gray-900
|                                            |
|  [Description]                             |  <-- text-sm text-gray-500 max-w-sm mx-auto
|  [two lines max]                           |      text-center
|                                            |
|  [Primary CTA]                             |  <-- Button variant="primary" size="md"
+-------------------------------------------+

Container: flex flex-col items-center justify-center py-16 text-center
```

**TypeScript interface:**

```typescript
interface EmptyStateProps {
  /** Lucide icon component */
  icon: React.ComponentType<{ className?: string }>;
  /** Primary title text */
  title: string;
  /** Descriptive text explaining what belongs here and how to get started */
  description: string;
  /** Optional CTA button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
}
```

### 9.2 Loading States (Skeletons)

Loading states use animated skeleton placeholders that match the shape of the content being loaded:

```
Skeleton element:
  bg-gray-200 animate-pulse rounded-md

Skeleton variants:
  Text line:    h-4 w-[width] rounded-md bg-gray-200 animate-pulse
  Heading:      h-6 w-48 rounded-md bg-gray-200 animate-pulse
  Circle:       h-8 w-8 rounded-full bg-gray-200 animate-pulse
  Card:         h-[height] w-full rounded-lg bg-gray-200 animate-pulse
  Table row:    h-12 w-full bg-gray-200 animate-pulse (repeated)
  Progress bar: h-3 w-full rounded-full bg-gray-200 animate-pulse
```

**TypeScript interface:**

```typescript
interface SkeletonProps {
  /** Shape variant */
  variant: 'text' | 'heading' | 'circle' | 'card' | 'row';
  /** Width (Tailwind class, e.g., "w-48", "w-full", "w-3/4") */
  width?: string;
  /** Height (Tailwind class, e.g., "h-4", "h-12") */
  height?: string;
  /** Number of skeleton elements to render */
  count?: number;
  /** Vertical gap between elements when count > 1 */
  gap?: string;
}
```

Skeletons should approximate the layout of the loaded content:
- A table skeleton has the same number of columns and approximate row heights.
- A card grid skeleton has the same grid layout with appropriately sized card placeholders.
- A KPI card skeleton matches the card's internal structure (3 lines: label, value, trend).

### 9.3 Error States

Error states provide a clear message and a recovery action:

```
+-------------------------------------------+
|  [AlertTriangle, 40px, text-error]         |  <-- Lucide AlertTriangle icon
|                                            |
|  [Error title]                             |  <-- text-h3 font-semibold text-gray-900
|                                            |
|  [Error description]                       |  <-- text-sm text-gray-500 max-w-sm mx-auto
|                                            |      text-center
|  [Retry]                                   |  <-- Button variant="secondary" size="md"
+-------------------------------------------+

Container: flex flex-col items-center justify-center py-16 text-center
```

**TypeScript interface:**

```typescript
interface ErrorStateProps {
  /** Error title (default: "Something went wrong") */
  title?: string;
  /** Error description explaining what happened */
  description?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Custom retry button label (default: "Try Again") */
  retryLabel?: string;
}
```

**Inline error variant (for sections within a page):**
When an error occurs in a section but the rest of the page is fine, use a compact inline error:

```
+-------------------------------------------+
|  [AlertTriangle 16px] Unable to load      |
|  activity feed. [Retry]                    |
+-------------------------------------------+

Container: flex items-center gap-2 rounded-lg bg-error-light px-4 py-3
Icon: h-4 w-4 text-error
Text: text-sm text-red-700
Retry: text-sm font-medium text-red-700 underline cursor-pointer
```

### 9.4 Pagination

Used on all list/table views when item count exceeds the page size.

```
Showing 1-25 of 342 leads              [< Previous]  1 2 3 ... 14  [Next >]
^-- text-sm text-gray-500               ^-- Button group

Container: flex items-center justify-between px-4 py-3 border-t border-gray-200

Info text: text-sm text-gray-500

Page buttons:
  Active: bg-purple-500 text-white h-8 w-8 rounded-md
  Inactive: bg-white text-gray-700 hover:bg-gray-50 h-8 w-8 rounded-md border border-gray-200
  Disabled (Prev/Next at bounds): opacity-50 cursor-not-allowed

Ellipsis: text-gray-400, not interactive
```

**TypeScript interface:**

```typescript
interface PaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems: number;
  /** Items per page */
  pageSize: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Label for the items being paginated (e.g., "leads", "orders") */
  itemLabel?: string;
}
```

### 9.5 Status Badges (Shared Pattern)

All status badges across the application follow a consistent visual pattern:

```
Badge: inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5
Dot: h-1.5 w-1.5 rounded-full [status-dot-color]
Text: text-xxs font-medium [status-text-color]
Background: [status-bg-color]
```

The color mappings are defined per-surface (see STAGE_COLORS, ORDER_STATUS_CONFIG, INVOICE_STATUS_CONFIG, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG above).

### 9.6 Confirmation Dialogs

Destructive actions always show a confirmation modal:

```
+-------------------------------------------+
|  [X]  Delete [Item Name]                   |
|                                            |
|  Are you sure you want to delete           |
|  "[specific item name]"? This action       |
|  cannot be undone.                         |
|                                            |
|  [consequence description if applicable]   |
|                                            |
|           [Cancel]  [Delete]               |
|                     ^-- danger variant     |
+-------------------------------------------+

Modal: size="sm" (max-w-md)
Title: includes the specific item name
Body: describes the consequence
Cancel: Button variant="secondary"
Confirm: Button variant="danger", label is verb-first ("Delete Lead", "Cancel Order")
```

### 9.7 Bulk Actions Bar

When items are selected in a table via checkboxes, a floating action bar appears:

```
+------------------------------------------------------------------------+
| [X] 3 selected                    [Export CSV]  [Archive]  [Delete]    |
+------------------------------------------------------------------------+

Position: sticky bottom-0 (or fixed bottom-6 left-1/2)
Container: bg-gray-900 text-white rounded-lg shadow-xl px-4 py-3
  flex items-center justify-between gap-4

Count text: text-sm font-medium text-white
Close button: [X] icon, clears selection
Action buttons: ghost style on dark bg (text-white hover:bg-gray-800 rounded-md h-8 px-3 text-xs)
Delete button: text-red-400 hover:bg-red-900/30
```

### 9.8 Search Pattern

All search inputs follow the same pattern:

```
[SearchIcon] [Search placeholder text...]

Container: relative
Input: h-10 w-full pl-10 pr-4 text-body
  rounded-md border border-gray-200 bg-white text-gray-900
  placeholder:text-gray-400
  focus:border-purple-500 focus:ring-1 focus:ring-purple-500
Icon: absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400
Clear button (when value exists): absolute right-3 top-1/2 -translate-y-1/2
  h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer
```

Search triggers on debounced input (300ms delay). A loading spinner replaces the search icon while results are being fetched.

### 9.9 Filter Chips

Used across multiple surfaces for active filter indication:

```
[stage: New]  [value: > $500]  [Clear All]

Chip: inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-700
  px-3 py-1 text-xs font-medium
Remove button: [X] h-3.5 w-3.5 text-purple-500 hover:text-purple-700 cursor-pointer
"Clear All" link: text-xs text-gray-500 hover:text-gray-700 cursor-pointer
```

### 9.10 Page Header Pattern

All top-level pages use a consistent header structure:

```
+------------------------------------------------------------------------+
| Page Title                                   [Secondary]  [Primary]    |
| Optional description text                                              |
+------------------------------------------------------------------------+

Title: text-h1 font-semibold tracking-tight text-gray-900
Description: text-sm text-gray-500 mt-1
Buttons: right-aligned, primary action on the far right
Container: flex items-start justify-between mb-8
```

### 9.11 Mobile Navigation

At viewport widths below 768px:

- The sidebar (TopNavBar) collapses entirely and is replaced by a hamburger menu icon in the top-left corner.
- Tapping the hamburger opens the sidebar as a full-height slide-in overlay from the left (`fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50`) with a backdrop overlay.
- The chat panel (ChatPanel) is hidden on mobile and accessible via the floating Kitz orb (which opens TalkToKitzModal as a full-screen sheet).
- Page content takes the full viewport width with `px-4` padding.

### 9.12 Currency Formatting

All monetary values follow a consistent format:

```typescript
function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
```

Display rules:
- Always show 2 decimal places: `$1,200.00` (not `$1200` or `$1,200`).
- Use thousands separators: `$12,450.00`.
- Negative values: `($500.00)` or `-$500.00` (parentheses preferred).
- Monospace / tabular figures for alignment in tables: `font-variant-numeric: tabular-nums` (Tailwind: `tabular-nums`).

### 9.13 Timestamp Formatting

```typescript
function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes <= 0 ? 'just now' : `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`;
  }
  // Absolute format for older timestamps
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}
```

Rules:
- Under 1 hour: `Xm ago` (e.g., "2m ago", "45m ago").
- 1-24 hours: `Xh ago` (e.g., "3h ago", "23h ago").
- Over 24 hours: Absolute date `MMM DD, YYYY` (e.g., "Feb 24, 2026").
- Tooltip on hover: always show full absolute date and time.

---

## Appendix A: Surface-to-Component Map

| Surface | Primary Components | Store(s) | API Endpoint(s) |
|---------|-------------------|----------|-----------------|
| Dashboard | DashboardGreeting, KPICardGrid, KPICard, AIBatteryCard, ActivityFeedSection, ActivityFeedItem | dashboardStore, activityStore | `GET /api/dashboard/kpi`, `GET /api/logs/activity` |
| Leads Pipeline | PipelineBoardView, PipelineColumn, PipelineCard, PipelineListView, LeadDetailDrawer, AddLeadModal | workspaceStore | `GET /api/workspace/leads`, `POST /api/workspace/leads`, `PATCH /api/workspace/leads/:id` |
| Orders | OrderTable, OrderDetail, OrderTimeline, OrderItemsTable, CreateOrderModal | workspaceStore | `GET /api/workspace/orders`, `POST /api/workspace/orders`, `PATCH /api/workspace/orders/:id` |
| Task Queue | TaskQueuePage, TaskStatusTabs, TaskCard, TaskApprovalActions, CreateTaskModal, TaskDetailDrawer | workspaceStore | `GET /api/workspace/tasks`, `POST /api/workspace/tasks`, `PATCH /api/workspace/tasks/:id/approve` |
| Invoices | InvoiceTable, InvoicePreview, InvoiceActionBar, CreateInvoiceModal | invoiceStore | `GET /api/workspace/invoices`, `POST /api/workspace/invoices`, `POST /api/workspace/invoices/:id/send` |
| Inbox | ConversationList, ConversationListItem, MessageThread, MessageBubble, InternalNoteBubble, MessageComposer | conversationStore | `GET /api/comms/conversations`, `GET /api/comms/conversations/:id/messages`, `POST /api/comms/conversations/:id/messages` |
| Integrations | IntegrationCard, IntegrationSettingsModal, IntegrationConnectFlow, IntegrationCategoryFilter | integrationStore | `GET /api/kitz/integrations`, `POST /api/kitz/integrations/:id/connect`, `DELETE /api/kitz/integrations/:id/disconnect` |
| AI Battery | BatteryGauge, BatteryProgressBar, TodaysActionsSection, TopAgentsSection, PlanSection, UpgradeModal | batteryStore | `GET /api/kitz/battery`, `GET /api/kitz/battery/actions`, `GET /api/kitz/battery/agents` |

---

## Appendix B: Shared Utility Components

These components are referenced across multiple surfaces and should be implemented once in `src/components/ui/`:

| Component | File | Description |
|-----------|------|-------------|
| `EmptyState` | `ui/EmptyState.tsx` | Shared empty state with icon, title, description, and CTA. |
| `ErrorState` | `ui/ErrorState.tsx` | Shared error state with retry button. |
| `Skeleton` | `ui/Skeleton.tsx` | Configurable skeleton loader (text, heading, circle, card, row variants). |
| `StatusBadge` | `ui/StatusBadge.tsx` | Generic status badge with dot + label. Accepts color config. |
| `Pagination` | `ui/Pagination.tsx` | Page navigation with info text, page buttons, and prev/next. |
| `SearchInput` | `ui/SearchInput.tsx` | Debounced search input with icon, clear button, and loading state. |
| `FilterChips` | `ui/FilterChips.tsx` | Active filter display with remove buttons and "Clear All". |
| `ConfirmDialog` | `ui/ConfirmDialog.tsx` | Destructive action confirmation modal. |
| `ViewToggle` | `ui/ViewToggle.tsx` | Two-segment toggle for switching between view modes (Board/List, Grid/Table). |
| `Timeline` | `ui/Timeline.tsx` | Vertical timeline with connected dots and event descriptions. |
| `BulkActionBar` | `ui/BulkActionBar.tsx` | Floating bottom bar for bulk operations on selected table rows. |
| `ChannelIcon` | `ui/ChannelIcon.tsx` | Channel-specific icon (WhatsApp, Email, SMS) with color circle. |
| `CurrencyDisplay` | `ui/CurrencyDisplay.tsx` | Formatted currency value with tabular-nums. |
| `RelativeTime` | `ui/RelativeTime.tsx` | Relative timestamp with tooltip showing absolute date. |

---

## Appendix C: Responsive Breakpoint Summary

| Breakpoint | Width | Tailwind | Layout Changes |
|------------|-------|----------|----------------|
| Mobile | < 640px | default | Single column. Full-screen modals. Stacked cards. Hidden sidebar. Hamburger menu. |
| Small tablet | 640px-767px | `sm:` | 2-column card grids. Wider touch targets. |
| Tablet | 768px-1023px | `md:` | Sidebar collapsed (icon-only or hidden). 2-column layouts. Tables visible (scrollable). |
| Desktop | 1024px-1279px | `lg:` | Full sidebar. 3-column shell. Tables fully visible. Board views horizontal. |
| Wide desktop | 1280px+ | `xl:` | Content max-width constrained (1280px). Centered with balanced gutters. |

---

## Appendix D: Accessibility Checklist (Per Surface)

Every surface must pass the following before shipping:

- [ ] All interactive elements have visible focus indicators (`focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`).
- [ ] Tab order is logical and complete (no skipped elements).
- [ ] Icon-only buttons have `aria-label` attributes.
- [ ] Status badges include text labels (not color alone).
- [ ] Tables have proper `<thead>`, `<tbody>`, scope attributes.
- [ ] Modals trap focus and close on Escape.
- [ ] Drag-and-drop operations (pipeline board) have keyboard alternatives (dropdown to change stage).
- [ ] Dynamic content updates use `aria-live` regions.
- [ ] Color contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large text).
- [ ] `prefers-reduced-motion` disables non-essential animations.
