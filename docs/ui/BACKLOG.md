# Kitz UI -- Implementation Backlog

> **Project:** Kitz -- AI-native small business operating system
> **Stack:** React 19 + Tailwind CSS v4 + TypeScript 5.9
> **Source of truth:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
> **Codebase root:** `/tmp/kitzV1/ui/src/`
> **Last updated:** 2026-02-24

---

## Summary

| Tier | Name | Tasks | Estimated Duration |
|------|------|-------|--------------------|
| P0 | Foundation | 9 | 1--2 weeks |
| P1 | Data Display + Forms | 10 | 1--2 weeks |
| P2 | Business Surfaces | 10 | 2--3 weeks |
| P3 | Polish + Advanced | 10 | 2--3 weeks |
| **Total** | | **39** | **6--10 weeks** |

**Recommended implementation order:** Complete P0 in its entirety before starting P1. P1 tasks can be parallelized. P2 tasks depend heavily on P0 and P1 components. P3 tasks are independent polish items that can be interleaved with P2 or deferred to a hardening sprint.

**Key principles:**
- Every component follows the specs in DESIGN_SYSTEM.md exactly (tokens, variants, sizes, states).
- All components are typed with the TypeScript interfaces defined in the design system.
- All interactive elements must have visible focus indicators and keyboard operability.
- Files use named exports. Components use `forwardRef` where DOM access is needed.

---

## P0: Foundation (Must have first)

These tasks establish the design token layer and the core primitive components that every other piece of the UI depends on. Nothing in P1--P3 should be started until all P0 items are complete.

---

### P0-01: Design Tokens

**Title:** Implement CSS custom properties via Tailwind v4 `@theme` block

**Files to create or edit:**
- Edit: `src/index.css`

**Acceptance criteria:**
1. The `@theme` block in `src/index.css` contains all tokens from the "Appendix: CSS Entry Point" section of DESIGN_SYSTEM.md: typography (font-size-display through font-size-xxs), brand colors (purple-50 through purple-900), neutral colors (gray-50 through gray-950), semantic colors (success, error, warning, info and their light variants), surface colors (surface-primary through surface-dark), border radii (radius-none through radius-full), and shadows (shadow-xs through shadow-xl).
2. The existing `--font-sans` token is replaced with `--font-family-sans` to match the design system spec.
3. Tailwind utility classes generated from these tokens (e.g., `bg-purple-500`, `text-gray-700`, `rounded-lg`, `shadow-md`, `text-display`, `text-body`) resolve correctly in rendered output.
4. Existing keyframe animations and utility classes in `src/index.css` are preserved.
5. The `body` selector uses token-based values: `background: var(--color-surface-primary)` and `color: var(--color-gray-900)`.

**Complexity:** S

**Dependencies:** None

---

### P0-02: Typography Scale

**Title:** Register type scale utilities and verify heading compositions

**Files to create or edit:**
- Edit: `src/index.css` (type scale tokens are part of the `@theme` block from P0-01; this task adds any supplemental utility rules if needed)

**Acceptance criteria:**
1. Tailwind classes `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-h4`, `text-body`, `text-sm`, `text-xs`, and `text-xxs` all resolve to the correct rem values defined in DESIGN_SYSTEM.md.
2. The heading composition examples from DESIGN_SYSTEM.md render correctly when applied (e.g., `<h1 class="text-display font-bold leading-tight tracking-tight text-gray-900">` produces 36px/bold/1.25 line-height text).
3. Font weights `font-normal` (400), `font-medium` (500), `font-semibold` (600), and `font-bold` (700) work as expected with Inter.
4. No custom `@utility` or `@layer` rules are needed beyond the `@theme` block -- verified by rendering each token in a test page or Storybook.

**Complexity:** S

**Dependencies:** P0-01

---

### P0-03: Button Component

**Title:** Create reusable Button component with all variants, sizes, and states

**Files to create or edit:**
- Create: `src/components/ui/Button.tsx`

**Acceptance criteria:**
1. Exports a `Button` component that accepts the `ButtonProps` interface defined in DESIGN_SYSTEM.md (variant, size, loading, iconLeft, iconRight, iconOnly, fullWidth, plus all native button attributes).
2. Renders four variants: `primary` (purple filled), `secondary` (outlined), `ghost` (transparent), `danger` (red filled), each with correct hover/active/focus/disabled styles per the design system.
3. Renders three sizes: `sm` (h-8, px-3, text-xs), `md` (h-10, px-4, text-body), `lg` (h-12, px-6, text-h4).
4. `iconOnly` mode renders a square button (equal width and height) with no text label.
5. `loading` state shows a spinner animation, applies `pointer-events-none`, and keeps the label visible.
6. `disabled` state applies `opacity-50 cursor-not-allowed pointer-events-none`.
7. Focus ring: `focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2` (or `ring-red-500` for danger variant).
8. `fullWidth` prop applies `w-full`.
9. Component uses `forwardRef` to forward the ref to the underlying `<button>` element.
10. Transitions: `transition-colors duration-150`.

**Complexity:** M

**Dependencies:** P0-01

---

### P0-04: Input Component

**Title:** Create reusable Input component with label, help text, error, and size variants

**Files to create or edit:**
- Create: `src/components/ui/Input.tsx`

**Acceptance criteria:**
1. Exports an `Input` component that accepts the `InputProps` interface from DESIGN_SYSTEM.md (size, label, helpText, error, iconLeft, iconRight, fullWidth, plus all native input attributes except `size`).
2. Renders three sizes: `sm` (h-8, px-2, text-xs), `md` (h-10, px-3, text-body), `lg` (h-12, px-4, text-h4).
3. Label renders above the input as `text-body font-medium text-gray-700`.
4. Help text renders below the input as `text-xs text-gray-500`.
5. Error message replaces help text, renders as `text-xs text-error`, and the input border changes to `border-error`.
6. Focus state: `border-purple-500 ring-1 ring-purple-500 outline-none`.
7. Disabled state: `bg-gray-50 text-gray-400 cursor-not-allowed`, label also changes to `text-gray-400`.
8. `iconLeft` and `iconRight` render inside the input with appropriate padding offset.
9. Error state sets `aria-invalid="true"` and `aria-describedby` pointing to the error message element.
10. Component uses `forwardRef`.
11. `fullWidth` defaults to `true` (renders `w-full`).

**Complexity:** M

**Dependencies:** P0-01

---

