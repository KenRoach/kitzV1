# Kitz Design System Foundation

> **Kitz** -- AI-native small business operating system.
> **Stack:** React 19 + Tailwind CSS v4 + TypeScript
> **Brand direction:** Premium, minimal, modern, geometric typography, deep flat colors.
> **Primary brand color:** Purple
> **Font:** Inter

This document defines every design token, component specification, and layout template required to build the Kitz UI. It is intended to be directly implementable: an engineer should be able to read a section and produce production-quality code without ambiguity.

---

## Design Tokens

All tokens are defined once and consumed through Tailwind utility classes or CSS custom properties. Tailwind CSS v4 uses `@theme` directives in your CSS entry point to register custom values. Where applicable, exact CSS custom property names are provided so they can be referenced in both Tailwind config and runtime styles.

---

### Type Scale

**Font family:** `Inter, ui-sans-serif, system-ui, -apple-system, sans-serif`

| Token     | Size (px) | Size (rem)  | Tailwind Class   | Usage                          |
|-----------|-----------|-------------|------------------|--------------------------------|
| `display` | 36        | 2.25        | `text-display`   | Page hero titles               |
| `h1`      | 30        | 1.875       | `text-h1`        | Page titles                    |
| `h2`      | 24        | 1.5         | `text-h2`        | Section titles                 |
| `h3`      | 20        | 1.25        | `text-h3`        | Card titles                    |
| `h4`      | 16        | 1           | `text-h4`        | Subsection titles              |
| `body`    | 14        | 0.875       | `text-body`      | Default body text              |
| `sm`      | 13        | 0.8125      | `text-sm`        | Secondary text                 |
| `xs`      | 12        | 0.75        | `text-xs`        | Captions, labels, metadata     |
| `xxs`     | 11        | 0.6875      | `text-xxs`       | Fine print, badges             |

**Font weights:**

| Token      | Value | Tailwind Class    | Usage                            |
|------------|-------|-------------------|----------------------------------|
| `regular`  | 400   | `font-normal`     | Body text, descriptions          |
| `medium`   | 500   | `font-medium`     | Labels, emphasized body text     |
| `semibold` | 600   | `font-semibold`   | Headings, buttons, nav items     |
| `bold`     | 700   | `font-bold`       | Display text, strong emphasis    |

**Line heights:**

| Token     | Value | Tailwind Class       | Usage                             |
|-----------|-------|----------------------|-----------------------------------|
| `tight`   | 1.25  | `leading-tight`      | Headings, display text            |
| `normal`  | 1.5   | `leading-normal`     | Body text, paragraphs             |
| `relaxed` | 1.625 | `leading-relaxed`    | Long-form content, descriptions   |

**Letter spacing:**

| Token    | Value      | Tailwind Class       | Usage                            |
|----------|------------|----------------------|----------------------------------|
| `tight`  | -0.025em   | `tracking-tight`     | Headings (h1, h2, display)       |
| `normal` | 0          | `tracking-normal`    | Body text                        |
| `wide`   | 0.025em    | `tracking-wide`      | Labels, badges, uppercase text   |

**Tailwind v4 CSS registration:**

```css
@theme {
  --font-family-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;

  --font-size-display: 2.25rem;
  --font-size-h1: 1.875rem;
  --font-size-h2: 1.5rem;
  --font-size-h3: 1.25rem;
  --font-size-h4: 1rem;
  --font-size-body: 0.875rem;
  --font-size-sm: 0.8125rem;
  --font-size-xs: 0.75rem;
  --font-size-xxs: 0.6875rem;
}
```

**Heading composition examples:**

```html
<!-- Display -->
<h1 class="text-display font-bold leading-tight tracking-tight text-gray-900">
  Dashboard
</h1>

<!-- H1 -->
<h1 class="text-h1 font-semibold leading-tight tracking-tight text-gray-900">
  Invoices
</h1>

<!-- H2 -->
<h2 class="text-h2 font-semibold leading-tight tracking-tight text-gray-900">
  Recent Activity
</h2>

<!-- H3 -->
<h3 class="text-h3 font-semibold leading-tight text-gray-900">
  Revenue Overview
</h3>

<!-- H4 -->
<h4 class="text-h4 font-medium leading-normal text-gray-900">
  Payment Methods
</h4>

<!-- Body -->
<p class="text-body font-normal leading-normal text-gray-700">
  Your next invoice is due on March 15.
</p>

<!-- Small / Secondary -->
<span class="text-sm font-normal leading-normal text-gray-500">
  Last updated 3 hours ago
</span>

<!-- XS / Caption -->
<span class="text-xs font-medium leading-normal tracking-wide text-gray-500 uppercase">
  Status
</span>

<!-- XXS / Badge -->
<span class="text-xxs font-medium leading-normal tracking-wide">
  NEW
</span>
```

---

### Spacing Scale

Base unit: **4px**. All spacing is derived from multiples of this base.

| Token | Value (px) | Value (rem) | Tailwind Class         | Common Usage                        |
|-------|------------|-------------|------------------------|-------------------------------------|
| `0`   | 0          | 0           | `p-0`, `m-0`, `gap-0`  | Reset                               |
| `1`   | 4px        | 0.25rem     | `p-1`, `m-1`, `gap-1`  | Tight inline spacing                |
| `2`   | 8px        | 0.5rem      | `p-2`, `m-2`, `gap-2`  | Icon-to-text gap, small padding     |
| `3`   | 12px       | 0.75rem     | `p-3`, `m-3`, `gap-3`  | Compact card padding                |
| `4`   | 16px       | 1rem        | `p-4`, `m-4`, `gap-4`  | Default card padding, section gaps  |
| `5`   | 20px       | 1.25rem     | `p-5`, `m-5`, `gap-5`  | Comfortable padding                 |
| `6`   | 24px       | 1.5rem      | `p-6`, `m-6`, `gap-6`  | Large card padding, major gaps      |
| `8`   | 32px       | 2rem        | `p-8`, `m-8`, `gap-8`  | Section separation                  |
| `10`  | 40px       | 2.5rem      | `p-10`, `m-10`         | Page-level top/bottom padding       |
| `12`  | 48px       | 3rem        | `p-12`, `m-12`         | Major section breaks                |
| `16`  | 64px       | 4rem        | `p-16`, `m-16`         | Page vertical padding               |
| `20`  | 80px       | 5rem        | `p-20`, `m-20`         | Hero section spacing                |
| `24`  | 96px       | 6rem        | `p-24`, `m-24`         | Maximum vertical spacing            |

**Spacing guidelines:**

- Inline element gaps (icon + label): `gap-2` (8px)
- Form field vertical stacking: `gap-4` (16px)
- Card internal padding: `p-4` (16px) or `p-6` (24px)
- Section vertical separation: `gap-8` (32px) or `gap-12` (48px)
- Page-level horizontal padding: `px-6` (24px)
- Page-level vertical padding: `py-8` (32px)

---

### Color Palette

All colors are defined as CSS custom properties and mapped into Tailwind via the `@theme` directive. Use `var(--color-*)` in CSS or the corresponding Tailwind utility classes (e.g., `bg-purple-500`, `text-gray-700`).

#### Brand -- Purple

