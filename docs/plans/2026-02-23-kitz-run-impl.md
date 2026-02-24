# Kitz Run — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a retro side-scroller arcade game where Kitz is the hero, rendered on HTML Canvas 2D, with 5 worlds of levels, DBZ-style power transformations (ending in Founder Mode), business-themed enemies, stealth-learning quiz popups, touch + keyboard controls, and a leaderboard.

**Architecture:** Custom lightweight game engine using Canvas 2D inside a React component. The game loop runs via `requestAnimationFrame` independent of React. React handles UI overlays (HUD, menus, quiz popups, touch controls). Game state syncs with the existing Zustand `gameStore` for XP/level progression. Pixel-art sprites are defined as 2D number arrays (same approach as the existing Orb component).

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Tailwind 4, Zustand 5, HTML Canvas 2D API. No external game libraries.

---

## Context for the Implementer

### Existing codebase
- **Repo:** `/tmp/kitzV1/ui/` — React SPA
- **Path alias:** `@/` → `./src/` (configured in tsconfig.json and vite.config.ts)
- **State:** Zustand stores in `src/stores/` — existing `gameStore.ts` tracks XP (0+), level (1-5), completed questions/courses
- **Routing:** `App.tsx` uses React Router. `DashboardPage.tsx` uses a switch statement with `currentNav` string to render pages
- **Nav:** `TopNavBar.tsx` has a `navItems` array with `{ id, label, icon }` entries
- **Styling:** Tailwind 4 + custom CSS keyframes in `src/index.css`
- **TypeScript:** Strict mode enabled, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`
- **Content dir:** `src/content/` for data files (NOT `src/data/` — blocked by .gitignore)

### Design reference
- **Full design doc:** `docs/plans/2026-02-23-kitz-run-retro-game-design.md`

### Key colors
```
PURPLE       = '#A855F7'
PURPLE_LIGHT = '#C084FC'
PURPLE_DARK  = '#7C3AED'
LAVENDER     = '#DDD6FE'
GOLD         = '#FBBF24'
BLUE         = '#60A5FA'
WHITE        = '#F9FAFB'
DARK         = '#0A0A0A'
```

---

## Task 1: Game Engine Core — Loop, Canvas, Input

Create the foundational game engine: a 60fps game loop, canvas rendering setup, and input manager that handles both keyboard and touch.

**Files:**
- Create: `ui/src/game/engine/GameLoop.ts`
- Create: `ui/src/game/engine/Canvas.ts`
- Create: `ui/src/game/engine/Input.ts`
- Create: `ui/src/game/constants.ts`

### Step 1: Create game constants

Create `ui/src/game/constants.ts`:

```typescript
// ── Kitz Run — Shared Constants ──

// Canvas
export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 450
export const TILE_SIZE = 16
export const PIXEL_SCALE = 2 // each game pixel = 2 screen pixels

// Physics
export const GRAVITY = 0.6
export const MAX_FALL_SPEED = 12
export const GROUND_Y = CANVAS_HEIGHT - TILE_SIZE * 3 // ground is 3 tiles from bottom

// Player
export const PLAYER_SPEED = 3
export const PLAYER_JUMP_FORCE = -10
export const PLAYER_WIDTH = 16
export const PLAYER_HEIGHT = 16
export const PLAYER_MAX_HP = 3
export const PLAYER_MAX_LIVES = 3
export const PLAYER_INVINCIBLE_MS = 1500

// Scoring
export const SCORE_PER_ENEMY = 100
export const SCORE_PER_BOSS = 1000
export const SCORE_PER_QUIZ = 500
export const SCORE_PER_COIN = 10
export const SCORE_PER_LEVEL = 2000
export const SCORE_NO_DAMAGE_BONUS = 1500
export const EXTRA_LIFE_THRESHOLD = 10000

// XP (syncs with gameStore)
export const XP_PER_ENEMY = 10
export const XP_PER_BOSS = 100
export const XP_PER_QUIZ_CORRECT = 50
export const XP_PER_LEVEL = 200

// Colors
export const COLORS = {
  purple: '#A855F7',
  purpleLight: '#C084FC',
  purpleDark: '#7C3AED',
  lavender: '#DDD6FE',
  gold: '#FBBF24',
  blue: '#60A5FA',
  white: '#F9FAFB',
  dark: '#0A0A0A',
  red: '#EF4444',
  green: '#22C55E',
  sky: '#0D0D12',
} as const

// Game states
export type GameState = 'menu' | 'playing' | 'paused' | 'quiz' | 'levelComplete' | 'gameOver'
```

### Step 2: Create the game loop

Create `ui/src/game/engine/GameLoop.ts`:

```typescript
export type UpdateFn = (dt: number) => void
export type RenderFn = () => void

export class GameLoop {
  private rafId = 0
  private lastTime = 0
  private running = false
  private paused = false
  private updateFn: UpdateFn
  private renderFn: RenderFn

  constructor(update: UpdateFn, render: RenderFn) {
    this.updateFn = update
    this.renderFn = render
  }

  start() {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.tick(this.lastTime)
  }

  stop() {
    this.running = false
    if (this.rafId) cancelAnimationFrame(this.rafId)
  }

  pause() {
    this.paused = true
  }

  resume() {
    this.paused = false
    this.lastTime = performance.now()
  }

  get isPaused() {
    return this.paused
  }

  private tick = (now: number) => {
    if (!this.running) return
    this.rafId = requestAnimationFrame(this.tick)

    if (this.paused) return

    // Cap delta to avoid spiral of death after tab switch
    const dt = Math.min((now - this.lastTime) / 16.667, 3) // normalize to ~60fps frames
    this.lastTime = now

    this.updateFn(dt)
    this.renderFn()
  }
}
```

### Step 3: Create the canvas manager

Create `ui/src/game/engine/Canvas.ts`:

```typescript
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants'

export class Canvas {
  readonly el: HTMLCanvasElement
  readonly ctx: CanvasRenderingContext2D
  private scaleX = 1
  private scaleY = 1

  constructor(canvas: HTMLCanvasElement) {
    this.el = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D not supported')
    this.ctx = ctx
    ctx.imageSmoothingEnabled = false // crispy pixels
    this.resize()
  }

  resize() {
    const parent = this.el.parentElement
    if (!parent) return

    const w = parent.clientWidth
    const h = parent.clientHeight

    // Maintain aspect ratio
    const aspect = CANVAS_WIDTH / CANVAS_HEIGHT
    let drawW = w
    let drawH = w / aspect
    if (drawH > h) {
      drawH = h
      drawW = h * aspect
    }

    this.el.width = CANVAS_WIDTH
    this.el.height = CANVAS_HEIGHT
    this.el.style.width = `${drawW}px`
    this.el.style.height = `${drawH}px`

    this.scaleX = CANVAS_WIDTH / drawW
    this.scaleY = CANVAS_HEIGHT / drawH

    this.ctx.imageSmoothingEnabled = false
  }

  /** Convert screen coords (click/touch) to game coords */
  toGameCoords(screenX: number, screenY: number): { x: number; y: number } {
    const rect = this.el.getBoundingClientRect()
    return {
      x: (screenX - rect.left) * this.scaleX,
      y: (screenY - rect.top) * this.scaleY,
    }
  }

  clear() {
    this.ctx.fillStyle = COLORS.sky
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  }

  /** Draw a filled rectangle */
  rect(x: number, y: number, w: number, h: number, color: string) {
    this.ctx.fillStyle = color
    this.ctx.fillRect(Math.round(x), Math.round(y), w, h)
  }

  /** Draw pixel-art sprite from a 2D number array with a color palette */
  sprite(
    grid: number[][],
    x: number,
    y: number,
    pixelSize: number,
    palette: Record<number, string>,
  ) {
    for (let row = 0; row < grid.length; row++) {
      const r = grid[row]
      if (!r) continue
      for (let col = 0; col < r.length; col++) {
        const cell = r[col]
        if (cell === undefined || cell === 0) continue
        const color = palette[cell]
        if (!color) continue
        this.ctx.fillStyle = color
        this.ctx.fillRect(
          Math.round(x + col * pixelSize),
          Math.round(y + row * pixelSize),
          pixelSize,
          pixelSize,
        )
      }
    }
  }

  /** Draw text */
  text(
    str: string,
    x: number,
    y: number,
    color: string,
    size = 8,
    align: CanvasTextAlign = 'left',
  ) {
    this.ctx.fillStyle = color
    this.ctx.font = `${size}px monospace`
    this.ctx.textAlign = align
    this.ctx.textBaseline = 'top'
    this.ctx.fillText(str, Math.round(x), Math.round(y))
  }
}
```

### Step 4: Create the input manager

Create `ui/src/game/engine/Input.ts`:

```typescript
export type GameAction = 'left' | 'right' | 'jump' | 'shoot' | 'special' | 'pause'

const KEY_MAP: Record<string, GameAction> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'jump',
  ' ': 'shoot',
  z: 'special',
  Z: 'special',
  p: 'pause',
  P: 'pause',
}

export class Input {
  /** Currently held actions */
  private held = new Set<GameAction>()
  /** Actions pressed this frame (edge-triggered) */
  private justPressedSet = new Set<GameAction>()
  /** Touch action state */
  private touchHeld = new Set<GameAction>()

  constructor() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  /** Call at END of each game update to clear justPressed */
  endFrame() {
    this.justPressedSet.clear()
  }

  isHeld(action: GameAction): boolean {
    return this.held.has(action) || this.touchHeld.has(action)
  }

  justPressed(action: GameAction): boolean {
    return this.justPressedSet.has(action)
  }

  /** Touch controls call these */
  touchStart(action: GameAction) {
    this.touchHeld.add(action)
    this.justPressedSet.add(action)
  }

