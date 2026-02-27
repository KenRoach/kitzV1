# Enterprise Patterns & Design Systems Intelligence

**Platform:** Kitz -- AI-native business operating system for LatAm small businesses
**Stack:** React 19, Tailwind CSS v4, TypeScript, Fastify microservices, Supabase
**Audience:** Kitz engineering and product team
**Last updated:** 2026-02-24

---

## Purpose

This document synthesizes enterprise-grade patterns from industry leaders and applies them concretely to Kitz. Each section identifies what to learn, how it maps to the platform's current state, and what to do next. The goal is to give the team a practical reference for leveling up platform quality across design systems, product UX, analytics, and security -- without over-engineering for a team and product at this stage.

---

## Table of Contents

1. [IBM Enterprise Patterns](#1-ibm-enterprise-patterns)
2. [Product & UX Design Taste](#2-product--ux-design-taste)
3. [Data, Analytics & BI](#3-data-analytics--bi)
4. [Security & Governance](#4-security--governance)
5. [Summary & Roadmaps](#5-summary--roadmaps)

---

## 1. IBM Enterprise Patterns

### 1.1 Carbon Design System

Carbon is IBM's open-source design system. It is one of the most mature enterprise design systems in production, with a token architecture, accessibility framework, and component composition model that Kitz can learn from directly.

#### What to Learn

**Token Architecture**

Carbon structures its design tokens in three tiers:

| Tier | Carbon Approach | Kitz Current State |
|------|----------------|--------------------|
| **Global tokens** | Primitive values (e.g., `$blue-60: #0f62fe`). These are raw palette values that are never used directly in components. | Kitz defines color values directly in the `@theme` block (e.g., `--color-purple-500: #a855f7`). These are used directly by components via Tailwind utilities. No separation between primitive and semantic layers. |
| **Alias tokens** | Semantic mappings (e.g., `$interactive-01: $blue-60`, `$text-primary: $gray-100`). These encode meaning -- "interactive" rather than "blue." Components reference alias tokens, not global tokens. | Kitz has a partial semantic layer for surfaces (`--color-surface-primary`, `--color-surface-dark`) and status colors (`--color-success`, `--color-error`), but most components still reference raw palette values like `bg-purple-500` rather than semantic tokens like `bg-interactive` or `bg-brand-primary`. |
| **Component tokens** | Per-component overrides (e.g., `$button-primary-background: $interactive-01`). These allow fine-grained theming at the component level. | Kitz has no component-level tokens. Button styles are defined inline via Tailwind class strings. |

**Why the three-tier model matters for Kitz:**
- Kitz will need dark mode for the chat panel to coexist with light mode for the main content. A semantic token layer makes this a theme swap rather than a rewrite.
- LatAm markets include users on low-contrast screens and in bright outdoor environments. Semantic tokens allow high-contrast theme variants without touching component code.
- The current approach (direct palette references) creates a coupling between component styling and specific color values. When brand colors evolve, every component needs manual updates.

**Application to Kitz:**

Introduce a two-tier token system (skip component-level tokens for now -- that is enterprise overhead Kitz does not need yet):

```css
/* Tier 1: Primitives (already exist in @theme) */
@theme {
  --color-purple-500: #a855f7;
  --color-purple-600: #9333ea;
  /* ... */
}

/* Tier 2: Semantic aliases (add these) */
@theme {
  --color-brand-primary: var(--color-purple-500);
  --color-brand-primary-hover: var(--color-purple-600);
  --color-brand-primary-active: var(--color-purple-700);
  --color-interactive: var(--color-purple-500);
  --color-interactive-hover: var(--color-purple-600);
  --color-text-primary: var(--color-gray-900);
  --color-text-secondary: var(--color-gray-500);
  --color-text-on-color: #ffffff;
  --color-border-default: var(--color-gray-200);
  --color-border-strong: var(--color-gray-300);
  --color-focus: var(--color-purple-500);
}
```

**Priority:** Next Quarter

The current DESIGN_SYSTEM.md already defines the primitive tokens. Adding semantic aliases is a non-breaking additive change that can happen after the P0 backlog items are complete.

**Action Items:**
1. After P0-01 (design tokens) is shipped, extend `src/index.css` with a semantic alias layer mapping primitives to roles.
2. Create a Tailwind v4 convention: new components use semantic tokens (`bg-brand-primary`) rather than raw palette (`bg-purple-500`). Existing components migrate gradually.
3. Document the naming convention in DESIGN_SYSTEM.md: `--color-{category}-{role}` where category is `brand`, `text`, `border`, `surface`, `interactive`, `status`.

---

**Component Composition Patterns**

Carbon components follow a strict composition model:

| Carbon Pattern | Description | Kitz Application |
|---------------|-------------|------------------|
| **Slot-based composition** | Components expose named slots (`renderIcon`, `renderLabel`) rather than accepting pre-built JSX children. This keeps component internals under control. | Kitz's DESIGN_SYSTEM.md already defines `iconLeft`, `iconRight` slots on Button and Input. Maintain this pattern. Avoid adding arbitrary `children` to low-level primitives where slots are sufficient. |
| **Controlled + uncontrolled** | All stateful components (Select, Accordion, Tabs) work in both controlled (`value` + `onChange`) and uncontrolled (internal state) modes. | Kitz's TabsProps only supports controlled mode (`activeKey` + `onChange`). This is fine for now. Add uncontrolled mode later if component reuse grows. |
| **Size consistency** | All components share the same size scale (`sm`, `md`, `lg`). A `sm` button and `sm` input have the same height. | Kitz's DESIGN_SYSTEM.md already enforces this: `sm` = 32px, `md` = 40px, `lg` = 48px across Button, Input, Select. Enforce this as components are built. |
| **Composition over configuration** | Complex components (DataTable, Modal) are composed from sub-components (`Modal.Header`, `Modal.Body`, `Modal.Footer`) rather than configured via a single monolithic props object. | Kitz's DESIGN_SYSTEM.md defines `CardHeader`, `CardBody`, `CardFooter` sub-components. Apply this pattern to Modal, Table, and future complex components. |

**Priority:** Now (enforce during P0 implementation)

**Action Items:**
1. Enforce the slot pattern (`iconLeft`, `iconRight`) over arbitrary `children` for primitive components.
2. Use sub-component composition for Card, Modal, and Table as defined in DESIGN_SYSTEM.md.
3. Validate that all components sharing a size scale produce the same height at each size tier.

---

**Accessibility Standards and Testing**

Carbon meets WCAG 2.1 AA as a baseline and targets AAA where feasible. Their approach:

| Carbon Practice | Kitz Current State | Gap |
|----------------|-------------------|-----|
| Every component ships with keyboard navigation, ARIA attributes, and screen reader announcements documented and tested. | Kitz has some ARIA attributes (`role="tab"`, `aria-selected`, `role="switch"`) but no systematic coverage. No skip-to-content link. No focus ring system. No ARIA live regions for toasts or chat. | HIGH |
| Automated accessibility testing with `@axe-core/react` in development and `cypress-axe` in CI. | No accessibility testing of any kind. All test files are placeholder stubs. | HIGH |
| Contrast checked at the token level: any token combination used for text-on-background is pre-validated. | Kitz's DESIGN_SYSTEM.md notes that `purple-500` on white fails AA for small text (3.4:1 ratio). The recommendation to use `purple-600` for text exists but is not enforced. | MEDIUM |
| `prefers-reduced-motion` support is built into the component library, not applied per-page. | Kitz defines 16 keyframe animations. None check `prefers-reduced-motion`. | MEDIUM |

**Application to Kitz:**

The UX_RUBRIC.md already documents comprehensive accessibility requirements (Section 7). The gap is implementation, not specification.

**Priority:** Now (begin during P0 component builds)

**Action Items:**
1. Add `@axe-core/react` to `devDependencies` in `ui/package.json`. Configure it to run in development mode. This catches 30-40% of accessibility violations automatically.
2. Every P0 component (Button, Input, Select, Card, Modal, Table) must ship with:
   - Visible focus ring (`focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2`)
   - Keyboard operability (Enter/Space for buttons, Escape for modals/dropdowns, Arrow keys for menus)
   - Appropriate ARIA attributes (documented in the component's JSDoc)
3. Add a global `prefers-reduced-motion` handler in `src/index.css`:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
4. Add a skip-to-content link as the first focusable element in `DashboardLayout.tsx`.
5. Add `aria-live="polite"` to the `ToastContainer` component.

---

**Responsive Design Patterns**

Carbon uses a 2x grid system with breakpoints at `sm` (320px), `md` (672px), `lg` (1056px), `xlg` (1312px), `max` (1584px). Components adapt using grid column spans rather than custom media queries.

| Carbon Pattern | Kitz Current State | Recommendation |
|---------------|-------------------|----------------|
| Grid system with column-based responsive layouts | Kitz uses Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) applied ad-hoc per component. No grid system. | Adopt Tailwind's CSS Grid utilities with consistent column counts: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`. Document standard grid patterns in DESIGN_SYSTEM.md. |
| Sidebar collapses at tablet; becomes overlay at mobile | Sidebar is always visible at 224px. No collapse, no hamburger. On mobile, the sidebar consumes most of the viewport. | Implement sidebar collapse (P0 priority per UI_INVENTORY gap analysis). At `< 768px`: hidden with hamburger trigger. At `768px-1279px`: collapsed to 64px icons-only. At `>= 1280px`: full 240px. |
| Content max-width constraints | Content uses `max-w-6xl` (1152px) on most pages, `max-w-5xl` (1024px) on Home, `max-w-3xl` (768px) on Settings. Inconsistent. | Standardize on `max-w-5xl` (1280px per UX_RUBRIC Section 3.2) for all main content areas. Settings content: `max-w-2xl` (per DESIGN_SYSTEM.md Settings layout). |

**Priority:** Now (sidebar collapse is a P0 blocker for mobile)

**Action Items:**
1. Implement responsive sidebar: hamburger at mobile, collapsed at tablet, expanded at desktop.
2. Standardize `max-w-5xl mx-auto` as the default content constraint.
3. Document the responsive breakpoint strategy in DESIGN_SYSTEM.md: what changes at each breakpoint.

---

**Theme Support and Customization**

Carbon supports light, dark, and high-contrast themes via CSS custom property swaps. The same component renders differently based on the active theme class on a parent element.

| Carbon Approach | Kitz Relevance |
|----------------|---------------|
| Theme applied via CSS class on a wrapper: `<div class="cds--g100">` (dark theme) | Kitz already has two visual zones: light main content and dark chat panel. The chat panel uses hardcoded hex values (`#0a0a1a`, `#1a0a2e`, etc.). These should become `--color-surface-dark-*` tokens. |
| Components are theme-agnostic: they reference semantic tokens that resolve differently per theme | When Kitz adds dark mode (LOW priority per UI_INVENTORY), the semantic token layer will make this possible without rewriting components. |
| Per-zone theming: different sections of the same page can use different themes | This is exactly what Kitz needs: light theme for workspace, dark theme for chat panel. Carbon's approach of scoping theme via CSS class on a container is the right model. |

**Priority:** Future (after semantic tokens are in place)

**Action Items:**
1. Replace hardcoded hex values in ChatPanel with `--color-surface-dark-*` tokens.
2. When dark mode is prioritized, implement it as a CSS class swap on the root element that redefines semantic token values.

---

### 1.2 IBM Documentation Hub Patterns

IBM structures developer documentation with a consistent pattern: overview page, quickstart guide, API reference, tutorials, and code samples. Each follows a predictable layout.

#### What to Learn

| Pattern | Description | Application to Kitz |
|---------|-------------|---------------------|
| **Overview + Quickstart** | Every service has a 2-minute overview and a 5-minute quickstart. The quickstart ends with a working example. | Kitz has 13+ microservices documented in CLAUDE.md. Each service needs a standalone overview page and a quickstart that matches the "<10 minutes to first value" activation target. |
| **API reference as structured data** | API endpoints documented with request/response schemas, error codes, and code samples in multiple languages. Generated from OpenAPI specs. | Kitz services use Fastify which supports auto-generated OpenAPI schemas. Add `@fastify/swagger` to gateway and workspace services. Generate API docs from the schemas. |
| **Layered documentation** | Three layers: conceptual (why), task-based (how), and reference (what). Users choose their entry point based on need. | Kitz documentation is currently a single monolith (CLAUDE.md). Split into: architecture overview (conceptual), runbooks (task-based), and API reference (reference). |

**Priority:** Next Quarter

**Action Items:**
1. Add `@fastify/swagger` and `@fastify/swagger-ui` to `kitz-gateway` and `workspace` services. Auto-generate OpenAPI specs.
2. Create a `/docs` route on the gateway that serves Swagger UI.
3. Restructure `kitz-docs/` into three directories: `concepts/`, `guides/`, `reference/`.

---

### 1.3 IBM Cloud API Patterns

#### What to Learn

| Pattern | Description | Application to Kitz |
|---------|-------------|---------------------|
| **Consistent error response shape** | Every IBM API returns `{ "errors": [{ "code": "string", "message": "string", "more_info": "url" }], "trace": "string" }`. Client code can handle errors uniformly. | Kitz services return ad-hoc error shapes. Some return `{ error: "string" }`, some return raw HTTP status codes. Standardize on a single error envelope in `kitz-schemas/src/contracts.ts`. |
| **Rate limiting headers** | Every response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`. Clients can self-throttle. | `kitz-gateway` has rate limiting (120 req/min) but does not expose rate limit headers. Add them. |
| **Pagination via cursor** | Large collections use cursor-based pagination (`?start=<cursor>&limit=50`) rather than offset-based. Cursor-based pagination performs better at scale and handles real-time insertions. | Kitz has no pagination anywhere (noted as a HIGH gap in UI_INVENTORY). Start with cursor-based pagination on the workspace API endpoints (leads, orders, payments). |
| **Request tracing** | Every request gets a trace ID (`X-Request-Id`) that flows through all downstream services. | Kitz has `traceId` propagation via `EventEnvelope`, but UI does not pass or receive trace IDs. Add `X-Request-Id` header to `apiFetch()` in `src/lib/api.ts`. |

**Priority:** Now (error shape standardization), Next Quarter (pagination, rate limit headers)

**Action Items:**
1. Define a `KitzErrorResponse` type in `kitz-schemas/src/contracts.ts`:
   ```typescript
   interface KitzErrorResponse {
     errors: Array<{
       code: string;      // e.g., "VALIDATION_ERROR", "NOT_FOUND", "RATE_LIMITED"
       message: string;   // Human-readable, display-safe
       field?: string;    // For validation errors, the field that failed
     }>;
     traceId: string;
   }
   ```
2. Update all Fastify error handlers to return this shape.
3. Update `apiFetch()` to generate and attach `X-Request-Id` headers.
4. Implement cursor-based pagination for workspace collection endpoints.

---

### 1.4 watsonx.ai API Patterns (AI API Design)

#### What to Learn

| Pattern | Description | Application to Kitz |
|---------|-------------|---------------------|
| **Streaming responses** | AI endpoints support both synchronous (`POST /generate`) and streaming (`POST /generate_stream`) modes. Streaming returns Server-Sent Events with incremental tokens. | Kitz's chat panel uses `orbStore.sendMessage()` which awaits a full response. Implement SSE streaming for AI responses to reduce perceived latency. The `useSSE` hook already exists. |
| **Model management** | Explicit model selection per request. Model metadata (capabilities, costs, context window) is queryable via API. | Kitz's LLM tier routing (Opus/Sonnet/Haiku) is hardcoded in `claudeClient.ts`. Expose model metadata via `kitz-llm-hub` so the UI can display which model is processing a request. |
| **Usage tracking** | Every AI response includes `usage: { input_tokens, output_tokens }` and the billing unit consumed. | Kitz tracks AI Battery credits but does not surface per-request cost to the user. Add usage data to AI response payloads and display it in the chat panel. |
| **Prompt versioning** | Prompts are versioned artifacts with IDs, not inline strings. Changes to prompts are tracked. | Kitz's semantic router embeds prompts inline. For the 5-phase semantic router, extract prompts into versioned constants or a separate prompt registry. This enables A/B testing and audit trails. |

**Priority:** Now (streaming), Next Quarter (prompt versioning, usage display)

**Action Items:**
1. Implement SSE streaming for the chat AI response path: `kitz_os` streams tokens to the gateway, gateway streams to the UI via SSE.
2. Add `usage` metadata (tokens consumed, credit cost) to AI response payloads.
3. Display per-message credit cost in `MessageBubble` or as a tooltip.
4. Extract semantic router prompts into a versioned registry in `kitz_os/src/prompts/`.

---

### 1.5 Watson Assistant API Patterns (Conversational AI)

#### What to Learn

| Pattern | Description | Application to Kitz |
|---------|-------------|---------------------|
| **Session management** | Conversations have explicit sessions with TTL. Context is scoped to sessions, not global. | Kitz's `orbStore` maintains a flat message array with no session concept. Add session IDs to conversation state so context can be scoped, persisted, and resumed. |
| **Intent + entity extraction** | Structured output from every user message: `{ intent, confidence, entities[] }`. This is exposed in debug mode for transparency. | Kitz's READ and COMPREHEND phases (semantic router) extract intent and entities but do not expose them to the UI. Surface this in the `AgentThinkingBlock` for transparency. |
| **Disambiguation** | When confidence is low, the system asks for clarification rather than guessing. Presents 2-3 options. | Kitz should implement a disambiguation step in the COMPREHEND phase: if intent confidence < 0.7, present the top 2-3 interpretations as suggestion chips in the chat panel. |
| **Draft-first with preview** | Outbound messages are previewed before sending. The user can edit, approve, or reject. | Kitz already has draft-first architecture. The `DraftQueue` component exists. Ensure all AI-generated outbound content (WhatsApp messages, emails, invoices) routes through the draft queue with a rich preview. |

**Priority:** Next Quarter

**Action Items:**
1. Add a `sessionId` field to `orbStore` state. Generate a new session ID on login and after 30 minutes of inactivity.
2. Surface intent and entity data from the semantic router in the `AgentThinkingStep` component.
3. Implement a disambiguation chip pattern: when confidence < 0.7, render 2-3 interpretation options as clickable suggestion chips.

---

## 2. Product & UX Design Taste

### 2.1 Stripe

Stripe is the gold standard for developer-facing product design. Their patterns are directly relevant to Kitz's workspace and documentation surfaces.

#### What to Learn

**Documentation UX**

| Pattern | Description | Application to Kitz |
|---------|-------------|---------------------|
| **Left nav + content + code panel** | Stripe docs use a three-panel layout: left navigation tree, center prose, right code samples. Code and prose are scroll-synced. | Kitz's architecture docs are markdown files with no interactive code. For the API reference, adopt a two-panel layout: left nav + content with inline code blocks. Skip the right panel (Kitz is not a developer platform with SDK samples yet). |
| **Copyable code blocks** | Every code block has a one-click copy button. Terminal commands include `$` prefix but exclude it from the clipboard. | Add a `CodeBlock` component with a copy button. Use it in the AgentDocsSection and any API reference pages. |
| **Progressive disclosure** | Docs show the simplest case first. Advanced configuration is in collapsible sections. | Apply to Kitz's HowItWorksPage: show the 4-step flow as the default. Put architecture details, agent org chart, and governance in expandable sections. |

**Payment Flow Design**

| Pattern | Description | Application to Kitz |
|---------|-------------|---------------------|
| **Multi-step checkout with progress** | Stripe Checkout uses a linear flow: customer info, payment method, review, confirm. Each step validates before progressing. A progress indicator shows the current step. | Kitz's CheckoutTab creates payment links but has no multi-step flow for the end-customer experience. When building the customer-facing checkout, follow Stripe's pattern: linear steps, inline validation, progress indicator. |
| **Inline error recovery** | Payment errors show specific messages at the field level ("Your card number is incorrect") with retry without re-entering all fields. | Kitz has no form validation (HIGH gap). When implementing forms, follow Stripe's pattern: validate on blur, show errors at field level, preserve valid fields on submission failure. |
| **Optimistic UI with rollback** | Stripe's dashboard uses optimistic updates: the UI reflects the action immediately, then reconciles with the server. If the server rejects, the UI rolls back and shows an error. | Kitz's `workspaceStore` already uses optimistic local state with async API sync. Formalize this: every store action should (1) update local state optimistically, (2) fire the API call, (3) on failure, rollback local state and show a toast. |

**Form Design**

| Pattern | Description | Application to Kitz |
|---------|-------------|---------------------|
| **Smart defaults** | Forms pre-fill with sensible defaults (country from IP, currency from locale). | Kitz targets LatAm. Pre-fill currency to the user's locale currency (MXN, COP, PEN, etc.) and date format to DD/MM/YYYY. Use the `navigator.language` API. |
| **Inline formatting** | Currency fields auto-format with thousands separators. Phone fields auto-format with country code. | Apply to all monetary inputs in the workspace (orders, payments, checkout links). Use `Intl.NumberFormat` for locale-aware formatting. |
| **Contextual help** | Form fields have `(?)` icons that expand into contextual help without leaving the form. | Kitz's DESIGN_SYSTEM.md defines `helpText` below inputs. For complex fields (tax ID, payment terms), add an expandable help tooltip triggered by a `(?)` icon. |

**Priority:** Now (form validation, optimistic UI formalization), Next Quarter (documentation UX, checkout flow)

**Action Items:**
1. Implement form validation pattern: validate on blur, field-level errors, preserve valid fields. Start with the CRM add-lead form.
2. Formalize the optimistic update pattern in `workspaceStore`: add rollback on API failure.
3. Add locale-aware currency formatting to all monetary displays using `Intl.NumberFormat`.
4. Build a `CodeBlock` component with copy-to-clipboard for documentation pages.

---

### 2.2 Linear

Linear defines the standard for speed-as-a-feature in SaaS products. Its keyboard-first interaction model and minimal aesthetic are directly applicable to Kitz.

#### What to Learn

| Pattern | Description | Application to Kitz |
|---------|-------------|---------------------|
| **Command palette (Cmd+K)** | Every action is accessible via a command palette. Users type natural language or slash commands to navigate, create, search, and execute. | Kitz has no global search or command palette (LOW gap per UI_INVENTORY, but HIGH value). Implement a command palette using `cmdk` library. Priority actions: navigate to any page, create lead/order/task, search CRM, toggle settings. |
| **Keyboard shortcuts** | Single-key shortcuts for common actions: `C` to create, `E` to edit, `D` to delete, `?` to show shortcut reference. | Add keyboard shortcuts for top actions. Start with: `/` to focus chat input, `N` to create new item (context-aware), `Esc` to close modals/panels, `1-7` to navigate sidebar items. |
| **Speed as a feature** | Linear achieves <100ms interaction latency. Techniques: local-first data, optimistic updates, prefetching, request deduplication. | Kitz's workspace already uses local-first state (Zustand stores with mock data). Measure and track interaction latency. Target: <200ms for any UI response. Add `performance.mark()` instrumentation to key flows. |
| **Minimal chrome** | Linear uses minimal borders, shadows, and visual noise. Content density is high; decorative elements are near zero. | Kitz uses `border border-gray-200` on most cards and `rounded-2xl` (16px radius). Consider reducing to `rounded-lg` (12px per DESIGN_SYSTEM.md) and using subtle borders (`border-gray-100`) for secondary containers. The DESIGN_SYSTEM.md already specifies this -- enforce it. |
| **Contextual right panel** | Clicking an item in a list opens a detail panel on the right, without navigating away. The list stays visible. | Kitz's app shell already has a right panel slot (400px, optional). Use it for lead detail, order detail, and task detail views. When a list row is clicked, render the detail in the right panel. |
| **Instant transitions** | Page transitions are imperceptible. No loading screens for navigation between cached views. | Kitz uses React Router with `lazy()` for code splitting. Add `<link rel="prefetch">` hints for likely next pages. Cache workspace data aggressively in Zustand stores. |

**Priority:** Now (keyboard shortcuts, contextual right panel), Next Quarter (command palette)

**Action Items:**
1. Add keyboard shortcut handler: register global `keydown` listener in `DashboardPage`. Start with `/` (focus chat), `Esc` (close modal/panel), `N` (new item).
2. Implement detail panel pattern: clicking a CRM lead, order, or task opens its detail in the right panel. `ContactDetail.tsx` already exists; wire it to the right panel slot.
3. Add `cmdk` to dependencies and build a command palette component. Wire it to `Cmd+K` / `Ctrl+K`.
4. Add `performance.mark()` / `performance.measure()` to key interaction paths (lead creation, message send, page navigation).

---

### 2.3 Notion

Notion's block-based architecture and flexible permission model offer patterns for Kitz's content creation and team collaboration features.

#### What to Learn

| Pattern | Description | Application to Kitz |
|---------|-------------|---------------------|
| **Block-based content** | Everything is a block: text, image, table, embed, toggle. Blocks are composable and reorderable. | Kitz's content creation feature (2026-02-24-content-creation-design.md) should adopt block-based editing for marketing content. Use a library like `tiptap` or `blocknote` rather than building from scratch. |
| **Slash command menu** | Typing `/` in a content area opens a contextual menu of insertable block types. | Apply to the chat input in ChatPanel: typing `/` shows available commands (create lead, check orders, run report, etc.). This aligns with the existing `kitz_os` tool registry concept. |
| **Flexible layouts** | Content can be arranged in columns, grids, and nested structures without code. | For Kitz's dashboard, allow users to rearrange KPI cards and activity feed sections. Start simple: a fixed grid with the option to show/hide individual cards. |
| **Workspace permissions** | Three-tier permission model: workspace (org), page (resource), and block (field) level. Roles: admin, editor, viewer, commenter. | Kitz's RBAC is defined at the gateway level (`x-scopes` header). Extend to the UI: show/hide/disable UI elements based on the user's role. The UX_RUBRIC (Section 9.6) already specifies this. Implement it. |
| **Undo/redo** | Every action is undoable via Cmd+Z. Changes are tracked as a stack of operations. | For the workspace (CRM edits, order updates, task changes), implement a simple undo stack in the Zustand stores. Push previous state on each mutation, pop on undo. |

**Priority:** Next Quarter (slash commands in chat, permissions UI), Future (block-based content, undo/redo)

**Action Items:**
1. Implement `/` command menu in ChatPanel: when the user types `/`, show a filterable list of available commands mapped to `kitz_os` tools.
2. Add role-based UI gating: create a `usePermission(action: string)` hook that checks the user's scopes from `authStore`. Use it to conditionally render/disable destructive actions.
3. Evaluate `tiptap` and `blocknote` for the content creation module.

---

### 2.4 Apple Human Interface Guidelines (HIG)

Apple's HIG defines design principles that apply universally. The most relevant for Kitz:

#### What to Learn

| Principle | HIG Description | Application to Kitz |
|-----------|----------------|---------------------|
| **Direct Manipulation** | Users should feel they are directly interacting with their data, not issuing commands through an intermediary. | Kitz's CRM pipeline (PipelineView) should support drag-and-drop to move leads between stages. Currently, stage changes use a native `<select>` dropdown. Replace with drag-and-drop using `@dnd-kit/core`. |
| **Feedback** | Every action must produce an immediate, visible response. The system should never leave the user wondering "did that work?" | Kitz has toast notifications but many actions have no feedback (noted as HIGH gap). Enforce the rule: every create/update/delete action produces a specific toast ("Lead 'Acme Corp' created successfully"). |
| **Consistency** | Similar operations should work the same way everywhere. Terminology, layout, and interaction patterns should be uniform. | Kitz uses inconsistent terminology (noted in UX_RUBRIC Section 10.6). Define a glossary: Lead (not Contact, Customer, or Prospect), Order (not Sale or Transaction), Task (not To-do or Action Item). Enforce it across all pages. |
| **Perceived Stability** | Interfaces should feel grounded. Elements should not shift position unexpectedly. Loading content should not reflow the page. | Kitz has no skeleton loading states (HIGH gap). Skeleton placeholders that match the final layout prevent layout shift and create perceived stability. Implement skeletons for every async content area per DESIGN_SYSTEM.md Skeleton spec. |
| **Aesthetic Integrity** | Visual design should match the seriousness of the task. A financial tool should feel precise and trustworthy, not playful. | Kitz balances "Gen Z clarity" brand energy with financial data (invoices, payments, revenue). Ensure financial surfaces (payments, invoices, AI Battery credits) use tabular-lining numerals (`font-variant-numeric: tabular-nums`), precise decimal formatting, and subdued colors. The game UI can be playful; the workspace must be trustworthy. |

**Priority:** Now (feedback, consistency, skeletons), Next Quarter (drag-and-drop, aesthetic integrity audit)

**Action Items:**
1. Create a terminology glossary and add it to DESIGN_SYSTEM.md. Audit all pages for term consistency.
2. Add skeleton states to every data-dependent surface (dashboard KPIs, CRM list, orders, activity feed).
3. Add `font-variant-numeric: tabular-nums` to all numerical displays (KPI cards, payment amounts, invoice totals).
4. Implement drag-and-drop for PipelineView using `@dnd-kit/core`.

---

### 2.5 Awwwards Trends (Current Web Design Patterns)

Current web design trends relevant to a B2B SaaS platform targeting LatAm SMBs:

#### What to Learn

| Trend | Description | Application to Kitz | Adopt? |
|-------|-------------|---------------------|--------|
| **Bento grid layouts** | Dashboard cards arranged in a bento box pattern with varying sizes. Larger cards for primary metrics, smaller cards for secondary. | The KPI header could use a bento layout: revenue card takes 2 columns, other metrics take 1 each. Creates visual hierarchy. | Yes -- for dashboard only |
| **Glassmorphism** | Frosted glass effect with backdrop blur and transparency. | Overused and harms readability on low-quality screens common in LatAm markets. | No |
| **Micro-interactions** | Subtle animations on hover, click, and state change. Button press scale-down, card hover lift, toggle slide. | Kitz's DESIGN_SYSTEM.md specifies transitions (150ms color, 200ms transform). Add micro-interactions sparingly: button active state scale-down (`active:scale-[0.98]`), card hover shadow lift. | Yes -- minimal |
| **Variable fonts** | Using font weight and width axes for dynamic typography. | Inter supports variable font axes. Already in use. Consider using `font-variation-settings` for fine-tuned heading weights. | Maybe -- low priority |
| **Generous whitespace** | Large margins, spacious padding, breathing room between elements. | Kitz targets SMB owners often on mobile or small laptops. Balance whitespace with information density. Use `p-4` for cards in grids (compact) and `p-6` for standalone sections (spacious), as DESIGN_SYSTEM.md specifies. | Yes -- with density awareness |
| **Dark mode as default** | Many modern SaaS products default to dark mode. | Kitz's primary users are in LatAm, often using screens in bright environments. Light mode should be default. Dark mode is a future nice-to-have for the chat panel and game UI. | No -- light default |

**Priority:** Next Quarter (bento dashboard layout, micro-interactions)

**Action Items:**
1. Design the dashboard KPI grid as a bento layout: revenue card spans 2 columns, AI Battery card gets a special treatment with the segmented bar.
2. Add `active:scale-[0.98] transition-transform duration-150` to the Button component's primary variant.
3. Add `hover:shadow-md hover:-translate-y-0.5 transition-all duration-150` to interactive Card variants.

---

### 2.6 Webflow Showcase Patterns

Modern web layout patterns from Webflow's showcase that apply to Kitz's marketing and workspace surfaces:

#### What to Learn

| Pattern | Description | Application to Kitz |
|---------|-------------|---------------------|
| **Split-view layouts** | Content on one side, interactive element on the other. Used for onboarding, feature explanations, and settings. | Kitz's Settings page should use the split-view layout specified in DESIGN_SYSTEM.md (left nav + right content). The "How It Works" page could use split-view: explanation text on the left, animated diagram on the right. |
| **Sticky section headers** | Section headers that stick to the top of the viewport as the user scrolls past them. | Apply to WorkspaceTabs: make the tab bar sticky so users can switch tabs without scrolling back to the top. Use `sticky top-16 z-10 bg-white` (below the top bar). |
| **Progressive loading** | Content loads in sections as the user scrolls, rather than all at once. Above-the-fold content loads first. | For long pages (AgentsPage at 353 lines, ActivityPage at 222 lines), lazy-load below-the-fold sections. Use `IntersectionObserver` to trigger loading when sections come into view. |
| **Responsive typography** | Font sizes scale with viewport width using `clamp()`. Headings are larger on desktop, smaller on mobile, without discrete breakpoints. | Add responsive type sizing to the display and h1 tokens: `--font-size-display: clamp(1.5rem, 2vw + 1rem, 2.25rem)`. This ensures headings are readable on mobile without being oversized on desktop. |

**Priority:** Next Quarter

**Action Items:**
1. Make WorkspaceTabs sticky: `sticky top-16 z-10 bg-white border-b border-gray-200`.
2. Add responsive type clamp values for `display` and `h1` tokens.
3. Implement `IntersectionObserver`-based lazy loading for heavy page sections.

---

## 3. Data, Analytics & BI

### 3.1 PostHog

PostHog is an open-source product analytics platform. Its patterns for event tracking, feature flags, and session replay are directly applicable to Kitz.

#### What to Learn

| Pattern | Description | Application to Kitz |
|---------|-------------|---------------------|
| **Event-based tracking** | Every user action is captured as a structured event: `{ event: "lead_created", properties: { source: "whatsapp", org_id: "abc" }, timestamp: "..." }`. Events are the foundation for all analytics. | Kitz has an `EventEnvelope` shape in the AOS. Extend this to the UI: add a thin analytics layer that captures user actions (page views, feature usage, CRM actions) as structured events. |
| **Auto-capture** | PostHog can automatically capture clicks, pageviews, and form submissions without manual instrumentation. | For Kitz's MVP analytics, start with auto-capture of page views and button clicks. Add manual event tracking for high-value actions (lead created, order completed, AI Battery used). |
| **Feature flags** | Feature flags control feature rollout per user, org, or percentage. Flags are evaluated client-side with server-side fallbacks. | Kitz is pre-product-market-fit. Feature flags enable safe experimentation: roll out new workspace tabs to a subset of orgs, A/B test the onboarding flow, gradually enable AI features. |
| **Session replay** | Record and replay user sessions to understand behavior, debug issues, and identify UX friction. | Session replay is invaluable for understanding how LatAm SMB owners interact with the platform. Critical for identifying the "<10 minutes to first value" activation bottleneck. |
| **Funnels** | Define conversion funnels (signup -> WhatsApp connect -> first lead -> first order) and measure drop-off at each step. | Define Kitz's activation funnel: Login -> WhatsApp QR scan -> First lead created -> First order created -> First AI action used. Measure and optimize each step. |

**Application to Kitz:**

Implement PostHog as the product analytics layer. It is open-source (can self-host for data sovereignty -- important for LatAm compliance), provides event tracking, feature flags, session replay, and funnels in a single tool.

**Priority:** Now (event tracking), Next Quarter (feature flags, session replay, funnels)

**Action Items:**
1. Add `posthog-js` to `ui/package.json`. Initialize in `main.tsx` with the PostHog project API key.
2. Implement auto-capture for page views and clicks.
3. Add manual event tracking for key actions:
   - `lead_created` (source, stage)
   - `order_completed` (amount, items)
   - `ai_battery_used` (action, credits_consumed)
   - `whatsapp_connected` (success/failure)
   - `feature_card_clicked` (feature_name)
4. Define the activation funnel in PostHog: Login -> WhatsApp Connect -> First Lead -> First Order -> First AI Action.
5. Enable session replay for 10% of sessions initially.
6. Create feature flag for new features: use `posthog.isFeatureEnabled('feature-name')` before rendering experimental components.

---

### 3.2 Metabase

Metabase is an open-source BI tool for embedded analytics. Its patterns for SQL-based queries and embedded dashboards are relevant to Kitz's reporting features.

#### What to Learn

| Pattern | Description | Application to Kitz |
|---------|-------------|---------------------|
| **Embedded analytics** | Metabase can be embedded as an iframe or via its SDK. Dashboards, charts, and queries are embedded directly in the host application. | Kitz's dashboard currently shows static KPI cards. For the "Analytics" feature, embed Metabase charts showing revenue trends, lead conversion rates, and AI usage over time. |
| **SQL-based queries with visual builder** | Users can write SQL or use a visual query builder to explore data. The visual builder covers 80% of use cases; SQL handles the rest. | For Kitz's target audience (SMB owners, not data analysts), a visual builder is essential. Metabase's visual builder pattern: select a table, add filters, choose a visualization, save as a dashboard card. |
| **Automatic discovery** | Metabase scans the database schema and auto-generates questions: "How many orders per day?", "What is the average lead value?" | Pre-build a set of "starter questions" for each Kitz workspace: revenue over time, leads by source, orders by status, AI Battery usage. These appear as one-click reports. |
| **Drill-down** | Clicking a chart element drills into the underlying data. Clicking a bar in "Revenue by Month" shows the individual orders for that month. | Implement drill-down for the dashboard KPI cards: clicking the revenue card navigates to the Payments tab filtered by the current period. Clicking the leads card navigates to the CRM. |

**Priority:** Future (after the workspace has real data persistence)

**Action Items:**
1. Evaluate Metabase vs. building custom charts with a library like `recharts` or `visx`. For MVP, custom charts are simpler and do not require deploying another service.
2. Build a `KPIChart` component using `recharts` for sparklines in KPI cards (trend line showing the metric over the selected period).
3. Implement KPI card drill-down: clicking a card navigates to the relevant workspace tab with a period filter applied.
4. When data volume justifies it, deploy Metabase alongside the stack and embed dashboards via iframe.

---

### 3.3 Apache Superset

#### What to Learn

| Pattern | Description | Application to Kitz |
|---------|-------------|---------------------|
| **Dashboard layout engine** | Superset uses a grid-based dashboard editor where users can drag and resize chart components. Charts auto-refresh on a configurable interval. | Future: Kitz's dashboard could allow users to customize their layout. For now, a fixed grid is sufficient. Store layout preferences in `settingsStore`. |
| **Filter scoping** | Dashboard-level filters that apply to all or selected charts. Time range selector, org filter, agent filter. | Implement the period selector (Today, This Week, This Month, This Quarter) as a dashboard-level filter that propagates to all KPI cards and the activity feed. The `DashboardPeriod` type already defines this. |
| **Chart type recommendations** | Superset recommends chart types based on the data shape: time series -> line chart, categorical -> bar chart, part-of-whole -> pie chart. | For Kitz's built-in reports: revenue -> line chart, leads by stage -> horizontal bar, AI usage -> segmented bar (already defined for AI Battery). |

**Priority:** Future

**Action Items:**
1. Implement dashboard period selector using the `DashboardPeriod` type from PATTERNS.md. Wire it to all KPI card and activity feed API calls.
2. Choose 3-4 chart types for the MVP analytics surface: line (trends), bar (comparisons), segmented bar (progress), and number (KPIs).

---

### 3.4 OpenTelemetry

OpenTelemetry (OTel) is the industry standard for observability. It provides a vendor-neutral way to collect traces, metrics, and logs from distributed systems.

#### What to Learn

| Pattern | Description | Application to Kitz |
|---------|-------------|---------------------|
| **Distributed tracing** | Every request generates a trace with spans for each service hop. Traces visualize the full request path: UI -> gateway -> kitz_os -> llm-hub -> connector. | Kitz has `traceId` propagation but no trace collection or visualization. Add OTel SDK to each service. Export traces to a collector. |
| **Semantic conventions** | OTel defines standard attribute names: `http.method`, `http.route`, `db.system`, `rpc.service`. Using standard names enables cross-service querying. | Adopt OTel semantic conventions for Kitz service attributes. Custom attributes: `kitz.org_id`, `kitz.user_id`, `kitz.agent_name`, `kitz.battery_credits`. |
| **Context propagation** | Trace context is propagated via HTTP headers (`traceparent`, `tracestate`). Every service in the chain participates. | Replace Kitz's custom `traceId` header with the W3C Trace Context standard (`traceparent` header). This is compatible with all OTel-enabled tools. |
| **Metrics collection** | OTel metrics capture: request count, latency histograms, error rates, custom business metrics (orders per minute, AI Battery consumption rate). | Define Kitz business metrics: `kitz.orders.created` (counter), `kitz.battery.credits.consumed` (counter), `kitz.llm.latency` (histogram), `kitz.api.error_rate` (gauge). |

**Priority:** Next Quarter

**Action Items:**
1. Add `@opentelemetry/sdk-node` and `@opentelemetry/auto-instrumentations-node` to each Fastify service.
2. Configure the OTel collector to export to a backend (Jaeger for traces, Prometheus for metrics -- both can run in Docker alongside the stack).
3. Replace custom `traceId` with W3C Trace Context propagation.
4. Define custom Kitz metrics and register them with the OTel meter.

---

### 3.5 Grafana

#### What to Learn

| Pattern | Description | Application to Kitz |
|---------|-------------|---------------------|
| **Dashboard composition** | Grafana dashboards are composed of panels arranged in a grid. Each panel has a data source, query, and visualization. Dashboards can be templated with variables. | For internal monitoring, create a "Kitz Operations" Grafana dashboard with panels: service health, request latency (p50, p95, p99), error rate, AI Battery consumption, active WhatsApp sessions. |
| **Alerting rules** | Define alerts on metric thresholds: "if error rate > 5% for 5 minutes, alert Slack." Alerts have severity levels (warning, critical) and notification channels. | Define alerting rules for Kitz: AI Battery approaching limit (warning at 80%), error rate spike (critical at >5%), service down (critical, immediate). |
| **Data source federation** | Grafana queries multiple data sources (Prometheus, PostgreSQL, Elasticsearch) in a single dashboard. | Kitz can query both Prometheus (infrastructure metrics) and PostgreSQL/Supabase (business metrics) from one Grafana instance. |

**Priority:** Next Quarter (alongside OTel rollout)

**Action Items:**
1. Add Grafana and Prometheus to `docker-compose.yml`.
2. Create a "Kitz Operations" dashboard with: service uptime, request latency, error rate, AI Battery consumption rate.
3. Configure alerting: error rate > 5% -> critical alert, AI Battery > 80% consumed -> warning.

---

### 3.6 Prometheus

#### What to Learn

| Pattern | Description | Application to Kitz |
|---------|-------------|---------------------|
| **Metrics exposition** | Each service exposes a `/metrics` endpoint returning Prometheus-format metrics. The Prometheus server scrapes these endpoints on a schedule. | Add `fastify-metrics` (or `prom-client`) to each Fastify service. Expose `/metrics` with default HTTP metrics plus custom business metrics. |
| **Label-based querying** | Metrics use labels for dimensionality: `http_requests_total{method="POST", route="/leads", status="200"}`. This enables flexible querying without pre-defining every metric combination. | Use labels for Kitz metrics: `service` (gateway, kitz_os, workspace), `org_id`, `endpoint`, `status_code`. |
| **Recording rules** | Pre-compute expensive queries as recording rules that run periodically. The results are stored as new time series. | Pre-compute: `kitz:orders_per_hour` = rate of `kitz.orders.created` over 1 hour. `kitz:battery_burn_rate` = rate of `kitz.battery.credits.consumed`. |

**Priority:** Next Quarter

**Action Items:**
1. Add `prom-client` to each Fastify service.
2. Register default metrics (HTTP request duration, request count) and custom metrics (orders created, battery credits consumed).
3. Expose `/metrics` endpoint on each service.
4. Add Prometheus scrape config to `docker-compose.yml`.

---

## 4. Security & Governance

### 4.1 NIST Cybersecurity Framework

The NIST CSF organizes security into five functions: Identify, Protect, Detect, Respond, Recover. This provides a structured way to assess and improve Kitz's security posture.

#### What to Learn

| Function | NIST Description | Kitz Current State | Gap | Priority |
|----------|-----------------|-------------------|-----|----------|
| **Identify** | Know your assets, data flows, and risk exposure. | CLAUDE.md documents the service map and data flows. `THREAT_MODEL.md` exists in kitz-docs. Agent org chart is documented. | Asset inventory is informal. No data classification (which data is PII, financial, internal-only). No formal risk register. | Now |
| **Protect** | Implement safeguards to limit impact. | Zero-trust gateway with auth, RBAC, rate limiting. Draft-first architecture for outbound messages. Kill-switch for AI execution. Payment webhook header checks (no signature verification). | API authentication relies on `DEV_TOKEN_SECRET` (dev bypass). No webhook signature verification. No encryption at rest documentation. No input sanitization framework. | Now |
| **Detect** | Identify security events in real time. | `EventEnvelope` with traceId propagation. Activity logging service (`logs-api`) is a stub. | No real-time security monitoring. No anomaly detection. No failed authentication tracking. | Next Quarter |
| **Respond** | Take action when an incident occurs. | `incident-response.md` runbook exists. Kill-switch can halt AI execution. | Runbook exists but no automated incident response. No alerting system. No communication plan template. | Next Quarter |
| **Recover** | Restore normal operations after an incident. | `rollback.md` runbook exists. Daily backup mentioned in activity feed examples. | No documented backup/restore procedure for Supabase. No disaster recovery plan. No recovery time objectives defined. | Future |

**Application to Kitz:**

**Priority:** Now (Identify + Protect gaps), Next Quarter (Detect + Respond)

**Action Items:**
1. **Data classification:** Create a data classification document. Categorize: PII (user email, phone, name), Financial (invoices, payments, credits), Internal (agent configs, prompts, system logs), Public (marketing content). Apply appropriate protections per category.
2. **Webhook signature verification:** Implement cryptographic signature verification for Stripe, PayPal, and WhatsApp webhooks. Currently "check header presence but don't cryptographically verify."
3. **Input sanitization:** Add input validation to all API endpoints. Use `zod` schemas (already a dependency pattern in the ecosystem) to validate request bodies. Reject malformed input before it reaches business logic.
4. **Authentication hardening:** Replace `DEV_TOKEN_SECRET` with a proper JWT flow for production. Add failed login attempt tracking and rate limiting on the auth endpoint.
5. **Secrets rotation:** Document and automate API key rotation for all third-party services (Anthropic, OpenAI, Stripe, ElevenLabs). The `token-rotation.md` runbook exists; automate it.

---

### 4.2 OWASP Top 10

The OWASP Top 10 represents the most critical web application security risks. Each risk mapped to Kitz:

| OWASP Risk | Description | Kitz Exposure | Mitigation |
|------------|-------------|---------------|------------|
| **A01: Broken Access Control** | Users can act outside their intended permissions. | Gateway has RBAC via `x-scopes`, but some services are called directly (kitz_os -> WhatsApp connector bypasses gateway). UI does not enforce permissions (noted gap). | (1) Route all inter-service traffic through gateway. (2) Implement UI permission gating. (3) Add authorization checks at the service level, not just the gateway. |
| **A02: Cryptographic Failures** | Sensitive data exposed due to weak or missing encryption. | No documented encryption at rest. Webhook signatures not verified. `auth_info_baileys` stores WhatsApp credentials on disk. | (1) Encrypt sensitive data at rest in Supabase (enable column-level encryption for PII). (2) Verify webhook signatures. (3) Encrypt `auth_info_baileys` directories. |
| **A03: Injection** | Untrusted data sent to an interpreter (SQL, NoSQL, OS command, LDAP). | Supabase client library provides parameterized queries (low risk for SQL injection). But prompt injection is a risk: user messages are fed to LLMs that execute tools. | (1) Input sanitization on all user-facing text fields. (2) Implement prompt injection defenses: output filtering, tool call validation, sandboxing tool execution. (3) Never interpolate user input directly into system prompts. |
| **A04: Insecure Design** | Missing or ineffective control design. | Draft-first architecture is a strong design control. Kill-switch is effective. But: no confirmation dialogs for destructive actions (UI gap), no idempotency enforcement on mutation endpoints. | (1) Add confirmation dialogs per UX_RUBRIC Section 9.1. (2) Enforce idempotency keys on all POST endpoints. (3) Add resource-level soft deletes instead of hard deletes. |
| **A05: Security Misconfiguration** | Default credentials, unnecessary features enabled, verbose error messages. | `DEV_TOKEN_SECRET` is a dev bypass. `GOD_MODE_USER_ID` is an admin bypass. Docker images may include unnecessary tools. | (1) Remove dev bypasses in production builds. Use environment-specific configuration. (2) Minimize Docker images (use `node:20-slim` or distroless). (3) Disable verbose error messages in production (return KitzErrorResponse, log full details internally). |
| **A06: Vulnerable Components** | Using libraries with known vulnerabilities. | Baileys v7.0.0-rc.9 (release candidate, not stable). 13+ services with separate dependency trees. | (1) Run `npm audit` in CI for all services. (2) Add Dependabot or Renovate for automated dependency updates. (3) Evaluate Baileys stability -- consider pinning or contributing upstream fixes. |
| **A07: Auth Failures** | Weak authentication mechanisms. | Auth is a dev stub (auto-login in LoginPage). No password hashing, no MFA, no session management. | (1) Implement proper authentication with Supabase Auth (email/password, magic links, social login). (2) Add session expiry and refresh token rotation. (3) Track failed login attempts. |
| **A08: Software/Data Integrity** | Code and infrastructure lacking integrity verification. | CI pipeline runs `typecheck -> lint -> test` but tests are stubs. No code signing. No build artifact verification. | (1) Implement real integration tests. (2) Add `npm ci --ignore-scripts` with explicit script allowlisting. (3) Pin dependency versions (use `package-lock.json` in CI). |
| **A09: Logging Failures** | Insufficient logging of security-relevant events. | EventEnvelope with traceId exists. `logs-api` service is a stub. | (1) Implement `logs-api` as a real service. (2) Log: all authentication events, all authorization failures, all data mutations, all AI tool invocations. (3) Forward logs to a central store. |
| **A10: SSRF** | Server-side request forgery. | `kitz_os` fetches URLs based on tool invocations (web scraping tools, API calls). An attacker could craft a message that causes the system to fetch an internal URL. | (1) Implement an allowlist for outbound URLs from tool execution. (2) Block requests to internal IP ranges (10.x, 172.16.x, 192.168.x, 127.x). (3) Use a dedicated HTTP client with SSRF protections for tool execution. |

**Priority:** Now (A01, A03, A05, A07), Next Quarter (A02, A04, A06, A09), Future (A08, A10)

**Action Items (ordered by priority):**
1. **Implement real authentication** using Supabase Auth. Replace the auto-login stub. This is the single highest-impact security improvement.
2. **Route all inter-service traffic through the gateway.** Eliminate direct service-to-service calls that bypass auth/RBAC.
3. **Add input validation** with `zod` schemas on all API endpoints.
4. **Implement prompt injection defenses:** validate tool call outputs, filter LLM outputs before execution, sandbox tool execution.
5. **Remove dev bypasses** (`DEV_TOKEN_SECRET`, `GOD_MODE_USER_ID`) from production environment config.
6. **Add `npm audit`** to the CI pipeline with `--audit-level=high` as a blocking check.
7. **Verify webhook signatures** cryptographically for all payment providers.
8. **Implement security event logging** in `logs-api`.

---

### 4.3 EU AI Act

The EU AI Act classifies AI systems by risk level and imposes requirements on high-risk systems. While Kitz primarily operates in LatAm, understanding these requirements positions the platform for global expansion and builds user trust.

#### What to Learn

| Requirement | EU AI Act Description | Application to Kitz |
|-------------|----------------------|---------------------|
| **Risk classification** | AI systems are classified as: Unacceptable (banned), High-risk (strict requirements), Limited-risk (transparency obligations), Minimal-risk (no obligations). | Kitz's AI features (semantic router, agent actions, content generation) are Limited-risk: they interact with users but do not make autonomous decisions in high-risk domains (healthcare, employment, credit). The draft-first architecture keeps humans in the loop. |
| **Transparency** | Users must be informed when they are interacting with an AI system. AI-generated content must be labeled. | (1) The chat panel should clearly indicate when responses are AI-generated (already implicit but not explicit). (2) AI-drafted WhatsApp messages, emails, and invoices should be labeled "AI-drafted" in the draft queue. (3) The `AgentThinkingBlock` provides transparency into AI reasoning -- good, keep it. |
| **Human oversight** | High-risk AI systems must allow human intervention. Users must be able to override AI decisions. | Kitz's draft-first architecture and kill-switch provide strong human oversight. Ensure every AI-initiated action has a human approval step. Document the override mechanisms. |
| **Data governance** | Training data must be relevant, representative, and free of biases. Data used for AI must be documented. | Kitz uses third-party LLMs (Claude, GPT) -- training data governance falls on the providers. However, Kitz should document: what user data is sent to LLMs, what data retention policies apply, and give users control over data sharing. |
| **Record-keeping** | AI system operations must be logged for auditability. Logs must include inputs, outputs, and decision rationale. | Kitz's `EventEnvelope` and `agent_audit_log` table provide a foundation. Ensure every AI tool invocation logs: input, output, model used, tokens consumed, decision rationale (from BRAINSTORM phase). |

**Priority:** Next Quarter (transparency labeling), Future (full compliance)

**Action Items:**
1. Add an "AI-generated" label to all AI-produced content in the UI (draft messages, generated reports, suggested actions).
2. Document what user data is sent to LLM providers. Add this to a privacy page or terms of service.
3. Ensure all AI tool invocations are logged with full input/output in the `agent_audit_log` table.
4. Add a user-facing toggle to opt out of AI data processing (graceful degradation to manual-only mode).

---

### 4.4 SOC 2

SOC 2 defines trust service criteria across five categories: Security, Availability, Processing Integrity, Confidentiality, and Privacy. While SOC 2 certification is premature for Kitz at this stage, building toward it creates a strong foundation.

#### What to Learn

| Criteria | Description | Kitz Current State | Priority Action |
|----------|-------------|-------------------|-----------------|
| **Security** | Protection against unauthorized access. | Gateway auth + RBAC. But: dev bypasses, no real auth, no encryption at rest. | Implement real authentication. Remove dev bypasses. |
| **Availability** | System is available for operation per agreements. | No SLA defined. No uptime monitoring. No disaster recovery plan. | Define internal availability targets (99.5% for workspace, 99% for AI features). Add uptime monitoring (Prometheus + Grafana). |
| **Processing Integrity** | System processing is complete, accurate, timely, and authorized. | Draft-first ensures authorization. AI Battery enforces limits. But: no data validation on inputs, no reconciliation for financial data. | Add input validation. Implement financial data reconciliation (orders vs. payments vs. invoices). |
| **Confidentiality** | Information designated as confidential is protected. | No data classification. No access controls beyond RBAC. No encryption at rest. | Classify data. Implement column-level encryption for PII. Add access logging for confidential data. |
| **Privacy** | Personal information is collected, used, retained, and disclosed per the entity's privacy notice. | No privacy policy. No data retention policy. No user data export/deletion capability. | Create privacy policy. Implement data retention rules. Build user data export (GDPR Article 20 equivalent). |

**Priority:** Now (Security basics), Next Quarter (Availability + Processing Integrity), Future (Confidentiality + Privacy for compliance)

**Action Items:**
1. Implement real authentication (highest priority security item).
2. Define internal availability targets and add monitoring.
3. Create a privacy policy document.
4. Implement user data export capability (all leads, orders, tasks for an org exportable as JSON/CSV).
5. Define data retention policy: how long are events, chat messages, and audit logs retained?

---

## 5. Summary & Roadmaps

### 5.1 Design System Maturity Roadmap

| Stage | Milestone | Current State | Target | Timeline |
|-------|-----------|---------------|--------|----------|
| **Level 0: Ad-hoc** | Styling is inline, per-component, no shared tokens or components. | **This is where Kitz is today.** The UI_INVENTORY confirms: no design tokens implemented in CSS, no reusable components, ad-hoc colors/spacing/typography, 13+ text sizes, no component library. DESIGN_SYSTEM.md exists as a specification but is not implemented. | -- | Current |
| **Level 1: Tokens** | Design tokens are defined in CSS and consumed by Tailwind. All new components use tokens. | Tokens are specified in DESIGN_SYSTEM.md but only `--font-sans` exists in `src/index.css`. | Full `@theme` block with all tokens from DESIGN_SYSTEM.md. Old ad-hoc values being migrated. | P0 (1-2 weeks) |
| **Level 2: Primitives** | Core components (Button, Input, Select, Card, Modal, Table, Badge, EmptyState, Skeleton, Tabs, Toast) are built and used across the app. | Zero reusable components. 53 component files, all bespoke. | 11 primitive components built per DESIGN_SYSTEM.md specs. All P0 and P1 backlog items complete. | P0-P1 (3-4 weeks) |
| **Level 3: Patterns** | Composite patterns (forms, data tables, detail panels, empty states, loading states) are standardized and documented. | PATTERNS.md specifies 9 surfaces with full decomposition. None are implemented to spec. | All 9 surfaces implemented per PATTERNS.md. Form validation, skeleton loading, error states, and pagination all functional. | P2 (5-7 weeks) |
| **Level 4: Semantic Tokens** | Two-tier token system (primitives + semantic aliases). Theme support. Component-level token overrides for edge cases. | No semantic token layer. Chat panel uses hardcoded hex. | Semantic aliases in place. Chat panel uses token-based dark theme. High-contrast variant available. | Next Quarter |
| **Level 5: System** | Full design system with documentation site, visual regression tests, accessibility CI checks, and contribution guidelines. | No Storybook, no visual tests, no accessibility CI. | Storybook or Ladle for component catalog. Chromatic or Percy for visual regression. `axe-core` in CI. | Future |

### 5.2 Analytics Implementation Plan

| Phase | Scope | Tools | Timeline |
|-------|-------|-------|----------|
| **Phase 1: Foundation** | Add PostHog SDK. Auto-capture page views and clicks. Manual events for key actions (lead created, order completed, AI Battery used, WhatsApp connected). | `posthog-js` | Now (1-2 days) |
| **Phase 2: Funnels** | Define activation funnel. Set up conversion tracking. Identify the biggest drop-off point in the activation flow. | PostHog funnels | Now (1 day after Phase 1) |
| **Phase 3: Feature Flags** | Wrap experimental features in PostHog feature flags. Enable gradual rollout. | PostHog feature flags | Next Quarter |
| **Phase 4: Session Replay** | Enable session replay for a subset of users. Review sessions weekly to identify UX friction. | PostHog session replay | Next Quarter |
| **Phase 5: Infrastructure Observability** | Add OpenTelemetry to all Fastify services. Deploy Prometheus + Grafana. Create operations dashboard. Define alerting rules. | OTel SDK, Prometheus, Grafana | Next Quarter |
| **Phase 6: Business Intelligence** | Build custom chart components for the dashboard (sparklines, trend lines). Implement drill-down from KPI cards to workspace tabs. Evaluate Metabase for advanced reporting. | `recharts`, Metabase (evaluation) | Future |

### 5.3 Security Hardening Priorities

Ordered by impact and urgency:

| # | Action | Severity | Effort | Dependencies |
|---|--------|----------|--------|-------------|
| 1 | **Implement real authentication** (Supabase Auth: email/password, magic links). Replace auto-login stub. | CRITICAL | M | None |
| 2 | **Add input validation** with `zod` schemas on all API endpoints. | CRITICAL | M | None |
| 3 | **Remove dev bypasses** (`DEV_TOKEN_SECRET`, `GOD_MODE_USER_ID`) from production config. Use environment-specific variables. | CRITICAL | S | None |
| 4 | **Verify webhook signatures** for Stripe, PayPal, and WhatsApp. | HIGH | S | None |
| 5 | **Route all inter-service traffic through gateway.** Eliminate direct kitz_os -> WhatsApp connector calls. | HIGH | M | #1 |
| 6 | **Add `npm audit --audit-level=high`** to CI pipeline as a blocking check. | HIGH | S | None |
| 7 | **Implement prompt injection defenses:** validate tool outputs, filter LLM outputs, sandbox execution. | HIGH | L | None |
| 8 | **Add security event logging** to `logs-api`: auth events, authorization failures, data mutations. | MEDIUM | M | #1 |
| 9 | **Encrypt sensitive data at rest** in Supabase (column-level encryption for PII). | MEDIUM | M | #1 |
| 10 | **Create privacy policy and data retention rules.** | MEDIUM | S | None |
| 11 | **Implement SSRF protections** for AI tool execution (URL allowlist, block internal IPs). | MEDIUM | S | None |
| 12 | **Add Dependabot/Renovate** for automated dependency updates. | LOW | S | None |

### 5.4 Documentation Improvement Plan

| Phase | Action | Deliverable | Timeline |
|-------|--------|-------------|----------|
| **Phase 1: API Reference** | Add `@fastify/swagger` to gateway and workspace. Auto-generate OpenAPI specs. Serve Swagger UI at `/docs`. | Interactive API documentation for all endpoints. | Next Quarter |
| **Phase 2: Restructure** | Split `kitz-docs/` into `concepts/` (architecture, data model, agent system), `guides/` (runbooks, tutorials, quickstarts), and `reference/` (API docs, contracts, env vars). | Organized documentation tree navigable by role (developer, operator, product). | Next Quarter |
| **Phase 3: Quickstarts** | Write a 5-minute quickstart for each service: what it does, how to run it locally, how to test it. | 13+ quickstart guides matching the service map. | Next Quarter |
| **Phase 4: Component Catalog** | Deploy Storybook or Ladle with all primitive components. Each component shows variants, sizes, states, and code examples. | Visual component catalog accessible at a dev URL. | Future |
| **Phase 5: Design Decision Records** | Formalize the decision log (`docs/ops/decision-log.md`) into ADR format: context, decision, consequences, status. | Searchable archive of architectural decisions. | Future |

---

## Appendix: Source Reference Index

| Source | Category | Key Takeaway for Kitz |
|--------|----------|----------------------|
| Carbon Design System | Design Tokens | Three-tier token architecture; Kitz should adopt a two-tier model (primitives + semantic aliases). |
| Carbon Design System | Accessibility | WCAG 2.1 AA as baseline; automated testing with axe-core; every component ships accessible. |
| Carbon Design System | Composition | Slot-based props, sub-component composition, consistent size scale across components. |
| IBM Cloud APIs | API Design | Consistent error shape, rate limit headers, cursor-based pagination, request tracing. |
| watsonx.ai API | AI Patterns | Streaming responses, usage tracking per request, prompt versioning. |
| Watson Assistant API | Conversational AI | Session management, intent/entity exposure, disambiguation, draft-first preview. |
| Stripe | Form Design | Smart defaults, inline validation, optimistic UI, locale-aware formatting. |
| Stripe | Documentation | Three-panel layout, copyable code blocks, progressive disclosure. |
| Linear | Speed | Command palette, keyboard shortcuts, <100ms latency target, contextual right panel. |
| Linear | Aesthetics | Minimal chrome, high content density, imperceptible transitions. |
| Notion | Architecture | Block-based content, slash commands, workspace permissions, undo/redo. |
| Apple HIG | Principles | Direct manipulation, immediate feedback, consistency, perceived stability, aesthetic integrity. |
| Awwwards | Trends | Bento grids, micro-interactions, generous whitespace, responsive typography. |
| Webflow | Layouts | Split-view, sticky headers, progressive loading, responsive type with clamp(). |
| PostHog | Analytics | Event-based tracking, feature flags, session replay, funnels. |
| Metabase | BI | Embedded analytics, visual query builder, auto-discovery, drill-down. |
| Apache Superset | Dashboards | Grid-based layout, filter scoping, chart type recommendations. |
| OpenTelemetry | Observability | Distributed tracing, semantic conventions, context propagation, custom metrics. |
| Grafana | Monitoring | Dashboard composition, alerting rules, data source federation. |
| Prometheus | Metrics | Metrics exposition, label-based querying, recording rules. |
| NIST CSF | Security Framework | Five functions (Identify, Protect, Detect, Respond, Recover); Kitz has gaps in Detect and Respond. |
| OWASP Top 10 | Web Security | Broken access control and injection are the highest risks for Kitz. Auth is the #1 priority. |
| EU AI Act | AI Governance | Transparency obligations, human oversight requirements, record-keeping for AI decisions. |
| SOC 2 | Compliance | Five trust criteria; Kitz should build toward Security and Availability criteria first. |

---

*This document should be reviewed quarterly and updated as the platform matures. Items marked "Now" should be addressed in the current sprint or the next. Items marked "Next Quarter" should be planned into the Q2 2026 roadmap. Items marked "Future" are strategic investments for when the platform reaches product-market fit.*