| Token          | Hex       | CSS Variable             | Tailwind Class     | Usage                          |
|----------------|-----------|--------------------------|--------------------|--------------------------------|
| `purple-50`    | `#faf5ff` | `--color-purple-50`      | `bg-purple-50`     | Lightest tint, selected row bg |
| `purple-100`   | `#f3e8ff` | `--color-purple-100`     | `bg-purple-100`    | Light tint, hover backgrounds  |
| `purple-200`   | `#e9d5ff` | `--color-purple-200`     | `bg-purple-200`    | Focus ring fill, soft accents  |
| `purple-300`   | `#d8b4fe` | `--color-purple-300`     | `bg-purple-300`    | Decorative elements            |
| `purple-400`   | `#c084fc` | `--color-purple-400`     | `bg-purple-400`    | Secondary accent               |
| `purple-500`   | `#a855f7` | `--color-purple-500`     | `bg-purple-500`    | **Primary** -- buttons, links  |
| `purple-600`   | `#9333ea` | `--color-purple-600`     | `bg-purple-600`    | **Primary hover**              |
| `purple-700`   | `#7c3aed` | `--color-purple-700`     | `bg-purple-700`    | Active/pressed state           |
| `purple-800`   | `#6b21a8` | `--color-purple-800`     | `bg-purple-800`    | Dark accents                   |
| `purple-900`   | `#581c87` | `--color-purple-900`     | `bg-purple-900`    | Darkest brand tone             |

#### Neutrals -- Gray

| Token          | Hex       | CSS Variable             | Tailwind Class     | Usage                            |
|----------------|-----------|--------------------------|--------------------|----------------------------------|
| `gray-50`      | `#f8fafc` | `--color-gray-50`        | `bg-gray-50`       | Secondary surface, hover rows    |
| `gray-100`     | `#f1f5f9` | `--color-gray-100`       | `bg-gray-100`      | Tertiary surface, dividers       |
| `gray-200`     | `#e2e8f0` | `--color-gray-200`       | `border-gray-200`  | Default borders                  |
| `gray-300`     | `#cbd5e1` | `--color-gray-300`       | `border-gray-300`  | Strong borders, disabled bg      |
| `gray-400`     | `#94a3b8` | `--color-gray-400`       | `text-gray-400`    | Placeholder text, disabled text  |
| `gray-500`     | `#64748b` | `--color-gray-500`       | `text-gray-500`    | Secondary text, captions         |
| `gray-600`     | `#475569` | `--color-gray-600`       | `text-gray-600`    | Tertiary headings, labels        |
| `gray-700`     | `#334155` | `--color-gray-700`       | `text-gray-700`    | Body text                        |
| `gray-800`     | `#1e293b` | `--color-gray-800`       | `text-gray-800`    | Emphasized body text             |
| `gray-900`     | `#0f172a` | `--color-gray-900`       | `text-gray-900`    | Headings, primary text           |
| `gray-950`     | `#020617` | `--color-gray-950`       | `text-gray-950`    | Maximum contrast text            |

#### Semantic Colors

| Token           | Hex        | CSS Variable              | Tailwind Class      | Usage                         |
|-----------------|------------|---------------------------|---------------------|-------------------------------|
| `success`       | `#22c55e`  | `--color-success`         | `text-success`      | Success text, icons           |
| `success-light` | `#dcfce7`  | `--color-success-light`   | `bg-success-light`  | Success background fills      |
| `error`         | `#ef4444`  | `--color-error`           | `text-error`        | Error text, icons, borders    |
| `error-light`   | `#fee2e2`  | `--color-error-light`     | `bg-error-light`    | Error background fills        |
| `warning`       | `#f59e0b`  | `--color-warning`         | `text-warning`      | Warning text, icons           |
| `warning-light` | `#fef3c7`  | `--color-warning-light`   | `bg-warning-light`  | Warning background fills      |
| `info`          | `#3b82f6`  | `--color-info`            | `text-info`         | Informational text, icons     |
| `info-light`    | `#dbeafe`  | `--color-info-light`      | `bg-info-light`     | Informational background fills|

#### Surface Colors

| Token               | Value                    | CSS Variable                  | Usage                              |
|---------------------|--------------------------|-------------------------------|------------------------------------|
| `surface-primary`   | `#ffffff`                | `--color-surface-primary`     | Main content background            |
| `surface-secondary` | `#f8fafc`                | `--color-surface-secondary`   | Sidebar, secondary panels          |
| `surface-tertiary`  | `#f1f5f9`                | `--color-surface-tertiary`    | Inset areas, nested containers     |
| `surface-elevated`  | `#ffffff`                | `--color-surface-elevated`    | Cards, dropdowns (with shadow)     |
| `surface-overlay`   | `rgba(0, 0, 0, 0.5)`    | `--color-surface-overlay`     | Modal/dialog backdrop              |
| `surface-dark`      | `#1e1b4b`                | `--color-surface-dark`        | AI chat panel, dark regions        |

**Tailwind v4 CSS registration:**

```css
@theme {
  /* Brand */
  --color-purple-50: #faf5ff;
  --color-purple-100: #f3e8ff;
  --color-purple-200: #e9d5ff;
  --color-purple-300: #d8b4fe;
  --color-purple-400: #c084fc;
  --color-purple-500: #a855f7;
  --color-purple-600: #9333ea;
  --color-purple-700: #7c3aed;
  --color-purple-800: #6b21a8;
  --color-purple-900: #581c87;

  /* Neutrals */
  --color-gray-50: #f8fafc;
  --color-gray-100: #f1f5f9;
  --color-gray-200: #e2e8f0;
  --color-gray-300: #cbd5e1;
  --color-gray-400: #94a3b8;
  --color-gray-500: #64748b;
  --color-gray-600: #475569;
  --color-gray-700: #334155;
  --color-gray-800: #1e293b;
  --color-gray-900: #0f172a;
  --color-gray-950: #020617;

  /* Semantic */
  --color-success: #22c55e;
  --color-success-light: #dcfce7;
  --color-error: #ef4444;
  --color-error-light: #fee2e2;
  --color-warning: #f59e0b;
  --color-warning-light: #fef3c7;
  --color-info: #3b82f6;
  --color-info-light: #dbeafe;

  /* Surfaces */
  --color-surface-primary: #ffffff;
  --color-surface-secondary: #f8fafc;
  --color-surface-tertiary: #f1f5f9;
  --color-surface-elevated: #ffffff;
  --color-surface-overlay: rgba(0, 0, 0, 0.5);
  --color-surface-dark: #1e1b4b;
}
```

---

### Border Radius

| Token   | Value    | Tailwind Class   | Usage                            |
|---------|----------|------------------|----------------------------------|
| `none`  | 0        | `rounded-none`   | No rounding                      |
| `sm`    | 4px      | `rounded-sm`     | Badges, small elements, chips    |
| `md`    | 8px      | `rounded-md`     | Inputs, buttons, dropdowns       |
| `lg`    | 12px     | `rounded-lg`     | Cards, containers, panels        |
| `xl`    | 16px     | `rounded-xl`     | Modals, popovers, large panels   |
| `full`  | 9999px   | `rounded-full`   | Pills, avatars, circular buttons |

**Tailwind v4 CSS registration:**

```css
@theme {
  --radius-none: 0;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}
```

---

### Shadows

| Token | Value                                                          | Tailwind Class | Usage                            |
|-------|----------------------------------------------------------------|----------------|----------------------------------|
| `xs`  | `0 1px 2px rgba(0, 0, 0, 0.05)`                               | `shadow-xs`    | Subtle lift, badges              |
| `sm`  | `0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)` | `shadow-sm`    | Buttons, small cards             |
| `md`  | `0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)` | `shadow-md`    | Elevated cards, dropdowns        |
| `lg`  | `0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)` | `shadow-lg`    | Modals, popovers                 |
| `xl`  | `0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)` | `shadow-xl`    | Full-screen overlays, hero cards |

**Tailwind v4 CSS registration:**

```css
@theme {
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
}
```

---

### Borders

| Token     | Value                                    | Usage                                  |
|-----------|------------------------------------------|----------------------------------------|
| `default` | `1px solid var(--color-gray-200)`        | Card borders, dividers, table rows     |
| `strong`  | `1px solid var(--color-gray-300)`        | Emphasized borders, active input idle  |
| `focus`   | `2px solid var(--color-purple-500)`      | Focus rings on inputs and interactive  |
| `error`   | `1px solid var(--color-error)`           | Inputs with validation errors          |
| `success` | `1px solid var(--color-success)`         | Inputs with success validation         |