  touchEnd(action: GameAction) {
    this.touchHeld.delete(action)
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const action = KEY_MAP[e.key]
    if (!action) return
    e.preventDefault()
    if (!this.held.has(action)) {
      this.justPressedSet.add(action)
    }
    this.held.add(action)
  }

  private onKeyUp = (e: KeyboardEvent) => {
    const action = KEY_MAP[e.key]
    if (!action) return
    this.held.delete(action)
  }
}
```

### Step 5: Verify TypeScript compiles

Run: `cd /tmp/kitzV1/ui && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to the new files (existing errors may appear).

### Step 6: Commit

```bash
cd /tmp/kitzV1
git add ui/src/game/constants.ts ui/src/game/engine/GameLoop.ts ui/src/game/engine/Canvas.ts ui/src/game/engine/Input.ts
git commit -m "feat(game): add core engine — game loop, canvas, input manager"
```

---

## Task 2: Camera & Collision Systems

Add the side-scrolling camera and AABB collision detection.

**Files:**
- Create: `ui/src/game/engine/Camera.ts`
- Create: `ui/src/game/engine/Collision.ts`

### Step 1: Create the camera

Create `ui/src/game/engine/Camera.ts`:

```typescript
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants'

export class Camera {
  x = 0
  y = 0

  /** How far ahead of the player the camera looks */
  private leadX = CANVAS_WIDTH * 0.35
  private smoothing = 0.08

  /** Total level width in pixels — camera won't scroll past this */
  levelWidth = CANVAS_WIDTH

  update(playerX: number, _playerY: number) {
    // Target: player at 35% from left edge
    const targetX = playerX - this.leadX

    // Smooth follow
    this.x += (targetX - this.x) * this.smoothing

    // Clamp to level bounds
    this.x = Math.max(0, Math.min(this.x, this.levelWidth - CANVAS_WIDTH))
    this.y = 0 // horizontal scroller — no vertical camera
  }
}
```

### Step 2: Create collision detection

Create `ui/src/game/engine/Collision.ts`:

```typescript
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** Axis-aligned bounding box overlap test */
export function aabb(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  )
}

/** Check if a point is inside a rect */
export function pointInRect(px: number, py: number, r: Rect): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h
}
```

### Step 3: Commit

```bash
cd /tmp/kitzV1
git add ui/src/game/engine/Camera.ts ui/src/game/engine/Collision.ts
git commit -m "feat(game): add camera and collision systems"
```

---

## Task 3: Kitz Player Sprite & Physics

Define the Kitz player with pixel-art sprites, physics (run, jump, gravity), and basic state machine (idle, run, jump, shoot).

**Files:**
- Create: `ui/src/game/sprites/KitzSprite.ts`
- Create: `ui/src/game/entities/Player.ts`

### Step 1: Create Kitz sprite data

Create `ui/src/game/sprites/KitzSprite.ts`:

```typescript
// Pixel-art sprite data for Kitz in all 5 forms
// Each grid: 0 = transparent, 1 = body, 2 = highlight, 3 = dark, 4 = eye, 5 = special

import { COLORS } from '../constants'

// ── Base Kitz (Level 1) ── 8x8 body (matches existing Orb shape)
export const KITZ_BODY: number[][] = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 4, 1, 1, 4, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 3, 3, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
]

// Feet frames for run animation
export const KITZ_FEET: number[][][] = [
  [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 3, 0, 0, 3, 0, 0]], // neutral
  [[0, 0, 0, 0, 0, 0, 0, 0], [0, 3, 0, 0, 0, 3, 0, 0]], // left step
  [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 3, 0, 0, 0, 3, 0]], // right step
]

// Antenna
export const KITZ_ANTENNA: number[][] = [
  [0, 0, 0, 5, 5, 0, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 0],
]

// Color palettes for each level
export const KITZ_PALETTES: Record<number, Record<number, string>> = {
  1: { 1: COLORS.purple, 2: COLORS.lavender, 3: COLORS.purpleDark, 4: COLORS.dark, 5: COLORS.purpleLight },
  2: { 1: COLORS.purple, 2: COLORS.lavender, 3: COLORS.purpleDark, 4: COLORS.dark, 5: COLORS.blue },
  3: { 1: COLORS.purple, 2: COLORS.gold, 3: COLORS.purpleDark, 4: COLORS.dark, 5: COLORS.gold },
  4: { 1: COLORS.purple, 2: COLORS.white, 3: COLORS.purpleDark, 4: COLORS.dark, 5: COLORS.white },
  5: { 1: COLORS.purple, 2: COLORS.gold, 3: COLORS.purpleDark, 4: COLORS.dark, 5: COLORS.gold },
}

// Laser projectile sprite (4x2)
export const LASER_SPRITE: number[][] = [
  [0, 1, 1, 2],
  [0, 1, 1, 2],
]

export const LASER_PALETTES: Record<number, Record<number, string>> = {
  1: { 1: COLORS.purpleLight, 2: '#fff' },
  2: { 1: COLORS.blue, 2: '#fff' },
  3: { 1: COLORS.gold, 2: '#fff' },
  4: { 1: COLORS.white, 2: '#fff' },
  5: { 1: COLORS.gold, 2: '#fff' },
}
```

### Step 2: Create the Player entity

Create `ui/src/game/entities/Player.ts`:

```typescript
import type { Rect } from '../engine/Collision'
import type { Input } from '../engine/Input'
import type { Canvas } from '../engine/Canvas'
import type { Camera } from '../engine/Camera'
import {
  GRAVITY, MAX_FALL_SPEED, GROUND_Y,
  PLAYER_SPEED, PLAYER_JUMP_FORCE,
  PLAYER_WIDTH, PLAYER_HEIGHT,
  PLAYER_MAX_HP, PLAYER_INVINCIBLE_MS,
} from '../constants'
import {
  KITZ_BODY, KITZ_FEET, KITZ_ANTENNA,
  KITZ_PALETTES, LASER_SPRITE, LASER_PALETTES,
} from '../sprites/KitzSprite'

export interface Projectile extends Rect {
  vx: number
  vy: number
  level: number
  alive: boolean
}

export class Player {
  x: number
  y: number
  vx = 0
  vy = 0
  hp = PLAYER_MAX_HP
  level = 1
  facing: 'left' | 'right' = 'right'
  grounded = false
  invincibleUntil = 0

  // Animation
  private feetFrame = 0
  private feetTimer = 0
  private shootCooldown = 0

  // Projectiles
  projectiles: Projectile[] = []

  constructor(startX: number, startY: number) {
    this.x = startX
    this.y = startY
  }

  get rect(): Rect {
    return { x: this.x, y: this.y, w: PLAYER_WIDTH, h: PLAYER_HEIGHT }
  }

  get isInvincible(): boolean {
    return performance.now() < this.invincibleUntil
  }

  update(input: Input, dt: number) {
    // Horizontal movement
    this.vx = 0
    if (input.isHeld('left')) {
      this.vx = -PLAYER_SPEED * dt
      this.facing = 'left'
    }
    if (input.isHeld('right')) {
      this.vx = PLAYER_SPEED * dt
      this.facing = 'right'
    }
    this.x += this.vx

    // Jump
    if (input.justPressed('jump') && this.grounded) {
      this.vy = PLAYER_JUMP_FORCE
      this.grounded = false
    }

    // Gravity
    this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL_SPEED)
    this.y += this.vy * dt

    // Ground collision (simple flat ground for now)
    if (this.y + PLAYER_HEIGHT >= GROUND_Y) {
      this.y = GROUND_Y - PLAYER_HEIGHT
      this.vy = 0
      this.grounded = true
    }

    // Shoot
    if (this.shootCooldown > 0) this.shootCooldown -= dt
    if (input.justPressed('shoot') && this.shootCooldown <= 0) {
      this.shoot()
      this.shootCooldown = 12 // frames
    }

    // Animate feet
    if (Math.abs(this.vx) > 0.1) {
      this.feetTimer += dt
      if (this.feetTimer > 6) {
        this.feetFrame = (this.feetFrame + 1) % 3
        this.feetTimer = 0
      }
    } else {
      this.feetFrame = 0
    }

    // Update projectiles
    for (const p of this.projectiles) {
      p.x += p.vx * dt
      // Remove off-screen
      if (p.x < -50 || p.x > 2000) p.alive = false
    }
    this.projectiles = this.projectiles.filter((p) => p.alive)
  }

  shoot() {
    const dir = this.facing === 'right' ? 1 : -1
    this.projectiles.push({
      x: this.x + (dir > 0 ? PLAYER_WIDTH : -8),
      y: this.y + PLAYER_HEIGHT / 2 - 2,
      w: 8,
      h: 4,
      vx: 6 * dir,
      vy: 0,
      level: this.level,
      alive: true,
    })
  }

  takeDamage() {
    if (this.isInvincible) return false
    this.hp--
    this.invincibleUntil = performance.now() + PLAYER_INVINCIBLE_MS
    return true
  }

  render(canvas: Canvas, camera: Camera) {
    const sx = Math.round(this.x - camera.x)
    const sy = Math.round(this.y - camera.y)
    const px = 2 // pixel scale
    const palette = KITZ_PALETTES[this.level] ?? KITZ_PALETTES[1]!

    // Blink when invincible
    if (this.isInvincible && Math.floor(performance.now() / 100) % 2 === 0) return

    // Antenna
    canvas.sprite(KITZ_ANTENNA, sx, sy - px * 2, px, palette)

    // Body
    canvas.sprite(KITZ_BODY, sx, sy, px, palette)

    // Feet
    const feet = KITZ_FEET[this.feetFrame] ?? KITZ_FEET[0]!
    canvas.sprite(feet, sx, sy + px * 8, px, palette)

    // Render projectiles
    const lPalette = LASER_PALETTES[this.level] ?? LASER_PALETTES[1]!
    for (const p of this.projectiles) {
      canvas.sprite(LASER_SPRITE, Math.round(p.x - camera.x), Math.round(p.y - camera.y), 2, lPalette)
    }
  }

  reset(startX: number, startY: number) {
    this.x = startX
    this.y = startY
    this.vx = 0
    this.vy = 0
    this.hp = PLAYER_MAX_HP
    this.grounded = false
    this.projectiles = []
    this.shootCooldown = 0
    this.invincibleUntil = 0
  }
}
```

