# Kitz UI Inventory

> Comprehensive audit of every page, component, store, and styling pattern in the Kitz frontend.
> Source of truth for design system planning, gap analysis, and implementation backlog.
>
> Last updated: 2026-02-24

---

## Current Tech Stack

| Layer          | Technology               | Version   | Notes                                       |
|----------------|--------------------------|-----------|---------------------------------------------|
| Framework      | React                    | 19.2.4    | Functional components, hooks only           |
| Routing        | React Router DOM         | 7.13.0    | `BrowserRouter`, 5 top-level routes         |
| State          | Zustand                  | 5.0.11    | 11 stores, no middleware (no persist/devtools) |
| Styling        | Tailwind CSS             | 4.2.0     | `@theme` directive in CSS, no `tailwind.config.js` |
| Icons          | Lucide React             | 0.575.0   | Used directly, no wrapper/system            |
| Language       | TypeScript               | 5.9.3     | Strict mode via `tsc -b`                    |
| Bundler        | Vite                     | 7.3.1     | `@vitejs/plugin-react`, `@tailwindcss/vite` |
| QR Codes       | qrcode.react             | 4.2.0     | WhatsApp QR login only                      |
| Utilities      | clsx + tailwind-merge    | 2.1.1 / 3.5.0 | Combined via `cn()` helper in `lib/utils.ts` |

**No component library is used.** No shadcn, no Radix, no Headless UI. All components are built from scratch with Tailwind utility classes.

---

## Pages (12)

All pages are rendered inside the `DashboardPage` shell except `LoginPage`, `WhatsAppPage`, and the code-split `/learn` and `/game` routes.

| # | Page             | Route              | File                                | Lines | Description                                                  |
|---|------------------|--------------------|-------------------------------------|-------|--------------------------------------------------------------|
| 1 | LoginPage        | `/login`           | `src/pages/LoginPage.tsx`           | 35    | Auto-login stub for MVP. Sets dev user and redirects to `/connect-whatsapp`. |
| 2 | DashboardPage    | `/`                | `src/pages/DashboardPage.tsx`       | 103   | Main app shell. 3-column layout: sidebar + content + chat panel. Manual/Kitz mode toggle. Renders all inner pages via `currentNav` state. |
| 3 | HomePage         | (nav: `home`)      | `src/pages/HomePage.tsx`            | 309   | Hero card with greeting, MissionBlock, floating Kitz orb. 6 quick-action FeatureCards. AgentDocsSection and AgentDiscoveryBanner. |
| 4 | WorkspacePage    | (nav: `workspace`)  | `src/pages/WorkspacePage.tsx`       | 204   | 8 module cards (CRM, Payments, Contacts, Orders, Tasks, Payment Links, Messages, Calendar). WorkspaceTabs with 9 tab components. API endpoint reference. |
| 5 | AgentsPage       | (nav: `agents`)     | `src/pages/AgentsPage.tsx`          | 353   | Agent architecture tiers (4 cards), 5-phase semantic router, team directory (18 teams, 106+ agents), swarm simulation runner, agent integration section. |
| 6 | AutomationsPage  | (nav: `automations`) | `src/pages/AutomationsPage.tsx`    | 230   | AutoPilotTab command center, 4-step workflow explanation, 6 SOPs, safety guardrails, external agent API. |
| 7 | ActivityPage     | (nav: `activity`)   | `src/pages/ActivityPage.tsx`        | 222   | ActivityTab with live feed, 5 event type cards, audit trail anatomy table, agent capabilities, activity API endpoints. |
| 8 | LearnPage        | `/learn` (also nav) | `src/pages/LearnPage.tsx`           | 107   | Course selection (ModuleSelect), quiz flow (QuestionCard), course completion screen with Orb level-up. Code-split via `lazy()`. |
| 9 | GamePage         | `/game` (also nav)  | `src/pages/GamePage.tsx`            | 10    | Thin wrapper around `KitzGame`. Code-split via `lazy()`. Dark background (`#0D0D12`). |
| 10 | HowItWorksPage  | (nav: `how-it-works`) | `src/pages/HowItWorksPage.tsx`    | 169   | 4-step flow diagram, 6 principles, safety & governance section. |
| 11 | WhatsAppPage    | `/connect-whatsapp` | `src/pages/WhatsAppPage.tsx`        | ~198  | QR code scanner for WhatsApp Business API login. Protected route. |
| 12 | SettingsPage    | (nav: `settings`)   | `src/pages/SettingsPage.tsx`        | 191   | 5 settings sections (Profile, Language, Notifications, AI Battery, Security). Danger zone with delete account. Inline Toggle and FieldRow sub-components. |

### Routing Architecture