**Focus ring pattern (all interactive elements):**

```html
<!-- Standard focus ring using Tailwind -->
<button class="... focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
```

For inputs, prefer a border-based focus indicator rather than a ring:

```html
<input class="... border border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
```

---

### Transitions

| Token    | Duration | Easing     | Tailwind Class                    | Usage                             |
|----------|----------|------------|-----------------------------------|-----------------------------------|
| `fast`   | 150ms    | ease       | `transition duration-150`         | Hover states, toggles             |
| `normal` | 200ms    | ease       | `transition duration-200`         | Buttons, inputs, general UI       |
| `slow`   | 300ms    | ease       | `transition duration-300`         | Modals, panels, page transitions  |

**Easing guidelines:**

- **Entrances:** `ease-out` -- elements decelerate as they arrive.
- **Exits:** `ease-in` -- elements accelerate as they leave.
- **State changes (hover, focus):** `ease` -- symmetric transition.

**Common transition compositions:**

```html
<!-- Button hover/focus -->
<button class="transition-colors duration-150 ease-in-out">

<!-- Modal entrance -->
<div class="transition-all duration-200 ease-out">

<!-- Sidebar collapse -->
<aside class="transition-[width] duration-300 ease-in-out">
```

---

## Component Specifications

Each component below includes its variants, sizes, states, TypeScript props interface, and Tailwind class compositions. Components are designed for React 19 with `forwardRef` patterns where applicable.

---

### Button

#### Variants

| Variant     | Description                | Default Styles                                                                                      |
|-------------|----------------------------|-----------------------------------------------------------------------------------------------------|
| `primary`   | Purple filled              | `bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700`                                |
| `secondary` | Outlined                   | `border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100`               |
| `ghost`     | Text only, no border       | `bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200`                               |
| `danger`    | Red filled for destructive | `bg-error text-white hover:bg-red-600 active:bg-red-700`                                           |

#### Sizes

| Size | Height | Padding    | Font         | Icon Size | Tailwind Classes               |
|------|--------|------------|--------------|-----------|--------------------------------|
| `sm` | 32px   | 12px horiz | `text-xs`    | 14px      | `h-8 px-3 text-xs gap-1.5`    |
| `md` | 40px   | 16px horiz | `text-body`  | 16px      | `h-10 px-4 text-body gap-2`   |
| `lg` | 48px   | 24px horiz | `text-h4`    | 18px      | `h-12 px-6 text-h4 gap-2`     |

#### Icon-Only Variant

Square aspect ratio for icon-only buttons. Uses the same height as the corresponding size but equal width.

| Size | Dimensions | Tailwind Classes |
|------|------------|------------------|
| `sm` | 32x32      | `h-8 w-8`       |
| `md` | 40x40      | `h-10 w-10`     |
| `lg` | 48x48      | `h-12 w-12`     |

#### States

| State      | Visual Treatment                                                                        |
|------------|-----------------------------------------------------------------------------------------|
| `default`  | Base variant styles                                                                     |
| `hover`    | Darkened background (one shade deeper)                                                  |
| `focus`    | `focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`             |
| `active`   | Darkened background (two shades deeper than default)                                    |
| `disabled` | `opacity-50 cursor-not-allowed pointer-events-none`                                    |
| `loading`  | Spinner replaces icon (or appears before label), text remains, `pointer-events-none`    |

#### TypeScript Props Interface

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Size preset */
  size?: 'sm' | 'md' | 'lg';
  /** Show loading spinner and disable interaction */
  loading?: boolean;
  /** Icon element to render before the label */
  iconLeft?: React.ReactNode;
  /** Icon element to render after the label */
  iconRight?: React.ReactNode;
  /** Render as icon-only button (square aspect ratio, no label) */
  iconOnly?: boolean;
  /** Full-width button */
  fullWidth?: boolean;
}
```

#### Tailwind Composition Example

```html
<!-- Primary, medium -->
<button class="inline-flex items-center justify-center h-10 px-4 gap-2
               rounded-md text-body font-medium
               bg-purple-500 text-white
               hover:bg-purple-600 active:bg-purple-700
               focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
               transition-colors duration-150
               disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none">
  Save Changes
</button>

<!-- Secondary, small -->
<button class="inline-flex items-center justify-center h-8 px-3 gap-1.5
               rounded-md text-xs font-medium
               border border-gray-200 bg-white text-gray-700
               hover:bg-gray-50 active:bg-gray-100
               focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
               transition-colors duration-150">
  Cancel
</button>

<!-- Ghost, icon-only, medium -->
<button class="inline-flex items-center justify-center h-10 w-10
               rounded-md
               bg-transparent text-gray-700
               hover:bg-gray-100 active:bg-gray-200
               focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
               transition-colors duration-150"
        aria-label="Close">
  <!-- Icon SVG -->
</button>

<!-- Danger, large -->
<button class="inline-flex items-center justify-center h-12 px-6 gap-2
               rounded-md text-h4 font-medium
               bg-error text-white
               hover:bg-red-600 active:bg-red-700
               focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
               transition-colors duration-150">
  Delete Account
</button>
```

---

### Input

#### Variants

| Variant    | Border                    | Background    | Text Color     |
|------------|---------------------------|---------------|----------------|
| `default`  | `border-gray-200`         | `bg-white`    | `text-gray-900`|
| `error`    | `border-error`            | `bg-white`    | `text-gray-900`|
| `disabled` | `border-gray-200`         | `bg-gray-50`  | `text-gray-400`|

#### Sizes

| Size | Height | Padding          | Font        | Tailwind Classes                    |
|------|--------|------------------|-------------|-------------------------------------|
| `sm` | 32px   | 8px horiz        | `text-xs`   | `h-8 px-2 text-xs`                 |
| `md` | 40px   | 12px horiz       | `text-body` | `h-10 px-3 text-body`              |
| `lg` | 48px   | 16px horiz       | `text-h4`   | `h-12 px-4 text-h4`               |

#### Anatomy

```
[Label]              <-- text-body font-medium text-gray-700 mb-1.5
+------------------+
| Placeholder...   | <-- input field
+------------------+
[Help text]          <-- text-xs text-gray-500 mt-1.5
[Error message]      <-- text-xs text-error mt-1.5 (replaces help text on error)
```

#### States

| State      | Visual Treatment                                                                    |
|------------|------------------------------------------------------------------------------------- |
| `default`  | `border border-gray-200 bg-white`                                                   |
| `hover`    | `border-gray-300`                                                                   |
| `focus`    | `border-purple-500 ring-1 ring-purple-500 outline-none`                             |
| `error`    | `border-error ring-1 ring-error`                                                    |
| `disabled` | `bg-gray-50 text-gray-400 cursor-not-allowed`                                      |

#### TypeScript Props Interface

```typescript
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Size preset */
  size?: 'sm' | 'md' | 'lg';
  /** Label displayed above the input */
  label?: string;
  /** Help text displayed below the input */
  helpText?: string;
  /** Error message displayed below the input (overrides helpText) */
  error?: string;
  /** Icon element rendered inside the input, leading position */
  iconLeft?: React.ReactNode;
  /** Icon element rendered inside the input, trailing position */
  iconRight?: React.ReactNode;
  /** Full-width input (default: true) */
  fullWidth?: boolean;
}
```

#### Tailwind Composition Example

```html
<!-- Default, medium -->
<div class="flex flex-col gap-1.5">
  <label class="text-body font-medium text-gray-700">
    Email Address
  </label>
  <input
    type="email"
    placeholder="you@company.com"
    class="h-10 px-3 text-body
           rounded-md border border-gray-200 bg-white text-gray-900
           placeholder:text-gray-400
           hover:border-gray-300
           focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none
           transition-colors duration-150"
  />
  <span class="text-xs text-gray-500">
    We will never share your email.
  </span>