### P0-05: Select Component

**Title:** Create native Select component with consistent styling

**Files to create or edit:**
- Create: `src/components/ui/Select.tsx`

**Acceptance criteria:**
1. Exports a `Select` component that accepts the `SelectProps` interface from DESIGN_SYSTEM.md (size, label, helpText, error, placeholder, options, fullWidth, plus native select attributes except `size`).
2. Renders using a native `<select>` element with `appearance-none` and a custom chevron-down icon positioned absolutely on the right.
3. Sizes, label, help text, error, focus, and disabled states match the Input component behavior exactly.
4. Placeholder option renders as the first `<option>` with `value=""` and is selected by default when no value is provided.
5. Each option in the `options` array renders as an `<option>` element; disabled options have the `disabled` attribute.
6. Component uses `forwardRef`.
7. Right padding accounts for the chevron icon (`pr-10`).

**Complexity:** S

**Dependencies:** P0-04

---

### P0-06: Card Component

**Title:** Create Card component with header/body/footer composition

**Files to create or edit:**
- Create: `src/components/ui/Card.tsx`

**Acceptance criteria:**
1. Exports `Card`, `CardHeader`, `CardBody`, and `CardFooter` components matching the TypeScript interfaces in DESIGN_SYSTEM.md.
2. `Card` renders three variants: `default` (border-gray-200, no shadow), `elevated` (no border, shadow-md), `interactive` (border-gray-200, hover:shadow-md, hover:border-gray-300, cursor-pointer).
3. `Card` accepts `padding` prop: `compact` (py-4) and `spacious` (py-6), and a `noPadding` prop that removes all internal padding.
4. `CardHeader` renders title (text-h3 font-semibold), optional description (text-sm text-gray-500), and optional action element right-aligned. Has a bottom border (`border-b border-gray-100`) and padding `px-6 py-4`.
5. `CardBody` renders with `px-6 py-4` (or py-6 for spacious).
6. `CardFooter` renders with `px-6 py-4`, top border, and configurable alignment (left/center/right, defaulting to right).
7. All sub-components accept `className` for extension and `children`.
8. `Card` uses `rounded-lg` and `bg-white`.
9. Interactive variant includes `transition-all duration-150`.

**Complexity:** S

**Dependencies:** P0-01

---

### P0-07: App Shell Layout Update

**Title:** Update DashboardLayout and TopNavBar for collapsible sidebar and responsive breakpoints

**Files to create or edit:**
- Edit: `src/components/layout/DashboardLayout.tsx`
- Edit: `src/components/layout/TopNavBar.tsx`

**Acceptance criteria:**
1. Sidebar supports two states: expanded (240px / `w-60`) and collapsed (64px / `w-16`).
2. Collapsed state shows only icons; a tooltip appears on hover with the nav item label.
3. A toggle button (chevron or hamburger icon) at the bottom or top of the sidebar switches between states.
4. Sidebar collapse/expand animates with `transition-[width] duration-300 ease-in-out`.
5. Responsive breakpoints:
   - Desktop (>=1280px): sidebar expanded by default.
   - Tablet (768--1279px): sidebar collapsed by default (icon-only).
   - Mobile (<768px): sidebar hidden; a hamburger button in the top bar opens it as an overlay.
6. Main content area uses `flex-1 overflow-y-auto` and constrains content width with `max-w-[1280px] mx-auto`.
7. Sidebar background uses `bg-surface-secondary` token.
8. Sidebar collapse preference is persisted (e.g., in localStorage or a Zustand store).
9. Existing nav items, language selector, settings button, and user section continue to function.
10. The `TopNavBar` component applies active/inactive nav item styles per DESIGN_SYSTEM.md (active: `text-purple-700 bg-purple-50 font-medium`; inactive: `text-gray-600 hover:text-gray-900 hover:bg-gray-100`).

**Complexity:** M

**Dependencies:** P0-01

---

### P0-08: Modal / Dialog Component

**Title:** Create Modal component with sizes, animation, focus trap, and escape-to-close

**Files to create or edit:**
- Create: `src/components/ui/Modal.tsx`

**Acceptance criteria:**
1. Exports a `Modal` component matching the `ModalProps` interface from DESIGN_SYSTEM.md (open, onClose, size, title, description, children, footer, preventClose).
2. Renders four sizes: `sm` (max-w-md), `md` (max-w-lg), `lg` (max-w-2xl), `full` (max-w-4xl).
3. Overlay backdrop uses `fixed inset-0 bg-black/50 z-50`.
4. Dialog panel uses `rounded-xl bg-white shadow-xl` and is centered vertically and horizontally.
5. Close button (X icon) renders in the header; calls `onClose` on click.
6. Pressing Escape calls `onClose` unless `preventClose` is true.
7. Clicking the overlay backdrop calls `onClose` unless `preventClose` is true.
8. Focus is trapped within the modal while open (Tab cycles through focusable elements inside the modal).
9. Entry animation: overlay fades in, dialog scales from 95% to 100% and fades in, 200ms ease-out.
10. Exit animation: reverse of entry, 150ms ease-in.
11. Header renders with `px-6 py-4 border-b border-gray-100`.
12. Body renders with `px-6 py-4 overflow-y-auto max-h-[60vh]`.
13. Footer renders with `px-6 py-4 border-t border-gray-100 flex justify-end gap-3`.
14. Uses a React portal to render at the document body level.
15. Sets `aria-modal="true"` and `role="dialog"` on the dialog element.

**Complexity:** M

**Dependencies:** P0-01

---

### P0-09: Toast System Update

**Title:** Update ToastContainer to match design system variants, icons, and behavior

**Files to create or edit:**
- Edit: `src/components/ui/ToastContainer.tsx`
- Edit: `src/stores/toastStore.ts` (add `warning` type if not present)

**Acceptance criteria:**
1. Toast supports four variants: `success`, `error`, `warning`, `info` -- each with the correct left border color, icon, and icon color per DESIGN_SYSTEM.md.
2. Toast width is `w-80` (320px) with `rounded-lg`.
3. Each toast has a colored left border (`border-l-4 border-l-success` etc.) on a white background with `shadow-lg`.
4. Icons: checkmark-circle for success, x-circle for error, alert-triangle for warning, info-circle for info.
5. Auto-dismiss after 4000ms (configurable per toast via `duration`; `duration: 0` disables auto-dismiss).
6. Multiple toasts stack vertically with `gap-3`.
7. Entry animation: slide in from right + fade (200ms, ease-out).
8. Exit animation: slide out to right + fade (150ms, ease-in).
9. Close button on each toast calls dismiss.
10. Toast container position: `fixed bottom-6 right-6 z-[100]`.
11. Each toast has `role="alert"` or uses `aria-live="polite"` for accessible announcements.
12. The `toastStore` supports the `warning` variant type alongside existing `success`, `error`, `info`.