### Step 3: Commit

```bash
cd /tmp/kitzV1
git add ui/src/game/sprites/KitzSprite.ts ui/src/game/entities/Player.ts
git commit -m "feat(game): add Kitz player sprite and physics entity"
```

---

## Task 4: Enemy System

Create the enemy base class and first enemy type (Spam Bot).

**Files:**
- Create: `ui/src/game/entities/Enemy.ts`
- Create: `ui/src/game/sprites/EnemySprites.ts`

### Step 1: Create enemy sprites

Create `ui/src/game/sprites/EnemySprites.ts`:

```typescript
import { COLORS } from '../constants'

// ── Spam Bot (flying, shoots junk) ── 8x8
export const SPAM_BOT_FRAMES: number[][][] = [
  // Frame 0 — wings up
  [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 2, 2, 1, 0, 0],
    [0, 3, 1, 1, 1, 1, 3, 0],
    [3, 3, 1, 4, 4, 1, 3, 3],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 3, 3, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Frame 1 — wings down
  [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 2, 2, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 4, 4, 1, 0, 0],
    [3, 3, 1, 1, 1, 1, 3, 3],
    [0, 3, 1, 3, 3, 1, 3, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
]

export const SPAM_BOT_PALETTE: Record<number, string> = {
  1: '#64748B', // body gray
  2: '#94A3B8', // highlight
  3: '#475569', // dark
  4: COLORS.red, // eyes
}

// ── Tax Gremlin (ground, hops) ── 8x8
export const TAX_GREMLIN_FRAMES: number[][][] = [
  [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 4, 4, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 1, 1, 1, 1, 2, 1],
    [1, 1, 1, 3, 3, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 3, 0, 0, 3, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 4, 4, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 1, 1, 1, 1, 2, 1],
    [0, 1, 1, 3, 3, 1, 1, 0],
    [0, 3, 0, 0, 0, 0, 3, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
]

export const TAX_GREMLIN_PALETTE: Record<number, string> = {
  1: '#16A34A', // green body
  2: '#4ADE80', // highlight
  3: '#15803D', // dark
  4: COLORS.gold, // eyes
}

// ── Bad Review Bug (small, fast, swarms) ── 6x6
export const BAD_REVIEW_FRAMES: number[][][] = [
  [
    [0, 1, 1, 1, 1, 0],
    [1, 4, 1, 1, 4, 1],
    [1, 1, 1, 1, 1, 1],
    [0, 1, 3, 3, 1, 0],
    [0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  [
    [0, 0, 1, 1, 0, 0],
    [0, 1, 4, 4, 1, 0],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 3, 3, 1, 1],
    [0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
]

export const BAD_REVIEW_PALETTE: Record<number, string> = {
  1: '#F97316', // orange
  2: '#FB923C', // light
  3: '#EA580C', // dark
  4: COLORS.dark, // eyes
}

// ── Coin pickup ── 6x6
export const COIN_SPRITE: number[][] = [
  [0, 0, 1, 1, 0, 0],
  [0, 1, 2, 2, 1, 0],
  [1, 2, 1, 2, 2, 1],
  [1, 2, 2, 1, 2, 1],
  [0, 1, 2, 2, 1, 0],
  [0, 0, 1, 1, 0, 0],
]

export const COIN_PALETTE: Record<number, string> = {
  1: COLORS.gold,
  2: '#FDE68A',
}

// ── Health heart pickup ── 6x6
export const HEART_SPRITE: number[][] = [
  [0, 1, 0, 0, 1, 0],
  [1, 1, 1, 1, 1, 1],
  [1, 2, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0],
]

export const HEART_PALETTE: Record<number, string> = {
  1: COLORS.red,
  2: '#FCA5A5',
}
```

### Step 2: Create the Enemy class

Create `ui/src/game/entities/Enemy.ts`:

```typescript
import type { Rect } from '../engine/Collision'
import type { Canvas } from '../engine/Canvas'
import type { Camera } from '../engine/Camera'
import { GROUND_Y } from '../constants'

export type EnemyType = 'spamBot' | 'taxGremlin' | 'badReview'

interface EnemyDef {
  frames: number[][][]
  palette: Record<number, string>
  w: number
  h: number
  hp: number
  speed: number
  points: number
  flying: boolean
}

import {
  SPAM_BOT_FRAMES, SPAM_BOT_PALETTE,
  TAX_GREMLIN_FRAMES, TAX_GREMLIN_PALETTE,
  BAD_REVIEW_FRAMES, BAD_REVIEW_PALETTE,
} from '../sprites/EnemySprites'

const ENEMY_DEFS: Record<EnemyType, EnemyDef> = {
  spamBot: { frames: SPAM_BOT_FRAMES, palette: SPAM_BOT_PALETTE, w: 16, h: 16, hp: 1, speed: 1.5, points: 100, flying: true },
  taxGremlin: { frames: TAX_GREMLIN_FRAMES, palette: TAX_GREMLIN_PALETTE, w: 16, h: 16, hp: 2, speed: 1, points: 150, flying: false },
  badReview: { frames: BAD_REVIEW_FRAMES, palette: BAD_REVIEW_PALETTE, w: 12, h: 12, hp: 1, speed: 2.5, points: 80, flying: false },
}

export class Enemy {
  x: number
  y: number
  type: EnemyType
  hp: number
  alive = true

  private def: EnemyDef
  private animFrame = 0
  private animTimer = 0
  private floatOffset = 0

  constructor(type: EnemyType, x: number, y: number) {
    this.type = type
    this.x = x
    this.def = ENEMY_DEFS[type]
    this.hp = this.def.hp
    // Flying enemies use provided y; ground enemies snap to ground
    this.y = this.def.flying ? y : GROUND_Y - this.def.h
  }

  get rect(): Rect {
    return { x: this.x, y: this.y, w: this.def.w, h: this.def.h }
  }

  get points(): number {
    return this.def.points
  }

  update(dt: number, playerX: number) {
    if (!this.alive) return

    // Move toward player
    const dir = playerX < this.x ? -1 : 1
    this.x += dir * this.def.speed * dt

    // Flying enemies bob up and down
    if (this.def.flying) {
      this.floatOffset += 0.05 * dt
      this.y += Math.sin(this.floatOffset) * 0.5
    }

    // Animate
    this.animTimer += dt
    if (this.animTimer > 15) {
      this.animFrame = (this.animFrame + 1) % this.def.frames.length
      this.animTimer = 0
    }
  }

  takeDamage(amount = 1) {
    this.hp -= amount
    if (this.hp <= 0) {
      this.alive = false
    }
  }

  render(canvas: Canvas, camera: Camera) {
    if (!this.alive) return
    const sx = Math.round(this.x - camera.x)
    const sy = Math.round(this.y - camera.y)
    const frame = this.def.frames[this.animFrame] ?? this.def.frames[0]!
    canvas.sprite(frame, sx, sy, 2, this.def.palette)
  }
}
```

### Step 3: Commit

```bash
cd /tmp/kitzV1
git add ui/src/game/sprites/EnemySprites.ts ui/src/game/entities/Enemy.ts
git commit -m "feat(game): add enemy system with Spam Bot, Tax Gremlin, Bad Review"
```

---

## Task 5: Level Data & Terrain

Create level definitions with terrain platforms, enemy spawn points, and coin placements.

**Files:**
- Create: `ui/src/game/levels/LevelData.ts`
- Create: `ui/src/game/levels/World1.ts`

### Step 1: Create level data types

Create `ui/src/game/levels/LevelData.ts`:

```typescript
import type { EnemyType } from '../entities/Enemy'

export interface Platform {
  x: number
  y: number
  w: number
  h: number
}

export interface EnemySpawn {
  type: EnemyType
  x: number
  y: number
}

export interface CoinSpawn {
  x: number
  y: number
}

export interface QuizTrigger {
  /** X position where quiz activates */
  x: number
  triggered: boolean
}

export interface LevelDef {
  id: string
  name: string
  world: number
  levelNum: number
  width: number
  platforms: Platform[]
  enemies: EnemySpawn[]
  coins: CoinSpawn[]
  quizTriggers: QuizTrigger[]
  /** X position of the finish line */
  finishX: number
  /** Ground color */
  groundColor: string
  /** Sky/background color */
  bgColor: string
}
```

### Step 2: Create World 1 levels

Create `ui/src/game/levels/World1.ts`:

```typescript
import type { LevelDef } from './LevelData'
import { GROUND_Y, CANVAS_HEIGHT, TILE_SIZE } from '../constants'

const T = TILE_SIZE

/** World 1: Startup Street — 5 levels */
export const WORLD_1: LevelDef[] = [
  {
    id: 'w1-1',
    name: 'First Steps',
    world: 1,
    levelNum: 1,
    width: 2400,
    platforms: [
      { x: 300, y: GROUND_Y - T * 4, w: T * 4, h: T },
      { x: 550, y: GROUND_Y - T * 3, w: T * 3, h: T },
      { x: 800, y: GROUND_Y - T * 5, w: T * 5, h: T },
      { x: 1100, y: GROUND_Y - T * 3, w: T * 3, h: T },
      { x: 1400, y: GROUND_Y - T * 4, w: T * 4, h: T },
      { x: 1700, y: GROUND_Y - T * 2, w: T * 6, h: T },
      { x: 2000, y: GROUND_Y - T * 5, w: T * 3, h: T },
    ],
    enemies: [
      { type: 'badReview', x: 400, y: 0 },
      { type: 'badReview', x: 600, y: 0 },
      { type: 'spamBot', x: 900, y: GROUND_Y - T * 8 },
      { type: 'badReview', x: 1200, y: 0 },
      { type: 'taxGremlin', x: 1500, y: 0 },
      { type: 'spamBot', x: 1800, y: GROUND_Y - T * 7 },
      { type: 'badReview', x: 2100, y: 0 },
    ],
    coins: [
      { x: 320, y: GROUND_Y - T * 6 },
      { x: 340, y: GROUND_Y - T * 6 },
      { x: 360, y: GROUND_Y - T * 6 },
      { x: 570, y: GROUND_Y - T * 5 },
      { x: 590, y: GROUND_Y - T * 5 },
      { x: 850, y: GROUND_Y - T * 7 },
      { x: 870, y: GROUND_Y - T * 7 },
      { x: 890, y: GROUND_Y - T * 7 },
      { x: 1450, y: GROUND_Y - T * 6 },
      { x: 1470, y: GROUND_Y - T * 6 },
      { x: 1750, y: GROUND_Y - T * 4 },
      { x: 1770, y: GROUND_Y - T * 4 },
      { x: 1790, y: GROUND_Y - T * 4 },
    ],
    quizTriggers: [
      { x: 1000, triggered: false },
    ],
    finishX: 2300,
    groundColor: '#374151',
    bgColor: '#0D0D12',
  },
  {
    id: 'w1-2',
    name: 'The Grind',
    world: 1,
    levelNum: 2,
    width: 2800,
    platforms: [
      { x: 250, y: GROUND_Y - T * 3, w: T * 3, h: T },
      { x: 500, y: GROUND_Y - T * 5, w: T * 4, h: T },
      { x: 780, y: GROUND_Y - T * 3, w: T * 3, h: T },
      { x: 1000, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 1300, y: GROUND_Y - T * 4, w: T * 5, h: T },
      { x: 1650, y: GROUND_Y - T * 3, w: T * 3, h: T },
      { x: 1900, y: GROUND_Y - T * 5, w: T * 4, h: T },
      { x: 2200, y: GROUND_Y - T * 3, w: T * 3, h: T },
      { x: 2500, y: GROUND_Y - T * 4, w: T * 3, h: T },
    ],
    enemies: [
      { type: 'badReview', x: 350, y: 0 },
      { type: 'spamBot', x: 600, y: GROUND_Y - T * 8 },
      { type: 'taxGremlin', x: 850, y: 0 },
      { type: 'badReview', x: 1100, y: 0 },
      { type: 'badReview', x: 1150, y: 0 },
      { type: 'spamBot', x: 1400, y: GROUND_Y - T * 7 },
      { type: 'taxGremlin', x: 1700, y: 0 },
      { type: 'spamBot', x: 2000, y: GROUND_Y - T * 8 },
      { type: 'badReview', x: 2300, y: 0 },
      { type: 'taxGremlin', x: 2500, y: 0 },
    ],
    coins: [
      { x: 270, y: GROUND_Y - T * 5 },
      { x: 290, y: GROUND_Y - T * 5 },
      { x: 530, y: GROUND_Y - T * 7 },
      { x: 550, y: GROUND_Y - T * 7 },
      { x: 570, y: GROUND_Y - T * 7 },
      { x: 1050, y: GROUND_Y - T * 8 },
      { x: 1350, y: GROUND_Y - T * 6 },
      { x: 1370, y: GROUND_Y - T * 6 },
      { x: 1950, y: GROUND_Y - T * 7 },
      { x: 1970, y: GROUND_Y - T * 7 },
    ],
    quizTriggers: [
      { x: 900, triggered: false },
      { x: 1800, triggered: false },
    ],
    finishX: 2700,
    groundColor: '#374151',
    bgColor: '#0D0D12',
  },
  {
    id: 'w1-3',
    name: 'Red Tape',
    world: 1,
    levelNum: 3,
    width: 3000,
    platforms: [
      { x: 200, y: GROUND_Y - T * 4, w: T * 3, h: T },
      { x: 450, y: GROUND_Y - T * 6, w: T * 2, h: T },
      { x: 650, y: GROUND_Y - T * 4, w: T * 4, h: T },
      { x: 950, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 1250, y: GROUND_Y - T * 3, w: T * 5, h: T },
      { x: 1600, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 1900, y: GROUND_Y - T * 4, w: T * 4, h: T },
      { x: 2200, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 2550, y: GROUND_Y - T * 3, w: T * 4, h: T },
    ],
    enemies: [
      { type: 'taxGremlin', x: 300, y: 0 },
      { type: 'spamBot', x: 500, y: GROUND_Y - T * 9 },
      { type: 'badReview', x: 700, y: 0 },
      { type: 'badReview', x: 750, y: 0 },
      { type: 'taxGremlin', x: 1000, y: 0 },
      { type: 'spamBot', x: 1300, y: GROUND_Y - T * 6 },
      { type: 'taxGremlin', x: 1650, y: 0 },
      { type: 'badReview', x: 1950, y: 0 },
      { type: 'spamBot', x: 2250, y: GROUND_Y - T * 8 },
      { type: 'taxGremlin', x: 2600, y: 0 },
      { type: 'badReview', x: 2650, y: 0 },
    ],
    coins: [
      { x: 230, y: GROUND_Y - T * 6 },
      { x: 250, y: GROUND_Y - T * 6 },
      { x: 470, y: GROUND_Y - T * 8 },
      { x: 700, y: GROUND_Y - T * 6 },
      { x: 720, y: GROUND_Y - T * 6 },
      { x: 1000, y: GROUND_Y - T * 7 },
      { x: 1650, y: GROUND_Y - T * 8 },
      { x: 1670, y: GROUND_Y - T * 8 },
      { x: 1950, y: GROUND_Y - T * 6 },
      { x: 2250, y: GROUND_Y - T * 7 },
      { x: 2270, y: GROUND_Y - T * 7 },
    ],
    quizTriggers: [
      { x: 800, triggered: false },
      { x: 2000, triggered: false },
    ],
    finishX: 2900,
    groundColor: '#374151',
    bgColor: '#0D0D12',
  },
  {
    id: 'w1-4',
    name: 'Hustle Hour',
    world: 1,
    levelNum: 4,
    width: 3200,
    platforms: [
      { x: 300, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 600, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 900, y: GROUND_Y - T * 7, w: T * 2, h: T },
      { x: 1100, y: GROUND_Y - T * 4, w: T * 5, h: T },
      { x: 1500, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 1800, y: GROUND_Y - T * 3, w: T * 4, h: T },
      { x: 2100, y: GROUND_Y - T * 5, w: T * 3, h: T },
      { x: 2400, y: GROUND_Y - T * 4, w: T * 4, h: T },
      { x: 2800, y: GROUND_Y - T * 3, w: T * 3, h: T },
    ],
    enemies: [
      { type: 'badReview', x: 400, y: 0 },
      { type: 'taxGremlin', x: 650, y: 0 },
      { type: 'spamBot', x: 950, y: GROUND_Y - T * 10 },
      { type: 'badReview', x: 1200, y: 0 },
      { type: 'badReview', x: 1250, y: 0 },
      { type: 'taxGremlin', x: 1550, y: 0 },
      { type: 'spamBot', x: 1850, y: GROUND_Y - T * 6 },
      { type: 'badReview', x: 2150, y: 0 },
      { type: 'taxGremlin', x: 2450, y: 0 },
      { type: 'spamBot', x: 2700, y: GROUND_Y - T * 7 },
      { type: 'badReview', x: 2850, y: 0 },
      { type: 'taxGremlin', x: 2900, y: 0 },
    ],
    coins: [
      { x: 350, y: GROUND_Y - T * 5 },
      { x: 370, y: GROUND_Y - T * 5 },
      { x: 650, y: GROUND_Y - T * 7 },
      { x: 670, y: GROUND_Y - T * 7 },
      { x: 1150, y: GROUND_Y - T * 6 },
      { x: 1170, y: GROUND_Y - T * 6 },
      { x: 1550, y: GROUND_Y - T * 8 },
      { x: 1850, y: GROUND_Y - T * 5 },
      { x: 2150, y: GROUND_Y - T * 7 },
      { x: 2170, y: GROUND_Y - T * 7 },
      { x: 2450, y: GROUND_Y - T * 6 },
    ],
    quizTriggers: [
      { x: 1000, triggered: false },
      { x: 2200, triggered: false },
    ],
    finishX: 3100,
    groundColor: '#374151',
    bgColor: '#0D0D12',
  },
  {
    id: 'w1-5',
    name: 'Boss: The Paper Pusher',
    world: 1,
    levelNum: 5,
    width: 1600,
    platforms: [
      { x: 200, y: GROUND_Y - T * 4, w: T * 3, h: T },
      { x: 500, y: GROUND_Y - T * 6, w: T * 3, h: T },
      { x: 900, y: GROUND_Y - T * 4, w: T * 6, h: T },
      { x: 1200, y: GROUND_Y - T * 7, w: T * 3, h: T },
    ],
    enemies: [
      // Boss is spawned separately by the game engine
      { type: 'badReview', x: 400, y: 0 },
      { type: 'badReview', x: 700, y: 0 },
    ],
    coins: [
      { x: 250, y: GROUND_Y - T * 6 },
      { x: 550, y: GROUND_Y - T * 8 },
      { x: 950, y: GROUND_Y - T * 6 },
    ],
    quizTriggers: [],
    finishX: 1500,
    groundColor: '#374151',
    bgColor: '#0D0D12',
  },
]
```

### Step 3: Commit