</div>

<!-- Error state -->
<div class="flex flex-col gap-1.5">
  <label class="text-body font-medium text-gray-700">
    Email Address
  </label>
  <input
    type="email"
    value="invalid-email"
    class="h-10 px-3 text-body
           rounded-md border border-error bg-white text-gray-900
           focus:ring-1 focus:ring-error focus:outline-none
           transition-colors duration-150"
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <span id="email-error" class="text-xs text-error" role="alert">
    Please enter a valid email address.
  </span>
</div>

<!-- Disabled state -->
<div class="flex flex-col gap-1.5">
  <label class="text-body font-medium text-gray-400">
    Email Address
  </label>
  <input
    type="email"
    value="locked@company.com"
    disabled
    class="h-10 px-3 text-body
           rounded-md border border-gray-200 bg-gray-50 text-gray-400
           cursor-not-allowed"
  />
</div>
```

---

### Select

Follows the same variant, size, and state patterns as Input. Adds a trailing chevron-down icon.

#### Variants and Sizes

Identical to Input. See Input section above.

#### Native Select

```html
<div class="flex flex-col gap-1.5">
  <label class="text-body font-medium text-gray-700">
    Country
  </label>
  <div class="relative">
    <select
      class="h-10 w-full px-3 pr-10 text-body appearance-none
             rounded-md border border-gray-200 bg-white text-gray-900
             hover:border-gray-300
             focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none
             transition-colors duration-150">
      <option value="">Select a country</option>
      <option value="us">United States</option>
      <option value="ca">Canada</option>
    </select>
    <!-- Chevron icon -->
    <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
         viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clip-rule="evenodd" />
    </svg>
  </div>
</div>
```

#### Custom Dropdown (Headless UI pattern)

For advanced use cases (search, multi-select, grouped options), use a custom dropdown built with a headless library (e.g., `@headlessui/react` or `cmdk`). The trigger should visually match the native select. The dropdown panel:

- `bg-white rounded-lg shadow-lg border border-gray-200`
- Max height: `max-h-60 overflow-auto`
- Option hover: `bg-gray-50`
- Option selected: `bg-purple-50 text-purple-700`
- Option padding: `px-3 py-2 text-body`
- Animation: `transition-all duration-150 ease-out` (scale from 95% to 100%, opacity 0 to 1)

#### TypeScript Props Interface

```typescript
interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Size preset */
  size?: 'sm' | 'md' | 'lg';
  /** Label displayed above the select */
  label?: string;
  /** Help text displayed below the select */
  helpText?: string;
  /** Error message displayed below the select (overrides helpText) */
  error?: string;
  /** Placeholder option text */
  placeholder?: string;
  /** Option items */
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  /** Full-width select (default: true) */
  fullWidth?: boolean;
}
```

---

### Card

#### Variants

| Variant       | Border              | Shadow      | Hover Effect                        |
|---------------|---------------------|-------------|-------------------------------------|
| `default`     | `border-gray-200`   | None        | None                                |
| `elevated`    | None                | `shadow-md` | None                                |
| `interactive` | `border-gray-200`   | None        | `hover:shadow-md hover:border-gray-300 cursor-pointer` |

#### Anatomy

```
+------------------------------------+
| Header (optional)                  |  <-- px-6 py-4, border-b border-gray-100
|------------------------------------|
| Body                               |  <-- px-6 py-4 (or py-6 for spacious)
|------------------------------------|
| Footer (optional)                  |  <-- px-6 py-4, border-t border-gray-100
+------------------------------------+
```

#### Padding Tokens

| Section  | Horizontal | Vertical  | Tailwind            |
|----------|------------|-----------|---------------------|
| Header   | 24px       | 16px      | `px-6 py-4`        |
| Body     | 24px       | 16px-24px | `px-6 py-4` or `px-6 py-6` |
| Footer   | 24px       | 16px      | `px-6 py-4`        |

#### TypeScript Props Interface

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: 'default' | 'elevated' | 'interactive';
  /** Padding preset -- compact uses py-4, spacious uses py-6 */
  padding?: 'compact' | 'spacious';
  /** Disable internal padding (for custom layouts) */
  noPadding?: boolean;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Title text */
  title?: string;
  /** Description below the title */
  description?: string;
  /** Action element rendered on the right side */
  action?: React.ReactNode;
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Alignment of footer content */
  align?: 'left' | 'center' | 'right';
}
```

#### Tailwind Composition Example

```html
<!-- Default card with header, body, footer -->
<div class="rounded-lg border border-gray-200 bg-white">
  <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
    <div>
      <h3 class="text-h3 font-semibold text-gray-900">Team Members</h3>
      <p class="text-sm text-gray-500 mt-0.5">Manage your team and permissions.</p>
    </div>
    <button class="...">Invite</button>
  </div>
  <div class="px-6 py-4">
    <!-- Body content -->
  </div>
  <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
    <button class="...">Cancel</button>
    <button class="...">Save</button>
  </div>
</div>

<!-- Elevated card -->
<div class="rounded-lg bg-white shadow-md">
  <div class="px-6 py-6">
    <!-- Content -->
  </div>
</div>

<!-- Interactive card -->
<div class="rounded-lg border border-gray-200 bg-white
            hover:shadow-md hover:border-gray-300
            cursor-pointer transition-all duration-150">
  <div class="px-6 py-4">
    <!-- Content -->
  </div>
</div>
```

---

### Table

#### Header

```html
<thead>
  <tr class="border-b border-gray-200">
    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
      Name
    </th>
  </tr>
</thead>
```

Optional: `sticky top-0 bg-white z-10` for sticky headers.

#### Rows

```html
<tbody>
  <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
    <td class="px-4 py-3 text-body text-gray-900">
      Acme Corp
    </td>
  </tr>
</tbody>
```

#### Sortable Header Pattern

```html
<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide
           cursor-pointer hover:text-gray-700 select-none group">
  <div class="inline-flex items-center gap-1">
    Name
    <!-- Sort indicator -->
    <svg class="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600"
         viewBox="0 0 20 20" fill="currentColor">
      <!-- Up/down arrow icon -->
    </svg>
  </div>
</th>
```

Active sort: replace `text-gray-400` with `text-purple-500` on the sort icon.

#### Checkbox Column

```html
<th class="w-12 px-4 py-3">
  <input type="checkbox"
         class="h-4 w-4 rounded-sm border-gray-300 text-purple-500
                focus:ring-purple-500 focus:ring-offset-0" />
</th>
```

#### Action Column

```html
<td class="px-4 py-3 text-right">
  <button class="inline-flex items-center justify-center h-8 w-8
                 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100
                 transition-colors duration-150"
          aria-label="Row actions">
    <!-- Ellipsis icon (three dots) -->
  </button>
</td>
```

#### TypeScript Props Interface

```typescript
interface Column<T> {
  /** Unique key matching a field in the data object */
  key: string;
  /** Display header text */
  header: string;
  /** Enable sorting on this column */
  sortable?: boolean;
  /** Custom cell renderer */
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  /** Column width (Tailwind class or CSS value) */
  width?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  /** Column definitions */
  columns: Column<T>[];
  /** Row data */
  data: T[];
  /** Enable row selection with checkboxes */
  selectable?: boolean;
  /** Callback when selection changes */
  onSelectionChange?: (selectedRows: T[]) => void;
  /** Current sort state */
  sort?: { key: string; direction: 'asc' | 'desc' };
  /** Callback when sort changes */
  onSortChange?: (sort: { key: string; direction: 'asc' | 'desc' }) => void;
  /** Enable sticky header */
  stickyHeader?: boolean;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Empty state component */
  emptyState?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
}
```

