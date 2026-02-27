# KITZ Terminal Command Center — Design Doc

**Date:** 2026-02-25
**Status:** Approved
**File:** `kitz_os/src/cli.ts`
**Run:** `npx tsx kitz_os/src/cli.ts`

## Overview

Interactive terminal REPL that serves as the third interface to KITZ (alongside WhatsApp and Web). Shows the full AOS organism in action: chat, agent activity, swarm visualization, team health, workflows, content creation, coaching, and the Kitz Orb — all in a rich terminal UI.

## Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│            ██████                                                       │
│          ██      ██        K I T Z   C O M M A N D   C E N T E R       │
│         █  ◉    ◉  █       155 tools · 106 agents · 18 teams           │
│         █    ██    █       ⚡ 3.2/5 credits  🟢 ONLINE                 │
│          ██      ██                                                     │
│            ██████          "Your hustle deserves infrastructure"        │
│                                                                         │
├──────────────────────────────────┬──────────────────────────────────────┤
│  💬 CHAT                         │  🧠 AGENT FEED                      │
│                                  │                                      │
│  You: check my leads             │  ┌─ CMO (marketing-growth) ────────┐│
│                                  │  │ 💡 Brainstorming campaign for   ││
│  ⏳ Thinking...                  │  │    Q1 growth push               ││
│  ├─ The Closer                   │  │ → ContentCreator (handoff)      ││
│  │  🔧 crm_listContacts         │  └─────────────────────────────────┘│
│  ├─ Lead Checker                 │                                      │
│  │  📊 Scoring 12 leads         │  ┌─ FeedbackCoach (coaches) ───────┐│
│  └─ Pipeline Opt                 │  │ 🎓 AgentSkillTrainer needs     ││
│     ✅ 3 hot, 5 warm             │  │    retraining on funnel tools   ││
│                                  │  └─────────────────────────────────┘│
│  Kitz: You have 12 leads.       │                                      │
│  3 hot, 5 warm, 4 cold.         │  ┌─ CEO (leadership) ──────────────┐│
│  Top: Maria Garcia (92)         │  │ ⚖️  Launch review: 28/33 GO     ││
│                                  │  │    2 blockers from Legal        ││
│                                  │  └─────────────────────────────────┘│
├──────────────────────────────────┼──────────────────────────────────────┤
│  🐝 SWARM                        │  📊 TEAMS                           │
│                                  │                                      │
│  Run #4d4e — 19/19 ✅ (12.7s)    │  sales-crm      ██████ 6/6 ✅      │
│                                  │  marketing      ██████ 6/6 ✅      │
│  ▸ sales-crm    [██████████] ✅  │  whatsapp       ██████ 6/6 ✅      │
│    The Closer ──→ Lead Checker   │  platform-eng   ██████ 6/6 ✅      │
│    ──→ Pipeline Opt (handoff)    │  devops-ci      █████░ 5/5 ✅      │
│  ▸ marketing    [██████████] ✅  │  content-brand  ██████ 6/6 ✅      │
│    ContentCreator: IG post done  │  ai-ml          ██████ 6/6 ✅      │
│  ▸ devops-ci    [██████████] ✅  │  coaches        █████░ 5/5 ✅      │
│    PipelineEng ✅ MonitorEng ✅   │  meta-tooling   █████░ 5/5 ✅      │
│  ▸ ai-ml        [██████████] ✅  │  ...9 more teams                   │
│    CostTracker: $0.02/req avg    │                                      │
│                                  │  Handoffs: 14  Knowledge: 107       │
│  107 knowledge entries → brain   │  Agents: 107/107 ✅                 │
├──────────────────────────────────┴──────────────────────────────────────┤
│ > Ask Kitz...                                                  [enter] │
└─────────────────────────────────────────────────────────────────────────┘
```

## The Kitz Orb (ASCII Art)

The Orb lives in the header. It has moods that change based on system state:

```
IDLE (breathing)         THINKING (spinning)       SUCCESS (happy)
    ██████                   ██████                   ██████
  ██      ██               ██  ⟳   ██               ██      ██
 █  ·    ·  █             █  ◉    ◉  █             █  ◕    ◕  █
 █    ──    █             █    ~~    █             █    ◡◡    █
  ██      ██               ██      ██               ██      ██
    ██████                   ██████                   ██████