```
App.tsx (BrowserRouter)
  /login          -> LoginPage (public)
  /connect-whatsapp -> WhatsAppPage (ProtectedRoute, lazy)
  /               -> DashboardPage (ProtectedRoute, lazy)
                      -> HomePage | WorkspacePage | AgentsPage | AutomationsPage
                         | ActivityPage | LearnPage | GamePage | HowItWorksPage
                         | SettingsPage
  /learn          -> LearnPage (ProtectedRoute, lazy)
  /game           -> GamePage (ProtectedRoute, lazy)
  *               -> Navigate to /
```

Note: `LearnPage` and `GamePage` are accessible both as standalone routes (`/learn`, `/game`) and as inner tabs within `DashboardPage`. When accessed via navigation sidebar, they render inside the dashboard shell. When accessed via direct URL, they render standalone.

---

## Components (53 files)

### layout/ (4 components)

| Component        | File                                       | Lines | Description                                                  |
|------------------|--------------------------------------------|-------|--------------------------------------------------------------|
| DashboardLayout  | `src/components/layout/DashboardLayout.tsx` | 33    | Outer shell: StatusBanner + sidebar/main flex container. Receives `currentNav` and `onNavChange`. |
| TopNavBar        | `src/components/layout/TopNavBar.tsx`       | 112   | Left sidebar (w-56 / 224px). Logo, 7 nav items (Home, Fun Learning, How it Works, Workspace, Agents, Automations, Activity), language selector (EN/ES/PT), Settings button, user avatar. |
| StatusBanner     | `src/components/layout/StatusBanner.tsx`    | 60    | Conditional banner for system status (degraded/outage/maintenance). Reads from `statusStore`. |
| ChatPanel        | `src/components/layout/ChatPanel.tsx`       | 228   | Right-side dark panel (w-[420px]). "Command Center" header, build log, message history, suggestion chips, typing indicator, agent thinking block, chat input with send button, stats bar (AI Battery, Active Agents, WhatsApp echo toggle), tagline. |

### home/ (5 components)

| Component              | File                                            | Lines | Description                                           |
|------------------------|-------------------------------------------------|-------|-------------------------------------------------------|
| FeatureCard            | `src/components/home/FeatureCard.tsx`            | 28    | Clickable card with icon, title, description, and color accent. 6 color variants (purple, blue, pink, emerald, orange, amber). |
| MissionBlock           | `src/components/home/MissionBlock.tsx`            | 44    | Displays Kitz mission statement with tagline in the hero area. |
| AgentDocsSection       | `src/components/home/AgentDocsSection.tsx`        | 95    | Section showing agent documentation links and capabilities overview. |
| AgentDiscoveryBanner   | `src/components/home/AgentDiscoveryBanner.tsx`    | 54    | Banner promoting AI agent discovery with manifest link. |
| PageHeader             | `src/components/home/PageHeader.tsx`              | 14    | Reusable title + description header used across all inner pages. |

### workspace/ (10 components)

| Component       | File                                           | Lines | Description                                           |
|-----------------|------------------------------------------------|-------|-------------------------------------------------------|
| WorkspaceTabs   | `src/components/workspace/WorkspaceTabs.tsx`   | 63    | Tab bar with 9 tabs (CRM, Payments, Contacts, Orders, Tasks, Payment Links, Products, Messages, Calendar). Font-mono uppercase labels. Purple underline on active. |
| CalendarTab     | `src/components/workspace/CalendarTab.tsx`     | 79    | Calendar view for appointments and follow-ups.         |
| CheckoutTab     | `src/components/workspace/CheckoutTab.tsx`     | 92    | Payment link creation and management.                  |
| InventoryTab    | `src/components/workspace/InventoryTab.tsx`    | 201   | Product catalog with add/edit/delete. Full CRUD against workspaceStore. |
| LeadsTab        | `src/components/workspace/LeadsTab.tsx`        | 69    | Contact list view (leads).                              |
| MessagesTab     | `src/components/workspace/MessagesTab.tsx`     | 81    | Unified inbox for WhatsApp/email/web messages.         |
| OrdersTab       | `src/components/workspace/OrdersTab.tsx`       | 68    | Order tracking and management.                          |
| PaymentsTab     | `src/components/workspace/PaymentsTab.tsx`     | 80    | Payment ledger (incoming/outgoing) with status badges. |
| TasksTab        | `src/components/workspace/TasksTab.tsx`        | 58    | To-do list with add/complete functionality.            |

### chat/ (4 components)