#### Full Table Composition

```html
<div class="rounded-lg border border-gray-200 overflow-hidden">
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="bg-gray-50">
        <tr class="border-b border-gray-200">
          <th class="w-12 px-4 py-3">
            <input type="checkbox" class="h-4 w-4 rounded-sm border-gray-300 text-purple-500" />
          </th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
            Customer
          </th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
            Amount
          </th>
          <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
          <td class="w-12 px-4 py-3">
            <input type="checkbox" class="h-4 w-4 rounded-sm border-gray-300 text-purple-500" />
          </td>
          <td class="px-4 py-3 text-body text-gray-900">Acme Corp</td>
          <td class="px-4 py-3 text-body text-gray-900">$1,250.00</td>
          <td class="px-4 py-3 text-right">
            <button class="h-8 w-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    aria-label="Actions">
              ...
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

### Modal / Dialog

#### Sizes

| Size   | Max Width    | Tailwind Class | Usage                              |
|--------|--------------|----------------|------------------------------------|
| `sm`   | 448px        | `max-w-md`     | Confirmations, simple forms        |
| `md`   | 512px        | `max-w-lg`     | Standard forms, detail views       |
| `lg`   | 672px        | `max-w-2xl`    | Complex forms, multi-step wizards  |
| `full` | 896px        | `max-w-4xl`    | Data-heavy views, previews         |

#### Anatomy

```
[Overlay backdrop]                     <-- fixed inset-0 bg-surface-overlay z-50
  [Dialog container]                   <-- fixed inset-0 flex items-center justify-center p-4
    +--------------------------------+
    | [X] Header / Title             |  <-- px-6 py-4, border-b border-gray-100
    |--------------------------------|
    | Body (scrollable)              |  <-- px-6 py-4, overflow-y-auto, max-h calculated
    |--------------------------------|
    | Footer (actions)               |  <-- px-6 py-4, border-t border-gray-100, flex justify-end gap-3
    +--------------------------------+
```

#### Animation

- **Enter:** fade in overlay (opacity 0 to 1) + scale up dialog (scale 95% to 100% + opacity 0 to 1), 200ms, `ease-out`
- **Exit:** reverse, 150ms, `ease-in`

#### TypeScript Props Interface

```typescript
interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when the modal requests to close */
  onClose: () => void;
  /** Size preset */
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** Title displayed in the header */
  title?: string;
  /** Description displayed below the title */
  description?: string;
  /** Modal body content */
  children: React.ReactNode;
  /** Footer content (typically action buttons) */
  footer?: React.ReactNode;
  /** Disable closing via overlay click or Escape key */
  preventClose?: boolean;
}
```

#### Tailwind Composition Example

```html
<!-- Overlay -->
<div class="fixed inset-0 z-50 bg-black/50
            transition-opacity duration-200"
     aria-hidden="true">
</div>

<!-- Dialog -->
<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="relative w-full max-w-lg rounded-xl bg-white shadow-xl
              transform transition-all duration-200 ease-out
              data-[state=open]:scale-100 data-[state=open]:opacity-100
              data-[state=closed]:scale-95 data-[state=closed]:opacity-0">

    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <div>
        <h2 class="text-h3 font-semibold text-gray-900">Delete Invoice</h2>
        <p class="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
      </div>
      <button class="h-8 w-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100
                     transition-colors duration-150"
              aria-label="Close">
        <!-- X icon -->
      </button>
    </div>

    <!-- Body -->
    <div class="px-6 py-4 overflow-y-auto max-h-[60vh]">
      <p class="text-body text-gray-700">
        Are you sure you want to delete invoice #1042? This will permanently
        remove the invoice and all associated records.
      </p>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
      <button class="h-10 px-4 rounded-md text-body font-medium
                     border border-gray-200 text-gray-700
                     hover:bg-gray-50 transition-colors duration-150">
        Cancel
      </button>
      <button class="h-10 px-4 rounded-md text-body font-medium
                     bg-error text-white
                     hover:bg-red-600 transition-colors duration-150">
        Delete
      </button>
    </div>
  </div>
</div>
```

---

### Toast

#### Variants

| Variant   | Icon Color       | Border Left       | Background          |
|-----------|------------------|-------------------|---------------------|
| `success` | `text-success`   | `border-l-success`| `bg-white`          |
| `error`   | `text-error`     | `border-l-error`  | `bg-white`          |
| `warning` | `text-warning`   | `border-l-warning`| `bg-white`          |
| `info`    | `text-info`      | `border-l-info`   | `bg-white`          |

#### Behavior

- **Position:** Fixed, bottom-right (`fixed bottom-6 right-6`)
- **Auto-dismiss:** 4000ms (4 seconds)
- **Stack:** Multiple toasts stack vertically with `gap-3`
- **Animation enter:** slide in from right + fade (200ms, `ease-out`)
- **Animation exit:** slide out to right + fade (150ms, `ease-in`)

#### TypeScript Props Interface

```typescript
interface ToastProps {
  /** Unique identifier */
  id: string;
  /** Semantic variant */
  variant: 'success' | 'error' | 'warning' | 'info';
  /** Toast message */
  message: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Auto-dismiss duration in ms (0 to disable) */
  duration?: number;
  /** Callback when toast is dismissed */
  onDismiss?: (id: string) => void;
}

interface ToastContainerProps {
  /** Position on screen */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}
```

#### Tailwind Composition Example

```html
<!-- Toast container -->
<div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">

  <!-- Individual toast (success) -->
  <div class="pointer-events-auto w-80 rounded-lg border border-gray-200 border-l-4 border-l-success
              bg-white shadow-lg
              flex items-start gap-3 px-4 py-3
              animate-in slide-in-from-right fade-in duration-200">

    <!-- Icon -->
    <svg class="h-5 w-5 text-success mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <!-- Checkmark circle icon -->
    </svg>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p class="text-body font-medium text-gray-900">Invoice sent successfully</p>
    </div>

    <!-- Close button -->
    <button class="shrink-0 h-6 w-6 rounded text-gray-400 hover:text-gray-600
                   transition-colors duration-150"
            aria-label="Dismiss">
      <!-- X icon -->
    </button>
  </div>

  <!-- Error toast with action -->
  <div class="pointer-events-auto w-80 rounded-lg border border-gray-200 border-l-4 border-l-error
              bg-white shadow-lg
              flex items-start gap-3 px-4 py-3">
    <svg class="h-5 w-5 text-error mt-0.5 shrink-0"><!-- Error icon --></svg>
    <div class="flex-1 min-w-0">
      <p class="text-body font-medium text-gray-900">Failed to save changes</p>
      <button class="mt-1 text-xs font-medium text-purple-500 hover:text-purple-600">
        Retry
      </button>
    </div>
    <button class="shrink-0 h-6 w-6 rounded text-gray-400 hover:text-gray-600"
            aria-label="Dismiss">
      <!-- X icon -->
    </button>
  </div>

</div>
```

---

### Badge

#### Variants

| Variant   | Background           | Text Color          | Border (optional)      |
|-----------|----------------------|---------------------|------------------------|
| `default` | `bg-gray-100`        | `text-gray-700`     | None                   |
| `primary` | `bg-purple-100`      | `text-purple-700`   | None                   |
| `success` | `bg-success-light`   | `text-green-700`    | None                   |
| `error`   | `bg-error-light`     | `text-red-700`      | None                   |
| `warning` | `bg-warning-light`   | `text-amber-700`    | None                   |

#### Sizes

| Size | Font        | Padding               | Tailwind Classes                      |
|------|-------------|-----------------------|---------------------------------------|
| `sm` | `text-xxs`  | 6px horiz, 2px vert   | `text-xxs px-1.5 py-0.5`             |
| `md` | `text-xs`   | 8px horiz, 2px vert   | `text-xs px-2 py-0.5`                |

#### TypeScript Props Interface

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Semantic variant */
  variant?: 'default' | 'primary' | 'success' | 'error' | 'warning';
  /** Size preset */
  size?: 'sm' | 'md';
}
```