**Complexity:** S

**Dependencies:** P0-01

---

## P1: Data Display + Forms

These tasks create the mid-level components used to display data, capture user input, and navigate within pages. They depend on the P0 foundation being in place.

---

### P1-01: Table Component

**Title:** Create a generic, sortable, selectable Table component

**Files to create or edit:**
- Create: `src/components/ui/Table.tsx`

**Acceptance criteria:**
1. Exports a generic `Table<T>` component matching the `TableProps<T>` interface from DESIGN_SYSTEM.md (columns, data, selectable, onSelectionChange, sort, onSortChange, stickyHeader, onRowClick, emptyState, loading).
2. Table renders inside a `rounded-lg border border-gray-200 overflow-hidden` container with `overflow-x-auto`.
3. Header row: `bg-gray-50`, cells use `px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide`.
4. Sortable headers show a sort indicator icon; active sort column uses `text-purple-500` on the icon; clicking toggles asc/desc.
5. Body rows: `border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150`; cells use `px-4 py-3 text-body text-gray-900`.
6. When `selectable` is true, a checkbox column is prepended; header checkbox toggles select-all; `onSelectionChange` fires with selected rows.
7. Columns support a custom `render` function for cell content.
8. `stickyHeader` applies `sticky top-0 bg-white z-10` to the `<thead>`.
9. When `loading` is true, the table body shows skeleton rows (using the Skeleton component if available, or inline pulse animation).
10. When `data` is empty and `emptyState` is provided, it renders centered inside the table container.
11. On mobile (< 768px), the table optionally renders rows as stacked cards (one card per row, each cell labeled).

**Complexity:** L

**Dependencies:** P0-01, P0-06

---

### P1-02: Badge Component

**Title:** Create Badge component with semantic variants and sizes

**Files to create or edit:**
- Create: `src/components/ui/Badge.tsx`

**Acceptance criteria:**
1. Exports a `Badge` component matching the `BadgeProps` interface from DESIGN_SYSTEM.md (variant, size, plus native span attributes).
2. Five variants: `default` (bg-gray-100, text-gray-700), `primary` (bg-purple-100, text-purple-700), `success` (bg-success-light, text-green-700), `error` (bg-error-light, text-red-700), `warning` (bg-warning-light, text-amber-700).
3. Two sizes: `sm` (text-xxs, px-1.5, py-0.5) and `md` (text-xs, px-2, py-0.5).
4. Shape: `rounded-sm`, `inline-flex items-center`, `font-medium`.
5. Default variant is `default`, default size is `md`.
6. Accepts `className` for extension and `children` for content.

**Complexity:** S

**Dependencies:** P0-01

---

### P1-03: Tabs Component

**Title:** Create Tabs component with underline and pill variants

**Files to create or edit:**
- Create: `src/components/ui/Tabs.tsx`

**Acceptance criteria:**
1. Exports a `Tabs` component matching the `TabsProps` interface from DESIGN_SYSTEM.md (items, activeKey, onChange, variant, fullWidth).
2. Underline variant: active tab has `text-purple-600 border-b-2 border-purple-500`; inactive has `text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300`; container has `border-b border-gray-200`.
3. Pill variant: active tab has `bg-white text-gray-900 shadow-xs rounded-md`; inactive has `text-gray-500 hover:text-gray-700 rounded-md`; container has `bg-gray-100 p-1 rounded-lg`.
4. Disabled tabs show `text-gray-300 cursor-not-allowed` and do not fire `onChange`.
5. Each tab item supports optional `icon` (before label) and `badge` (after label).
6. `fullWidth` distributes tabs equally across the container width.
7. Keyboard navigation: Left/Right arrow keys move focus between tabs; Enter/Space activates the focused tab.
8. ARIA: `role="tablist"` on container, `role="tab"` on each tab, `aria-selected` reflects active state, `aria-disabled` on disabled tabs.
9. Transitions: `transition-colors duration-150`.

**Complexity:** M

**Dependencies:** P0-01

---

### P1-04: Empty State Component

**Title:** Create Empty State component for zero-data scenarios

**Files to create or edit:**
- Create: `src/components/ui/EmptyState.tsx`

**Acceptance criteria:**
1. Exports an `EmptyState` component matching the `EmptyStateProps` interface from DESIGN_SYSTEM.md (icon, title, description, action, secondaryAction).
2. Layout: `flex flex-col items-center justify-center py-16 px-4`, inner container `max-w-xs text-center`.
3. Icon renders at `h-10 w-10 text-gray-400`.
4. Title: `text-h3 font-semibold text-gray-900`.
5. Description: `text-body text-gray-500`.
6. Primary action renders as a primary Button (using the Button component from P0-03) with `mt-4`.
7. Secondary action renders as a ghost Button or text link below the primary action.
8. Vertical gap between icon, title, and description is `gap-3`.

**Complexity:** S

**Dependencies:** P0-03

---

### P1-05: Skeleton / Loading Component

**Title:** Create Skeleton component with text, avatar, and card variants

**Files to create or edit:**
- Create: `src/components/ui/Skeleton.tsx`

**Acceptance criteria:**
1. Exports a `Skeleton` component matching the `SkeletonProps` interface from DESIGN_SYSTEM.md (variant, width, height, lines).
2. Three variants:
   - `text`: `h-4 w-full rounded bg-gray-200 animate-pulse` (default).
   - `avatar`: `h-10 w-10 rounded-full bg-gray-200 animate-pulse`.
   - `card`: `h-40 w-full rounded-lg bg-gray-200 animate-pulse`.
3. `width` and `height` props override defaults (accept Tailwind classes like `w-1/3` or CSS values).
4. `lines` prop (only for `text` variant) renders multiple skeleton lines stacked vertically with `gap-2`; the last line is shorter (`w-2/3`).
5. Accepts `className` for extension.
6. Animation uses Tailwind's built-in `animate-pulse`.

**Complexity:** S

**Dependencies:** P0-01

---

### P1-06: Form Validation Patterns

