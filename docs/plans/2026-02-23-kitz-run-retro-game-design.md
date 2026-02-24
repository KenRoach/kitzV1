# Kitz Run — Retro Side-Scroller Game Design

## Summary

A retro side-scroller arcade game where Kitz is the hero. Kitz runs, jumps, shoots laser eyes, and fights business-themed enemies across 5 worlds. As the player progresses, Kitz transforms Dragon Ball Z style — from scrappy startup orb to calm, collected Founder Mode where AI agents handle everything.

Business education is invisible. Players learn by playing — enemies are business problems, power-ups are business tools, quiz pop-ups feel like in-game intel briefings. They never realize they're getting smarter.

**Mission alignment:** "Your hustle deserves infrastructure." The game teaches small business owners how to use AI to run their business — without them knowing they're learning.

---

## Target Audience

- Solopreneurs and small business owners, age 25-45
- Based in Latin America, Spanish-first
- Sell on WhatsApp/Instagram
- Mobile-first but also use desktop

---

## Tech Stack

- **Rendering:** HTML Canvas 2D (custom lightweight engine, no external game libs)
- **UI layer:** React + Tailwind (menus, HUD, quiz overlays, touch controls)
- **State:** Zustand (shared gameStore with existing Learn system)
- **Input:** Keyboard (desktop) + touch controls (mobile), auto-detected
- **Persistence:** localStorage (scores, progress, unlocks)
- **Framework:** Vite 7 + React 19 + TypeScript (existing stack)

---

## Core Game Loop

1. Player picks a world/level from the level select screen
2. Kitz auto-runs right through a scrolling pixel-art world
3. Player controls: jump, shoot laser eyes, use special ability
4. Enemies approach — dodge or destroy them
5. Mid-level: time freezes, a quick business question appears (disguised as "intel briefing")
   - Correct answer = temporary power boost (shield, extra damage, coin magnet)
   - Wrong answer = enemies speed up for 5 seconds
6. Reach the end of the level, fight the boss
7. Beat the boss = earn XP, level up, Kitz transforms
8. XP syncs with the main Kitz app (same gameStore)

---

## Controls

### Desktop (Keyboard)
- Arrow keys: move left/right, jump (up)
- Spacebar: shoot laser
- Z key: special ability
- P: pause

### Mobile (Touch)
- Left side: virtual d-pad (left, right, jump)
- Right side: shoot button + special ability button
- Auto-detected based on device

---

## Kitz Power Progression (5 Forms)

### Level 1 — Base Kitz
- **Look:** Standard purple pixel orb
- **Basic attack:** Single laser shot
- **Special:** Puff Dodge (short-range teleport with smoke effect)
- **Passive:** None
- **Vibe:** Scrappy startup energy

### Level 2 — Blue Flame Kitz
- **Look:** Blue aura ring around Kitz
- **Basic attack:** Double laser shot
- **Special:** Speed Burst (2x speed for 3 seconds)
- **Passive:** Faster base movement speed
- **Vibe:** Getting traction

### Level 3 — Super Saiyan Kitz
- **Look:** Gold aura, hair-like energy spikes
- **Basic attack:** Laser Eyes (continuous beam, short duration)
- **Special:** Aura Blast (damages all nearby enemies)
- **Passive:** 1.5x attack damage
- **Vibe:** Scaling up

### Level 4 — Ultra Instinct Kitz
- **Look:** White energy field, calm expression, subtle particle effects
- **Basic attack:** Homing laser (tracks nearest enemy)
- **Special:** Auto-Dodge (phases through damage, ghostly effect)
- **Passive:** Auto-dodge activates every 10 seconds
- **Vibe:** Reading the market before it moves

