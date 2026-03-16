#!/usr/bin/env tsx
/**
 * KITZ — Chat + Activity TUI
 *
 * Layout:
 * ┌─────────────────────────┬───────────────────────┐
 * │                         │ Activity              │
 * │  Kitz: Morning boss     │ ⟳ READ intent         │
 * │                         │ ⟳ EXECUTE tools       │
 * │  you: build a page      │ ⟳ deck_create called  │
 * │                         │ ⟳ VOICE format        │
 * │  Kitz: Done.            │ ✅ 5.4s · 23 credits  │
 * │                         │                       │
 * ├─────────────────────────┴───────────────────────┤
 * │  kitz >  _                                      │
 * └─────────────────────────────────────────────────┘
 *
 * Run:  npm run kitz
 */

// @ts-nocheck — blessed has no proper TypeScript types
import dotenv from 'dotenv'
// Load .env from CWD (repo root) first, then kitz_os/.env as fallback
dotenv.config()
dotenv.config({ path: new URL('../../.env', import.meta.url).pathname, override: false })
dotenv.config({ path: new URL('../.env', import.meta.url).pathname, override: false })
import blessed from 'blessed'
import * as path from 'node:path'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as http from 'node:http'
import { execSync } from 'node:child_process'
// Inline LLM call for memory extraction (avoids ESM .js/.ts import issues)
async function tuiCallLLM(system: string, user: string): Promise<string> {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || ''
  if (!apiKey) return JSON.stringify({ error: 'No API key' })
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 200, temperature: 0.1, system, messages: [{ role: 'user', content: user }] }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return JSON.stringify({ error: `API ${res.status}` })
    const d = await res.json() as { content: Array<{ type: string; text?: string }> }
    return d.content?.find(c => c.type === 'text')?.text || ''
  } catch { return JSON.stringify({ error: 'LLM failed' }) }
}

// ── Config ─────────────────────────────────────────────

const VERSION = '0.1.0'
const KITZ_OS_URL = process.env.KITZ_OS_URL || 'http://localhost:3012'
const WA_URL = process.env.WA_CONNECTOR_URL || 'http://localhost:3006'
const DEV_SECRET = process.env.DEV_TOKEN_SECRET || ''
const PREVIEW_PORT = Number(process.env.KITZ_PREVIEW_PORT) || 3333
const ARTIFACT_DIR = path.join(os.tmpdir(), 'kitz-artifacts')

function findRepoRoot(): string {
  let dir = process.cwd()
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'kitz_os')) && fs.existsSync(path.join(dir, 'aos'))) return dir
    if (fs.existsSync(path.join(dir, 'CLAUDE.md'))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  for (const p of ['/Users/fliaroach/kitzV1', path.join(os.homedir(), 'kitzV1')]) {
    if (fs.existsSync(p)) return p
  }
  return process.cwd()
}

const REPO_ROOT = findRepoRoot()

// ── Types ──────────────────────────────────────────────

type KitzMode = 'plan' | 'ask' | 'go'

interface BootInfo {
  toolCount: number; agentCount: number; teamCount: number
  batteryUsed: number; batteryLimit: number; batteryRemaining: number
  kernelStatus: string; waConnected: boolean; waPhone: string
  uptime: number; nodeVersion: string; platform: string
  hostname: string; user: string; repoPath: string; serviceCount: number
  gitBranch: string; gitCommit: string; gitDirty: boolean
}

// ── State ──────────────────────────────────────────────

let currentMode: KitzMode = 'go'
let previewRunning = false
let previewServer: http.Server | null = null
let lastDraftToken: string | null = null
const artifactRegistry: Array<{ file: string; lang: string; created: Date; sizeKB: number }> = []

// ── Persistent Memory (shared with cli.ts) ────────────

interface MemoryEntry {
  type: 'fact' | 'preference' | 'decision'
  key: string
  value: string
  source: 'user' | 'inferred'
  ts: number
}

const MEMORY_FILE = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'data', 'cli', 'memory.jsonl')

function loadMemories(): MemoryEntry[] {
  try {
    if (!fs.existsSync(MEMORY_FILE)) return []
    return fs.readFileSync(MEMORY_FILE, 'utf-8')
      .split('\n').filter(Boolean)
      .map(line => JSON.parse(line) as MemoryEntry)
  } catch { return [] }
}

function getMemoryContext(): string {
  const memories = loadMemories()
  if (memories.length === 0) return ''
  const facts = memories.filter(m => m.type === 'fact')
  const prefs = memories.filter(m => m.type === 'preference')
  const lines: string[] = []
  if (facts.length > 0) {
    lines.push('Known facts about the user:')
    for (const f of facts) lines.push(`- ${f.key}: ${f.value}`)
  }
  if (prefs.length > 0) {
    lines.push('User preferences:')
    for (const p of prefs) lines.push(`- ${p.key}: ${p.value}`)
  }
  return lines.join('\n')
}