**Title:** Create useForm hook with field-level validation and error management

**Files to create or edit:**
- Create: `src/hooks/useForm.ts`

**Acceptance criteria:**
1. Exports a `useForm<T>` hook that accepts an initial values object and a validation rules map.
2. Returns: `values`, `errors`, `touched`, `isValid`, `isSubmitting`, `handleChange`, `handleBlur`, `handleSubmit`, `setFieldValue`, `setFieldError`, `resetForm`.
3. Built-in validators: `required`, `email` (regex validation), `minLength(n)`, `maxLength(n)`, `pattern(regex)`.
4. Validation runs on blur by default (field-level); full validation runs on submit.
5. `errors` is a `Record<keyof T, string | undefined>` mapping field names to error messages.
6. `handleSubmit` accepts an async callback, sets `isSubmitting` to true during execution, catches errors, and sets `isSubmitting` to false when done.
7. `touched` tracks which fields have been interacted with; errors only display for touched fields.
8. Works with the Input component (P0-04) by passing `error={touched.fieldName ? errors.fieldName : undefined}`.
9. Type-safe: field names are constrained to keys of `T`.

**Complexity:** M

**Dependencies:** P0-04

---

### P1-07: Dropdown Menu Component

**Title:** Create Dropdown Menu with trigger, items, icons, dividers, and keyboard navigation

**Files to create or edit:**
- Create: `src/components/ui/DropdownMenu.tsx`

**Acceptance criteria:**
1. Exports `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuItem`, and `DropdownMenuDivider` components.
2. Trigger: any element (typically a Button) that toggles the menu open/closed on click.
3. Menu panel: `bg-white rounded-lg shadow-lg border border-gray-200`, `min-w-[180px]`, `py-1`.
4. Menu items: `px-3 py-2 text-body text-gray-700 hover:bg-gray-50 cursor-pointer`, support optional leading icon, optional trailing shortcut text.
5. Divider: `border-t border-gray-100 my-1`.
6. Menu closes on: item click, click outside, Escape key.
7. Keyboard navigation: Arrow Down/Up moves focus through items; Enter/Space activates focused item; Home/End jump to first/last item.
8. Animation: scale from 95% to 100% + opacity 0 to 1, 150ms ease-out on open; reverse on close.
9. Menu positions below the trigger by default; flips above if insufficient viewport space (basic collision detection).
10. ARIA: `aria-expanded` on trigger, `role="menu"` on panel, `role="menuitem"` on items.

**Complexity:** M

**Dependencies:** P0-01

---

### P1-08: Tooltip Component

**Title:** Create Tooltip component with configurable placement and delay

**Files to create or edit:**
- Create: `src/components/ui/Tooltip.tsx`

**Acceptance criteria:**
1. Exports a `Tooltip` component that wraps a trigger element and shows a tooltip on hover/focus.
2. Props: `content` (string or ReactNode), `placement` (top | bottom | left | right, default top), `delay` (ms, default 200), `children` (trigger element).
3. Tooltip renders as a small dark panel: `bg-gray-900 text-white text-xs rounded-md px-2 py-1 shadow-md`.
4. Shows after `delay` ms of hover; hides immediately on mouse leave.
5. Keyboard accessible: shows on focus of the trigger, hides on blur.
6. Positioned relative to the trigger with a small offset (8px gap).
7. Has a small arrow/caret pointing to the trigger (optional, CSS-based).
8. Uses a portal to avoid clipping by overflow containers.
9. Sets `role="tooltip"` and links via `aria-describedby`.

**Complexity:** S

**Dependencies:** P0-01

---

### P1-09: Pagination Component

**Title:** Create Pagination component with page numbers, navigation, and page size selector

**Files to create or edit:**
- Create: `src/components/ui/Pagination.tsx`

**Acceptance criteria:**
1. Props: `currentPage`, `totalItems`, `pageSize`, `onPageChange`, `onPageSizeChange`, `pageSizeOptions` (default [10, 25, 50]).
2. Renders "Showing X--Y of Z" text on the left.
3. Renders page number buttons in the center/right; active page is highlighted with `bg-purple-500 text-white`; inactive pages are `text-gray-700 hover:bg-gray-100`.
4. Previous and Next buttons are rendered with arrow icons; disabled when on first/last page respectively.
5. Ellipsis (`...`) is shown when there are more than 7 pages (shows first, last, and window around current page).
6. Page size selector (using Select or a native `<select>`) allows changing items per page.
7. `onPageChange` fires with the new page number; `onPageSizeChange` fires with the new page size and resets to page 1.
8. All buttons use the design system focus ring.

**Complexity:** S

**Dependencies:** P0-03

---

### P1-10: Search Input Component

**Title:** Create Search Input with icon, clear button, and debounced onChange

**Files to create or edit:**
- Create: `src/components/ui/SearchInput.tsx`

**Acceptance criteria:**
1. Renders an Input-like element with a search icon (magnifying glass) on the left.
2. Clear button (X icon) appears on the right when the input has a value; clicking it clears the input and fires `onChange` with an empty string.
3. `onChange` callback is debounced by a configurable `debounceMs` prop (default 300ms).
4. Placeholder defaults to "Search..." but is configurable.
5. Optional keyboard shortcut hint badge displayed inside the input on the right (e.g., a small `Cmd+K` badge in `text-xxs text-gray-400 bg-gray-100 rounded px-1`), hidden when the input is focused or has a value.
6. Sizes match the Input component sizes (sm/md/lg).
7. Focus, hover, and disabled states match the Input component.
8. Component uses `forwardRef`.

**Complexity:** S

**Dependencies:** P0-04

---

## P2: Business Surfaces

These tasks build the application-specific pages and feature areas that combine the P0 and P1 components into functional business workflows.

---

### P2-01: Dashboard KPI Cards

**Title:** Create KPI card components for the main dashboard

**Files to create or edit:**
- Create: `src/components/dashboard/KPICard.tsx`
- Create: `src/components/dashboard/KPIHeader.tsx`