| Component          | File                                          | Lines | Description                                           |
|--------------------|-----------------------------------------------|-------|-------------------------------------------------------|
| AgentThinkingBlock | `src/components/chat/AgentThinkingBlock.tsx`  | 55    | Collapsible block showing agent reasoning steps in the chat panel. |
| AgentThinkingStep  | `src/components/chat/AgentThinkingStep.tsx`   | 55    | Individual step within the thinking block (status icon, agent name, description). |
| MessageBubble      | `src/components/chat/MessageBubble.tsx`        | 49    | Chat message bubble with role-based styling (user vs. assistant). Supports `dark` variant for chat panel. |
| TypingIndicator    | `src/components/chat/TypingIndicator.tsx`      | 25    | Three bouncing dots animation while Kitz is thinking. Uses `typing-bounce` keyframe. |

### crm/ (3 components)

| Component      | File                                       | Lines | Description                                           |
|----------------|--------------------------------------------|-------|-------------------------------------------------------|
| ContactDetail  | `src/components/crm/ContactDetail.tsx`     | 202   | Full contact profile: name, phone, email, source, stage badge, value, tags (add/remove), notes (add), last contact date. |
| CrmTab         | `src/components/crm/CrmTab.tsx`            | 308   | Main CRM view with pipeline toggle (list/pipeline), add lead form, lead list with search/filter, pipeline view integration. |
| PipelineView   | `src/components/crm/PipelineView.tsx`      | 199   | Kanban-style pipeline with 6 stages (New, Contacted, Qualified, Proposal, Won, Lost). Stage columns with lead cards showing name, value, tags. Stage change via dropdown. |

### auth/ (1 component)

| Component       | File                                        | Lines | Description                                          |
|-----------------|---------------------------------------------|-------|------------------------------------------------------|
| ProtectedRoute  | `src/components/auth/ProtectedRoute.tsx`    | 8     | Redirects to `/login` if no auth token. Wraps children. |

### autopilot/ (3 components)

| Component       | File                                           | Lines | Description                                           |
|-----------------|------------------------------------------------|-------|-------------------------------------------------------|
| AgentStatusCard | `src/components/autopilot/AgentStatusCard.tsx` | 77    | Card showing individual agent status (active/idle/error), last action, and metrics. |
| AutoPilotTab    | `src/components/autopilot/AutoPilotTab.tsx`    | 70    | Live command center for autopilot mode. Shows active agents, pending drafts, and agent status cards. |
| DraftQueue      | `src/components/autopilot/DraftQueue.tsx`      | 98    | Queue of AI-drafted actions awaiting approval. Approve/reject/edit workflow. |

### activity/ (3 components)

| Component       | File                                           | Lines | Description                                          |
|-----------------|------------------------------------------------|-------|------------------------------------------------------|
| ActivityTab     | `src/components/activity/ActivityTab.tsx`       | 45    | Filter chip bar (All, Agents, CRM, Orders, Messages, System) + ActivityFeed. |
| ActivityFeed    | `src/components/activity/ActivityFeed.tsx`      | 37    | Renders list of ActivityEntry components from activityStore. |
| ActivityEntry   | `src/components/activity/ActivityEntry.tsx`     | 48    | Individual activity event row with icon, description, timestamp, and type badge. |

### learn/ (2 components)

| Component      | File                                       | Lines | Description                                           |
|----------------|--------------------------------------------|-------|-------------------------------------------------------|
| ModuleSelect   | `src/components/learn/ModuleSelect.tsx`    | 63    | Course selection grid. Shows available courses with progress, icon, and question count. |
| QuestionCard   | `src/components/learn/QuestionCard.tsx`    | 109   | Quiz question with multiple-choice options, correct/incorrect feedback, explanation text, and next button. |

### orb/ (2 components)

| Component    | File                                    | Lines | Description                                           |
|--------------|-----------------------------------------|-------|-------------------------------------------------------|
| Orb          | `src/components/orb/Orb.tsx`            | 750   | The Kitz mascot. Animated character with multiple states (idle, sleeping, thinking, talking). Eyes, mouth, aura, thought bubble, sleep "Z" particles. Level-based visual evolution. Pure CSS animations. |
| FloatingOrb  | `src/components/orb/FloatingOrb.tsx`    | 176   | Floating navigation assistant. Moves toward sidebar nav items using `useOrbNavigator` hook. Puff in/out teleport animations. Highlights target nav items with `kitz-highlight` class. |

### talk/ (1 component)

| Component        | File                                       | Lines | Description                                           |
|------------------|--------------------------------------------|-------|-------------------------------------------------------|
| TalkToKitzModal  | `src/components/talk/TalkToKitzModal.tsx`  | 307   | Full-screen modal for voice/chat interaction with Kitz. Orb display, text input, voice recording UI, message history. Opens via `orbStore.open()`. |

### ui/ (2 components)