#### Tailwind Composition Example

```html
<!-- Default, medium -->
<span class="inline-flex items-center rounded-sm px-2 py-0.5
             text-xs font-medium
             bg-gray-100 text-gray-700">
  Draft
</span>

<!-- Primary, small -->
<span class="inline-flex items-center rounded-sm px-1.5 py-0.5
             text-xxs font-medium
             bg-purple-100 text-purple-700">
  New
</span>

<!-- Success, medium -->
<span class="inline-flex items-center rounded-sm px-2 py-0.5
             text-xs font-medium
             bg-success-light text-green-700">
  Paid
</span>

<!-- Error, medium -->
<span class="inline-flex items-center rounded-sm px-2 py-0.5
             text-xs font-medium
             bg-error-light text-red-700">
  Overdue
</span>

<!-- Warning, small -->
<span class="inline-flex items-center rounded-sm px-1.5 py-0.5
             text-xxs font-medium
             bg-warning-light text-amber-700">
  Pending
</span>
```

---

### Tabs

#### Variants

**Underline Tabs** (default):

Active indicator is a 2px bottom border in purple.

```html
<div class="border-b border-gray-200">
  <nav class="flex gap-0 -mb-px" role="tablist">
    <!-- Active tab -->
    <button class="px-4 py-2.5 text-body font-medium
                   text-purple-600 border-b-2 border-purple-500
                   transition-colors duration-150"
            role="tab" aria-selected="true">
      Overview
    </button>

    <!-- Inactive tab -->
    <button class="px-4 py-2.5 text-body font-medium
                   text-gray-500 border-b-2 border-transparent
                   hover:text-gray-700 hover:border-gray-300
                   transition-colors duration-150"
            role="tab" aria-selected="false">
      Invoices
    </button>

    <!-- Disabled tab -->
    <button class="px-4 py-2.5 text-body font-medium
                   text-gray-300 border-b-2 border-transparent
                   cursor-not-allowed"
            role="tab" aria-selected="false" aria-disabled="true" disabled>
      Reports
    </button>
  </nav>
</div>
```

**Pill Tabs:**

Active indicator is a filled background.

```html
<nav class="flex gap-1 rounded-lg bg-gray-100 p-1" role="tablist">
  <!-- Active tab -->
  <button class="px-4 py-2 text-body font-medium
                 rounded-md bg-white text-gray-900 shadow-xs
                 transition-all duration-150"
          role="tab" aria-selected="true">
    Overview
  </button>

  <!-- Inactive tab -->
  <button class="px-4 py-2 text-body font-medium
                 rounded-md text-gray-500
                 hover:text-gray-700
                 transition-all duration-150"
          role="tab" aria-selected="false">
    Invoices
  </button>
</nav>
```

#### TypeScript Props Interface

```typescript
interface TabItem {
  /** Unique key for the tab */
  key: string;
  /** Display label */
  label: string;
  /** Disable this tab */
  disabled?: boolean;
  /** Optional icon before the label */
  icon?: React.ReactNode;
  /** Optional badge/count after the label */
  badge?: React.ReactNode;
}

interface TabsProps {
  /** Tab items to render */
  items: TabItem[];
  /** Currently active tab key */
  activeKey: string;
  /** Callback when active tab changes */
  onChange: (key: string) => void;
  /** Visual variant */
  variant?: 'underline' | 'pill';
  /** Full-width tabs (each tab takes equal space) */
  fullWidth?: boolean;
}
```

---

### Empty State

Centered container for zero-data scenarios. Provides clear guidance on what to do next.

#### Anatomy

```
+------------------------------------+
|                                    |
|           [Icon - 40px]            |  <-- text-gray-400, h-10 w-10
|                                    |
|        Title (h3, centered)        |  <-- text-h3 font-semibold text-gray-900
|                                    |
|     Description (body, centered)   |  <-- text-body text-gray-500, max-w-xs
|                                    |
|          [CTA Button]              |  <-- Primary button, mt-4
|                                    |
+------------------------------------+
```

#### Constraints

- Maximum width: 320px (`max-w-xs`)
- Centered horizontally and vertically within parent
- Vertical gap between elements: 12px (`gap-3`)
- Gap before CTA button: 16px (`mt-4`)

#### TypeScript Props Interface

```typescript
interface EmptyStateProps {
  /** Icon element (renders at 40px) */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action (rendered as ghost button or link) */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}
```

#### Tailwind Composition Example

```html
<div class="flex flex-col items-center justify-center py-16 px-4">
  <div class="flex flex-col items-center gap-3 max-w-xs text-center">
    <!-- Icon -->
    <svg class="h-10 w-10 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <!-- Inbox/document icon -->
    </svg>

    <!-- Title -->
    <h3 class="text-h3 font-semibold text-gray-900">
      No invoices yet
    </h3>

    <!-- Description -->
    <p class="text-body text-gray-500">
      Create your first invoice to start tracking payments and revenue.
    </p>

    <!-- CTA -->
    <button class="mt-4 inline-flex items-center justify-center h-10 px-4 gap-2
                   rounded-md text-body font-medium
                   bg-purple-500 text-white
                   hover:bg-purple-600 active:bg-purple-700
                   focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                   transition-colors duration-150">
      Create Invoice
    </button>
  </div>
</div>
```

---

### Skeleton / Loading

Placeholder UI shown while data is being fetched. Uses a pulse animation to indicate loading state.

#### Variants

| Variant  | Shape             | Default Size          | Tailwind Classes                          |
|----------|-------------------|-----------------------|-------------------------------------------|
| `text`   | Rounded rectangle | `h-4 w-full`         | `rounded bg-gray-200 animate-pulse`       |
| `avatar` | Circle            | `h-10 w-10`          | `rounded-full bg-gray-200 animate-pulse`  |
| `card`   | Rounded large     | `h-40 w-full`        | `rounded-lg bg-gray-200 animate-pulse`    |

#### Animation

- CSS class: `animate-pulse`
- Effect: opacity oscillates between 1.0 and 0.5
- Duration: 1.5s
- Timing function: `ease-in-out`
- Iteration: infinite

#### TypeScript Props Interface

```typescript
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape variant */
  variant?: 'text' | 'avatar' | 'card';
  /** Width (Tailwind class or CSS value) */
  width?: string;
  /** Height (Tailwind class or CSS value) */
  height?: string;
  /** Number of skeleton lines to render (for text variant) */
  lines?: number;
}
```

#### Tailwind Composition Example