### Level 5 — Founder Mode
- **Look:** Deep purple body with gold trim aura. All 18 agent team icons orbit Kitz like a solar system. Calm, collected, no screaming energy — pure confidence.
- **Basic attack:** Agent Swarm (auto-targeting projectiles from orbiting agents)
- **Special:** Deploy All Teams (screen-clearing ultimate, agents fan out and handle everything)
- **Passive:** Agents orbit and auto-attack nearby enemies. Kitz barely has to move.
- **Vibe:** The CEO who built the machine. Cool, calm, collected. AI runs the business.

---

## Worlds & Levels (5 Worlds, 5 Levels Each = 25 Total)

### World 1 — Startup Street
- **Theme:** Starting a business, first steps
- **Setting:** City sidewalks, storefronts, coffee shops
- **Stealth learning:** Business registration, basic operations, first customers
- **Boss: The Paper Pusher** — Giant stack of paperwork that throws forms at you
- **Enemies:** Confusion Cloud, Red Tape Worm, Procrastination Snail

### World 2 — Market Square
- **Theme:** Marketing and social media
- **Setting:** Neon-lit marketplace, social media billboards
- **Stealth learning:** Content strategy, audience building, engagement
- **Boss: The Algorithm** — Shape-shifting boss, changes attack patterns unpredictably
- **Enemies:** Spam Bot, Troll Face, Clickbait Fly, Ghost Follower

### World 3 — Finance Fortress
- **Theme:** Money management, taxes, payments
- **Setting:** Vault corridors, coin-filled rooms, ledger walls
- **Stealth learning:** Cash flow, tax deadlines, invoicing
- **Boss: The Debt Collector** — Heavy armored enemy that charges at you
- **Enemies:** Tax Gremlin, Late Invoice Ghost, Bad Debt Blob, Fee Flea

### World 4 — Tech Tower
- **Theme:** Technology, cybersecurity, tools
- **Setting:** Circuit board platforms, server rooms, data streams
- **Stealth learning:** Tech stack choices, security basics, automation
- **Boss: The Hacker** — Invisible enemy, you see attacks before you see it
- **Enemies:** Downtime Glitch, Malware Moth, Bug Beetle, Phishing Hook

### World 5 — Empire Summit
- **Theme:** Scaling, competition, leadership
- **Setting:** Mountain peak, corporate skyline, clouds
- **Stealth learning:** Growth strategy, team building, competitive advantage
- **Boss: Competition Corp** — Mirror version of Kitz without AI, slower and weaker. Shows what you'd be without Kitz.
- **Enemies:** Mix of all previous enemy types, faster and stronger

---

## Enemy Design

Retro pixel-art creatures with business names. Players see cute arcade enemies. The names and behaviors subtly teach business concepts.

### Common Enemies (appear across worlds)
- **Spam Bot** — Flies in patterns, shoots junk mail projectiles
- **Late Invoice Ghost** — Slow follower that gets faster over time. Steals coins on contact.
- **Tax Gremlin** — Hides off-screen, jumps out. Steals coins if it touches you.
- **Bad Review Bug** — Small and fast, comes in swarms of 3-5
- **Downtime Glitch** — Appears as static/noise, freezes a section of the screen temporarily

### World-Specific Enemies
Each world introduces 2-3 unique enemies themed to that world's business topic.

---

## Quiz System (Stealth Learning)

Mid-level, at scripted trigger points (1-2 per level):

1. Screen pauses, pixel-art "incoming transmission" effect
2. A question appears styled as an "Intel Briefing" from Kitz HQ
3. 4 multiple-choice options, 10-second timer
4. **Correct:** Power-up drops (shield, damage boost, coin magnet, health)
5. **Wrong:** Enemies speed up for 5 seconds, brief "signal lost" effect
6. **No answer (timeout):** Nothing happens, game continues

Questions pulled from existing courses.ts content + new game-specific questions. Covers business, marketing, finance, tech, and strategy.

The player never sees the word "quiz" or "test" — it's always framed as tactical intel.

---

## Scoring & Progression

### Points
- Enemy defeated: 100 points
- Boss defeated: 1,000 points
- Quiz correct: 500 points
- Coins collected: 10 points each
- Level completed: 2,000 points
- No-damage bonus: 1,500 points