| Component      | File                                    | Lines | Description                                           |
|----------------|-----------------------------------------|-------|-------------------------------------------------------|
| ErrorBoundary  | `src/components/ui/ErrorBoundary.tsx`   | 66    | React error boundary. Catches render errors, displays fallback with error message and retry button. |
| ToastContainer | `src/components/ui/ToastContainer.tsx`  | 56    | Fixed-position toast notification container. Reads from `toastStore`. Auto-dismiss. Success/error/info variants. |

### whatsapp/ (1 component)

| Component   | File                                        | Lines | Description                                          |
|-------------|---------------------------------------------|-------|------------------------------------------------------|
| QRScanner   | `src/components/whatsapp/QRScanner.tsx`     | 198   | QR code display for WhatsApp Business API pairing. Uses `qrcode.react`. Polling for scan confirmation. |

### game/ui/ (9 components)

| Component           | File                                      | Lines | Description                                           |
|---------------------|-------------------------------------------|-------|-------------------------------------------------------|
| TycoonGame          | `src/game/ui/TycoonGame.tsx`              | 665   | Business Tycoon quiz game. 3 difficulty levels (Startup/Growth/Scale). Question/answer flow with revenue, customers, brand, and cash metrics. Win/lose screens. |
| GameTypeSelect      | `src/game/ui/GameTypeSelect.tsx`          | 161   | Game menu with 4 game types (Business Tycoon available, 3 coming soon). Retro pixel-font aesthetic. Leaderboard link. |
| GameOverScreen      | `src/game/ui/GameOverScreen.tsx`          | 65    | Platformer game over screen with score, retry, and menu buttons. |
| LevelSelect         | `src/game/ui/LevelSelect.tsx`             | 165   | World/level selector for platformer game. 5 worlds with locked/unlocked states. |
| LevelCompleteScreen | `src/game/ui/LevelCompleteScreen.tsx`     | 74    | Level completion screen with score summary and next level button. |
| HUD                 | `src/game/ui/HUD.tsx`                     | 79    | Heads-up display for platformer: health, score, level indicator. |
| Leaderboard         | `src/game/ui/Leaderboard.tsx`             | 122   | Top Founders leaderboard. Reads from localStorage. Retro styling. |
| QuizOverlay         | `src/game/ui/QuizOverlay.tsx`             | 135   | In-game quiz popup during platformer gameplay. |
| TouchControls       | `src/game/ui/TouchControls.tsx`           | 82    | Mobile touch controls (D-pad + action buttons) for platformer game. |

### game/engine/ (non-UI, for reference)

The `src/game/` directory also contains a canvas-based platformer game engine with the following modules: `GameManager.ts`, `GameLoop.ts`, `Canvas.ts`, `Input.ts`, `Camera.ts`, `Collision.ts`, `Player.ts`, `Enemy.ts`, `KitzSprite.ts`, `EnemySprites.ts`, `AuraRenderer.ts`, `LevelData.ts`, and 5 world definitions (`World1.ts` through `World5.ts`). These are not React components.

---

## State Management (11 Zustand Stores)

All stores use `create()` from Zustand 5 with no middleware (no `persist`, `devtools`, or `immer`).

| Store              | File                                    | Lines | Purpose                                                        |
|--------------------|-----------------------------------------|-------|----------------------------------------------------------------|
| workspaceStore     | `src/stores/workspaceStore.ts`          | 276   | Core business data. Leads (with CRM pipeline stages), orders, tasks, checkout links, payments, products (inventory). Full CRUD with local-first pattern (optimistic local state + async API sync). Mock data for demos. |
| orbStore           | `src/stores/orbStore.ts`                | 100   | Chat state machine (idle/thinking/talking), message history, voice modal open/close, chat focus trigger, `sendMessage()` with API call. |
| gameStore          | `src/stores/gameStore.ts`               | 88    | Game progression: current course, question index, completed questions, XP, level. `startCourse()`, `answerQuestion()`, `completeCourse()`, `addXP()`. |
| simulationStore    | `src/stores/simulationStore.ts`         | 77    | Swarm simulation state: `running`, `lastResult` (team results, agent results, duration, handoff count, knowledge written), `startSimulation()`. |
| agentStore         | `src/stores/agentStore.ts`              | 76    | Agent metadata and discovery. Agent team listings, capabilities. |
| agentThinkingStore | `src/stores/agentThinkingStore.ts`      | 75    | Agent reasoning display: `steps[]` with status (pending/running/done/error), `isThinking` flag, `addStep()`, `updateStep()`, `clear()`. |
| settingsStore      | `src/stores/settingsStore.ts`           | 73    | User preferences: interface language, bot language, notification toggles, AI Battery daily credit limit, security toggles (kill switch, draft-first, audit trail). |
| authStore          | `src/stores/authStore.ts`               | 69    | Authentication: `user` (id, email), `token`, `login()`, `logout()`, `hydrate()` from localStorage. |
| activityStore      | `src/stores/activityStore.ts`           | 46    | Activity log: events array, filter state (all/agent/crm/order/message/system), `addEvent()`, `setFilter()`. |
| toastStore         | `src/stores/toastStore.ts`              | 30    | Toast notifications: `toasts[]` with id, message, type (success/error/info), `addToast()`, `removeToast()`. |
| statusStore        | `src/stores/statusStore.ts`             | 25    | System status: status level (ok/degraded/outage/maintenance), message string. |