**Acceptance criteria:**
1. `KPICard` renders inside a Card (elevated variant) and displays: metric value (text-h1 font-bold), label (text-sm text-gray-500), and trend indicator (up/down arrow icon with green/red color and percentage text).
2. `KPIHeader` renders a row of 4--5 `KPICard` components in a responsive CSS Grid: 4--5 columns on desktop (>=1280px), 2 columns on tablet, 1 column on mobile.
3. Grid gap is `gap-4` (16px).
4. Trend indicator: green up arrow and text for positive, red down arrow and text for negative, gray dash for neutral/zero.
5. Each card has `min-h-[120px]` for visual consistency.
6. Cards accept a `loading` prop that shows a Skeleton (or inline pulse) in place of the value and trend.
7. Props for `KPICard`: `label: string`, `value: string | number`, `trend?: { value: number; direction: 'up' | 'down' | 'neutral' }`, `loading?: boolean`.

**Complexity:** M

**Dependencies:** P0-06, P1-02

---

### P2-02: Activity Feed Component

**Title:** Update Activity Feed with design system styling and relative timestamps

**Files to create or edit:**
- Edit: `src/components/activity/ActivityFeed.tsx`
- Edit: `src/components/activity/ActivityEntry.tsx`

**Acceptance criteria:**
1. Each entry renders with a left-aligned icon (colored per activity type), description text (text-body), and relative timestamp (text-xs text-gray-500) on the right.
2. Activity types have distinct icon colors: agent actions = purple, orders = blue, CRM = green, payments = amber, system = gray.
3. Entries are separated by `border-b border-gray-100` dividers.
4. Timestamps use relative format ("2 minutes ago", "3 hours ago", "Yesterday").
5. "Load more" button at the bottom is styled as a secondary Button component.
6. Empty state uses the EmptyState component with an appropriate icon and message.
7. "View all" link renders at the top-right when the feed is displayed in a summary context (e.g., on the dashboard), linking to the full Activity page.
8. Activity entry badges (e.g., status tags) use the Badge component.

**Complexity:** S

**Dependencies:** P1-02

---

### P2-03: CRM Pipeline Board

**Title:** Upgrade Pipeline View with drag-drop, card redesign, and column headers

**Files to create or edit:**
- Edit: `src/components/crm/PipelineView.tsx`

**Acceptance criteria:**
1. Pipeline renders as a horizontal board with one column per stage; columns are scrollable horizontally on overflow.
2. Each column has a header showing: stage name (text-h4 font-semibold), lead count Badge, and total value.
3. Lead cards render inside Cards (interactive variant) showing: contact name (font-semibold), avatar or initials circle, deal value with dollar icon, up to 2 tags as Badges, and contact method icons (phone/email).
4. Drag-and-drop: leads can be dragged between columns to change their stage. On drop, the workspace store is updated. Visual feedback during drag (card slightly elevated, shadow-lg, opacity reduced on source).
5. "Add lead" button at the bottom of each column opens a Modal for quick lead creation.
6. Empty columns show an EmptyState with stage-specific messaging.
7. Column backgrounds alternate subtly (e.g., every other column uses `bg-gray-50/50`).
8. Responsive: on screens < 768px, the board collapses to a stacked vertical layout or prompts the user to switch to list view.

**Complexity:** L

**Dependencies:** P0-06, P1-02, P1-04

---

### P2-04: CRM List View

**Title:** Create a table-based list view for CRM leads with search and filtering

**Files to create or edit:**
- Create: `src/components/crm/LeadsList.tsx`

**Acceptance criteria:**
1. Renders leads in a Table component with columns: checkbox, name, email, phone, stage (Badge), value (formatted currency), last activity (relative time), actions (dropdown menu).
2. Sortable columns: name, value, last activity.
3. Above the table: SearchInput for filtering by name/email, a stage filter (Select or pill tabs for filtering by pipeline stage), and a "View" toggle to switch between list and board views.
4. Bulk actions bar appears when rows are selected: "Move to stage", "Delete", "Export".
5. Clicking a row opens the existing ContactDetail component (or navigates to the lead detail).
6. Pagination below the table with configurable page size.
7. Empty state when no leads match the search/filter.
8. Loading state shows table skeleton rows.

**Complexity:** L

**Dependencies:** P1-01, P1-09, P1-10

---

### P2-05: Order List + Detail

**Title:** Build order management table and detail panel

**Files to create or edit:**
- Edit: `src/components/workspace/OrdersTab.tsx`
- Create: `src/components/workspace/OrderDetail.tsx`

**Acceptance criteria:**
1. `OrdersTab` renders a Table with columns: order number, customer name, date, total amount, status (Badge with semantic variant: pending=warning, fulfilled=success, cancelled=error, refunded=default), actions.
2. Table is sortable by date and amount.
3. SearchInput above the table filters by order number or customer name.
4. Clicking a row opens the `OrderDetail` component in a side panel or Modal (lg size).
5. `OrderDetail` shows: order header (order number, date, status badge), line items table (product, qty, unit price, subtotal), totals section (subtotal, tax, total), customer info, and a timeline of order events (placed, payment received, shipped, etc.).
6. Action buttons in OrderDetail: "Send Receipt" (secondary), "Refund" (danger), "Print" (ghost).
7. Loading state and empty state handled appropriately.
8. Status filter above the table (tabs or pill filter for All/Pending/Fulfilled/Cancelled).

**Complexity:** L

**Dependencies:** P1-01, P1-02, P0-08

---

### P2-06: Task Queue with Approvals

**Title:** Build task management list with status tabs, priority, and approval actions

**Files to create or edit:**
- Edit: `src/components/workspace/TasksTab.tsx`

**Acceptance criteria:**
1. Tab bar at top with tabs: All, Pending Approval, In Progress, Completed.
2. Task list renders using a Table or styled list with columns/fields: task title, priority badge (urgent=error, high=warning, normal=default, low=primary), assignee (avatar + name), due date, status badge, actions.
3. Approval tasks show "Approve" (primary Button, sm) and "Reject" (danger Button, sm) buttons inline.
4. Clicking Approve or Reject updates the task status and shows a success/error toast.
5. Tasks are sortable by priority and due date.
6. Empty state per tab ("No pending approvals", etc.).
7. Task count badges on each tab header.

**Complexity:** M

**Dependencies:** P1-01, P1-02, P1-03

---

### P2-07: Invoice List + Preview

**Title:** Build invoice management table and document-style preview

**Files to create or edit:**
- Edit: `src/components/workspace/PaymentsTab.tsx`
- Create: `src/components/workspace/InvoicePreview.tsx`