```bash
cd /tmp/kitzV1
git add ui/src/game/levels/LevelData.ts ui/src/game/levels/World1.ts
git commit -m "feat(game): add level data system and World 1 (Startup Street)"
```

---

## Task 6: Game Manager — Tying It All Together

Create the main game manager that orchestrates the game loop, player, enemies, collisions, scoring, and level progression.

**Files:**
- Create: `ui/src/game/GameManager.ts`

### Step 1: Create the game manager

Create `ui/src/game/GameManager.ts`:

```typescript
import { GameLoop } from './engine/GameLoop'
import { Canvas } from './engine/Canvas'
import { Input } from './engine/Input'
import { Camera } from './engine/Camera'
import { aabb } from './engine/Collision'
import { Player } from './entities/Player'
import { Enemy } from './entities/Enemy'
import type { LevelDef, CoinSpawn } from './levels/LevelData'
import { COIN_SPRITE, COIN_PALETTE, HEART_SPRITE, HEART_PALETTE } from './sprites/EnemySprites'
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, TILE_SIZE,
  SCORE_PER_ENEMY, SCORE_PER_COIN, SCORE_PER_LEVEL, SCORE_NO_DAMAGE_BONUS,
  XP_PER_ENEMY, XP_PER_LEVEL, XP_PER_QUIZ_CORRECT,
  PLAYER_MAX_HP, PLAYER_MAX_LIVES, EXTRA_LIFE_THRESHOLD,
  COLORS,
} from './constants'
import type { GameState } from './constants'

export interface GameCallbacks {
  onScoreChange: (score: number) => void
  onHpChange: (hp: number) => void
  onLivesChange: (lives: number) => void
  onStateChange: (state: GameState) => void
  onQuizTrigger: () => void
  onLevelComplete: (xpEarned: number) => void
  onGameOver: (finalScore: number) => void
}

export class GameManager {
  private loop: GameLoop
  private canvas: Canvas
  private input: Input
  private camera: Camera
  private player: Player

  // Game state
  state: GameState = 'menu'
  score = 0
  lives = PLAYER_MAX_LIVES
  private tookDamage = false
  private nextLifeAt: number

  // Level
  private level: LevelDef | null = null
  private enemies: Enemy[] = []
  private coins: { x: number; y: number; collected: boolean }[] = []
  private xpEarned = 0

  // Callbacks to React
  private callbacks: GameCallbacks

  // Stars (background decoration)
  private stars: { x: number; y: number; size: number; speed: number }[] = []

  constructor(canvasEl: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = new Canvas(canvasEl)
    this.input = new Input()
    this.camera = new Camera()
    this.player = new Player(50, GROUND_Y - 32)
    this.callbacks = callbacks
    this.nextLifeAt = EXTRA_LIFE_THRESHOLD

    // Generate starfield
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * 3000,
        y: Math.random() * (GROUND_Y - 20),
        size: Math.random() > 0.7 ? 2 : 1,
        speed: 0.2 + Math.random() * 0.3,
      })
    }

    this.loop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render(),
    )
  }

  start() {
    this.loop.start()
  }

  destroy() {
    this.loop.stop()
    this.input.destroy()
  }

  resize() {
    this.canvas.resize()
  }

  loadLevel(levelDef: LevelDef, playerLevel: number) {
    this.level = levelDef
    this.camera.levelWidth = levelDef.width
    this.camera.x = 0
    this.player.reset(50, GROUND_Y - 32)
    this.player.level = playerLevel
    this.tookDamage = false
    this.xpEarned = 0

    // Spawn enemies
    this.enemies = levelDef.enemies.map((s) => new Enemy(s.type, s.x, s.y))

    // Spawn coins
    this.coins = levelDef.coins.map((c) => ({ ...c, collected: false }))

    // Reset quiz triggers
    for (const qt of levelDef.quizTriggers) {
      qt.triggered = false
    }

    this.state = 'playing'
    this.callbacks.onStateChange('playing')
    this.callbacks.onHpChange(this.player.hp)
    this.callbacks.onLivesChange(this.lives)
    this.loop.resume()
  }

  pauseGame() {
    if (this.state !== 'playing') return
    this.state = 'paused'
    this.loop.pause()
    this.callbacks.onStateChange('paused')
  }

  resumeGame() {
    if (this.state !== 'paused') return
    this.state = 'playing'
    this.loop.resume()
    this.callbacks.onStateChange('playing')
  }

  /** Called by React when quiz answer is submitted */
  answerQuiz(correct: boolean) {
    if (correct) {
      this.addScore(500)
      this.xpEarned += XP_PER_QUIZ_CORRECT
      // Give a temporary power-up: restore 1 HP
      if (this.player.hp < PLAYER_MAX_HP) {
        this.player.hp++
        this.callbacks.onHpChange(this.player.hp)
      }
    }
    // Resume game
    this.state = 'playing'
    this.loop.resume()
    this.callbacks.onStateChange('playing')
  }

  /** Touch control pass-through */
  touchAction(action: 'left' | 'right' | 'jump' | 'shoot' | 'special', pressed: boolean) {
    if (pressed) this.input.touchStart(action)
    else this.input.touchEnd(action)
  }

  // ── Private ──

  private update(dt: number) {
    if (this.state !== 'playing' || !this.level) return

    // Pause check
    if (this.input.justPressed('pause')) {
      this.pauseGame()
      this.input.endFrame()
      return
    }

    // Update player
    this.player.update(this.input, dt)

    // Platform collisions
    for (const plat of this.level.platforms) {
      const pr = this.player.rect
      // Only check if falling
      if (this.player.vy >= 0 &&
        pr.x + pr.w > plat.x && pr.x < plat.x + plat.w &&
        pr.y + pr.h >= plat.y && pr.y + pr.h <= plat.y + plat.h + 4) {
        this.player.y = plat.y - pr.h
        this.player.vy = 0
        this.player.grounded = true
      }
    }

    // Update enemies
    for (const enemy of this.enemies) {
      enemy.update(dt, this.player.x)
    }

    // Projectile vs enemy collision
    for (const proj of this.player.projectiles) {
      for (const enemy of this.enemies) {
        if (!enemy.alive || !proj.alive) continue
        if (aabb(proj, enemy.rect)) {
          proj.alive = false
          enemy.takeDamage()
          if (!enemy.alive) {
            this.addScore(enemy.points)
            this.xpEarned += XP_PER_ENEMY
          }
        }
      }
    }

    // Enemy vs player collision
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue
      if (aabb(this.player.rect, enemy.rect)) {
        if (this.player.takeDamage()) {
          this.tookDamage = true
          this.callbacks.onHpChange(this.player.hp)
          if (this.player.hp <= 0) {
            this.loseLife()
          }
        }
      }
    }

    // Coin collection
    for (const coin of this.coins) {
      if (coin.collected) continue
      if (aabb(this.player.rect, { x: coin.x, y: coin.y, w: 12, h: 12 })) {
        coin.collected = true
        this.addScore(SCORE_PER_COIN)
      }
    }

    // Quiz triggers
    for (const qt of this.level.quizTriggers) {
      if (!qt.triggered && this.player.x >= qt.x) {
        qt.triggered = true
        this.state = 'quiz'
        this.loop.pause()
        this.callbacks.onStateChange('quiz')
        this.callbacks.onQuizTrigger()
      }
    }

    // Finish line check
    if (this.player.x >= this.level.finishX) {
      this.completeLevel()
    }

    // Camera
    this.camera.update(this.player.x, this.player.y)

    // Clear justPressed
    this.input.endFrame()
  }

  private render() {
    if (!this.level) return
    const c = this.canvas
    const cam = this.camera

    // Clear
    c.clear()

    // Stars (parallax)
    for (const star of this.stars) {
      const sx = star.x - cam.x * star.speed
      const screenX = ((sx % CANVAS_WIDTH) + CANVAS_WIDTH) % CANVAS_WIDTH
      c.rect(screenX, star.y, star.size, star.size, COLORS.purpleLight + '30')
    }

    // Ground
    c.rect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y, this.level.groundColor)
    // Ground line
    c.rect(0, GROUND_Y, CANVAS_WIDTH, 2, COLORS.purpleLight + '40')

    // Platforms
    for (const plat of this.level.platforms) {
      const px = Math.round(plat.x - cam.x)
      c.rect(px, plat.y, plat.w, plat.h, '#4B5563')
      c.rect(px, plat.y, plat.w, 2, '#6B7280')
    }

    // Coins
    for (const coin of this.coins) {
      if (coin.collected) continue
      c.sprite(COIN_SPRITE, Math.round(coin.x - cam.x), Math.round(coin.y - cam.y), 2, COIN_PALETTE)
    }

    // Enemies
    for (const enemy of this.enemies) {
      enemy.render(c, cam)
    }

    // Player
    this.player.render(c, cam)

    // Finish flag (simple pixel flag)
    if (this.level) {
      const fx = Math.round(this.level.finishX - cam.x)
      c.rect(fx, GROUND_Y - TILE_SIZE * 5, 3, TILE_SIZE * 5, COLORS.purpleLight)
      c.rect(fx + 3, GROUND_Y - TILE_SIZE * 5, TILE_SIZE, TILE_SIZE, COLORS.gold)
    }
  }

  private addScore(points: number) {
    this.score += points
    this.callbacks.onScoreChange(this.score)

    // Check for extra life
    if (this.score >= this.nextLifeAt) {
      this.lives++
      this.nextLifeAt += EXTRA_LIFE_THRESHOLD
      this.callbacks.onLivesChange(this.lives)
    }
  }

  private loseLife() {
    this.lives--
    this.callbacks.onLivesChange(this.lives)

    if (this.lives <= 0) {
      this.state = 'gameOver'
      this.loop.pause()
      this.callbacks.onStateChange('gameOver')
      this.callbacks.onGameOver(this.score)
    } else {
      // Restart level
      this.player.reset(50, GROUND_Y - 32)
      this.player.hp = PLAYER_MAX_HP
      this.callbacks.onHpChange(this.player.hp)
    }
  }

  private completeLevel() {
    this.state = 'levelComplete'
    this.loop.pause()

    let levelScore = SCORE_PER_LEVEL
    if (!this.tookDamage) levelScore += SCORE_NO_DAMAGE_BONUS
    this.addScore(levelScore)

    this.xpEarned += XP_PER_LEVEL
    this.callbacks.onStateChange('levelComplete')
    this.callbacks.onLevelComplete(this.xpEarned)
  }
}
```