### Store Dependency Graph

```
DashboardPage
  -> orbStore (mode, chat)
  -> authStore (user)

HomePage
  -> authStore (user greeting)
  -> orbStore (open modal, state, focusChat)

ChatPanel
  -> orbStore (messages, state, sendMessage)
  -> authStore (user)
  -> agentThinkingStore (steps, isThinking)

WorkspacePage / WorkspaceTabs
  -> workspaceStore (leads, orders, tasks, checkoutLinks, payments, products)

AgentsPage
  -> simulationStore (running, lastResult, startSimulation)

AutomationsPage
  -> (no direct store — AutoPilotTab uses agent data)

ActivityPage
  -> activityStore (filter, events)

LearnPage / GamePage
  -> gameStore (currentCourse, level, XP)

SettingsPage
  -> settingsStore (all preferences)

TopNavBar
  -> settingsStore (interfaceLang)

StatusBanner
  -> statusStore (status, message)

ToastContainer
  -> toastStore (toasts)
```

---

## Styling Approach

### Tailwind v4 Configuration

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, ...;
}
```

- Uses Tailwind v4 `@theme` directive (CSS-first configuration)
- No `tailwind.config.js` file exists
- Only one CSS variable defined: `--font-sans`
- No custom color tokens, spacing tokens, or design tokens of any kind

### Custom CSS Animations (16 keyframes)

All animations are defined as raw `@keyframes` in `src/index.css`:

| Keyframe           | Usage                                    | Duration  |
|--------------------|------------------------------------------|-----------|
| `orb-pulse`        | Orb idle pulse with glow                 | Implicit  |
| `orb-breathe`      | Orb breathing (scale + opacity)          | Implicit  |
| `orb-bounce`       | Orb gentle vertical bounce               | Implicit  |
| `talk-pulse`       | Voice button pulse ring                  | Implicit  |
| `talk-mouth`       | Orb mouth open/close during speech       | Implicit  |
| `modal-fade-in`    | Modal entrance (opacity + scale)         | Implicit  |
| `typing-bounce`    | Chat typing indicator dots               | Implicit  |
| `cursorBlink`      | Text cursor blink                        | Implicit  |
| `fadeInUp`         | Content entrance (opacity + translateY)  | Implicit  |
| `sleep-float`      | Sleep "Z" particles floating up          | Implicit  |
| `kitz-navigate`    | Orb wandering path across nav area       | Implicit  |
| `kitz-puff-out`    | Orb teleport disappear (scale + blur)    | 0.4s      |
| `kitz-puff-in`     | Orb teleport appear (scale + blur)       | 0.5s      |
| `kitz-smoke`       | Smoke cloud during teleport              | 0.5s      |
| `kitz-glow`        | Nav item highlight glow on Orb hover     | 0.6s x3   |

Three CSS utility classes are also defined: `.kitz-puff-out`, `.kitz-puff-in`, `.kitz-smoke`, `.kitz-highlight`.

### Color Usage (no system, ad-hoc)

Colors are applied directly via Tailwind utilities and inline styles. The dominant palette:

| Role        | Values Used                                                    |
|-------------|----------------------------------------------------------------|
| Primary     | `purple-500` (#A855F7), `purple-600` (#9333EA), `purple-50`, `purple-100` |
| Neutrals    | `gray-50` through `gray-900`, `white`, `black`                 |
| Success     | `emerald-500`/`green-500` (#22C55E), `green-400`               |
| Error       | `red-500` (#EF4444), `red-400`, `red-50`, `red-200`            |
| Info        | `blue-500` (#3B82F6), `blue-100`, `blue-700`                   |
| Warning     | `amber-500` (#FBBF24), `amber-100`, `amber-600`               |
| Accent      | `pink-100`/`pink-600`, `cyan-50`/`cyan-700`, `orange` (FeatureCard) |
| Chat panel  | Custom hex: `#0a0a1a`, `#1a0a2e`, `#12122a`, `#0f0f1a`, `#333355`, `#4a4a6a`, `#64748b`, `#C084FC` |
| Game        | Custom hex throughout (retro dark theme)                       |

### Typography (no scale, ad-hoc)