**Acceptance criteria:**
1. `PaymentsTab` renders a Table with columns: invoice number, customer, date, due date, amount, status (Badge: draft=default, sent=primary, paid=success, overdue=error), actions (dropdown: View, Send, Download, Delete).
2. Sortable by date, due date, and amount.
3. SearchInput filters by invoice number or customer name.
4. Status filter tabs above the table.
5. Clicking a row or "View" action opens the `InvoicePreview` in a Modal (full size).
6. `InvoicePreview` renders a document-style layout: business logo/name at top, bill-to address block, line items table, subtotal/tax/total, payment terms, and footer notes.
7. Preview footer has action buttons: "Download PDF" (primary), "Send to Customer" (secondary), "Close" (ghost).
8. Pagination and loading states handled.

**Complexity:** L

**Dependencies:** P1-01, P0-08, P1-02

---

### P2-08: Inbox / Messaging

**Title:** Build two-panel messaging interface with conversation list and thread view

**Files to create or edit:**
- Edit: `src/components/workspace/MessagesTab.tsx`
- Create: `src/components/inbox/ConversationList.tsx`
- Create: `src/components/inbox/MessageThread.tsx`
- Create: `src/components/inbox/Composer.tsx`

**Acceptance criteria:**
1. `MessagesTab` renders a two-panel layout: conversation list on the left (320px, border-r), message thread on the right (flex-1).
2. `ConversationList` shows: avatar, contact name, last message preview (truncated), timestamp, unread indicator (purple dot), channel icon (WhatsApp/email/SMS).
3. Active conversation is highlighted with `bg-purple-50`.
4. SearchInput at the top of the conversation list filters by contact name.
5. `MessageThread` shows: contact header bar (avatar, name, channel badge), scrollable message list, and composer at the bottom.
6. Message bubbles: outgoing messages are right-aligned with `bg-purple-500 text-white rounded-2xl`; incoming are left-aligned with `bg-gray-100 text-gray-900 rounded-2xl`.
7. Internal notes render with a yellow background (`bg-warning-light`) and an "Internal Note" label.
8. `Composer` has a text input (auto-expanding textarea), send button (primary), attach button (ghost/icon-only), and a template selector dropdown.
9. Empty state when no conversations exist.
10. Responsive: on mobile (< 768px), only one panel shows at a time (list or thread) with a back button to return to the list.

**Complexity:** L

**Dependencies:** P0-04, P1-10

---

### P2-09: Integrations Page

**Title:** Create integrations management page with connector cards

**Files to create or edit:**
- Create: `src/components/integrations/ConnectorCard.tsx`
- Create: `src/components/integrations/IntegrationsGrid.tsx`

**Acceptance criteria:**
1. `IntegrationsGrid` renders two sections: "Connected" and "Available", each with a section heading.
2. Each section displays `ConnectorCard` components in a responsive grid: 3 columns on desktop, 2 on tablet, 1 on mobile, with `gap-4`.
3. `ConnectorCard` renders inside a Card (default variant) with: integration icon/logo (48x48), name (text-h4 font-semibold), short description (text-sm text-gray-500), and status badge (Connected=success, Not Connected=default).
4. Connected cards show a "Settings" button (secondary, sm) and a "Disconnect" option in a dropdown menu.
5. Available cards show a "Connect" button (primary, sm).
6. Clicking Connect triggers an OAuth flow or opens a configuration Modal.
7. Empty state for "Available" section if all integrations are connected.
8. Search/filter at the top to find integrations by name.

**Complexity:** M

**Dependencies:** P0-06, P1-02

---

### P2-10: AI Battery / Credits

**Title:** Create AI usage dashboard with credit bar, action log, and agent breakdown

**Files to create or edit:**
- Create: `src/components/dashboard/AIBattery.tsx`

**Acceptance criteria:**
1. Renders inside a Card with a header "AI Credits".
2. Usage bar: a horizontal progress bar showing "X of Y credits used". Fill color: `bg-purple-500` when < 75%, `bg-warning` when 75--90%, `bg-error` when > 90%. Background: `bg-gray-200`. Height: 8px, `rounded-full`.
3. Below the bar: text showing "X credits remaining" and "Resets in N days".
4. Action log: a compact Table showing the last 10 AI actions with columns: timestamp, agent name, action description, credits used.
5. Top agents: a small summary showing which AI agents consumed the most credits (agent name + percentage bar).
6. Upgrade CTA: when usage > 80%, a banner appears with "Running low on credits" message and an "Upgrade Plan" primary button.
7. Card accepts a `loading` prop that shows skeletons.

**Complexity:** M

**Dependencies:** P0-06, P1-01

---

## P3: Polish + Advanced

These tasks add visual polish, accessibility hardening, advanced interactions, and quality-of-life features. They can be worked on in any order once their dependencies are met, and can be interleaved with P2 work.

---

### P3-01: Sidebar Collapse Animation

**Title:** Animate sidebar collapse to icon-only mode with tooltip labels

**Files to create or edit:**
- Edit: `src/components/layout/TopNavBar.tsx`

**Acceptance criteria:**
1. Sidebar collapses to 64px width with a smooth `transition-[width] duration-300 ease-in-out` animation.
2. Nav item labels fade out during collapse and fade in during expand (`transition-opacity duration-200`).
3. In collapsed mode, hovering over a nav icon shows a Tooltip with the item label (using the Tooltip component from P1-08).
4. The collapse toggle button animates (chevron icon rotates 180 degrees).
5. Logo text collapses to an icon or single letter in collapsed mode.
6. Language selector and user section adapt to collapsed mode (show abbreviated or icon-only versions).
7. Collapse preference is persisted to localStorage and restored on page load.
8. Respects `prefers-reduced-motion` by disabling animations when requested.

**Complexity:** M

**Dependencies:** P0-07

---

### P3-02: Dark Mode Support

**Title:** Implement dark color tokens, system preference detection, and manual toggle

**Files to create or edit:**
- Edit: `src/index.css`
- Edit: `src/components/layout/TopNavBar.tsx` (add toggle)
- Edit: `src/stores/settingsStore.ts` (add theme preference)
- Edit: Multiple components (ensure they use token-based colors)