function saveMemory(entry: MemoryEntry): void {
  try {
    const dir = path.dirname(MEMORY_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.appendFileSync(MEMORY_FILE, JSON.stringify(entry) + '\n')
  } catch { /* silent */ }
}

function deleteMemory(key: string): boolean {
  const memories = loadMemories()
  const filtered = memories.filter(m => m.key !== key)
  if (filtered.length === memories.length) return false
  try {
    const dir = path.dirname(MEMORY_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(MEMORY_FILE, filtered.map(m => JSON.stringify(m)).join('\n') + (filtered.length ? '\n' : ''))
    return true
  } catch { return false }
}

function buildKitzContext(message: string, modePrefix: string): string {
  const memoryCtx = getMemoryContext()
  const memories = loadMemories()
  const parts: string[] = []
  parts.push(`[KITZ System Context]
You are KITZ, an AI-powered business operating system. You CAN learn and remember things about the user across sessions.
The user can teach you facts with /remember, remove them with /forget, and see what you know with /memories.
You also auto-detect facts from conversation (name, company, location, products, preferences).
When asked if you can learn: YES, you can. You have a persistent memory system.${memories.length > 0 ? ` You currently remember ${memories.length} thing${memories.length !== 1 ? 's' : ''} about this user.` : ''}
Always respond in the same language the user writes in.`)
  if (memoryCtx) parts.push(`[KITZ Memory — what I know about this user]\n${memoryCtx}`)
  if (modePrefix) parts.push(modePrefix)
  return `${parts.join('\n\n')}\n\nUser message: ${message}`
}

const bootInfo: BootInfo = {
  toolCount: 155, agentCount: 107, teamCount: 19,
  batteryUsed: 0, batteryLimit: 5, batteryRemaining: 5,
  kernelStatus: 'offline', waConnected: false, waPhone: '',
  uptime: 0, nodeVersion: process.version,
  platform: `${os.platform()} ${os.arch()}`,
  hostname: os.hostname(), user: os.userInfo().username,
  repoPath: REPO_ROOT, serviceCount: 0,
  gitBranch: '', gitCommit: '', gitDirty: false,
}

// ── Helpers ────────────────────────────────────────────

async function kitzFetch<T>(urlPath: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-dev-secret': DEV_SECRET,
    ...(opts.headers as Record<string, string> || {}),
  }
  const res = await fetch(`${KITZ_OS_URL}${urlPath}`, { ...opts, headers, signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text().catch(() => 'no body')}`)
  return res.json() as Promise<T>
}

async function probeService(url: string, timeoutMs = 3000): Promise<boolean> {
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(timeoutMs) })
    return res.ok
  } catch { return false }
}

function barText(done: number, total: number, width = 10): string {
  const pct = Math.min(done / Math.max(total, 1), 1)
  const filled = Math.round(pct * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

function timeNow(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

async function gatherBootInfo(): Promise<void> {
  try {
    bootInfo.gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: REPO_ROOT, timeout: 3000 }).toString().trim()
    bootInfo.gitCommit = execSync('git rev-parse --short HEAD', { cwd: REPO_ROOT, timeout: 3000 }).toString().trim()
    bootInfo.gitDirty = execSync('git status --porcelain', { cwd: REPO_ROOT, timeout: 3000 }).toString().trim().length > 0
  } catch {}

  try {
    const dirs = fs.readdirSync(REPO_ROOT, { withFileTypes: true })
    bootInfo.serviceCount = dirs.filter(d =>
      d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('node_modules') &&
      fs.existsSync(path.join(REPO_ROOT, d.name, 'package.json'))
    ).length
  } catch {}

  const [kitzOk, waOk] = await Promise.all([probeService(KITZ_OS_URL), probeService(WA_URL)])
  bootInfo.kernelStatus = kitzOk ? 'online' : 'offline'
  bootInfo.waConnected = waOk

  if (kitzOk) {
    try {
      const status = await kitzFetch<any>('/api/kitz/status')
      bootInfo.toolCount = status.tools_registered ?? 155
      bootInfo.batteryUsed = status.battery?.todayCredits ?? 0
      bootInfo.batteryLimit = status.battery?.dailyLimit ?? 5
      bootInfo.batteryRemaining = status.battery?.remaining ?? (bootInfo.batteryLimit - bootInfo.batteryUsed)
      bootInfo.uptime = status.uptime ?? 0
      bootInfo.kernelStatus = status.status ?? 'online'
    } catch {}
  }
}

// ── Preview Server (embedded) ─────────────────────────

function startPreviewServerSilent(): void {
  if (previewRunning) return
  if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true })

  previewServer = http.createServer((req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${PREVIEW_PORT}`)
    const urlPath = decodeURIComponent(url.pathname)
    res.setHeader('Access-Control-Allow-Origin', '*')

    if (urlPath === '/' || urlPath === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(buildPreviewIndex())
      return
    }

    const filename = urlPath.slice(1)
    const filePath = path.join(ARTIFACT_DIR, filename)
    if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return }

    const content = fs.readFileSync(filePath, 'utf-8')
    const ext = path.extname(filePath).toLowerCase()
    const mime = ext === '.html' ? 'text/html' : ext === '.json' ? 'application/json' : 'text/plain'
    res.writeHead(200, { 'Content-Type': mime })
    res.end(content)
  })

  previewServer.listen(PREVIEW_PORT, '127.0.0.1', () => { previewRunning = true })
  previewServer.on('error', () => { previewRunning = true })
}