Text sizes used across the codebase (not systematized):

- `text-[5px]`, `text-[6px]`, `text-[7px]`, `text-[8px]`, `text-[9px]`, `text-[10px]`, `text-[11px]` (game UI)
- `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl` (app UI)
- Font weights: `font-medium`, `font-semibold`, `font-bold`, `font-extrabold`
- Game uses `"Press Start 2P"` font family inline

### Spacing (no scale, ad-hoc)

Common patterns but no systematic scale:

- Page padding: `px-6 py-8 pb-12`
- Card padding: `p-5`, `p-4`, `p-6`
- Gaps: `gap-1`, `gap-2`, `gap-3`, `gap-4`
- Max widths: `max-w-3xl` (Settings), `max-w-5xl` (Home), `max-w-6xl` (most pages), `max-w-lg` (game cards), `max-w-md` (game menus)

### Border Radius (no tokens)

- Cards: `rounded-2xl` (16px), `rounded-3xl` (24px)
- Buttons: `rounded-lg` (8px), `rounded-xl` (12px), `rounded-full`
- Inputs: `rounded-lg` (8px), `rounded-xl` (12px)
- Chips/badges: `rounded-full`, `rounded-md`

---

## Layout Architecture

### 3-Column Layout

```
+----------------+------------------------+------------------+
| TopNavBar      | Main Content           | ChatPanel        |
| (sidebar)      | (scrollable)           | (dark theme)     |
| w-56 (224px)   | flex-1                 | w-[420px]        |
| border-right   |                        | hidden < lg      |
+----------------+------------------------+------------------+
```

### TopNavBar (Left Sidebar)

- Fixed width: `w-56` (224px)
- White background, `border-r border-gray-200`
- Structure (top to bottom):
  1. Logo: "KITZ v0.1" in purple gradient text
  2. Navigation: 7 items (Home, Fun Learning, How it Works, Workspace, Agents, Automations, Activity)
  3. Language selector: EN / ES / PT toggle (pill style)
  4. Settings button
  5. User avatar (purple circle with initial) + name
- Active state: `bg-purple-50 text-purple-600`
- Icon size: `h-4 w-4` (all nav icons)

### Main Content Area

- `flex-1 overflow-hidden`
- Contains mode toggle (Manual / Powered by KITZ) at top
- Scrollable content area: `flex-1 overflow-y-auto`
- Most pages use `mx-auto max-w-6xl px-6 py-8 pb-12`

### ChatPanel (Right Panel)

- Fixed width: `w-[420px]`
- Hidden on screens < `lg` (1024px): `hidden lg:flex`
- Dark theme: `bg-gradient-to-b from-purple-950 to-purple-900`
- Structure (top to bottom):
  1. Header: "Command Center"
  2. Scrollable area: build log, messages, thinking block, suggestion chips
  3. Input bar: text input + send button
  4. Stats bar: AI Battery (credits), Active Agents (count), WhatsApp echo toggle
  5. Tagline: "Your hustle deserves infrastructure"

### Responsive Behavior

- Chat panel hidden below 1024px (`hidden lg:flex`)
- Sidebar is always visible (no hamburger menu, no mobile nav)
- Content grids use responsive columns: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (or 4)
- No mobile-first design beyond Tailwind's default breakpoints

---

## Hooks (3 custom hooks)

| Hook             | File                              | Description                                       |
|------------------|-----------------------------------|---------------------------------------------------|
| useKitzVoice     | `src/hooks/useKitzVoice.ts`       | Voice recording and speech-to-text integration.   |
| useOrbNavigator  | `src/hooks/useOrbNavigator.ts`    | Drives FloatingOrb to navigate toward sidebar nav targets. |
| useSSE           | `src/hooks/useSSE.ts`             | Server-Sent Events subscription for real-time updates. |

---

## Content / Data Files

| File                              | Description                                            |
|-----------------------------------|--------------------------------------------------------|
| `src/content/courses.ts`          | Course definitions with questions, options, explanations for Learn module. |
| `src/content/kitz-manifest.ts`    | KITZ agent manifest: capabilities, endpoints, governance rules, agent teams (18 teams, 106+ agents). |
| `src/lib/constants.ts`            | API endpoint constants.                                |
| `src/lib/api.ts`                  | `apiFetch()` wrapper with auth headers.                |
| `src/lib/i18n.ts`                 | Internationalization utilities.                        |
| `src/lib/utils.ts`               | `cn()` helper (clsx + tailwind-merge).                 |
| `src/lib/agentScenarios.ts`      | Scenario data for agent simulation.                    |

---

## What's Missing (Gap Analysis)

### Design Foundation