### Step 2: Commit

```bash
cd /tmp/kitzV1
git add ui/src/game/GameManager.ts
git commit -m "feat(game): add GameManager orchestrating loop, collision, scoring"
```

---

## Task 7: React UI Layer — KitzGame Component, HUD, Touch Controls

Create the React wrapper that hosts the Canvas game, HUD overlay, touch controls, quiz popup, and menus.

**Files:**
- Create: `ui/src/game/ui/HUD.tsx`
- Create: `ui/src/game/ui/TouchControls.tsx`
- Create: `ui/src/game/ui/QuizOverlay.tsx`
- Create: `ui/src/game/ui/LevelSelect.tsx`
- Create: `ui/src/game/ui/GameOverScreen.tsx`
- Create: `ui/src/game/ui/LevelCompleteScreen.tsx`
- Create: `ui/src/game/KitzGame.tsx`

### Step 1: Create HUD

Create `ui/src/game/ui/HUD.tsx`:

```tsx
interface HUDProps {
  score: number
  hp: number
  maxHp: number
  lives: number
  levelName: string
  worldNum: number
}

export function HUD({ score, hp, maxHp, lives, levelName, worldNum }: HUDProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 font-mono text-xs text-white">
      {/* Left: score */}
      <div>
        <div className="text-[10px] text-purple-300">WORLD {worldNum}</div>
        <div className="text-sm font-bold">{score.toLocaleString()}</div>
      </div>

      {/* Center: level name */}
      <div className="text-center text-[10px] text-gray-400 uppercase tracking-wider">
        {levelName}
      </div>

      {/* Right: health + lives */}
      <div className="flex items-center gap-3">
        {/* Hearts */}
        <div className="flex gap-0.5">
          {Array.from({ length: maxHp }, (_, i) => (
            <span key={i} className={i < hp ? 'text-red-500' : 'text-gray-600'}>
              {i < hp ? '\u2764' : '\u2661'}
            </span>
          ))}
        </div>
        {/* Lives */}
        <div className="text-[10px] text-gray-400">
          x{lives}
        </div>
      </div>
    </div>
  )
}
```

### Step 2: Create touch controls

Create `ui/src/game/ui/TouchControls.tsx`:

```tsx
import { useCallback } from 'react'

interface TouchControlsProps {
  onAction: (action: 'left' | 'right' | 'jump' | 'shoot' | 'special', pressed: boolean) => void
  onPause: () => void
}

export function TouchControls({ onAction, onPause }: TouchControlsProps) {
  const btn = useCallback(
    (action: 'left' | 'right' | 'jump' | 'shoot' | 'special') => ({
      onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); onAction(action, true) },
      onTouchEnd: (e: React.TouchEvent) => { e.preventDefault(); onAction(action, false) },
      onTouchCancel: (e: React.TouchEvent) => { e.preventDefault(); onAction(action, false) },
    }),
    [onAction],
  )

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex items-end justify-between p-4 lg:hidden">
      {/* Left side: D-pad */}
      <div className="flex items-center gap-2">
        <button
          {...btn('left')}
          className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-xl text-white active:bg-white/20"
        >
          &larr;
        </button>
        <div className="flex flex-col gap-2">
          <button
            {...btn('jump')}
            className="flex h-10 w-14 items-center justify-center rounded-xl bg-white/10 text-xl text-white active:bg-white/20"
          >
            &uarr;
          </button>
        </div>
        <button
          {...btn('right')}
          className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-xl text-white active:bg-white/20"
        >
          &rarr;
        </button>
      </div>

      {/* Right side: Action buttons */}
      <div className="flex items-center gap-2">
        <button
          {...btn('special')}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/30 text-[10px] font-bold text-purple-300 active:bg-purple-500/50"
        >
          SP
        </button>
        <button
          {...btn('shoot')}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/40 text-xs font-bold text-white active:bg-purple-500/60"
        >
          FIRE
        </button>
      </div>

      {/* Pause button */}
      <button
        onClick={onPause}
        className="absolute right-4 top-[-40px] flex h-8 w-8 items-center justify-center rounded bg-white/10 text-xs text-white"
      >
        | |
      </button>
    </div>
  )
}
```

### Step 3: Create quiz overlay

Create `ui/src/game/ui/QuizOverlay.tsx`:

```tsx
import { useState } from 'react'
import type { Question } from '@/content/courses'

interface QuizOverlayProps {
  question: Question
  onAnswer: (correct: boolean) => void
}

export function QuizOverlay({ question, onAnswer }: QuizOverlayProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  const handleSelect = (idx: number) => {
    if (revealed) return
    setSelected(idx)
    setRevealed(true)
    const correct = idx === question.correctIndex
    // Short delay before resuming game
    setTimeout(() => onAnswer(correct), 1500)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-purple-500/30 bg-gray-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-purple-400">
          Incoming Intel
        </div>
        <h3 className="mb-4 text-sm font-bold leading-snug text-white">
          {question.question}
        </h3>

        {/* Options */}
        <div className="space-y-2">
          {question.options.map((opt, i) => {
            let style = 'border-gray-700 bg-gray-800 hover:border-purple-400 text-gray-200'
            if (revealed) {
              if (i === question.correctIndex) {
                style = 'border-green-500 bg-green-900/30 text-green-300'
              } else if (i === selected) {
                style = 'border-red-500 bg-red-900/30 text-red-300'
              } else {
                style = 'border-gray-800 bg-gray-900 text-gray-600'
              }
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={revealed}
                className={`w-full rounded-lg border px-3 py-2.5 text-left text-xs transition ${style}`}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {revealed && (
          <div className={`mt-3 rounded-lg p-3 text-xs ${selected === question.correctIndex ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
            {selected === question.correctIndex ? 'Correct! +1 HP restored.' : 'Wrong — enemies incoming faster!'}
            <p className="mt-1 text-gray-400">{question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

### Step 4: Create level select screen

Create `ui/src/game/ui/LevelSelect.tsx`:

```tsx
import { WORLD_1 } from '../levels/World1'
import type { LevelDef } from '../levels/LevelData'

interface LevelSelectProps {
  onSelectLevel: (level: LevelDef) => void
  highScores: Record<string, number>
}

const WORLDS = [
  { num: 1, name: 'Startup Street', levels: WORLD_1, color: '#A855F7', unlocked: true },
  // Future worlds will be added here
]

export function LevelSelect({ onSelectLevel, highScores }: LevelSelectProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[#0D0D12] p-4 font-mono">
      <h1 className="mb-1 text-2xl font-bold text-white">KITZ RUN</h1>
      <p className="mb-8 text-xs text-purple-300">Your hustle deserves infrastructure.</p>

      {WORLDS.map((world) => (
        <div key={world.num} className="mb-6 w-full max-w-md">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-purple-400">
            World {world.num}: {world.name}
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {world.levels.map((level, i) => {
              const score = highScores[level.id]
              return (
                <button
                  key={level.id}
                  onClick={() => world.unlocked && onSelectLevel(level)}
                  disabled={!world.unlocked}
                  className={`flex flex-col items-center rounded-lg border p-3 transition ${
                    world.unlocked
                      ? 'border-purple-500/30 bg-gray-900 text-white hover:border-purple-400 hover:bg-gray-800'
                      : 'border-gray-800 bg-gray-950 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <span className="text-lg font-bold">{i + 1}</span>
                  <span className="mt-1 text-[8px] text-gray-400 truncate w-full text-center">{level.name}</span>
                  {score !== undefined && (
                    <span className="mt-1 text-[8px] text-yellow-400">{score.toLocaleString()}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Keyboard hint */}
      <p className="mt-6 text-[10px] text-gray-600">
        Arrow keys to move &middot; Space to shoot &middot; Z for special
      </p>
    </div>
  )
}
```

### Step 5: Create game over screen

Create `ui/src/game/ui/GameOverScreen.tsx`:

```tsx
interface GameOverScreenProps {
  score: number
  onRetry: () => void
  onQuit: () => void
}

export function GameOverScreen({ score, onRetry, onQuit }: GameOverScreenProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 font-mono">
      <h2 className="text-3xl font-bold text-red-500">GAME OVER</h2>
      <p className="mt-2 text-sm text-gray-400">Final Score</p>
      <p className="text-2xl font-bold text-white">{score.toLocaleString()}</p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={onRetry}
          className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-bold text-white hover:bg-purple-500"
        >
          Try Again
        </button>
        <button
          onClick={onQuit}
          className="rounded-lg bg-gray-700 px-6 py-2 text-sm font-bold text-white hover:bg-gray-600"
        >
          Quit
        </button>
      </div>
    </div>
  )
}
```

### Step 6: Create level complete screen

Create `ui/src/game/ui/LevelCompleteScreen.tsx`:

```tsx
interface LevelCompleteScreenProps {
  levelName: string
  score: number
  xpEarned: number
  onNextLevel: () => void
  onQuit: () => void
}

export function LevelCompleteScreen({ levelName, score, xpEarned, onNextLevel, onQuit }: LevelCompleteScreenProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 font-mono">
      <h2 className="text-2xl font-bold text-green-400">LEVEL CLEAR!</h2>
      <p className="mt-1 text-xs text-gray-400">{levelName}</p>
      <div className="mt-4 flex items-center gap-6">
        <div className="text-center">
          <p className="text-[10px] text-gray-500">SCORE</p>
          <p className="text-lg font-bold text-white">{score.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500">XP EARNED</p>
          <p className="text-lg font-bold text-purple-400">+{xpEarned}</p>
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          onClick={onNextLevel}
          className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-bold text-white hover:bg-purple-500"
        >
          Next Level
        </button>
        <button
          onClick={onQuit}
          className="rounded-lg bg-gray-700 px-6 py-2 text-sm font-bold text-white hover:bg-gray-600"
        >
          Level Select
        </button>
      </div>
    </div>
  )
}
```

### Step 7: Create the main KitzGame React component

Create `ui/src/game/KitzGame.tsx`:

```tsx
import { useRef, useEffect, useState, useCallback } from 'react'
import { GameManager } from './GameManager'
import { useGameStore } from '@/stores/gameStore'
import { COURSES } from '@/content/courses'
import type { Question } from '@/content/courses'
import type { LevelDef } from './levels/LevelData'
import type { GameState } from './constants'
import { PLAYER_MAX_HP, PLAYER_MAX_LIVES } from './constants'
import { WORLD_1 } from './levels/World1'

import { HUD } from './ui/HUD'
import { TouchControls } from './ui/TouchControls'
import { QuizOverlay } from './ui/QuizOverlay'
import { LevelSelect } from './ui/LevelSelect'
import { GameOverScreen } from './ui/GameOverScreen'
import { LevelCompleteScreen } from './ui/LevelCompleteScreen'

const ALL_LEVELS = [...WORLD_1]

/** Get a random question from courses for quiz popups */
function getRandomQuestion(): Question {
  const allQuestions = COURSES.flatMap((c) => c.questions)
  return allQuestions[Math.floor(Math.random() * allQuestions.length)]!
}

export function KitzGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameManager | null>(null)
  const addXP = useGameStore((s) => s.addXP)
  const playerLevel = useGameStore((s) => s.level)

  // UI state
  const [gameState, setGameState] = useState<GameState>('menu')
  const [score, setScore] = useState(0)
  const [hp, setHp] = useState(PLAYER_MAX_HP)
  const [lives, setLives] = useState(PLAYER_MAX_LIVES)
  const [currentLevel, setCurrentLevel] = useState<LevelDef | null>(null)
  const [quizQuestion, setQuizQuestion] = useState<Question | null>(null)
  const [xpEarned, setXpEarned] = useState(0)
  const [highScores, setHighScores] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem('kitz-run-scores')
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  })

  // Initialize game manager
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gm = new GameManager(canvas, {
      onScoreChange: setScore,
      onHpChange: setHp,
      onLivesChange: setLives,
      onStateChange: setGameState,
      onQuizTrigger: () => {
        setQuizQuestion(getRandomQuestion())
      },
      onLevelComplete: (xp) => {
        setXpEarned(xp)
        addXP(xp)
      },
      onGameOver: (finalScore) => {
        // Save high score
        if (currentLevel) {
          setHighScores((prev) => {
            const updated = { ...prev }
            const existing = updated[currentLevel.id]
            if (!existing || finalScore > existing) {
              updated[currentLevel.id] = finalScore
            }
            try { localStorage.setItem('kitz-run-scores', JSON.stringify(updated)) } catch {}
            return updated
          })
        }
      },
    })

    gm.start()
    gameRef.current = gm

    const handleResize = () => gm.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      gm.destroy()
      window.removeEventListener('resize', handleResize)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectLevel = useCallback((level: LevelDef) => {
    setCurrentLevel(level)
    setScore(0)
    setHp(PLAYER_MAX_HP)
    setLives(PLAYER_MAX_LIVES)
    gameRef.current?.loadLevel(level, playerLevel)
  }, [playerLevel])

  const handleQuizAnswer = useCallback((correct: boolean) => {
    setQuizQuestion(null)
    gameRef.current?.answerQuiz(correct)
  }, [])

  const handlePause = useCallback(() => {
    const gm = gameRef.current
    if (!gm) return
    if (gm.state === 'playing') gm.pauseGame()
    else if (gm.state === 'paused') gm.resumeGame()
  }, [])

  const handleTouchAction = useCallback(
    (action: 'left' | 'right' | 'jump' | 'shoot' | 'special', pressed: boolean) => {
      gameRef.current?.touchAction(action, pressed)
    }, [],
  )

  const handleRetry = useCallback(() => {
    if (!currentLevel) return
    setScore(0)
    setHp(PLAYER_MAX_HP)
    setLives(PLAYER_MAX_LIVES)
    gameRef.current?.loadLevel(currentLevel, playerLevel)
  }, [currentLevel, playerLevel])

  const handleQuit = useCallback(() => {
    setGameState('menu')
    setCurrentLevel(null)
  }, [])

  const handleNextLevel = useCallback(() => {
    if (!currentLevel) return
    const idx = ALL_LEVELS.findIndex((l) => l.id === currentLevel.id)
    const next = ALL_LEVELS[idx + 1]
    if (next) {
      handleSelectLevel(next)
    } else {
      handleQuit()
    }
  }, [currentLevel, handleSelectLevel, handleQuit])

  // Show level select when in menu state
  if (gameState === 'menu') {
    return <LevelSelect onSelectLevel={handleSelectLevel} highScores={highScores} />
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#0D0D12]">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="block"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* HUD overlay */}
      {currentLevel && gameState === 'playing' && (
        <HUD
          score={score}
          hp={hp}
          maxHp={PLAYER_MAX_HP}
          lives={lives}
          levelName={currentLevel.name}
          worldNum={currentLevel.world}
        />
      )}

      {/* Touch controls */}
      {gameState === 'playing' && (
        <TouchControls onAction={handleTouchAction} onPause={handlePause} />
      )}

      {/* Paused */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 font-mono">
          <h2 className="text-2xl font-bold text-white">PAUSED</h2>
          <div className="mt-4 flex gap-3">
            <button onClick={handlePause} className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-bold text-white hover:bg-purple-500">
              Resume
            </button>
            <button onClick={handleQuit} className="rounded-lg bg-gray-700 px-6 py-2 text-sm font-bold text-white hover:bg-gray-600">
              Quit
            </button>
          </div>
        </div>
      )}

      {/* Quiz overlay */}
      {gameState === 'quiz' && quizQuestion && (
        <QuizOverlay question={quizQuestion} onAnswer={handleQuizAnswer} />
      )}

      {/* Level complete */}
      {gameState === 'levelComplete' && currentLevel && (
        <LevelCompleteScreen
          levelName={currentLevel.name}
          score={score}
          xpEarned={xpEarned}
          onNextLevel={handleNextLevel}
          onQuit={handleQuit}
        />
      )}

      {/* Game over */}
      {gameState === 'gameOver' && (
        <GameOverScreen score={score} onRetry={handleRetry} onQuit={handleQuit} />
      )}
    </div>
  )
}
```

### Step 8: Commit

```bash
cd /tmp/kitzV1
git add ui/src/game/ui/ ui/src/game/KitzGame.tsx
git commit -m "feat(game): add React UI layer — HUD, touch controls, quiz, menus"
```

---

## Task 8: Wire Game Into the App

Add the game to the navigation, routing, and dashboard.

**Files:**
- Create: `ui/src/pages/GamePage.tsx`
- Modify: `ui/src/components/layout/TopNavBar.tsx` — add "Kitz Run" nav item
- Modify: `ui/src/pages/DashboardPage.tsx` — add game case to renderPage switch
- Modify: `ui/src/App.tsx` — add /game route

### Step 1: Create GamePage

Create `ui/src/pages/GamePage.tsx`:

```tsx
import { KitzGame } from '@/game/KitzGame'

export function GamePage() {
  return (
    <div className="h-full w-full bg-[#0D0D12]">
      <KitzGame />
    </div>
  )
}
```

### Step 2: Add nav item to TopNavBar

In `ui/src/components/layout/TopNavBar.tsx`:
- Add `Gamepad2` to the lucide-react imports
- Add `{ id: 'game', label: 'Kitz Run', icon: Gamepad2 }` to the `navItems` array after the 'learn' entry

### Step 3: Add game case to DashboardPage

In `ui/src/pages/DashboardPage.tsx`:
- Add `import { GamePage } from './GamePage'`
- Add `case 'game': return <GamePage />` to the `renderPage()` switch

### Step 4: Add /game route to App.tsx

In `ui/src/App.tsx`:
- Add `import { GamePage } from '@/pages/GamePage'`
- Add a protected route for `/game`:
```tsx
<Route
  path="/game"
  element={
    <ProtectedRoute>
      <GamePage />
    </ProtectedRoute>
  }
/>
```

### Step 5: Verify build compiles

Run: `cd /tmp/kitzV1/ui && npx tsc --noEmit 2>&1 | head -30`
Expected: No new errors.

Run: `cd /tmp/kitzV1/ui && npx vite build 2>&1 | tail -10`
Expected: Build succeeds.

### Step 6: Commit

```bash
cd /tmp/kitzV1
git add ui/src/pages/GamePage.tsx ui/src/components/layout/TopNavBar.tsx ui/src/pages/DashboardPage.tsx ui/src/App.tsx
git commit -m "feat(game): wire Kitz Run into app navigation and routing"
```

---

## Task 9: Aura & Transformation Visual Effects

Add the DBZ-style aura system to the Canvas game — Blue Flame, Super Saiyan, Ultra Instinct, and Founder Mode visual effects rendered around the player during gameplay.

**Files:**
- Create: `ui/src/game/systems/AuraRenderer.ts`
- Modify: `ui/src/game/entities/Player.ts` — integrate aura rendering

### Step 1: Create AuraRenderer

Create `ui/src/game/systems/AuraRenderer.ts`:

```typescript
import type { Canvas } from '../engine/Canvas'
import { COLORS } from '../constants'