ERROR (alert)            SWARM (buzzing)           SPEAKING (wave)
    ██████                   ██████                   ██████
  ██      ██               ██ ≋≋≋≋ ██               ██      ██
 █  ✖    ✖  █             █  ◉    ◉  █             █  ◉    ◉  █
 █    ──    █             █    ≈≈    █             █    ))) █
  ██      ██               ██      ██               ██      ██
    ██████                   ██████                   ██████
```

The Orb pulses (alternates brightness) every 2s in idle. During swarm, it vibrates (shifts left/right by 1 char). On success, it flashes green.

## Panels

### 1. Chat Panel (top-left)
- Interactive input at bottom
- Messages scroll up
- Agent thinking chain shows in real-time with spinners
- Tool badges: `🔧 tool_name`
- Draft approval: shows `[approve/reject]` inline

### 2. Agent Feed (top-right)
Live stream of events from EventBus. Categorized and color-coded:

| Event | Icon | Color |
|-------|------|-------|
| Leadership decisions | ⚖️ | Yellow |
| Teamwork/handoffs | 🤝 | Cyan |
| Brainstorming | 💡 | Magenta |
| Coaching/learning | 🎓 | Green |
| Content creation | 📣 | Blue |
| Errors/escalations | 🚨 | Red |
| Knowledge shared | 📚 | White |

Cards stack with newest on top. Each card shows: agent name, team, action, timestamp.

### 3. Swarm Panel (bottom-left)
When swarm runs, this panel activates with live visualization:

**Phase 1 — Launch**: Teams appear with empty progress bars
```
▸ sales-crm    [░░░░░░░░░░]
▸ marketing    [░░░░░░░░░░]
```

**Phase 2 — Execution**: Bars fill as agents complete
```
▸ sales-crm    [████░░░░░░] 2/6
  LeadScorer ✅ (26ms) PipelineOpt ⏳
```

**Phase 3 — Handoffs**: Animated arrows between agents
```
▸ sales-crm    [████████░░] 5/6
  The Closer ──→ Lead Checker ──→ Pipeline Opt
                 ══► marketing-growth (cross-team!)
```

**Phase 4 — Complete**: Final stats flash
```
▸ sales-crm    [██████████] ✅ 6/6 (33ms)
  107 knowledge entries → brain 🧠
```

### 4. Teams Dashboard (bottom-right)
All 18 teams with:
- Progress bar showing agent completion
- Success/fail counts
- Last activity timestamp
- Aggregate stats: handoffs, knowledge entries, duration

## Commands

| Command | Action |
|---------|--------|
| Any text | Chat with KITZ AI |
| `swarm` | Run full 18-team swarm with live viz |
| `swarm <team1,team2>` | Run specific teams |
| `agents` | List all 106 agents with status |
| `agents <name>` | Agent detail: tools, actions, team |
| `teams` | Team health overview |
| `launch` | Full 33-agent launch review |
| `daily` | Generate daily ops brief |
| `weekly` | Weekly board packet |
| `battery` | AI Battery breakdown |
| `digest` | CTO digest (auto-fixes, escalations) |
| `warroom` | Active war rooms |
| `workflows` | n8n workflow status |
| `content` | Content creation pipeline |
| `coaching` | Agent training & performance |
| `whatsapp` | Connect WhatsApp — render QR in terminal |
| `clear` | Clear chat history |
| `quit` / Ctrl+C | Exit |

## WhatsApp QR in Terminal

When user types `whatsapp`, the CLI:
1. Connects to WhatsApp connector SSE at `localhost:3006/whatsapp/connect` (or Railway)
2. Receives QR string from Baileys
3. Renders QR code as Unicode block characters directly in the terminal
4. Shows 60-second countdown ring (text-based)
5. On scan success, shows connected phone number

```
  ┌─ WhatsApp Connect ─────────────────────┐
  │                                         │
  │   ██████████████    ████  ██████████    │
  │   ██          ██  ██  ██  ██      ██    │
  │   ██  ██████  ██    ████  ██  ██  ██    │
  │   ██  ██████  ██  ████    ██  ██  ██    │
  │   ██  ██████  ██  ██  ██  ██  ██  ██    │
  │   ██          ██    ██    ██      ██    │
  │   ██████████████  ██  ██  ██████████    │
  │                   ██████                │
  │   ██████  ██  ████    ██████████  ██    │
  │     ██  ████████  ██████    ████        │
  │   ██████████████    ████  ██████████    │
  │                                         │
  │   ⏱ 47s remaining                       │
  │   Scan with WhatsApp > Linked Devices   │
  │                                         │
  │   [Ctrl+C to cancel]                    │
  └─────────────────────────────────────────┘