```html
<!-- Single text line -->
<div class="h-4 w-3/4 rounded bg-gray-200 animate-pulse"></div>

<!-- Multiple text lines -->
<div class="flex flex-col gap-2">
  <div class="h-4 w-full rounded bg-gray-200 animate-pulse"></div>
  <div class="h-4 w-full rounded bg-gray-200 animate-pulse"></div>
  <div class="h-4 w-2/3 rounded bg-gray-200 animate-pulse"></div>
</div>

<!-- Avatar -->
<div class="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>

<!-- Card skeleton -->
<div class="rounded-lg border border-gray-200 p-6">
  <div class="flex items-center gap-3 mb-4">
    <div class="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
    <div class="flex flex-col gap-2 flex-1">
      <div class="h-4 w-1/3 rounded bg-gray-200 animate-pulse"></div>
      <div class="h-3 w-1/4 rounded bg-gray-200 animate-pulse"></div>
    </div>
  </div>
  <div class="flex flex-col gap-2">
    <div class="h-4 w-full rounded bg-gray-200 animate-pulse"></div>
    <div class="h-4 w-full rounded bg-gray-200 animate-pulse"></div>
    <div class="h-4 w-3/5 rounded bg-gray-200 animate-pulse"></div>
  </div>
</div>

<!-- Table skeleton -->
<div class="rounded-lg border border-gray-200 overflow-hidden">
  <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
    <div class="h-3 w-20 rounded bg-gray-200 animate-pulse"></div>
  </div>
  <div class="divide-y divide-gray-100">
    <div class="flex items-center gap-4 px-4 py-3">
      <div class="h-4 w-1/4 rounded bg-gray-200 animate-pulse"></div>
      <div class="h-4 w-1/3 rounded bg-gray-200 animate-pulse"></div>
      <div class="h-4 w-16 rounded bg-gray-200 animate-pulse ml-auto"></div>
    </div>
    <div class="flex items-center gap-4 px-4 py-3">
      <div class="h-4 w-1/4 rounded bg-gray-200 animate-pulse"></div>
      <div class="h-4 w-1/3 rounded bg-gray-200 animate-pulse"></div>
      <div class="h-4 w-16 rounded bg-gray-200 animate-pulse ml-auto"></div>
    </div>
    <div class="flex items-center gap-4 px-4 py-3">
      <div class="h-4 w-1/4 rounded bg-gray-200 animate-pulse"></div>
      <div class="h-4 w-1/3 rounded bg-gray-200 animate-pulse"></div>
      <div class="h-4 w-16 rounded bg-gray-200 animate-pulse ml-auto"></div>
    </div>
  </div>
</div>
```

---

## Layout Templates

### App Shell

The primary application layout. Three-column design with a fixed sidebar, scrollable main content area, and an optional right panel.

```
+----------+---------------------------+------------+
| Sidebar  |      Main Content         | Right Panel|
| (240px)  |      (flex-grow)          | (400px)    |
| Fixed    |      Scrollable           | Optional   |
+----------+---------------------------+------------+
```

#### Specifications

| Region          | Width        | Behavior                                 | Background              |
|-----------------|--------------|------------------------------------------|-------------------------|
| Sidebar         | 240px        | Fixed height, non-scrollable (or own scroll) | `surface-secondary`     |
| Sidebar (collapsed) | 64px    | Icons only, tooltip labels               | `surface-secondary`     |
| Main Content    | `flex-1`     | Scrollable (`overflow-y-auto`)           | `surface-primary`       |
| Right Panel     | 400px        | Optional, hidden by default on < 1280px  | `surface-primary`       |

#### Responsive Behavior

| Breakpoint       | Sidebar          | Right Panel          |
|------------------|------------------|----------------------|
| Desktop (>=1280) | 240px expanded   | Visible if active    |
| Tablet (768-1279)| 64px collapsed   | Hidden (overlay opt) |
| Mobile (<768)    | Hidden (overlay) | Hidden (overlay opt) |

#### Top Bar

The top bar lives inside the main content area, not globally. It contains the page title, breadcrumbs, and page-level actions.

```html
<div class="sticky top-0 z-10 flex items-center justify-between
            h-16 px-6 bg-white border-b border-gray-100">
  <div>
    <h1 class="text-h2 font-semibold text-gray-900">Invoices</h1>
  </div>
  <div class="flex items-center gap-3">
    <!-- Action buttons -->
  </div>
</div>
```

#### Tailwind Composition Example

```html
<div class="flex h-screen overflow-hidden bg-surface-primary">
  <!-- Sidebar -->
  <aside class="flex flex-col w-60 shrink-0 border-r border-gray-200 bg-surface-secondary
                transition-[width] duration-300 ease-in-out
                data-[collapsed=true]:w-16">
    <!-- Logo -->
    <div class="flex items-center h-16 px-4 border-b border-gray-100">
      <span class="text-h3 font-bold text-purple-600">Kitz</span>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-3 py-4">
      <ul class="flex flex-col gap-1">
        <!-- Active nav item -->
        <li>
          <a href="#" class="flex items-center gap-3 px-3 py-2 rounded-md
                            text-body font-medium text-purple-700 bg-purple-50">
            <!-- Icon -->
            <svg class="h-5 w-5 shrink-0"><!-- icon --></svg>
            <span>Dashboard</span>
          </a>
        </li>
        <!-- Inactive nav item -->
        <li>
          <a href="#" class="flex items-center gap-3 px-3 py-2 rounded-md
                            text-body font-medium text-gray-600
                            hover:text-gray-900 hover:bg-gray-100
                            transition-colors duration-150">
            <svg class="h-5 w-5 shrink-0"><!-- icon --></svg>
            <span>Invoices</span>
          </a>
        </li>
      </ul>
    </nav>

    <!-- User section -->
    <div class="flex items-center gap-3 px-4 py-3 border-t border-gray-100">
      <div class="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
        <span class="text-xs font-semibold text-purple-700">JD</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-body font-medium text-gray-900 truncate">Jane Doe</p>
        <p class="text-xs text-gray-500 truncate">jane@acme.com</p>
      </div>
    </div>
  </aside>

  <!-- Main content area -->
  <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <!-- Top bar -->
    <div class="sticky top-0 z-10 flex items-center justify-between
                h-16 px-6 bg-white border-b border-gray-100 shrink-0">
      <h1 class="text-h2 font-semibold text-gray-900">Invoices</h1>
      <div class="flex items-center gap-3">
        <button class="h-10 px-4 rounded-md text-body font-medium
                       bg-purple-500 text-white hover:bg-purple-600
                       transition-colors duration-150">
          New Invoice
        </button>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto px-6 py-8">
      <!-- Page content goes here -->
    </div>
  </main>

  <!-- Right panel (optional, conditionally rendered) -->
  <aside class="w-[400px] shrink-0 border-l border-gray-200 bg-white
                overflow-y-auto
                hidden xl:block">
    <!-- Panel content -->
  </aside>
</div>
```

---

### Auth Layout

Used for login, register, forgot password, and similar unauthenticated pages.

#### Specifications

- Centered card: `max-w-md` (448px), white background
- Logo: positioned above the card, centered
- Page background: subtle gradient from `purple-50` to `white`
- Card: `rounded-xl shadow-lg` with `p-8` internal padding

#### Tailwind Composition Example

```html
<div class="min-h-screen flex flex-col items-center justify-center
            bg-gradient-to-b from-purple-50 to-white
            px-4 py-12">
  <!-- Logo -->
  <div class="mb-8">
    <span class="text-h1 font-bold text-purple-600">Kitz</span>
  </div>

  <!-- Auth card -->
  <div class="w-full max-w-md rounded-xl bg-white shadow-lg p-8">
    <!-- Title -->
    <div class="text-center mb-6">
      <h1 class="text-h2 font-semibold text-gray-900">Sign in to your account</h1>
      <p class="text-body text-gray-500 mt-2">
        Welcome back. Enter your credentials to continue.
      </p>
    </div>

    <!-- Form -->
    <form class="flex flex-col gap-4">
      <!-- Email input -->
      <div class="flex flex-col gap-1.5">
        <label class="text-body font-medium text-gray-700">Email</label>
        <input type="email" placeholder="you@company.com"
               class="h-10 px-3 text-body rounded-md border border-gray-200 bg-white
                      placeholder:text-gray-400
                      hover:border-gray-300
                      focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none
                      transition-colors duration-150" />
      </div>

      <!-- Password input -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <label class="text-body font-medium text-gray-700">Password</label>
          <a href="#" class="text-xs font-medium text-purple-500 hover:text-purple-600">
            Forgot password?
          </a>
        </div>
        <input type="password" placeholder="Enter your password"
               class="h-10 px-3 text-body rounded-md border border-gray-200 bg-white
                      placeholder:text-gray-400
                      hover:border-gray-300
                      focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none
                      transition-colors duration-150" />
      </div>

      <!-- Submit -->
      <button type="submit"
              class="h-10 w-full rounded-md text-body font-medium
                     bg-purple-500 text-white
                     hover:bg-purple-600 active:bg-purple-700
                     focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                     transition-colors duration-150 mt-2">
        Sign In
      </button>
    </form>

    <!-- Footer -->
    <p class="text-center text-sm text-gray-500 mt-6">
      Do not have an account?
      <a href="#" class="font-medium text-purple-500 hover:text-purple-600">Sign up</a>
    </p>
  </div>
</div>
```