**Acceptance criteria:**
1. Dark mode color tokens are defined in `src/index.css` inside a `@media (prefers-color-scheme: dark)` block or a `.dark` class scope, covering all surface, text, border, and semantic colors.
2. `settingsStore` has a `theme` preference: `'system' | 'light' | 'dark'`.
3. A toggle in the sidebar or settings allows switching between system/light/dark.
4. When set to `system`, the app respects the OS preference via `prefers-color-scheme`.
5. The `<html>` element receives a `dark` class when dark mode is active.
6. All surface colors invert appropriately: backgrounds become dark (e.g., gray-900/950), text becomes light (gray-50/100), borders become subtle (gray-700/800).
7. Purple brand colors remain consistent; shadows become more subtle (lower opacity).
8. Theme preference is persisted to localStorage.
9. No flash of wrong theme on page load (theme class is applied before render).
10. At minimum, all P0 components (Button, Input, Select, Card, Modal, Toast) render correctly in dark mode.

**Complexity:** L

**Dependencies:** P0-01

---

### P3-03: Keyboard Shortcuts System

**Title:** Create useKeyboardShortcuts hook and shortcut help modal

**Files to create or edit:**
- Create: `src/hooks/useKeyboardShortcuts.ts`

**Acceptance criteria:**
1. Exports a `useKeyboardShortcuts` hook that registers global keyboard shortcuts.
2. Accepts a map of shortcut definitions: `{ keys: string (e.g., 'mod+k'), handler: () => void, description: string, enabled?: boolean }`.
3. `mod` resolves to `Cmd` on macOS and `Ctrl` on Windows/Linux.
4. Shortcuts are only active when no input/textarea/contenteditable is focused (unless explicitly overridden).
5. Supports common shortcuts out of the box: `mod+k` (search/command palette), `Escape` (close modal/panel), `?` (show shortcut help).
6. A `ShortcutHelpModal` component (or integration point) lists all registered shortcuts in a Modal, grouped by category.
7. Shortcuts are cleaned up on unmount.
8. Multiple hooks can register shortcuts without conflicts (last-registered wins for duplicates, or all fire).

**Complexity:** M

**Dependencies:** P0-08

---

### P3-04: Command Palette (Cmd+K)

**Title:** Create a searchable command palette for quick navigation and actions

**Files to create or edit:**
- Create: `src/components/ui/CommandPalette.tsx`

**Acceptance criteria:**
1. Opens with `Cmd+K` (or `Ctrl+K`) via the keyboard shortcuts system.
2. Renders as a centered Modal-like overlay with a large search input at the top.
3. Search results are grouped by category: Pages, Actions, Contacts, Recent.
4. Each result shows: icon, label, optional description, and optional keyboard shortcut hint.
5. Arrow Up/Down navigates results; Enter activates the selected result; Escape closes the palette.
6. Results filter as the user types with instant feedback (no debounce needed for local data).
7. "Recent searches" section shows the last 5 searches, persisted to localStorage.
8. No results state shows "No results found" with the search query echoed.
9. Page navigation results route to the corresponding page via React Router.
10. Action results execute their handler (e.g., "Create Invoice", "Add Lead").
11. Contact results navigate to the contact detail view.

**Complexity:** L

**Dependencies:** P0-08, P3-03

---

### P3-05: Page Transition Animations

**Title:** Add fade transitions between route changes

**Files to create or edit:**
- Edit: `src/App.tsx`

**Acceptance criteria:**
1. Route transitions use a fade effect (opacity 0 to 1 on enter, 1 to 0 on exit).
2. Transition duration: 200ms, ease-out on enter, ease-in on exit.
3. Uses React Router's transition capabilities or a wrapper component (e.g., `framer-motion`'s `AnimatePresence` or CSS transitions).
4. Respects `prefers-reduced-motion`: when the user has requested reduced motion, transitions are instant (duration 0ms) or disabled entirely.
5. The Suspense fallback (loading state) does not trigger a transition animation.
6. No layout shift during transitions (outgoing and incoming pages do not overlap or cause scroll jumps).

**Complexity:** S

**Dependencies:** P0-01

---

### P3-06: Notification Center

**Title:** Create notification bell with dropdown panel and notification list

**Files to create or edit:**
- Create: `src/components/layout/NotificationCenter.tsx`

**Acceptance criteria:**
1. A bell icon button in the top bar (or sidebar header) with an unread count badge (red dot or number badge).
2. Clicking the bell opens a DropdownMenu-style panel (320px wide, max-h-[400px], scrollable).
3. Each notification shows: icon (colored per type), title (text-body font-medium), description (text-sm text-gray-500), relative timestamp (text-xs text-gray-400).
4. Unread notifications have a `bg-purple-50` background or a left purple bar indicator.
5. "Mark all as read" button at the top of the panel.
6. Clicking a notification marks it as read and navigates to the relevant page/entity.
7. Empty state when no notifications exist.
8. Badge hides when unread count is 0.

**Complexity:** M

**Dependencies:** P1-07, P1-02

---

### P3-07: Settings Page Rebuild

**Title:** Rebuild Settings page with section navigation and form-based settings cards

**Files to create or edit:**
- Edit: `src/pages/SettingsPage.tsx`
- Create: `src/components/settings/GeneralSettings.tsx`
- Create: `src/components/settings/TeamSettings.tsx`
- Create: `src/components/settings/BillingSettings.tsx`

**Acceptance criteria:**
1. `SettingsPage` renders the Settings Layout from DESIGN_SYSTEM.md: left nav (200px) + content area (max-w-2xl).
2. Left nav sections: General, Team, Billing (with potential for Integrations and API Keys later).
3. Active section indicator: `text-purple-700 bg-purple-50 font-medium rounded-md`.
4. `GeneralSettings` contains Cards for: Business Information (name, address, phone), Locale (timezone Select, currency Select, language Select), and Notifications (toggle switches for email/push notifications).
5. `TeamSettings` contains: a Table of team members (name, email, role Badge, actions dropdown with Edit/Remove), and an "Invite Member" Button that opens a Modal with an email input.
6. `BillingSettings` contains: current plan Card with plan name/price/features, "Change Plan" button, payment method Card with masked card number and "Update" button, and billing history Table (date, description, amount, status, download link).
7. Each settings Card has Save/Cancel buttons in the footer; Save triggers form validation (useForm hook) and shows a success/error toast.
8. Section navigation is defined by URL hash or query parameter (e.g., `/settings?section=team`) so sections are deep-linkable.
9. Left nav is sticky (`sticky top-24`).

**Complexity:** L

**Dependencies:** P0-04, P0-03, P1-03

---

### P3-08: Mobile Responsive Overhaul

**Title:** Comprehensive mobile responsive improvements across all layouts

**Files to create or edit:**
- Edit: `src/components/layout/DashboardLayout.tsx`
- Edit: `src/components/layout/TopNavBar.tsx`
- Edit: Multiple page and component files