| Gap                       | Impact | Details                                                      |
|---------------------------|--------|--------------------------------------------------------------|
| No design tokens          | HIGH   | No systematic spacing scale, type scale, color tokens, radius tokens, or shadow tokens. Every value is ad-hoc (`px-4`, `text-sm`, `rounded-2xl`). Inconsistency across pages is inevitable. |
| No typography scale       | HIGH   | 13+ different text sizes used including arbitrary values (`text-[5px]` through `text-[11px]`). No heading hierarchy defined. No prose/body text scale. |
| No spacing system         | HIGH   | Padding and margins vary per component. No t-shirt sizing or 4px/8px base grid enforced. |
| No color tokens           | MEDIUM | Colors are Tailwind defaults used directly. Chat panel and game use raw hex values. No semantic color mapping (e.g., `--color-surface`, `--color-on-surface`). |

### Component Library

| Gap                           | Impact | Details                                                  |
|-------------------------------|--------|----------------------------------------------------------|
| No Button component           | HIGH   | Buttons are inline `<button>` elements with ad-hoc Tailwind classes. At least 6 different button styles exist (primary purple, outline, ghost, danger red, game retro, icon-only). No size variants, no loading state, no disabled styling consistency. |
| No Input component            | HIGH   | Text inputs are inline `<input>` with repeated `rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-purple-500`. Copy-pasted across SettingsPage, CrmTab, workspace tabs. |
| No Select component           | MEDIUM | Native `<select>` elements used in SettingsPage. No styled dropdown. |
| No Card component             | HIGH   | Cards are `<div>` with repeated patterns like `rounded-2xl border border-gray-200 bg-white p-5`. Used 30+ times across pages with slight variations. |
| No Table component            | MEDIUM | Audit trail in ActivityPage uses manual `<div>` rows. No proper `<table>` with sort, filter, or pagination. |
| No Modal/Dialog component     | MEDIUM | TalkToKitzModal is a one-off implementation. No reusable modal with backdrop, close, animation, focus trap. |
| No Tooltip component          | LOW    | Only one `title` attribute used (WhatsApp echo toggle). No tooltip UI. |
| No Popover/Dropdown component | MEDIUM | No dropdown menus exist. Stage change in PipelineView uses a native `<select>`. |
| No Tabs component             | MEDIUM | WorkspaceTabs is a one-off. Tab pattern is also used in ChatPanel (Details/Preview toggle), AgentsPage (Customer Teams/All Teams), and ActivityTab (filter chips). Each is built differently. |
| No Badge/Tag component        | LOW    | Tags/badges are inline spans with varying styles. Used in CRM tags, SOP triggers, agent counts, pipeline stages. |

### UX Patterns

| Gap                             | Impact | Details                                                |
|---------------------------------|--------|--------------------------------------------------------|
| No form validation              | HIGH   | CRM add-lead form, Settings inputs, checkout link creation -- none have validation, error messages, or required field indicators. |
| No empty states                 | HIGH   | Orders, tasks, checkout links, messages, calendar tabs have no empty state design when data is absent. Just blank space. |
| No loading states/skeletons     | HIGH   | Only loading indicator is a plain `<p>Loading...</p>` in the Suspense fallback. No skeleton screens, no shimmer placeholders, no inline loading spinners (except the swarm simulation button). |
| No error state patterns         | MEDIUM | ErrorBoundary catches React crashes. No inline error states for failed API calls, network errors, or form submission failures. workspaceStore silently catches API errors. |
| No pagination                   | MEDIUM | Lead list, activity feed, order list -- all render full arrays. No pagination, infinite scroll, or virtual list. |
| No breadcrumbs                  | LOW    | Only the Learn page has a "Back to courses" text button. No breadcrumb navigation anywhere. |
| No confirmation dialogs         | MEDIUM | Delete account, delete lead, delete product -- no confirmation step. Destructive actions execute immediately. |
| No search                       | LOW    | CRM has a search input but no global search. No command palette. |

### Responsive & Accessibility

| Gap                              | Impact | Details                                               |
|----------------------------------|--------|-------------------------------------------------------|
| No mobile layout                 | HIGH   | Sidebar (224px) is always visible. On mobile, the sidebar alone consumes most of the viewport. Chat panel is hidden but sidebar is not collapsible. No hamburger menu. |
| No dark mode                     | LOW    | Only the chat panel and game UI use dark backgrounds. Main content is white-only. No system preference detection. |
| No accessibility audit           | HIGH   | Some `aria-` attributes exist (tab roles, aria-selected, aria-label on suggestion chips, role="switch" on toggles). But: no skip-to-content link, no focus ring styling, no keyboard navigation for pipeline drag, no screen reader announcements for toasts, no ARIA live regions for chat messages. |
| No focus ring system             | MEDIUM | Focus styles are inconsistent. Some inputs have `focus:border-purple-500`, most buttons have no visible focus indicator. Tailwind's default `outline` is likely suppressed by `outline-none` used on inputs. |