function buildPreviewIndex(): string {
  const files = fs.existsSync(ARTIFACT_DIR)
    ? fs.readdirSync(ARTIFACT_DIR).map(f => `<li><a href="/${f}">${f}</a></li>`).join('')
    : ''
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>KITZ Artifacts</title>
<meta http-equiv="refresh" content="5">
<style>body{font-family:monospace;background:#0d0d0d;color:#e0e0e0;padding:2rem}
h1{color:#a855f7}a{color:#a855f7}li{margin:0.3rem 0}</style></head>
<body><h1>KITZ Artifacts</h1><ul>${files || '<li>No artifacts yet</li>'}</ul></body></html>`
}

// ── Mode Info ──────────────────────────────────────────

const MODE_INFO: Record<KitzMode, { label: string; emoji: string; color: string; chatPrefix: string }> = {
  plan: { label: 'PLAN', emoji: '📋', color: '{yellow-fg}', chatPrefix: '[MODE: PLAN — Think step-by-step. Outline what you would do. Do NOT execute tools. Present as a numbered plan.]' },
  ask:  { label: 'ASK',  emoji: '🤔', color: '{blue-fg}',   chatPrefix: '[MODE: ASK — Before performing any action, explain and ask for permission. Be concise.]' },
  go:   { label: 'GO',   emoji: '🚀', color: '{green-fg}',  chatPrefix: '' },
}

// ══════════════════════════════════════════════════════
//  BLESSED TUI — Chat + Activity Sidebar
// ══════════════════════════════════════════════════════

function createDashboard() {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'KitZ (OS)',
    fullUnicode: true,
    forceUnicode: true,
  })

  const INPUT_HEIGHT = 3
  const SIDEBAR_WIDTH = 35

  // ── Chat Panel (left) — clean, no border ──
  const chatPanel = blessed.log({
    parent: screen,
    top: 0,
    left: 0,
    width: `100%-${SIDEBAR_WIDTH}`,
    height: `100%-${INPUT_HEIGHT}`,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: ' ', style: { bg: '#333' } },
    tags: true,
    mouse: true,
    keys: true,
    vi: true,
    wrap: true,
    style: { fg: 'white' },
    padding: { left: 1, right: 1 },
  })

  // ── Activity Sidebar (right) — scrollable log of what's happening ──
  const activityPanel = blessed.log({
    parent: screen,
    label: ' {gray-fg}activity{/} ',
    top: 0,
    right: 0,
    width: SIDEBAR_WIDTH,
    height: `100%-${INPUT_HEIGHT}`,
    border: { type: 'line' },
    style: {
      border: { fg: '#222' },
      fg: '#888',
    },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: ' ', style: { bg: '#222' } },
    tags: true,
    mouse: true,
    wrap: true,
    padding: { left: 1, right: 0 },
  })

  // ── Input Bar (bottom, full width) ──
  const inputBox = blessed.textbox({
    parent: screen,
    bottom: 0,
    left: 0,
    width: '100%',
    height: INPUT_HEIGHT,
    border: { type: 'line' },
    style: {
      border: { fg: '#333' },
      fg: 'white',
    },
    tags: true,
    inputOnFocus: false,
    keys: true,
    mouse: true,
    padding: { left: 1 },
    label: ` {bold}{#a855f7-fg}kitz{/} {gray-fg}›{/} `,
  })

  // ── Command History ──
  const cmdHistory: string[] = []
  let historyIdx = -1

  // ═══════════════════════════════════════════════════
  //  OUTPUT HELPERS
  // ═══════════════════════════════════════════════════

  function appendChat(text: string) {
    chatPanel.log(text)
    screen.render()
  }

  function appendChatLines(lines: string[]) {
    for (const line of lines) chatPanel.log(line)
    screen.render()
  }

  // Activity sidebar — the "what's happening" log
  function logActivity(text: string) {
    activityPanel.log(`{gray-fg}${timeNow()}{/} ${text}`)
    screen.render()
  }

  // ═══════════════════════════════════════════════════
  //  COMMANDS
  // ═══════════════════════════════════════════════════

  async function handleChat(message: string): Promise<void> {
    appendChat(`{gray-fg}you ›{/} {white-fg}${message}{/}`)
    logActivity('{yellow-fg}⟳{/} {bold}READ{/}')
    logActivity('  {cyan-fg}Haiku{/} reading intent')

    try {
      const modePrefix = MODE_INFO[currentMode].chatPrefix
      const fullMessage = buildKitzContext(message, modePrefix)

      logActivity('{yellow-fg}⟳{/} {bold}COMPREHEND{/}')
      logActivity('  {cyan-fg}Haiku{/} classifying intent')
      const startMs = Date.now()

      const res = await kitzFetch<{
        response?: string; reply?: string; message?: string
        tools_used?: string[]; credits_consumed?: number
        draft_token?: string
      }>('/api/kitz', {
        method: 'POST',
        body: JSON.stringify({ message: fullMessage, channel: 'terminal', user_id: `cli:${bootInfo.user}` }),
      })

      const reply = res.response ?? res.reply ?? res.message ?? 'Done.'
      const tools = res.tools_used ?? []
      const credits = res.credits_consumed ?? 0
      const elapsed = Date.now() - startMs

      if (res.draft_token) lastDraftToken = res.draft_token

      // Update battery
      bootInfo.batteryUsed += credits
      bootInfo.batteryRemaining = bootInfo.batteryLimit - bootInfo.batteryUsed

      // Activity: show who's doing what at each phase
      if (tools.length > 0) {
        // Complex request — Sonnet brainstorms
        logActivity('{yellow-fg}⟳{/} {bold}BRAINSTORM{/}')
        logActivity(`  {#a855f7-fg}Sonnet{/} planning ${tools.length} tool${tools.length > 1 ? 's' : ''}`)
        logActivity('{yellow-fg}⟳{/} {bold}EXECUTE{/}')
        logActivity('  {green-fg}gpt-4o-mini{/} running tools')
        for (const t of tools) {
          logActivity(`    {cyan-fg}→{/} ${t}`)
        }
      } else {
        // Simple request — Haiku handles it
        logActivity('{yellow-fg}⟳{/} {bold}BRAINSTORM{/}')
        logActivity('  {cyan-fg}Haiku{/} direct response')
      }
      logActivity('{yellow-fg}⟳{/} {bold}VOICE{/}')
      logActivity('  {cyan-fg}Haiku{/} formatting reply')
      logActivity(`{green-fg}✅{/} done ${elapsed}ms ⚡${credits.toFixed(1)}`)
      if (res.draft_token) {
        logActivity('{yellow-fg}📋{/} draft created → approve?')
      }

      // Chat: clean response
      const replyLines = reply.split('\n')
      appendChat(`{bold}{#a855f7-fg}Kitz:{/} {white-fg}${replyLines[0]}{/}`)
      for (const rl of replyLines.slice(1)) {
        appendChat(`      {white-fg}${rl}{/}`)
      }

      // Artifact detection
      detectAndSaveArtifacts(reply)

      // Draft hint in chat
      if (res.draft_token) {
        appendChat(`{yellow-fg}  📋 Draft pending{/} — {cyan-fg}approve{/} / {cyan-fg}reject{/}`)
      }

      appendChat('')

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reach KITZ'
      logActivity(`{red-fg}✖{/} ${msg.slice(0, 40)}`)
      if (msg.includes('API 404') || msg.includes('fetch')) {
        appendChat(`{yellow-fg}⚠ kitz_os not reachable{/}`)
        appendChat(`{gray-fg}  Start: cd kitz_os && npm run dev{/}`)
      } else {
        appendChat(`{red-fg}❌ ${msg}{/}`)
      }
    }

    screen.render()
  }

  async function handleSwarm(teamsArg?: string): Promise<void> {
    appendChat('{cyan-fg}🐝 Launching swarm...{/}')
    logActivity('{cyan-fg}🐝{/} Swarm starting')
    logActivity('{gray-fg}POST{/} /api/kitz/swarm/run')

    try {
      const body: Record<string, unknown> = { concurrency: 6 }
      if (teamsArg) {
        body.teams = teamsArg.split(',').map(t => t.trim())
        logActivity(`{gray-fg}teams:{/} ${(body.teams as string[]).join(', ')}`)
      }

      const startMs = Date.now()
      const result = await kitzFetch<any>('/api/kitz/swarm/run', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      const elapsed = Date.now() - startMs

      logActivity(`{green-fg}✅{/} Swarm done ${(elapsed / 1000).toFixed(1)}s`)
      logActivity(`{gray-fg}teams:{/} ${result.teamsCompleted}/${result.teamsTotal}`)

      appendChat('')
      appendChat('{bold}{#a855f7-fg}🐝 SWARM{/}')
      appendChat(`{gray-fg}${'─'.repeat(55)}{/}`)
      appendChat(`${result.status === 'completed' ? '{green-fg}COMPLETED{/}' : `{yellow-fg}${(result.status || '').toUpperCase()}{/}`}  Teams: {white-fg}${result.teamsCompleted}/${result.teamsTotal}{/}  Duration: {white-fg}${((result.durationMs || 0) / 1000).toFixed(1)}s{/}`)
      appendChat('')

      for (const tr of (result.teamResults || [])) {
        const succeeded = (tr.agentResults || []).filter((a: any) => a.success).length
        const total = (tr.agentResults || []).length
        const icon = tr.status === 'completed' ? '{green-fg}✅{/}' : '{red-fg}❌{/}'
        const tBar = barText(succeeded, total, 8)
        appendChat(`${icon} {bold}${(tr.team || '').padEnd(22)}{/} [{green-fg}${tBar}{/}] ${succeeded}/${total}  {gray-fg}${tr.durationMs}ms{/}`)

        // Activity: log each team with lead
        logActivity(`${icon} {bold}${tr.team}{/}`)

        for (const ar of (tr.agentResults || [])) {
          const s = ar.success ? '{green-fg}✔{/}' : '{red-fg}✖{/}'
          const err = ar.error ? ` {red-fg}⚠ ${ar.error.slice(0, 25)}{/}` : ''
          appendChat(`   ${s} {white-fg}${(ar.agent || '').padEnd(20)}{/} {cyan-fg}${(ar.tool || '').padEnd(22)}{/} {gray-fg}${ar.durationMs}ms{/}${err}`)

          // Activity: show agent name → what they did
          logActivity(`  ${s} {white-fg}${ar.agent}{/}`)
          logActivity(`    → ${ar.tool}`)
        }
        appendChat('')
      }

      logActivity(`{gray-fg}handoffs:{/} ${result.handoffCount}`)
      logActivity(`{gray-fg}knowledge:{/} ${result.knowledgeWritten} entries`)

    } catch (err) {
      logActivity(`{red-fg}✖{/} Swarm failed`)
      appendChat(`{red-fg}❌ Swarm failed: ${err instanceof Error ? err.message : String(err)}{/}`)
    }

    screen.render()
  }

  function showHelp() {
    appendChatLines([
      '',
      '{bold}{#a855f7-fg}KITZ Commands{/}',
      `{gray-fg}${'─'.repeat(55)}{/}`,
      '',
      '{gray-fg}Just type naturally to chat with Kitz AI.{/}',
      '',
      '{bold}Modes{/}       {cyan-fg}plan{/}  {cyan-fg}ask{/}  {cyan-fg}go{/}',
      '{bold}Drafts{/}      {cyan-fg}approve{/}  {cyan-fg}reject{/}',
      '{bold}Agents{/}      {cyan-fg}swarm{/}  {cyan-fg}launch{/}  {cyan-fg}agents{/}  {cyan-fg}teams{/}  {cyan-fg}digest{/}',
      '{bold}System{/}      {cyan-fg}status{/}  {cyan-fg}battery{/}  {cyan-fg}health{/}  {cyan-fg}services{/}  {cyan-fg}tools{/}',
      '{bold}Code{/}        {cyan-fg}search <q>{/}  {cyan-fg}read <path>{/}  {cyan-fg}explain <path>{/}  {cyan-fg}git{/}',
      '{bold}Preview{/}     {cyan-fg}preview{/}  {cyan-fg}open{/}',
      '{bold}Memory{/}      {cyan-fg}remember <fact>{/}  {cyan-fg}forget <key>{/}  {cyan-fg}memories{/}',
      '{bold}Other{/}       {cyan-fg}daily{/}  {cyan-fg}map{/}  {cyan-fg}env{/}  {cyan-fg}clear{/}  {cyan-fg}quit{/}',
      '',
      '{gray-fg}↑↓ history · Tab scroll · Ctrl-C quit{/}',
      '',
    ])
    logActivity('{gray-fg}help displayed{/}')
  }

  function showStatus() {
    const kIcon = bootInfo.kernelStatus === 'online' ? '{green-fg}●{/}' : '{red-fg}○{/}'
    const wIcon = bootInfo.waConnected ? '{green-fg}●{/}' : '{red-fg}○{/}'
    appendChat('')
    appendChat('{bold}{#a855f7-fg}Status{/}')
    appendChat(`${kIcon} kitz_os {gray-fg}${bootInfo.kernelStatus}{/}   ${wIcon} WhatsApp {gray-fg}${bootInfo.waConnected ? 'ok' : 'off'}{/}   ${previewRunning ? '{green-fg}●{/}' : '{red-fg}○{/}'} Preview {gray-fg}:${PREVIEW_PORT}{/}`)
    appendChat(`Battery: [{green-fg}${barText(bootInfo.batteryUsed, bootInfo.batteryLimit, 15)}{/}] ${bootInfo.batteryUsed.toFixed(1)}/${bootInfo.batteryLimit}`)
    appendChat(`{gray-fg}${bootInfo.toolCount} tools · ${bootInfo.agentCount} agents · ${bootInfo.teamCount} teams · ${bootInfo.gitBranch}${bootInfo.gitDirty ? '*' : ''} @ ${bootInfo.gitCommit}{/}`)
    appendChat('')
    logActivity('{gray-fg}status refreshed{/}')
  }

  function showTeams() {
    const teams = [
      { name: 'whatsapp-comms', lead: 'HeadCustomer', count: 7 },
      { name: 'sales-crm', lead: 'CRO', count: 7 },
      { name: 'marketing-growth', lead: 'CMO', count: 7 },
      { name: 'growth-hacking', lead: 'HeadGrowth', count: 7 },
      { name: 'education-onboarding', lead: 'HeadEducation', count: 6 },
      { name: 'customer-success', lead: 'customerVoice', count: 7 },
      { name: 'content-brand', lead: 'founderAdvocate', count: 7 },
      { name: 'platform-eng', lead: 'HeadEngineering', count: 7 },
      { name: 'frontend', lead: 'CPO', count: 6 },
      { name: 'backend', lead: 'CTO', count: 7 },
      { name: 'devops-ci', lead: 'COO', count: 6 },
      { name: 'qa-testing', lead: 'Reviewer', count: 7 },
      { name: 'ai-ml', lead: 'HeadIntelligenceRisk', count: 7 },
      { name: 'finance-billing', lead: 'CFO', count: 6 },
      { name: 'legal-compliance', lead: 'EthicsTrustGuardian', count: 7 },
      { name: 'strategy-intel', lead: 'Chair', count: 6 },
      { name: 'governance-pmo', lead: 'FocusCapacity', count: 7 },
      { name: 'coaches', lead: 'FeedbackCoach', count: 6 },
      { name: 'meta-tooling', lead: 'CTO', count: 6 },
    ]
    appendChat('')
    appendChat('{bold}{#a855f7-fg}Teams{/}')
    for (const t of teams) {
      appendChat(`{cyan-fg}◆{/} {white-fg}${t.name.padEnd(24)}{/} {#a855f7-fg}${t.lead.padEnd(20)}{/} {gray-fg}${t.count}{/}`)
    }
    appendChat(`{gray-fg}${teams.length} teams · ${teams.reduce((s, t) => s + t.count, 0)} agents{/}`)
    appendChat('')
  }

  function showMap() {
    appendChatLines([
      '',
      '{bold}{#a855f7-fg}Architecture{/}',
      '',
      '  {green-fg}WhatsApp{/}  {cyan-fg}Web{/}  {yellow-fg}Terminal{/}',
      '      {gray-fg}\\    |    /{/}',
      '  {#a855f7-fg}┌──────────────────────────┐{/}',
      '  {#a855f7-fg}│{/}    {bold}kitz_os (Kernel){/}      {#a855f7-fg}│{/}',
      '  {#a855f7-fg}│{/}  Router · Tools · AOS    {#a855f7-fg}│{/}',
      '  {#a855f7-fg}└──┬─────┬─────┬──────┬───┘{/}',
      '  {cyan-fg}LLM{/}   {green-fg}CRM{/}   {yellow-fg}Pay{/}   {red-fg}Swarm{/}',
      '',
    ])
  }

  function detectAndSaveArtifacts(reply: string) {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    let match

    while ((match = codeBlockRegex.exec(reply)) !== null) {
      const lang = match[1] || 'txt'
      const content = match[2].trim()
      if (content.length < 50) continue

      const extMap: Record<string, string> = {
        html: '.html', css: '.css', javascript: '.js', js: '.js',
        typescript: '.ts', ts: '.ts', json: '.json', sql: '.sql',
        python: '.py', yaml: '.yml', markdown: '.md', sh: '.sh',
        svg: '.svg', xml: '.xml',
      }
      const ext = extMap[lang.toLowerCase()] || `.${lang}`

      if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true })

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const filename = `kitz-${timestamp}${ext}`
      const filepath = path.join(ARTIFACT_DIR, filename)

      try {
        fs.writeFileSync(filepath, content, 'utf-8')
        artifactRegistry.push({ file: filepath, lang, created: new Date(), sizeKB: content.length / 1024 })

        const sizeKB = (content.length / 1024).toFixed(1)
        appendChat(`{green-fg}💾 Saved{/} {gray-fg}${lang} · ${sizeKB}KB{/}`)
        logActivity(`{green-fg}💾{/} artifact: ${filename}`)
        if (previewRunning) {
          appendChat(`{cyan-fg}   http://localhost:${PREVIEW_PORT}/${filename}{/}`)
        }
      } catch {}
    }
  }

  function cmdSearch(query: string) {
    if (!query) { appendChat('{yellow-fg}Usage: search <pattern>{/}'); return }
    logActivity(`{gray-fg}grep:{/} "${query}"`)
    try {
      const result = execSync(
        `grep -rn --include="*.ts" --include="*.tsx" --include="*.md" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git "${query.replace(/"/g, '\\"')}" "${REPO_ROOT}" | head -25`,
        { timeout: 15000, maxBuffer: 1024 * 1024 }
      ).toString().trim()

      if (!result) { appendChat(`{gray-fg}No results for "${query}"{/}`); return }

      const lines = result.split('\n')
      logActivity(`{green-fg}✅{/} ${lines.length} matches`)
      appendChat('')
      appendChat(`{bold}{#a855f7-fg}Search: "${query}"{/}`)
      for (const line of lines.slice(0, 20)) {
        const firstColon = line.indexOf(':')
        const secondColon = line.indexOf(':', firstColon + 1)
        if (firstColon > 0 && secondColon > 0) {
          const filePath = line.slice(0, firstColon).replace(REPO_ROOT + '/', '')
          const lineNum = line.slice(firstColon + 1, secondColon)
          const content = line.slice(secondColon + 1).trim().slice(0, 70)
          appendChat(`{cyan-fg}${filePath}{/}{gray-fg}:${lineNum}{/}  ${content}`)
        }
      }
      appendChat('')
    } catch (err) {
      if ((err as any)?.status === 1) { appendChat(`{gray-fg}No results for "${query}"{/}`); return }
      appendChat(`{red-fg}❌ Search error{/}`)
    }
  }

  function cmdGit() {
    logActivity('{gray-fg}git status{/}')
    try {
      const status = execSync('git status --short', { cwd: REPO_ROOT, timeout: 5000 }).toString().trim()
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: REPO_ROOT, timeout: 3000 }).toString().trim()
      const log = execSync('git log --oneline -8', { cwd: REPO_ROOT, timeout: 3000 }).toString().trim()

      appendChat('')
      appendChat(`{bold}{#a855f7-fg}Git{/} {cyan-fg}${branch}{/}`)
      if (status) {
        for (const l of status.split('\n').slice(0, 15)) {
          const flag = l.slice(0, 2)
          const file = l.slice(3)
          const color = flag.includes('M') ? '{yellow-fg}' : flag.includes('A') ? '{green-fg}' : flag.includes('D') ? '{red-fg}' : '{white-fg}'
          appendChat(`  ${color}${flag}{/} ${file}`)
        }
      } else {
        appendChat('{gray-fg}  Clean{/}')
      }
      for (const l of log.split('\n')) {
        const [hash, ...msg] = l.split(' ')
        appendChat(`  {yellow-fg}${hash}{/} {gray-fg}${msg.join(' ')}{/}`)
      }
      appendChat('')
    } catch { appendChat('{red-fg}❌ Git error{/}') }
  }

  function cmdRead(filePath: string) {
    if (!filePath) { appendChat('{yellow-fg}Usage: read <path>{/}'); return }
    const fullPath = filePath.startsWith('/') ? filePath : path.join(REPO_ROOT, filePath)
    if (!fs.existsSync(fullPath)) { appendChat(`{red-fg}Not found: ${fullPath}{/}`); return }
    logActivity(`{gray-fg}read:{/} ${filePath}`)

    try {
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        const entries = fs.readdirSync(fullPath, { withFileTypes: true })
        appendChat('')
        appendChat(`{bold}{#a855f7-fg}${filePath}{/}`)
        for (const e of entries.slice(0, 30)) {
          appendChat(`  ${e.isDirectory() ? '{cyan-fg}📁{/}' : ''} ${e.name}`)
        }
        appendChat('')
        return
      }

      if (stat.size > 50000) { appendChat(`{yellow-fg}⚠ File too large (${(stat.size / 1024).toFixed(0)}KB){/}`); return }

      const content = fs.readFileSync(fullPath, 'utf-8')
      const lines = content.split('\n')
      logActivity(`{green-fg}✅{/} ${lines.length} lines`)
      appendChat('')
      appendChat(`{bold}{#a855f7-fg}${filePath}{/} {gray-fg}(${lines.length} lines){/}`)
      for (let i = 0; i < Math.min(lines.length, 40); i++) {
        appendChat(`{gray-fg}${String(i + 1).padStart(4)}{/} ${lines[i].slice(0, 100)}`)
      }
      if (lines.length > 40) appendChat(`{gray-fg}... ${lines.length - 40} more lines{/}`)
      appendChat('')
    } catch { appendChat('{red-fg}❌ Read failed{/}') }
  }

  // ═══════════════════════════════════════════════════
  //  COMMAND ROUTER
  // ═══════════════════════════════════════════════════

  async function handleInput(input: string) {
    const trimmed = input.trim()
    if (!trimmed) return

    cmdHistory.push(trimmed)
    historyIdx = cmdHistory.length

    const [cmd, ...args] = trimmed.split(/\s+/)
    const arg = args.join(' ')

    switch (cmd.toLowerCase()) {
      // Modes
      case 'mode':
        if (!arg) { appendChat(`{gray-fg}Mode: ${MODE_INFO[currentMode].emoji} ${currentMode}{/}`); return }
        // fall through
      case 'plan': case 'p':
        currentMode = 'plan'; appendChat(`📋 {yellow-fg}PLAN{/} mode`); logActivity('{yellow-fg}mode:{/} plan'); break
      case 'ask': case 'a': case 'safe':
        currentMode = 'ask'; appendChat(`🤔 {blue-fg}ASK{/} mode`); logActivity('{blue-fg}mode:{/} ask'); break
      case 'go': case 'vibe': case 'yolo': case 'ship':
        currentMode = 'go'; appendChat(`🚀 {green-fg}GO{/} mode`); logActivity('{green-fg}mode:{/} go'); break

      // Draft workflow
      case 'approve': case 'approved': case 'yes': case 'confirm':
        if (!lastDraftToken) { appendChat('{yellow-fg}⚠ No pending draft{/}'); break }
        logActivity('{green-fg}→{/} approving draft...')
        try {
          const res = await kitzFetch<any>('/api/kitz/approve', {
            method: 'POST',
            body: JSON.stringify({ token: lastDraftToken, action: 'approve', user_id: `cli:${bootInfo.user}` }),
          })
          lastDraftToken = null
          appendChat(`{green-fg}✅ Approved{/} ${res.response || res.message || 'Done'}`)
          logActivity('{green-fg}✅{/} draft approved')
        } catch (err) {
          appendChat(`{red-fg}❌ ${err instanceof Error ? err.message : 'Failed'}{/}`)
          logActivity('{red-fg}✖{/} approve failed')
        }
        break

      case 'reject': case 'rejected': case 'deny': case 'cancel':
        if (!lastDraftToken) { appendChat('{yellow-fg}⚠ No pending draft{/}'); break }
        lastDraftToken = null
        appendChat('{yellow-fg}❌ Draft rejected{/}')
        logActivity('{yellow-fg}✖{/} draft rejected')
        break

      // Preview
      case 'preview': case 'render':
        if (previewRunning) {
          try { execSync(`open http://localhost:${PREVIEW_PORT}`, { timeout: 3000 }) } catch {}
          appendChat(`{green-fg}●{/} Preview: {cyan-fg}http://localhost:${PREVIEW_PORT}{/}`)
        } else {
          startPreviewServerSilent()
          appendChat(`{green-fg}●{/} Preview: {cyan-fg}http://localhost:${PREVIEW_PORT}{/}`)
        }
        logActivity(`{cyan-fg}preview{/} :${PREVIEW_PORT}`)
        break

      case 'open':
        if (artifactRegistry.length > 0) {
          const last = artifactRegistry[artifactRegistry.length - 1]
          const url = previewRunning
            ? `http://localhost:${PREVIEW_PORT}/${path.basename(last.file)}`
            : `file://${last.file}`
          try { execSync(`open "${url}"`, { timeout: 3000 }) } catch {}
          appendChat(`{green-fg}Opened{/} {gray-fg}${path.basename(last.file)}{/}`)
          logActivity(`{cyan-fg}open{/} ${path.basename(last.file)}`)
        } else {
          appendChat('{yellow-fg}⚠ No artifacts yet{/}')
        }
        break

      // AI & Chat
      case 'daily':
        appendChat('{yellow-fg}📋 Generating daily brief...{/}')
        logActivity('{yellow-fg}⟳{/} daily brief...')
        try {
          const res = await kitzFetch<any>('/api/kitz', {
            method: 'POST',
            body: JSON.stringify({ message: '/daily', channel: 'terminal', user_id: `cli:${bootInfo.user}` }),
          })
          appendChat(`{bold}{#a855f7-fg}Daily:{/} {white-fg}${res.response || res.reply || 'No data'}{/}`)
          logActivity('{green-fg}✅{/} daily delivered')
        } catch (err) {
          appendChat(`{red-fg}❌ ${err instanceof Error ? err.message : 'Failed'}{/}`)
          logActivity('{red-fg}✖{/} daily failed')
        }
        break

      // Agents & Swarm
      case 'swarm': await handleSwarm(arg || undefined); return
      case 'agents':
        logActivity('{gray-fg}GET{/} /api/kitz/agents')
        try {
          const data = await kitzFetch<any>('/api/kitz/agents')
          appendChat('')
          appendChat('{bold}{#a855f7-fg}Agents{/}')
          for (const a of (data.agents || [])) {
            const s = a.online ? '{green-fg}●{/}' : '{red-fg}○{/}'
            appendChat(`${s} {white-fg}${(a.name || '').padEnd(25)}{/} {gray-fg}${a.actionsToday || 0} actions{/}`)
          }
          appendChat('')
          logActivity(`{green-fg}✅{/} ${(data.agents || []).length} agents`)
        } catch (err) { appendChat(`{red-fg}❌ ${err instanceof Error ? err.message : 'Failed'}{/}`) }
        break
      case 'teams': showTeams(); break
      case 'launch':
        appendChat('{yellow-fg}⚖️ Running launch review...{/}')
        logActivity('{yellow-fg}⟳{/} launch review...')
        logActivity('{gray-fg}GET{/} /api/kitz/launch')
        try {
          const startMs = Date.now()
          const data = await kitzFetch<any>('/api/kitz/launch')
          const approved = data.approved
          const votes = data.votes || {}
          const elapsed = Date.now() - startMs

          logActivity(`{green-fg}✅{/} review done ${elapsed}ms`)
          logActivity(`{gray-fg}decided by:{/} {bold}${data.decidedBy || 'CEO'}{/}`)
          logActivity(approved ? '{green-fg}{bold}→ GO{/}' : '{red-fg}{bold}→ NO-GO{/}')
          logActivity(`{green-fg}${votes.go} GO{/} {yellow-fg}${votes.conditional} COND{/} {red-fg}${votes.noGo} NO{/}`)
          if (data.blockers?.length) logActivity(`{red-fg}blockers:{/} ${data.blockers.length}`)

          // Log each reviewer — show who voted what
          for (const r of (data.reviews || [])) {
            const line = String(r).split('\n')[0].slice(0, 32)
            logActivity(`  ${line}`)
          }

          appendChat('')
          appendChat('{bold}{#a855f7-fg}Launch Review{/}')
          appendChat(`${approved ? '{green-fg}{bold}GO ✅{/}' : '{red-fg}{bold}NO-GO ❌{/}'}  {gray-fg}by ${data.decidedBy || 'CEO'}{/}`)
          appendChat(`{green-fg}${votes.go || 0} GO{/}  {yellow-fg}${votes.conditional || 0} COND{/}  {red-fg}${votes.noGo || 0} NO{/}  {gray-fg}(${votes.total || 0} total){/}`)
          if (data.blockers?.length) {
            appendChat(`{red-fg}Blockers: ${data.blockers.join(', ')}{/}`)
          }
          for (const line of (data.summary || '').split('\n')) {
            if (line.trim()) appendChat(`{gray-fg}${line}{/}`)
          }
          appendChat('')
          for (const r of (data.reviews || []).slice(0, 15)) {
            const reviewLine = String(r).split('\n')[0].slice(0, 80)
            appendChat(`  ${reviewLine}`)
          }
          if ((data.reviews || []).length > 15) {
            appendChat(`{gray-fg}... and ${data.reviews.length - 15} more{/}`)
          }
          appendChat('')
        } catch (err) {
          appendChat(`{red-fg}❌ ${err instanceof Error ? err.message : 'Failed'}{/}`)
          logActivity('{red-fg}✖{/} launch failed')
        }
        break
      case 'digest':
        logActivity('{gray-fg}GET{/} /api/kitz/agents/cto/digest')
        try {
          const data = await kitzFetch<any>('/api/kitz/agents/cto/digest')
          appendChat('{bold}{#a855f7-fg}CTO Digest{/}')
          for (const e of (data.autoFixed || [])) appendChat(`{green-fg}✅{/} ${e.agent}: ${e.summary}`)
          for (const e of (data.recommendations || [])) appendChat(`{yellow-fg}💡{/} ${e.agent}: ${e.summary}`)
          for (const e of (data.escalations || [])) appendChat(`{red-fg}🚨{/} ${e.agent}: ${e.summary}`)
          if (!(data.autoFixed?.length || data.recommendations?.length || data.escalations?.length))
            appendChat('{gray-fg}All clear.{/}')
          logActivity('{green-fg}✅{/} digest loaded')
        } catch (err) { appendChat(`{red-fg}❌ ${err instanceof Error ? err.message : 'Failed'}{/}`) }
        break

      // System
      case 'status':
        logActivity('{gray-fg}refreshing status...{/}')
        await gatherBootInfo(); showStatus(); break
      case 'battery':
        logActivity('{gray-fg}GET{/} /api/kitz/battery')
        try {
          const data = await kitzFetch<any>('/api/kitz/battery')
          appendChat('{bold}{#a855f7-fg}Battery{/}')
          appendChat(`Today: [{green-fg}${barText(data.todayCredits, data.dailyLimit, 20)}{/}] ${data.todayCredits?.toFixed(1)}/${data.dailyLimit}`)
          appendChat(`Remaining: {white-fg}${data.remaining?.toFixed(1)}{/}  Total: {white-fg}${data.totalCredits?.toFixed(1)}{/}  Calls: {white-fg}${data.todayCalls}{/}`)
          if (data.byProvider) {
            for (const [p, c] of Object.entries(data.byProvider)) {
              appendChat(`  {cyan-fg}${p.padEnd(15)}{/} ${(c as number).toFixed(3)}`)
            }
          }
          logActivity('{green-fg}✅{/} battery loaded')
        } catch (err) { appendChat(`{red-fg}❌ ${err instanceof Error ? err.message : 'Failed'}{/}`) }
        break
      case 'services':
        try {
          const dirs = fs.readdirSync(REPO_ROOT, { withFileTypes: true })
          const services = dirs
            .filter(d => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'node_modules')
            .map(d => {
              const pkgPath = path.join(REPO_ROOT, d.name, 'package.json')
              if (!fs.existsSync(pkgPath)) return null
              try {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
                return { name: d.name, version: pkg.version || '?', hasDev: !!pkg.scripts?.dev }
              } catch { return null }
            }).filter(Boolean) as Array<{ name: string; version: string; hasDev: boolean }>
          appendChat('{bold}{#a855f7-fg}Services{/}')
          for (const s of services) {
            appendChat(`${s.hasDev ? '{green-fg}▶{/}' : '{gray-fg}○{/}'} {white-fg}${s.name.padEnd(28)}{/} {gray-fg}v${s.version}{/}`)
          }
          appendChat(`{gray-fg}${services.length} services{/}`)
        } catch { appendChat('{red-fg}❌ Failed{/}') }
        break
      case 'tools':
        try {
          const toolsDir = path.join(REPO_ROOT, 'kitz_os', 'src', 'tools')
          const files = fs.readdirSync(toolsDir).filter(f => f.endsWith('.ts') && !f.includes('.test.'))
          appendChat('{bold}{#a855f7-fg}Tool Modules{/}')
          for (const f of files.sort()) appendChat(`  {cyan-fg}⚙{/} ${f.replace('.ts', '')}`)
          appendChat(`{gray-fg}${files.length} modules · ${bootInfo.toolCount}+ tools{/}`)
        } catch { appendChat('{red-fg}❌ Failed{/}') }
        break
      case 'health':
        appendChat('{yellow-fg}Probing...{/}')
        logActivity('{yellow-fg}⟳{/} health probes...')
        const healthServices = [
          { name: 'kitz_os', url: KITZ_OS_URL },
          { name: 'whatsapp', url: WA_URL },
          { name: 'workspace', url: 'http://localhost:3001' },
          { name: 'gateway', url: 'http://localhost:4000' },
          { name: 'preview', url: `http://localhost:${PREVIEW_PORT}` },
          { name: 'ui', url: 'http://localhost:5173' },
        ]
        for (const s of healthServices) {
          const start = Date.now()
          const ok = await probeService(s.url, 2000)
          const lat = Date.now() - start
          appendChat(`${ok ? '{green-fg}●{/}' : '{red-fg}○{/}'} {white-fg}${s.name.padEnd(15)}{/} ${ok ? `{gray-fg}${lat}ms{/}` : '{red-fg}down{/}'}`)
          logActivity(`${ok ? '{green-fg}●{/}' : '{red-fg}○{/}'} ${s.name} ${ok ? `${lat}ms` : 'down'}`)
        }
        break

      // Channels
      case 'wa': case 'whatsapp':
        appendChat('{green-fg}📱 WhatsApp QR — use simple CLI:{/} {gray-fg}npm run cli{/}')
        break
      case 'openclaw': case 'oc':
        try {
          const ocConfig = path.join(os.homedir(), '.openclaw', 'openclaw.json')
          if (!fs.existsSync(ocConfig)) { appendChat('{yellow-fg}⚠ OpenClaw not configured{/}'); break }
          const config = JSON.parse(fs.readFileSync(ocConfig, 'utf-8'))
          appendChat(`{bold}{#a855f7-fg}OpenClaw{/} v${config.meta?.lastTouchedVersion || '?'}  {cyan-fg}${config.agents?.defaults?.model?.primary || '?'}{/}`)
        } catch { appendChat('{red-fg}❌ OpenClaw read failed{/}') }
        break

      // Code Intelligence
      case 'search': case 'grep': case 'find': cmdSearch(arg); break
      case 'read': case 'cat': cmdRead(arg); break
      case 'files': case 'ls':
        try {
          const target = arg || '.'
          const result = execSync(
            `find "${REPO_ROOT}/${target}" -maxdepth 3 -type f \\( -name "*.ts" -o -name "*.json" -o -name "*.md" \\) 2>/dev/null | grep -v node_modules | grep -v dist | grep -v .git | sort | head -30`,
            { timeout: 5000 }
          ).toString().trim()
          appendChat(`{bold}{#a855f7-fg}Files: ${target}{/}`)
          for (const f of result.split('\n')) appendChat(`  {cyan-fg}${f.replace(REPO_ROOT + '/', '')}{/}`)
        } catch { appendChat('{red-fg}❌ File listing failed{/}') }
        break
      case 'explain':
        if (!arg) { appendChat('{yellow-fg}Usage: explain <path>{/}'); break }
        appendChat('{yellow-fg}Analyzing...{/}')
        logActivity(`{yellow-fg}⟳{/} explain ${arg}`)
        try {
          const fullPath = arg.startsWith('/') ? arg : path.join(REPO_ROOT, arg)
          const content = fs.readFileSync(fullPath, 'utf-8')
          const res = await kitzFetch<any>('/api/kitz', {
            method: 'POST',
            body: JSON.stringify({
              message: `Explain this file concisely. Purpose, key patterns, exports. File: ${arg}\n\n\`\`\`\n${content.slice(0, 6000)}\n\`\`\``,
              channel: 'terminal', user_id: `cli:${bootInfo.user}`,
            }),
          })
          appendChat(`{bold}{#a855f7-fg}${arg}{/}`)
          appendChat(`{white-fg}${res.response || res.reply || 'No analysis'}{/}`)
          logActivity('{green-fg}✅{/} explain done')
        } catch (err) { appendChat(`{red-fg}❌ ${err instanceof Error ? err.message : 'Failed'}{/}`) }
        break
      case 'map': case 'arch': showMap(); break
      case 'env':
        const envPath = path.join(REPO_ROOT, 'kitz_os', '.env')
        if (fs.existsSync(envPath)) {
          appendChat('{bold}{#a855f7-fg}Environment{/}')
          const envContent = fs.readFileSync(envPath, 'utf-8')
          for (const l of envContent.split('\n').filter(l => l.trim() && !l.startsWith('#'))) {
            const [key] = l.split('=')
            if (!key) continue
            const val = process.env[key.trim()]
            const sensitive = /KEY|SECRET|TOKEN|PASSWORD|URL/i.test(key)
            if (sensitive && val) appendChat(`{green-fg}●{/} ${key.trim().padEnd(28)} {gray-fg}••••${val.slice(-4)}{/}`)
            else if (val) appendChat(`{green-fg}●{/} ${key.trim().padEnd(28)} {gray-fg}${val.slice(0, 35)}{/}`)
            else appendChat(`{red-fg}○{/} ${key.trim().padEnd(28)} {red-fg}NOT SET{/}`)
          }
        } else { appendChat('{yellow-fg}⚠ No .env file{/}') }
        break
      case 'git': cmdGit(); break

      // Memory & Learning
      case 'remember': case 'learn': {
        if (!arg) { appendChat('{yellow-fg}Usage: /remember <fact>{/}'); break }
        logActivity('{magenta-fg}🧠{/} learning...')
        try {
          const result = await tuiCallLLM(
            `Extract a key-value fact or preference from the user's statement.
Return ONLY a JSON object: {"type":"fact"|"preference","key":"short_snake_case_key","value":"the value"}
Examples:
- "my company is RenewFlo" → {"type":"fact","key":"company_name","value":"RenewFlo"}
- "I sell warranty renewals" → {"type":"fact","key":"products_services","value":"warranty renewals"}
- "always respond in English" → {"type":"preference","key":"language","value":"English"}
Return ONLY the JSON, nothing else.`,
            arg,
          )
          const parsed = JSON.parse(result)
          if (parsed.key && parsed.value) {
            saveMemory({ type: parsed.type || 'fact', key: parsed.key, value: parsed.value, source: 'user', ts: Date.now() })
            appendChat(`{magenta-fg}🧠 Learned:{/} {white-fg}${parsed.key}{/} = {green-fg}"${parsed.value}"{/}`)
            logActivity(`{green-fg}✓{/} remembered: ${parsed.key}`)
          } else {
            appendChat('{yellow-fg}Could not extract a fact from that.{/}')
          }
        } catch {
          appendChat('{red-fg}Failed to learn — try again.{/}')
        }
        break
      }
      case 'forget': {
        if (!arg) { appendChat('{yellow-fg}Usage: /forget <key>{/}'); break }
        if (deleteMemory(arg.trim())) {
          appendChat(`{magenta-fg}🧠{/} Forgot: {white-fg}${arg.trim()}{/}`)
          logActivity(`{yellow-fg}✓{/} forgot: ${arg.trim()}`)
        } else {
          appendChat(`{yellow-fg}No memory found for "${arg.trim()}"{/}`)
        }
        break
      }
      case 'memories': case 'memory': case 'brain': {
        const memories = loadMemories()
        if (memories.length === 0) {
          appendChat('{gray-fg}No memories yet. Teach me with /remember <fact>{/}')
        } else {
          let out = '{magenta-fg}{bold}🧠 KITZ Memory{/}\n'
          const facts = memories.filter(m => m.type === 'fact')
          const prefs = memories.filter(m => m.type === 'preference')
          if (facts.length > 0) {
            out += '{white-fg}{bold}Facts:{/}\n'
            for (const f of facts) out += `  {cyan-fg}${f.key}{/}: {white-fg}${f.value}{/}\n`
          }
          if (prefs.length > 0) {
            out += '{white-fg}{bold}Preferences:{/}\n'
            for (const p of prefs) out += `  {cyan-fg}${p.key}{/}: {white-fg}${p.value}{/}\n`
          }
          out += `{gray-fg}${memories.length} total — /forget <key> to remove{/}`
          appendChat(out)
        }
        break
      }

      // Utilities
      case 'clear':
        chatPanel.setContent('')
        screen.render()
        break
      case 'help': case '?': showHelp(); break
      case 'quit': case 'exit': case 'q':
        if (previewServer) previewServer.close()
        process.exit(0)

      // Default → Chat with kitz_os
      default:
        await handleChat(trimmed)
        return
    }

    screen.render()
  }

  // ═══════════════════════════════════════════════════
  //  INPUT HANDLING & KEY BINDINGS
  // ═══════════════════════════════════════════════════

  // Start input mode
  inputBox.readInput()

  inputBox.on('submit', async (value: string) => {
    inputBox.clearValue()
    screen.render()
    await handleInput(value)
    inputBox.readInput()
    screen.render()
  })

  inputBox.key(['up'], () => {
    if (cmdHistory.length > 0 && historyIdx > 0) {
      historyIdx--
      inputBox.setValue(cmdHistory[historyIdx])
      screen.render()
    }
  })

  inputBox.key(['down'], () => {
    if (historyIdx < cmdHistory.length - 1) {
      historyIdx++
      inputBox.setValue(cmdHistory[historyIdx])
    } else {
      historyIdx = cmdHistory.length
      inputBox.setValue('')
    }
    screen.render()
  })

  screen.key(['escape'], () => { inputBox.readInput(); screen.render() })

  screen.key(['C-c'], () => {
    if (previewServer) previewServer.close()
    process.exit(0)
  })

  screen.key(['tab'], () => {
    if (chatPanel.focused) {
      inputBox.readInput()
    } else {
      chatPanel.focus()
    }
    screen.render()
  })

  chatPanel.key(['pageup'], () => { chatPanel.scroll(-chatPanel.height as number + 2); screen.render() })
  chatPanel.key(['pagedown'], () => { chatPanel.scroll(chatPanel.height as number - 2); screen.render() })

  // ═══════════════════════════════════════════════════
  //  BOOT
  // ═══════════════════════════════════════════════════

  const kIcon = bootInfo.kernelStatus === 'online' ? '{green-fg}●{/}' : '{red-fg}○{/}'

  appendChatLines([
    '',
    `{bold}{#a855f7-fg}KITZ{/} v${VERSION}  ${kIcon} {gray-fg}${bootInfo.toolCount} tools · ${bootInfo.agentCount} agents{/}`,
    '',
    `{gray-fg}What are we building today?{/}`,
    '',
  ])

  logActivity('{green-fg}●{/} kitz_os booted')
  logActivity(`{gray-fg}tools:{/} ${bootInfo.toolCount}`)
  logActivity(`{gray-fg}agents:{/} ${bootInfo.agentCount}`)
  logActivity(`{gray-fg}battery:{/} ${bootInfo.batteryRemaining.toFixed(1)} remaining`)
  logActivity(`{gray-fg}branch:{/} ${bootInfo.gitBranch}`)
  logActivity(`{gray-fg}preview:{/} :${PREVIEW_PORT}`)

  screen.render()
  return screen
}

// ══════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════

async function main() {
  await gatherBootInfo()
  startPreviewServerSilent()
  createDashboard()
}

main().catch((err) => {
  process.stderr.write(`Boot failed: ${err.message}\n`)
  process.exit(1)
})