**Acceptance criteria:**
1. Mobile (< 768px):
   - Sidebar is completely hidden; a hamburger button in a top header bar toggles it as a full-screen overlay with backdrop.
   - Optional bottom navigation bar with 4--5 key icons (Home, Workspace, Agents, Activity, Settings) as an alternative to the overlay sidebar.
   - Top header bar (h-14) shows: hamburger toggle, "Kitz" logo (centered), and notification bell.
2. Tables collapse to card-based lists on mobile: each row becomes a Card showing key fields stacked vertically with field labels.
3. Inbox messaging: only one panel visible at a time (conversation list or thread); selecting a conversation transitions to the thread view with a back button.
4. Modals render as full-screen sheets on mobile (`rounded-none`, `h-full`, slide up from bottom).
5. KPI cards stack to a single column.
6. Pipeline board collapses to a vertical stack or prompts switching to list view.
7. All touch targets meet minimum 44x44px hit area.
8. No horizontal scroll on any page at mobile widths.

**Complexity:** L

**Dependencies:** P0-07

---

### P3-09: Accessibility Audit + Fixes

**Title:** Comprehensive accessibility audit and remediation across all components

**Files to create or edit:**
- Edit: Multiple component files across `src/components/`

**Acceptance criteria:**
1. All interactive elements (buttons, links, inputs, selects, tabs, menu items) have visible focus rings per the design system (`focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`).
2. All icon-only buttons have `aria-label` attributes describing their action.
3. A skip-to-content link is rendered as the first focusable element in the App Shell, visually hidden until focused.
4. All images and decorative icons have appropriate `alt` text or `aria-hidden="true"`.
5. Form inputs are associated with labels via `htmlFor`/`id` or wrapping `<label>` elements.
6. Error messages are linked to their inputs via `aria-describedby`.
7. Modal and dropdown components trap focus correctly and announce themselves to screen readers.
8. Tables have `<caption>` or `aria-label` for screen reader context.
9. Color is not the sole means of conveying information (e.g., error states also use icons or text, not just red color).
10. All animations respect `prefers-reduced-motion` (use Tailwind `motion-reduce:` variant).
11. Page passes axe-core automated audit with zero critical or serious violations.
12. Manual testing with VoiceOver (macOS) confirms a logical reading order and operable interactions.

**Complexity:** L

**Dependencies:** All P0 and P1 tasks

---

### P3-10: UI Preview Page

**Title:** Create a single-page UI component gallery for visual QA

**Files to create or edit:**
- Create: `src/pages/UIPreviewPage.tsx`

**Acceptance criteria:**
1. A dedicated route (e.g., `/ui-preview`) renders all core components with every variant and state on a single scrollable page.
2. Sections for each component: Button (all variants x sizes x states), Input (all sizes x states), Select, Card (all variants), Modal (triggered by buttons), Toast (triggered by buttons), Badge (all variants x sizes), Tabs (both variants), EmptyState, Skeleton (all variants), Table (with sample data), Pagination, SearchInput, DropdownMenu, Tooltip.
3. Each section has a heading (component name) and subsections for variants/states.
4. Interactive components are functional (buttons trigger toasts, modals open, etc.).
5. Page is only accessible in development mode (guarded by `import.meta.env.DEV` or similar).
6. Typography section at the top shows all type scale tokens rendered with sample text.
7. Color palette section shows all brand, neutral, and semantic colors as swatches with hex values.
8. Page uses the DashboardLayout but with a "UI Preview" title in the top bar.

**Complexity:** M

**Dependencies:** All P0 and P1 tasks

---

## Dependency Graph

The following shows the critical path through the backlog. Tasks with no arrow are leaf nodes.

```
P0-01 (Design Tokens)
 |-- P0-02 (Typography)
 |-- P0-03 (Button) --> P1-04 (Empty State) --> P2-03 (Pipeline Board)
 |                  --> P1-09 (Pagination)   --> P2-04 (CRM List)
 |-- P0-04 (Input)  --> P0-05 (Select)
 |                  --> P1-06 (useForm)      --> P3-07 (Settings)
 |                  --> P1-10 (Search Input)  --> P2-04, P2-08 (Inbox)
 |-- P0-06 (Card)   --> P1-01 (Table)        --> P2-04, P2-05, P2-06, P2-07
 |                  --> P2-01 (KPI Cards)
 |                  --> P2-09 (Integrations)
 |                  --> P2-10 (AI Battery)
 |-- P0-07 (Layout) --> P3-01 (Collapse Anim)
 |                  --> P3-08 (Mobile)
 |-- P0-08 (Modal)  --> P2-05 (Orders)
 |                  --> P2-07 (Invoices)
 |                  --> P3-03 (Shortcuts)     --> P3-04 (Cmd+K)
 |-- P0-09 (Toast)
 |
P1-02 (Badge) --> P2-02 (Activity Feed)
              --> P2-03 (Pipeline Board)
              --> P3-06 (Notifications)
P1-03 (Tabs)  --> P2-06 (Task Queue)
              --> P3-07 (Settings)
P1-07 (Dropdown) --> P3-06 (Notifications)
P1-08 (Tooltip)  --> P3-01 (Collapse Anim)
P1-05 (Skeleton) -- no downstream dependencies (used passively)
```

---

## Notes for Implementers

1. **File naming convention:** All component files use PascalCase (e.g., `Button.tsx`, `KPICard.tsx`). Hooks use camelCase (e.g., `useForm.ts`). Stores use camelCase with "Store" suffix (e.g., `toastStore.ts`).

2. **Exports:** Use named exports for all components and hooks. Default exports are reserved for lazy-loaded page components.

3. **Testing:** Each P0 and P1 component should have corresponding unit tests covering all variants, sizes, and states. Use React Testing Library. Tests are not tracked as separate backlog items but are expected as part of each task's "definition of done."

4. **Design system compliance:** When in doubt, refer to DESIGN_SYSTEM.md. The design system document is the single source of truth for all visual decisions.

5. **Incremental delivery:** Each task is designed to be a self-contained pull request. Avoid bundling multiple backlog items into a single PR unless they are tightly coupled (e.g., P0-01 and P0-02 may be combined).

6. **Token-first approach:** Never hardcode hex colors, pixel sizes, or shadows directly in components. Always use Tailwind utility classes that resolve to the registered tokens. This ensures dark mode and future theming work correctly.