### XP System
- Shares the existing gameStore XP
- XP_PER_ENEMY = 10
- XP_PER_BOSS = 100
- XP_PER_QUIZ_CORRECT = 50 (same as existing course quiz)
- XP_PER_LEVEL = 200
- Leveling up transforms Kitz (same 5-level system)

### Health
- 3 hearts (like classic Zelda/Mario)
- Lose a heart when hit by enemy/projectile
- Health pickups restore 1 heart
- 0 hearts = game over, restart level

### Lives
- 3 lives per session
- Lose a life = restart current level
- 0 lives = game over, back to level select
- Earn extra life every 10,000 points

---

## Leaderboard

- Local-first (localStorage)
- Shows top 10 scores with: name, score, level reached, world completed
- Future: server-side leaderboard (not MVP)

---

## Architecture

### File Structure
```
ui/src/game/
  engine/
    GameLoop.ts          — requestAnimationFrame game loop (60fps)
    Canvas.ts            — Canvas setup, rendering context, camera
    Input.ts             — Keyboard + touch input manager
    Collision.ts         — AABB collision detection
    Camera.ts            — Side-scrolling camera that follows Kitz
    Particles.ts         — Particle system (puffs, sparks, aura effects)
  sprites/
    KitzSprite.ts        — Kitz pixel data for all 5 forms + animations
    EnemySprites.ts      — All enemy pixel data + animation frames
    ProjectileSprites.ts — Laser, beam, agent projectile sprites
    EffectSprites.ts     — Explosions, power-up pickups, boss death
  levels/
    LevelData.ts         — Level definitions (terrain, spawns, triggers)
    World1.ts            — Startup Street levels
    World2.ts            — Market Square levels
    World3.ts            — Finance Fortress levels
    World4.ts            — Tech Tower levels
    World5.ts            — Empire Summit levels
  systems/
    Combat.ts            — Damage, health, attack logic
    Scoring.ts           — Points, combo tracking
    PowerUps.ts          — Power-up effects and timers
    QuizSystem.ts        — Quiz trigger points, question selection
    Progression.ts       — XP, leveling, form changes
  ui/
    HUD.tsx              — Score, health, level indicator (React overlay)
    PauseMenu.tsx        — Pause screen
    LevelSelect.tsx      — World/level picker
    QuizOverlay.tsx      — Intel briefing quiz popup
    TouchControls.tsx    — Mobile d-pad and action buttons
    GameOver.tsx         — Game over / continue screen
    Leaderboard.tsx      — Top scores display
  KitzGame.tsx           — Main React component (Canvas + UI layers)
  constants.ts           — Colors, sizes, timing values
```

### Integration with Existing App
- New nav item in TopNavBar: "Kitz Run" with Gamepad2 icon
- New page: `pages/GamePage.tsx` — wraps KitzGame component
- Added to DashboardPage switch and App.tsx routes
- Shares gameStore — XP earned in game levels up Kitz everywhere
- Game questions pulled from existing courses.ts + game-specific additions

### Rendering Architecture
- **Canvas layer:** All game rendering (Kitz, enemies, terrain, effects, particles)
- **React overlay layer:** HUD, menus, quiz popups, touch controls (positioned absolute over canvas)
- **Game loop:** requestAnimationFrame at 60fps, runs independently from React
- **State bridge:** Game engine writes to Zustand store for XP/score, React reads for UI updates

---

## MVP Priorities

For the first buildable version, focus on:

1. Game engine (loop, canvas, input, collision, camera)
2. Kitz sprite (base form, run/jump/shoot animations)
3. 1 enemy type (Spam Bot)
4. World 1, Level 1 only (proof of concept)
5. Basic HUD (score, health)
6. Touch + keyboard controls
7. Level complete → XP earned
8. Then iterate: more enemies, more levels, transformations, quiz system, bosses