---

### Settings Layout

A two-column layout nested inside the App Shell's main content area. Left side contains section navigation; right side displays the active section's content.

#### Sections

| Section        | Description                                  |
|----------------|----------------------------------------------|
| General        | Business name, timezone, currency, locale     |
| Team           | Members, roles, invitations                   |
| Integrations   | Connected apps, OAuth connections              |
| Billing        | Plan, payment methods, invoices               |
| API Keys       | Key management, usage, regeneration           |

#### Specifications

- Left nav width: 200px
- Content area: flex-1, max-width 640px for readability
- Active section indicator: `text-purple-700 bg-purple-50 font-medium` on the nav item
- Inactive nav items: `text-gray-600 hover:text-gray-900 hover:bg-gray-50`
- Each section renders as a vertical stack of Cards

#### Tailwind Composition Example

```html
<!-- Inside the App Shell's scrollable content area -->
<div class="flex gap-8 px-6 py-8">
  <!-- Settings nav -->
  <nav class="w-48 shrink-0">
    <ul class="flex flex-col gap-1 sticky top-24">
      <!-- Active -->
      <li>
        <a href="#" class="flex items-center px-3 py-2 rounded-md
                          text-body font-medium text-purple-700 bg-purple-50">
          General
        </a>
      </li>
      <!-- Inactive -->
      <li>
        <a href="#" class="flex items-center px-3 py-2 rounded-md
                          text-body text-gray-600
                          hover:text-gray-900 hover:bg-gray-50
                          transition-colors duration-150">
          Team
        </a>
      </li>
      <li>
        <a href="#" class="flex items-center px-3 py-2 rounded-md
                          text-body text-gray-600
                          hover:text-gray-900 hover:bg-gray-50
                          transition-colors duration-150">
          Integrations
        </a>
      </li>
      <li>
        <a href="#" class="flex items-center px-3 py-2 rounded-md
                          text-body text-gray-600
                          hover:text-gray-900 hover:bg-gray-50
                          transition-colors duration-150">
          Billing
        </a>
      </li>
      <li>
        <a href="#" class="flex items-center px-3 py-2 rounded-md
                          text-body text-gray-600
                          hover:text-gray-900 hover:bg-gray-50
                          transition-colors duration-150">
          API Keys
        </a>
      </li>
    </ul>
  </nav>

  <!-- Settings content -->
  <div class="flex-1 max-w-2xl">
    <div class="flex flex-col gap-6">
      <!-- Section title -->
      <div>
        <h2 class="text-h2 font-semibold text-gray-900">General</h2>
        <p class="text-body text-gray-500 mt-1">
          Manage your business profile and preferences.
        </p>
      </div>

      <!-- Settings card -->
      <div class="rounded-lg border border-gray-200 bg-white">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-h4 font-medium text-gray-900">Business Information</h3>
        </div>
        <div class="px-6 py-4 flex flex-col gap-4">
          <!-- Form fields -->
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button class="h-10 px-4 rounded-md text-body font-medium
                         border border-gray-200 text-gray-700 hover:bg-gray-50
                         transition-colors duration-150">
            Cancel
          </button>
          <button class="h-10 px-4 rounded-md text-body font-medium
                         bg-purple-500 text-white hover:bg-purple-600
                         transition-colors duration-150">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## Appendix: CSS Entry Point

Below is the recommended Tailwind CSS v4 entry point that registers all design tokens defined in this document.

```css
/* src/index.css */

@import "tailwindcss";

@theme {
  /* ===== Typography ===== */
  --font-family-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;

  --font-size-display: 2.25rem;
  --font-size-h1: 1.875rem;
  --font-size-h2: 1.5rem;
  --font-size-h3: 1.25rem;
  --font-size-h4: 1rem;
  --font-size-body: 0.875rem;
  --font-size-sm: 0.8125rem;
  --font-size-xs: 0.75rem;
  --font-size-xxs: 0.6875rem;

  /* ===== Colors: Brand ===== */
  --color-purple-50: #faf5ff;
  --color-purple-100: #f3e8ff;
  --color-purple-200: #e9d5ff;
  --color-purple-300: #d8b4fe;
  --color-purple-400: #c084fc;
  --color-purple-500: #a855f7;
  --color-purple-600: #9333ea;
  --color-purple-700: #7c3aed;
  --color-purple-800: #6b21a8;
  --color-purple-900: #581c87;

  /* ===== Colors: Neutrals ===== */
  --color-gray-50: #f8fafc;
  --color-gray-100: #f1f5f9;
  --color-gray-200: #e2e8f0;
  --color-gray-300: #cbd5e1;
  --color-gray-400: #94a3b8;
  --color-gray-500: #64748b;
  --color-gray-600: #475569;
  --color-gray-700: #334155;
  --color-gray-800: #1e293b;
  --color-gray-900: #0f172a;
  --color-gray-950: #020617;

  /* ===== Colors: Semantic ===== */
  --color-success: #22c55e;
  --color-success-light: #dcfce7;
  --color-error: #ef4444;
  --color-error-light: #fee2e2;
  --color-warning: #f59e0b;
  --color-warning-light: #fef3c7;
  --color-info: #3b82f6;
  --color-info-light: #dbeafe;

  /* ===== Colors: Surfaces ===== */
  --color-surface-primary: #ffffff;
  --color-surface-secondary: #f8fafc;
  --color-surface-tertiary: #f1f5f9;
  --color-surface-elevated: #ffffff;
  --color-surface-overlay: rgba(0, 0, 0, 0.5);
  --color-surface-dark: #1e1b4b;

  /* ===== Border Radius ===== */
  --radius-none: 0;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* ===== Shadows ===== */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
}
```

---

## Appendix: Accessibility Checklist

Every component built from this design system must meet the following baseline:

1. **Color contrast:** All text meets WCAG 2.1 AA minimum contrast ratios (4.5:1 for normal text, 3:1 for large text). The purple-500 on white (#a855f7 on #ffffff) is 3.4:1, which fails for small text. Use purple-600 (#9333ea) or darker on white backgrounds for text, or use purple-500 only for large text and non-text indicators.
2. **Focus indicators:** All interactive elements display a visible focus ring (`focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`).
3. **Keyboard navigation:** All interactive components are reachable and operable via keyboard (Tab, Enter, Space, Escape, Arrow keys as appropriate).
4. **ARIA attributes:** Use semantic HTML elements first. Add `role`, `aria-label`, `aria-describedby`, `aria-expanded`, `aria-selected`, `aria-invalid`, and other ARIA attributes where native semantics are insufficient.
5. **Reduced motion:** Respect `prefers-reduced-motion` by disabling or reducing animations for users who request it. Tailwind provides `motion-reduce:` and `motion-safe:` variants.
6. **Screen reader text:** Use `sr-only` class for visually hidden but screen-reader-accessible labels (e.g., icon-only buttons must have an `aria-label` or visually hidden text).

---

*This document is the single source of truth for the Kitz design system. All UI components, pages, and features should reference these tokens and patterns. When in doubt, default to the values defined here.*