```

Uses `qrcode-terminal` npm package (renders QR as UTF-8 blocks) or manual Unicode rendering with `█` and `░` characters. The QR auto-refreshes when a new one is emitted by Baileys.

## Architecture

```
kitz_os/src/cli.ts
  ├── ConnectionManager
  │   ├── tryHTTP(localhost:3012)
  │   └── fallbackKernel(in-process)
  ├── App (ink root component)
  │   ├── Header (Orb + status bar)
  │   ├── ChatPanel
  │   │   ├── MessageList
  │   │   ├── AgentThinkingChain
  │   │   └── InputLine
  │   ├── AgentFeedPanel
  │   │   └── EventCard[]
  │   ├── SwarmPanel
  │   │   ├── TeamProgressBar[]
  │   │   ├── HandoffArrow[]
  │   │   └── SwarmStats
  │   ├── TeamsPanel
  │   │   └── TeamRow[]
  │   └── StatusBar (battery, connection)
  ├── WhatsAppConnect
  │   ├── SSE to /whatsapp/connect
  │   ├── QRRenderer (Unicode blocks)
  │   └── CountdownTimer (60s)
  └── EventBridge
      ├── subscribe(eventBus) [in-process]
      └── poll(/api/kitz/agents) [HTTP mode]
```

## Connection Auto-Detection

```typescript
async function connect(): Promise<'http' | 'kernel'> {
  try {
    const res = await fetch('http://localhost:3012/health')
    if (res.ok) return 'http'
  } catch {}
  // Boot kernel in-process
  const { bootKernel } = await import('./kernel.js')
  await bootKernel()
  return 'kernel'
}
```

## Dependencies

```json
{
  "ink": "^5.0.0",
  "ink-spinner": "^5.0.0",
  "ink-text-input": "^6.0.0",
  "chalk": "^5.3.0",
  "qrcode-terminal": "^0.12.0"
}
```

All lightweight. `ink` is React for terminals — fits the project's React-first approach.

## Data Sources

| Panel | HTTP Mode | Kernel Mode |
|-------|-----------|-------------|
| Chat | `POST /api/kitz` | `routeWithAI()` direct |
| Agent Feed | `GET /api/kitz/agents` polling | EventBus subscribe |
| Swarm | `POST /api/kitz/swarm/run` | `SwarmRunner.run()` direct |
| Teams | Derived from swarm results | Same |
| Battery | `GET /api/kitz/battery` | `aiBattery.getStatus()` |
| Digest | `GET /api/kitz/agents/cto/digest` | `CTODigest.current()` |

## Swarm Progress Callback

In-process mode gets real-time progress via callback:

```typescript
const runner = new SwarmRunner({
  onProgress: (update) => {
    // update.type: 'team_start' | 'team_complete' | 'agent_action' | 'handoff' | 'knowledge'
    // Directly updates SwarmPanel state
    swarmStore.dispatch(update)
  }
})
```

HTTP mode polls `/api/kitz/swarm/status` every 500ms during a run.

## File Structure

Single file: `kitz_os/src/cli.ts` (~400-500 lines)

Components are defined inline using ink's React-like API. No separate component files needed — this keeps it self-contained and easy to run.

## Run Command

```bash
# From anywhere in the monorepo
npx tsx kitz_os/src/cli.ts

# Add to package.json scripts
"cli": "tsx src/cli.ts"

# Then just:
cd kitz_os && npm run cli
```

## Success Criteria

1. `npx tsx kitz_os/src/cli.ts` boots in < 3 seconds
2. Chat works identically to WhatsApp/web channel
3. Swarm visualization shows all 107 agents with live progress
4. Orb animates based on system state
5. Agent feed shows real-time leadership, coaching, brainstorming events
6. Battery tracking visible in header
7. All special commands work (swarm, agents, teams, launch, etc.)