### Animation & Motion

| Gap                              | Impact | Details                                               |
|----------------------------------|--------|-------------------------------------------------------|
| No motion system                 | LOW    | 16 keyframe animations defined ad-hoc in CSS. No motion tokens (duration, easing), no reduced-motion media query support, no animation utilities. |
| No transition tokens             | LOW    | Transitions are inline (`transition-all duration-300`, `transition-colors`). No standard durations or easings. |

### Icon System

| Gap                              | Impact | Details                                               |
|----------------------------------|--------|-------------------------------------------------------|
| No icon wrapper                  | LOW    | Lucide icons used directly with varying sizes: `h-3 w-3`, `h-3.5 w-3.5`, `h-4 w-4`, `h-5 w-5`. No consistent size scale. No color system for icons (usually `text-purple-500`, `text-gray-400`, or `text-white/50`). |

---

## Summary Statistics

| Metric                    | Count  |
|---------------------------|--------|
| Pages                     | 12     |
| Component files           | 53     |
| Zustand stores            | 11     |
| Custom hooks              | 3      |
| CSS keyframe animations   | 16     |
| Total component lines     | ~6,000 |
| Total store lines         | ~935   |
| Lucide icons imported     | 40+    |
| Tailwind arbitrary values | 15+    |
| Unique text sizes used    | 13+    |

---

## File Tree Reference

```
src/
  App.tsx
  main.tsx
  index.css
  components/
    activity/
      ActivityEntry.tsx
      ActivityFeed.tsx
      ActivityTab.tsx
    auth/
      ProtectedRoute.tsx
    autopilot/
      AgentStatusCard.tsx
      AutoPilotTab.tsx
      DraftQueue.tsx
    chat/
      AgentThinkingBlock.tsx
      AgentThinkingStep.tsx
      MessageBubble.tsx
      TypingIndicator.tsx
    crm/
      ContactDetail.tsx
      CrmTab.tsx
      PipelineView.tsx
    home/
      AgentDiscoveryBanner.tsx
      AgentDocsSection.tsx
      FeatureCard.tsx
      MissionBlock.tsx
      PageHeader.tsx
    layout/
      ChatPanel.tsx
      DashboardLayout.tsx
      StatusBanner.tsx
      TopNavBar.tsx
    learn/
      ModuleSelect.tsx
      QuestionCard.tsx
    orb/
      FloatingOrb.tsx
      Orb.tsx
    talk/
      TalkToKitzModal.tsx
    ui/
      ErrorBoundary.tsx
      ToastContainer.tsx
    whatsapp/
      QRScanner.tsx
    workspace/
      CalendarTab.tsx
      CheckoutTab.tsx
      InventoryTab.tsx
      LeadsTab.tsx
      MessagesTab.tsx
      OrdersTab.tsx
      PaymentsTab.tsx
      TasksTab.tsx
      WorkspaceTabs.tsx
  content/
    courses.ts
    kitz-manifest.ts
  game/
    KitzGame.tsx
    GameManager.ts
    constants.ts
    engine/
      Camera.ts
      Canvas.ts
      Collision.ts
      GameLoop.ts
      Input.ts
    entities/
      Enemy.ts
      Player.ts
    levels/
      LevelData.ts
      World1.ts - World5.ts
    sprites/
      EnemySprites.ts
      KitzSprite.ts
    systems/
      AuraRenderer.ts
    ui/
      GameOverScreen.tsx
      GameTypeSelect.tsx
      HUD.tsx
      Leaderboard.tsx
      LevelCompleteScreen.tsx
      LevelSelect.tsx
      QuizOverlay.tsx
      TouchControls.tsx
      TycoonGame.tsx
  hooks/
    useKitzVoice.ts
    useOrbNavigator.ts
    useSSE.ts
  lib/
    agentScenarios.ts
    api.ts
    constants.ts
    i18n.ts
    utils.ts
  pages/
    ActivityPage.tsx
    AgentsPage.tsx
    AutomationsPage.tsx
    DashboardPage.tsx
    GamePage.tsx
    HomePage.tsx
    HowItWorksPage.tsx
    LearnPage.tsx
    LoginPage.tsx
    SettingsPage.tsx
    WhatsAppPage.tsx
    WorkspacePage.tsx
  stores/
    activityStore.ts
    agentStore.ts
    agentThinkingStore.ts
    authStore.ts
    gameStore.ts
    orbStore.ts
    settingsStore.ts
    simulationStore.ts
    statusStore.ts
    toastStore.ts
    workspaceStore.ts
  types/
    activity.ts
```