interface AuraLayer {
  color: string
  radius: number
  pulseSpeed: number
  opacity: number
}

const AURA_DEFS: Record<number, AuraLayer[]> = {
  1: [], // Base Kitz — no extra aura
  2: [
    { color: COLORS.blue, radius: 14, pulseSpeed: 0.04, opacity: 0.2 },
  ],
  3: [
    { color: COLORS.blue, radius: 14, pulseSpeed: 0.04, opacity: 0.15 },
    { color: COLORS.gold, radius: 18, pulseSpeed: 0.03, opacity: 0.25 },
  ],
  4: [
    { color: COLORS.blue, radius: 14, pulseSpeed: 0.04, opacity: 0.1 },
    { color: COLORS.gold, radius: 18, pulseSpeed: 0.03, opacity: 0.15 },
    { color: COLORS.white, radius: 22, pulseSpeed: 0.02, opacity: 0.2 },
  ],
  5: [
    { color: COLORS.blue, radius: 14, pulseSpeed: 0.04, opacity: 0.08 },
    { color: COLORS.gold, radius: 18, pulseSpeed: 0.03, opacity: 0.12 },
    { color: COLORS.white, radius: 22, pulseSpeed: 0.02, opacity: 0.15 },
    { color: COLORS.gold, radius: 26, pulseSpeed: 0.015, opacity: 0.2 },
  ],
}

export class AuraRenderer {
  private time = 0

  update(dt: number) {
    this.time += dt
  }

  render(canvas: Canvas, level: number, centerX: number, centerY: number) {
    const layers = AURA_DEFS[level] ?? []
    const ctx = canvas.ctx

    for (const layer of layers) {
      const pulse = Math.sin(this.time * layer.pulseSpeed) * 0.3 + 0.7
      const r = layer.radius * pulse

      ctx.save()
      ctx.globalAlpha = layer.opacity * pulse
      ctx.beginPath()
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
      ctx.fillStyle = layer.color
      ctx.filter = `blur(${Math.round(r * 0.4)}px)`
      ctx.fill()
      ctx.restore()
    }

    // Founder Mode: orbiting dots representing agent teams
    if (level >= 5) {
      const teamCount = 8
      for (let i = 0; i < teamCount; i++) {
        const angle = (i / teamCount) * Math.PI * 2 + this.time * 0.02
        const orbitR = 20 + Math.sin(this.time * 0.01 + i) * 3
        const dx = Math.cos(angle) * orbitR
        const dy = Math.sin(angle) * orbitR * 0.6 // oval orbit
        ctx.save()
        ctx.globalAlpha = 0.6
        ctx.fillStyle = i % 2 === 0 ? COLORS.gold : COLORS.purpleLight
        ctx.beginPath()
        ctx.arc(centerX + dx, centerY + dy, 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }
  }
}
```

### Step 2: Integrate AuraRenderer into Player

In `ui/src/game/entities/Player.ts`:
- Import `AuraRenderer`
- Add `private aura = new AuraRenderer()` to the Player class
- In `update()`, add `this.aura.update(dt)` after the existing update logic
- In `render()`, add `this.aura.render(canvas, this.level, sx + 8, sy + 8)` before rendering the sprite (so aura appears behind)

### Step 3: Commit

```bash
cd /tmp/kitzV1
git add ui/src/game/systems/AuraRenderer.ts ui/src/game/entities/Player.ts
git commit -m "feat(game): add DBZ aura transformations — Blue, Gold, Ultra, Founder"
```

---

## Task 10: Worlds 2-5 Level Data

Add levels for Market Square, Finance Fortress, Tech Tower, and Empire Summit.

**Files:**
- Create: `ui/src/game/levels/World2.ts`
- Create: `ui/src/game/levels/World3.ts`
- Create: `ui/src/game/levels/World4.ts`
- Create: `ui/src/game/levels/World5.ts`
- Modify: `ui/src/game/ui/LevelSelect.tsx` — import and display all worlds
- Modify: `ui/src/game/KitzGame.tsx` — include all levels in ALL_LEVELS

### Step 1: Create World 2-5 files

Each world file follows the same structure as `World1.ts` — export a `WORLD_N: LevelDef[]` array with 5 levels each. Use the same patterns but with:
- Increasing level widths (2400 → 4000+)
- More enemies per level
- More quiz triggers
- Different ground/bg colors per world:
  - World 2 (Market Square): groundColor `#1E3A5F`, bgColor `#0B1628`
  - World 3 (Finance Fortress): groundColor `#2D1B00`, bgColor `#0D0800`
  - World 4 (Tech Tower): groundColor `#1A1A2E`, bgColor `#0A0A14`
  - World 5 (Empire Summit): groundColor `#1C1C1C`, bgColor `#050505`

### Step 2: Update LevelSelect

Add all worlds to the `WORLDS` array in `LevelSelect.tsx`.

### Step 3: Update KitzGame

Update `ALL_LEVELS` to include all world arrays:
```typescript
const ALL_LEVELS = [...WORLD_1, ...WORLD_2, ...WORLD_3, ...WORLD_4, ...WORLD_5]
```

### Step 4: Commit

```bash
cd /tmp/kitzV1
git add ui/src/game/levels/ ui/src/game/ui/LevelSelect.tsx ui/src/game/KitzGame.tsx
git commit -m "feat(game): add Worlds 2-5 level data (25 total levels)"
```

---

## Task 11: Leaderboard

Add a local leaderboard that persists to localStorage.

**Files:**
- Create: `ui/src/game/ui/Leaderboard.tsx`
- Modify: `ui/src/game/ui/LevelSelect.tsx` — add leaderboard toggle
- Modify: `ui/src/game/KitzGame.tsx` — save scores after each level/game over

### Step 1: Create Leaderboard component

Create `ui/src/game/ui/Leaderboard.tsx`:

```tsx
interface LeaderboardEntry {
  name: string
  score: number
  world: number
  level: number
  date: string
}

interface LeaderboardProps {
  onBack: () => void
}

export function Leaderboard({ onBack }: LeaderboardProps) {
  const entries: LeaderboardEntry[] = (() => {
    try {
      const raw = localStorage.getItem('kitz-run-leaderboard')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })()

  const sorted = [...entries].sort((a, b) => b.score - a.score).slice(0, 10)

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[#0D0D12] p-4 font-mono">
      <h2 className="mb-6 text-xl font-bold text-yellow-400">TOP SCORES</h2>
      {sorted.length === 0 ? (
        <p className="text-xs text-gray-500">No scores yet. Play a level!</p>
      ) : (
        <div className="w-full max-w-sm space-y-1">
          {sorted.map((e, i) => (
            <div key={i} className="flex items-center justify-between rounded bg-gray-900 px-3 py-2 text-xs">
              <span className="text-purple-400 font-bold w-6">{i + 1}.</span>
              <span className="text-white flex-1">{e.name}</span>
              <span className="text-gray-400">W{e.world}-{e.level}</span>
              <span className="text-yellow-400 ml-3 font-bold">{e.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={onBack}
        className="mt-6 rounded-lg bg-gray-700 px-6 py-2 text-sm font-bold text-white hover:bg-gray-600"
      >
        Back
      </button>
    </div>
  )
}
```

### Step 2: Wire into LevelSelect and KitzGame

Add a "Leaderboard" button to LevelSelect. Save leaderboard entries when levels complete.

### Step 3: Commit

```bash
cd /tmp/kitzV1
git add ui/src/game/ui/Leaderboard.tsx ui/src/game/ui/LevelSelect.tsx ui/src/game/KitzGame.tsx
git commit -m "feat(game): add local leaderboard with top 10 scores"
```

---

## Task 12: Polish & Final Integration

Final polish: update the Level 5 aura label from pink to Founder Mode, ensure the game XP syncs properly with the main app, clean up any TypeScript errors, and run a full build.

**Files:**
- Modify: `ui/src/components/orb/Orb.tsx` — update Level 5 aura from pink to deep purple + gold (Founder Mode)
- Verify: Full TypeScript compilation
- Verify: Full Vite production build

### Step 1: Update Orb.tsx Level 5 aura

Change the Level 5 `AURA_LAYERS` entry from pink (`#E879F9`) to deep purple + gold:
```typescript
{ color: '#7C3AED', size: 19, blur: 24, opacity: 0.35, speed: 1.5 },   // Level 5: Founder Mode (deep purple)
```

Also update the Level 5 outer ring border color from `#E879F930` to `#FBBF2430` (gold tint).

### Step 2: Verify TypeScript

Run: `cd /tmp/kitzV1/ui && npx tsc --noEmit`
Expected: Clean compilation (or only pre-existing errors unrelated to our code).

### Step 3: Verify production build

Run: `cd /tmp/kitzV1/ui && npx vite build`
Expected: Build succeeds.

### Step 4: Commit

```bash
cd /tmp/kitzV1
git add ui/src/components/orb/Orb.tsx
git commit -m "feat(game): update Level 5 aura to Founder Mode (deep purple + gold)"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Game Engine Core — Loop, Canvas, Input | 4 files |
| 2 | Camera & Collision | 2 files |
| 3 | Kitz Player Sprite & Physics | 2 files |
| 4 | Enemy System | 2 files |
| 5 | Level Data & Terrain | 2 files |
| 6 | Game Manager | 1 file |
| 7 | React UI Layer — HUD, Controls, Quiz, Menus | 7 files |
| 8 | Wire Into App | 4 files modified |
| 9 | Aura & Transformations | 2 files |
| 10 | Worlds 2-5 | 5 files |
| 11 | Leaderboard | 3 files |
| 12 | Polish & Final | 1 file + verification |

**Total: ~35 files, 12 tasks**
