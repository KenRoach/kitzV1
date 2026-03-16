#!/usr/bin/env tsx
/**
 * ╔═══════════════════════════════════════════════════════╗
 * ║  KITZ Command Center — Terminal Intelligence System   ║
 * ║                                                       ║
 * ║  "Your Business Handled"                ║
 * ║  Channels: WhatsApp · Web · Terminal · (future multi)  ║
 * ║  Engine: kitz_os kernel · 155+ tools · 107 agents     ║
 * ╚═══════════════════════════════════════════════════════╝
 *
 * Run:  npx tsx kitz_os/src/cli.ts
 *       cd kitz_os && npm run cli
 *       kitz (if installed globally)
 */

import dotenv from 'dotenv'
// Load .env from CWD (repo root) first, then kitz_os/.env as fallback
dotenv.config()
dotenv.config({ path: new URL('../.env', import.meta.url).pathname, override: false })
import * as readline from 'node:readline'
import * as path from 'node:path'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as http from 'node:http'
import { execSync } from 'node:child_process'
import chalk from 'chalk'
import { callLLM } from './tools/shared/callLLM.js'

// ── Types ──────────────────────────────────────────────

interface ChatMessage { role: 'user' | 'assistant'; content: string; ts: number }
interface AgentResult { agent: string; team: string; tool: string; success: boolean; durationMs: number; error?: string }
interface TeamResult { team: string; status: string; agentResults: AgentResult[]; durationMs: number; error?: string }
interface SwarmResult {
  id: string; status: string; teamsCompleted: number; teamsTotal: number
  teamResults: TeamResult[]; handoffCount: number; knowledgeWritten: number; durationMs: number
}
interface ThinkingStep { phase: string; detail: string; durationMs?: number }

// ── Config ─────────────────────────────────────────────

const VERSION = '0.1.0'
const CODENAME = 'Lumen'
const KITZ_OS_URL = process.env.KITZ_OS_URL || 'http://localhost:3012'
const KITZ_CLOUD_URL = 'https://kitz.services'
const WA_URL = process.env.WA_CONNECTOR_URL || 'http://localhost:3006'
const DEV_SECRET = process.env.DEV_TOKEN_SECRET || ''
const REPO_ROOT = findRepoRoot()
const KITZ_OS_DIR = path.join(REPO_ROOT, 'kitz_os')

// ── Repo Discovery ─────────────────────────────────────

function findRepoRoot(): string {
  let dir = process.cwd()
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'kitz_os')) && fs.existsSync(path.join(dir, 'aos'))) return dir
    if (fs.existsSync(path.join(dir, 'CLAUDE.md'))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  // fallback: common locations
  for (const p of ['/Users/fliaroach/kitzV1', path.join(os.homedir(), 'kitzV1')]) {
    if (fs.existsSync(p)) return p
  }
  return process.cwd()
}

// ── KITZ Wordmark ─────────────────────────────────────

const p = chalk.hex('#A855F7')
const KITZ_WORDMARK = [
  p('  ██╗  ██╗██╗████████╗███████╗'),
  p('  ██║ ██╔╝██║╚══██╔══╝╚══███╔╝'),
  p('  █████╔╝ ██║   ██║     ███╔╝ '),
  p('  ██╔═██╗ ██║   ██║    ███╔╝  '),
  p('  ██║  ██╗██║   ██║   ███████╗'),
  p('  ╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝'),
]

// ── Execution Modes ────────────────────────────────────

type KitzMode = 'plan' | 'ask' | 'go'

const MODE_INFO: Record<KitzMode, { label: string; color: (s: string) => string; emoji: string; desc: string; chatPrefix: string }> = {
  plan: {
    label: 'PLAN',
    color: chalk.hex('#F59E0B'),
    emoji: '📋',
    desc: 'KitZ (OS) explica lo que haría, paso a paso, antes de actuar. Tú apruebas.',
    chatPrefix: '[MODE: PLAN — Think step-by-step. Outline what you would do, which tools you would call, and what the expected outcome is. Do NOT execute any tools yet. Present as a numbered plan and ask for approval.]',
  },
  ask: {
    label: 'ASK',
    color: chalk.hex('#3B82F6'),
    emoji: '🤔',
    desc: 'KitZ (OS) pregunta antes de cada acción. Modo seguro — nada pasa sin tu OK.',
    chatPrefix: '[MODE: ASK — Before performing any action or calling any tool, explain what you want to do and ask for explicit permission. Be concise.]',
  },
  go: {
    label: 'GO',
    color: chalk.hex('#22C55E'),
    emoji: '🚀',
    desc: 'KitZ (OS) lo hace. Autonomía total — ejecuta herramientas, decide, y lanza.',
    chatPrefix: '',
  },
}

// ── Slash Command Registry ────────────────────────────

interface SlashCommand {
  name: string
  aliases: string[]
  category: 'mode' | 'draft' | 'chat' | 'agents' | 'system' | 'code' | 'preview' | 'channel' | 'content' | 'memory' | 'util'
  description: string
  takesArg?: boolean
  argHint?: string
}

const SLASH_COMMANDS: SlashCommand[] = [
  // Modes
  { name: 'plan', aliases: ['p'], category: 'mode', description: 'Plan mode — outlines before acting' },
  { name: 'ask', aliases: ['a', 'safe'], category: 'mode', description: 'Ask mode — confirms each action' },
  { name: 'go', aliases: ['vibe', 'yolo', 'ship'], category: 'mode', description: 'Go mode — full autonomy' },
  { name: 'mode', aliases: [], category: 'mode', description: 'Show/switch execution mode', takesArg: true, argHint: '[plan|ask|go]' },
  { name: 'auto', aliases: ['autoaccept', 'auto-accept'], category: 'mode', description: 'Toggle auto-accept drafts (GO mode)' },
  // Drafts
  { name: 'approve', aliases: ['yes', 'confirm'], category: 'draft', description: 'Approve pending draft' },
  { name: 'reject', aliases: ['deny', 'cancel'], category: 'draft', description: 'Reject pending draft' },
  // Chat & AI
  { name: 'daily', aliases: [], category: 'chat', description: 'Daily ops brief' },
  { name: 'weekly', aliases: [], category: 'chat', description: 'Weekly board packet' },
  // Agents & Swarm
  { name: 'swarm', aliases: [], category: 'agents', description: 'Full 19-team swarm run', takesArg: true, argHint: '[teams]' },
  { name: 'agents', aliases: [], category: 'agents', description: 'All agents with status' },
  { name: 'teams', aliases: [], category: 'agents', description: 'Team dashboard' },
  { name: 'launch', aliases: [], category: 'agents', description: '33-agent launch review' },
  { name: 'digest', aliases: [], category: 'agents', description: 'CTO digest' },
  { name: 'warroom', aliases: ['warrooms', 'war'], category: 'agents', description: 'Active war rooms' },
  { name: 'coaching', aliases: ['coach', 'training'], category: 'agents', description: 'Agent training & performance' },
  // Content & Workflows
  { name: 'content', aliases: ['pipeline'], category: 'content', description: 'Content creation pipeline' },
  { name: 'workflows', aliases: ['workflow', 'n8n'], category: 'content', description: 'n8n workflow status' },
  // System
  { name: 'status', aliases: [], category: 'system', description: 'Full system status' },
  { name: 'battery', aliases: [], category: 'system', description: 'AI Battery breakdown' },
  { name: 'services', aliases: [], category: 'system', description: 'List all monorepo services' },
  { name: 'tools', aliases: [], category: 'system', description: 'List tool modules' },
  { name: 'health', aliases: ['ping'], category: 'system', description: 'Probe all services' },
  { name: 'env', aliases: [], category: 'system', description: 'Environment variables (redacted)' },
  // Channels
  { name: 'wa', aliases: ['whatsapp'], category: 'channel', description: 'Connect WhatsApp (QR in terminal)' },
  // Code Intelligence
  { name: 'search', aliases: ['grep', 'find'], category: 'code', description: 'Search entire codebase', takesArg: true, argHint: '<pattern>' },
  { name: 'files', aliases: ['ls'], category: 'code', description: 'List source files', takesArg: true, argHint: '[path]' },
  { name: 'read', aliases: ['cat'], category: 'code', description: 'Read a file', takesArg: true, argHint: '<path>' },
  { name: 'explain', aliases: [], category: 'code', description: 'AI-powered file analysis', takesArg: true, argHint: '<path>' },
  { name: 'audit', aliases: [], category: 'code', description: 'AI-powered code audit', takesArg: true, argHint: '[service|url]' },
  { name: 'deps', aliases: [], category: 'code', description: 'Dependency graph', takesArg: true, argHint: '[service]' },
  { name: 'diff', aliases: [], category: 'code', description: 'Uncommitted changes', takesArg: true, argHint: '[service]' },
  { name: 'map', aliases: ['arch', 'architecture'], category: 'code', description: 'Architecture diagram' },
  { name: 'git', aliases: [], category: 'code', description: 'Git status & sub-commands', takesArg: true, argHint: '[log|diff|branches]' },
  // Preview
  { name: 'preview', aliases: ['render', 'server'], category: 'preview', description: 'Start artifact render server', takesArg: true, argHint: '[stop]' },
  { name: 'open', aliases: [], category: 'preview', description: 'Open last artifact in browser' },
  { name: 'artifact', aliases: ['artifacts'], category: 'preview', description: 'Show last artifact path' },
  // Memory & Learning
  { name: 'remember', aliases: ['learn'], category: 'memory', description: 'Teach KitZ (OS) a fact', takesArg: true, argHint: '<fact>' },
  { name: 'forget', aliases: [], category: 'memory', description: 'Remove a learned fact', takesArg: true, argHint: '<key>' },
  { name: 'memories', aliases: ['memory', 'brain'], category: 'memory', description: 'Show what KitZ (OS) remembers' },
  // Utilities
  { name: 'clear', aliases: [], category: 'util', description: 'Clear screen' },
  { name: 'help', aliases: [], category: 'util', description: 'Full command reference' },
  { name: 'quit', aliases: ['exit', 'q'], category: 'util', description: 'Exit KitZ (OS)' },
]

// Build a fast lookup set of all known command names + aliases
const KNOWN_COMMANDS = new Set<string>()
for (const cmd of SLASH_COMMANDS) {
  KNOWN_COMMANDS.add(cmd.name)
  for (const a of cmd.aliases) KNOWN_COMMANDS.add(a)
}

// ── State ──────────────────────────────────────────────

let autoAccept = false
let currentMode: KitzMode = 'go'
let orbMood: 'idle' | 'thinking' | 'success' | 'error' | 'swarm' = 'idle'
let chatHistory: ChatMessage[] = []

// ── Persistent CLI Memory ─────────────────────────────
// Append-only NDJSON file for facts, preferences, and learned context.
// Survives CLI restarts. User can teach KITZ via /remember or natural conversation.

interface MemoryEntry {
  type: 'fact' | 'preference' | 'decision'
  key: string           // short identifier (e.g. "company_name", "language")
  value: string         // the learned content
  source: 'user' | 'inferred'  // explicitly taught or inferred from conversation
  ts: number
}

const MEMORY_FILE = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'data', 'cli', 'memory.jsonl')

/** Load all memories from disk */
function loadMemories(): MemoryEntry[] {
  try {
    if (!fs.existsSync(MEMORY_FILE)) return []
    const raw = fs.readFileSync(MEMORY_FILE, 'utf-8').trim()
    if (!raw) return []
    return raw.split('\n').map(line => JSON.parse(line) as MemoryEntry)
  } catch { return [] }
}

/** Save a memory entry (append-only) */
function saveMemory(entry: MemoryEntry): void {
  const dir = path.dirname(MEMORY_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.appendFileSync(MEMORY_FILE, JSON.stringify(entry) + '\n')
  // Update in-memory cache
  const idx = cliMemories.findIndex(m => m.key === entry.key && m.type === entry.type)
  if (idx >= 0) cliMemories[idx] = entry
  else cliMemories.push(entry)
}

/** Delete a memory by key */
function deleteMemory(key: string): boolean {
  const idx = cliMemories.findIndex(m => m.key.toLowerCase() === key.toLowerCase())
  if (idx < 0) return false
  cliMemories.splice(idx, 1)
  // Rewrite file without deleted entry
  const dir = path.dirname(MEMORY_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(MEMORY_FILE, cliMemories.map(m => JSON.stringify(m)).join('\n') + (cliMemories.length ? '\n' : ''))
  return true
}

/** Get all active memories as context string for AI */
function getMemoryContext(): string {
  if (cliMemories.length === 0) return ''
  const facts = cliMemories.filter(m => m.type === 'fact')
  const prefs = cliMemories.filter(m => m.type === 'preference')
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

/** Try to detect facts or preferences from user messages */
async function detectAndLearn(message: string): Promise<string | null> {
  // Quick pattern matching for common teaching phrases
  const patterns: Array<{ regex: RegExp; type: 'fact' | 'preference'; keyGen: (m: RegExpMatchArray) => string }> = [
    { regex: /my (?:company|business|startup|brand) (?:is|name is|called) ["']?(.+?)["']?$/i, type: 'fact', keyGen: () => 'company_name' },
    { regex: /(?:i am|i'm|my name is|call me) ["']?(\w[\w\s]+?)["']?$/i, type: 'fact', keyGen: () => 'user_name' },
    { regex: /(?:i sell|we sell|i offer|we offer) (.+)$/i, type: 'fact', keyGen: () => 'products_services' },
    { regex: /(?:i'm based in|i live in|i'm from|we're in|located in) (.+)$/i, type: 'fact', keyGen: () => 'location' },
    { regex: /(?:my (?:target )?(?:market|audience|customers?) (?:is|are)) (.+)$/i, type: 'fact', keyGen: () => 'target_market' },
    { regex: /(?:always |please )?(respond|reply|answer|speak|talk) (?:in |to me in )(.+)/i, type: 'preference', keyGen: () => 'language' },
    { regex: /(?:i prefer|use) (bullet ?points?|lists?|short answers?|detailed answers?)/i, type: 'preference', keyGen: () => 'response_format' },
  ]

  for (const p of patterns) {
    const match = message.match(p.regex)
    if (match) {
      const value = match[match.length - 1].trim()
      const key = p.keyGen(match)
      // Check if we already know this
      const existing = cliMemories.find(m => m.key === key)
      if (existing && existing.value.toLowerCase() === value.toLowerCase()) return null

      saveMemory({ type: p.type, key, value, source: 'user', ts: Date.now() })
      return `📝 Learned: ${key.replace(/_/g, ' ')} = "${value}"`
    }
  }
  return null
}

// Load memories at startup
let cliMemories: MemoryEntry[] = loadMemories()

/** /remember <fact> — teach KitZ (OS) something via AI-powered extraction */
async function cmdRemember(input: string): Promise<string> {
  if (!input.trim()) {
    return chalk.yellow('\n  ⚠ Usage: /remember <fact>\n  Example: /remember my company is RenewFlo\n  Example: /remember always respond in English\n')
  }

  // Use AI to extract structured key:value from natural language
  const spinner = showSpinner('Aprendiendo...')
  try {
    const result = await callLLM(
      `Extract a key-value fact or preference from the user's statement.
Return ONLY a JSON object: {"type":"fact"|"preference","key":"short_snake_case_key","value":"the value"}
Examples:
- "my company is RenewFlo" → {"type":"fact","key":"company_name","value":"RenewFlo"}
- "I sell warranty renewals to IT channel partners" → {"type":"fact","key":"products_services","value":"warranty renewals to IT channel partners"}
- "always respond in English" → {"type":"preference","key":"language","value":"English"}
- "I'm based in Panama City" → {"type":"fact","key":"location","value":"Panama City"}
- "my email is ken@renewflo.com" → {"type":"fact","key":"email","value":"ken@renewflo.com"}
Return ONLY the JSON, nothing else.`,
      input,
      { maxTokens: 200, temperature: 0.1 },
    )
    stopSpinner(spinner)

    try {
      const parsed = JSON.parse(result) as { type: 'fact' | 'preference'; key: string; value: string }
      if (parsed.key && parsed.value) {
        saveMemory({ type: parsed.type || 'fact', key: parsed.key, value: parsed.value, source: 'user', ts: Date.now() })
        return [
          '',
          purpleBold('  🧠 Learned'),
          `  ${line(40)}`,
          `  ${chalk.cyan(parsed.key.replace(/_/g, ' '))}: ${chalk.white(parsed.value)}`,
          `  ${dim(`(${parsed.type} · ${cliMemories.length} total memories)`)}`,
          '',
        ].join('\n')
      }
    } catch { /* fallback below */ }

    // Fallback: store as raw fact
    const key = input.slice(0, 30).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    saveMemory({ type: 'fact', key, value: input, source: 'user', ts: Date.now() })
    return [
      '',
      purpleBold('  🧠 Learned'),
      `  ${chalk.cyan(key)}: ${chalk.white(input)}`,
      '',
    ].join('\n')
  } catch {
    stopSpinner(spinner)
    // Store raw without AI
    const key = input.slice(0, 30).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    saveMemory({ type: 'fact', key, value: input, source: 'user', ts: Date.now() })
    return `\n  ${chalk.green('📝')} Remembered: ${input}\n`
  }
}

/** /forget <key> — remove a learned memory */
function cmdForget(input: string): string {
  if (!input.trim()) {
    return chalk.yellow('\n  ⚠ Usage: /forget <key>\n  Use /memories to see all keys.\n')
  }
  const success = deleteMemory(input.trim())
  if (success) {
    return `\n  ${chalk.green('✔')} Forgot: ${input.trim()}\n`
  }
  return chalk.red(`\n  ❌ No memory found with key: ${input.trim()}\n  Use /memories to see all keys.\n`)
}

/** /memories — show everything KitZ (OS) remembers */
function cmdMemories(): string {
  if (cliMemories.length === 0) {
    return [
      '',
      purpleBold('  🧠 KitZ (OS) Memory'),
      `  ${line(40)}`,
      dim('  No memories yet. Teach me with /remember <fact>'),
      dim('  Example: /remember my company is called RenewFlo'),
      '',
    ].join('\n')
  }

  const facts = cliMemories.filter(m => m.type === 'fact')
  const prefs = cliMemories.filter(m => m.type === 'preference')
  const decisions = cliMemories.filter(m => m.type === 'decision')

  const lines = ['', purpleBold('  🧠 KitZ (OS) Memory'), `  ${line(40)}`, '']

  if (facts.length > 0) {
    lines.push(chalk.bold('  Facts:'))
    for (const f of facts) {
      lines.push(`    ${chalk.cyan(f.key.replace(/_/g, ' ').padEnd(20))} ${chalk.white(f.value)}  ${dim(f.source)}`)
    }
    lines.push('')
  }

  if (prefs.length > 0) {
    lines.push(chalk.bold('  Preferences:'))
    for (const p of prefs) {
      lines.push(`    ${chalk.cyan(p.key.replace(/_/g, ' ').padEnd(20))} ${chalk.white(p.value)}  ${dim(p.source)}`)
    }
    lines.push('')
  }

  if (decisions.length > 0) {
    lines.push(chalk.bold('  Decisions:'))
    for (const d of decisions) {
      lines.push(`    ${chalk.cyan(d.key.replace(/_/g, ' ').padEnd(20))} ${chalk.white(d.value)}  ${dim(new Date(d.ts).toLocaleDateString())}`)
    }
    lines.push('')
  }

  lines.push(dim(`  ${cliMemories.length} memories · /forget <key> to remove · /remember <fact> to add`))
  lines.push('')
  return lines.join('\n')
}

let lastSwarm: SwarmResult | null = null
let lastDraftToken: string | null = null
let lastArtifactPath: string | null = null
let connectionMode: 'http' | 'local' = 'local'
const ARTIFACT_DIR = path.join(os.tmpdir(), 'kitz-artifacts')
const PREVIEW_PORT = Number(process.env.KITZ_PREVIEW_PORT) || 3333
let previewServer: http.Server | null = null
let previewRunning = false
const artifactRegistry: Array<{ file: string; lang: string; created: Date; sizeKB: number; url: string }> = []
let bootInfo = {
  toolCount: 267, agentCount: 140, teamCount: 19,
  batteryUsed: 0, batteryLimit: 5, batteryRemaining: 5,
  kernelStatus: 'offline' as string,
  waConnected: false, waPhone: '',
  waLinking: false, waCountdown: 0,
  uptime: 0, nodeVersion: process.version,
  platform: `${os.platform()} ${os.arch()}`,
  hostname: os.hostname(),
  user: os.userInfo().username,
  repoPath: REPO_ROOT,
  serviceCount: 0,
  gitBranch: '', gitCommit: '', gitDirty: false,
}

// ── HTTP Helpers ───────────────────────────────────────

let activeBaseUrl = KITZ_OS_URL

async function kitzFetch<T>(urlPath: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-dev-secret': DEV_SECRET,
    ...(opts.headers as Record<string, string> || {}),
  }
  const res = await fetch(`${activeBaseUrl}${urlPath}`, { ...opts, headers, signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text().catch(() => 'no body')}`)
  return res.json() as Promise<T>
}

// ── Connection & Boot ──────────────────────────────────

async function probeService(url: string, timeoutMs = 3000): Promise<boolean> {
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(timeoutMs) })
    return res.ok
  } catch { return false }
}

async function gatherBootInfo(): Promise<void> {
  // Git info (sync, fast)
  try {
    bootInfo.gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: REPO_ROOT, timeout: 3000 }).toString().trim()
    bootInfo.gitCommit = execSync('git rev-parse --short HEAD', { cwd: REPO_ROOT, timeout: 3000 }).toString().trim()
    bootInfo.gitDirty = execSync('git status --porcelain', { cwd: REPO_ROOT, timeout: 3000 }).toString().trim().length > 0
  } catch {}

  // Count services (sync, fast)
  try {
    const dirs = fs.readdirSync(REPO_ROOT, { withFileTypes: true })
    bootInfo.serviceCount = dirs.filter(d =>
      d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('node_modules') &&
      fs.existsSync(path.join(REPO_ROOT, d.name, 'package.json'))
    ).length
  } catch {}

  // Probe services (async) — try localhost first, then kitz.services
  const [kitzOk, waOk] = await Promise.all([
    probeService(KITZ_OS_URL),
    probeService(WA_URL),
  ])

  let kitzReachable = kitzOk
  if (kitzOk) {
    activeBaseUrl = KITZ_OS_URL
  } else {
    // Fallback to kitz.services cloud
    const cloudOk = await probeService(KITZ_CLOUD_URL)
    if (cloudOk) {
      activeBaseUrl = KITZ_CLOUD_URL
      kitzReachable = true
    }
  }

  connectionMode = kitzReachable ? 'http' : 'local'
  bootInfo.kernelStatus = kitzReachable ? 'online' : 'offline'
  bootInfo.waConnected = waOk

  // Fetch live data from kitz_os
  if (kitzReachable) {
    try {
      const status = await kitzFetch<{
        tools_registered?: number
        battery?: { todayCredits?: number; dailyLimit?: number; remaining?: number }
        uptime?: number
        status?: string
      }>('/api/kitz/status')
      bootInfo.toolCount = status.tools_registered ?? 267
      bootInfo.batteryUsed = status.battery?.todayCredits ?? 0
      bootInfo.batteryLimit = status.battery?.dailyLimit ?? 5
      bootInfo.batteryRemaining = status.battery?.remaining ?? (bootInfo.batteryLimit - bootInfo.batteryUsed)
      bootInfo.uptime = status.uptime ?? 0
      bootInfo.kernelStatus = status.status ?? 'online'
    } catch {}
  }

  // WhatsApp phone
  if (waOk) {
    try {
      const waHealth = await fetch(`${WA_URL}/health`, { signal: AbortSignal.timeout(3000) })
      if (waHealth.ok) {
        const data = await waHealth.json() as { phone?: string; sessions?: number }
        bootInfo.waPhone = data.phone ?? ''
      }
    } catch {}
  }
}

// ── Rendering Helpers ──────────────────────────────────

function bar(done: number, total: number, width = 10): string {
  const pct = Math.min(done / Math.max(total, 1), 1)
  const filled = Math.round(pct * width)
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(width - filled))
}

function dim(s: string): string { return chalk.gray(s) }
function purple(s: string): string { return chalk.hex('#A855F7')(s) }
function purpleBold(s: string): string { return chalk.hex('#A855F7').bold(s) }

function line(width = 60): string { return dim('─'.repeat(width)) }

/** Word-wrap text to terminal width with indent, preserving existing line breaks */
function wrapText(text: string, indent = 2, maxWidth?: number): string {
  const cols = maxWidth || (process.stdout.columns || 80)
  const pad = ' '.repeat(indent)
  const lineWidth = cols - indent - 1 // leave 1 char margin

  return text.split('\n').map(paragraph => {
    if (paragraph.trim() === '') return ''
    // Already short enough — just indent
    if (paragraph.length <= lineWidth) return pad + paragraph
    // Word wrap
    const words = paragraph.split(/\s+/)
    const wrapped: string[] = []
    let current = ''
    for (const word of words) {
      if (current.length + word.length + 1 > lineWidth) {
        if (current) wrapped.push(pad + current)
        current = word
      } else {
        current = current ? current + ' ' + word : word
      }
    }
    if (current) wrapped.push(pad + current)
    return wrapped.join('\n')
  }).join('\n')
}

function timeAgo(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${Math.floor(seconds / 86400)}d`
}

// ── Top Bar (compact, always visible) ───────────────────

function renderTopBar(): string {
  const b = bootInfo
  const kernelDot = b.kernelStatus === 'online' ? chalk.green('●') :
                    b.kernelStatus === 'degraded' ? chalk.yellow('●') : chalk.red('●')

  // WhatsApp status — shows linking progress when active
  let waStatus: string
  if (b.waLinking) {
    waStatus = `${chalk.yellow('◉')} ${chalk.yellow(`Linking ${b.waCountdown}s`)}`
  } else if (b.waConnected) {
    waStatus = `${chalk.green('●')} ${dim('WA')}${b.waPhone ? dim(` +${b.waPhone}`) : ''}`
  } else {
    waStatus = `${chalk.red('○')} ${dim('WA')}`
  }

  const mInfo = MODE_INFO[currentMode]
  const modeTag = mInfo.color(`[${mInfo.label}]`)
  const autoTag = autoAccept ? chalk.green(' [AUTO]') : ''

  // Line 1: Brand + status
  const line1 = `  ${purpleBold('KitZ (OS)')} ${dim(`v${VERSION}`)}  ${kernelDot} ${dim('OS')}  ${waStatus}  ${chalk.hex('#A855F7')('⚡')} ${dim(b.batteryLimit > 0 ? 'Ilimitado' : '—')}  ${modeTag}${autoTag}  ${dim(`${b.toolCount} herramientas · ${b.agentCount} agentes`)}`
  // Line 2: Separator (responsive to terminal width)
  const barWidth = Math.max((process.stdout.columns || 80) - 4, 40)
  const line2 = `  ${dim('─'.repeat(barWidth))}`

  return `${line1}\n${line2}`
}

/** Boot screen — wordmark + que hacemos + como + tagline */
function renderBootScreen(): string {
  const b = bootInfo

  // Last update date from git
  let lastUpdate = ''
  try {
    lastUpdate = execSync('git log -1 --format=%cd --date=short', { cwd: REPO_ROOT, timeout: 3000 }).toString().trim()
  } catch { lastUpdate = '—' }

  const waStatus = b.waConnected
    ? `${chalk.green('●')} WhatsApp conectado${b.waPhone ? ` (+${b.waPhone})` : ''}`
    : `${chalk.red('○')} WhatsApp sin vincular — escribe ${chalk.cyan('/wa')} para escanear QR`

  const killSwitch = process.env.KILL_SWITCH === 'true'
  const bootBarWidth = Math.max((process.stdout.columns || 80) - 4, 40)

  const lines = [
    ...KITZ_WORDMARK.map(l => `  ${l}`),
    `  ${dim('"Tu Negocio, Resuelto"')}  ${dim(`v${VERSION} · ${lastUpdate}`)}`,
    '',
    `  ${purpleBold('Qué')}   ${chalk.white('Sistema operativo de negocios con IA')}`,
    `  ${purpleBold('Cómo')}  ${chalk.white('Chatea aquí o en WhatsApp — KitZ (OS) maneja tus ops')}`,
    `  ${waStatus}`,
    cliMemories.length > 0 ? `  ${chalk.magenta('🧠')} ${dim(`${cliMemories.length} memoria${cliMemories.length !== 1 ? 's' : ''} cargada${cliMemories.length !== 1 ? 's' : ''}`)}  ${dim(`— /remember · /forget · /memories`)}` : '',
  ].filter(Boolean)

  if (killSwitch) {
    lines.push(`  ${chalk.bgRed.white.bold(' ⛔ KILL SWITCH ACTIVO ')} ${chalk.red('— Ejecución de IA detenida. Set KILL_SWITCH=false para reactivar.')}`)
  }

  lines.push(
    '',
    `  ${chalk.cyan('/status')}  ${dim('Sistema')}  ${chalk.cyan('/wa')}  ${dim('WhatsApp')}  ${chalk.cyan('/auto')}  ${dim('Auto-aprobar')}  ${chalk.cyan('/')}  ${dim('Comandos')}`,
    `  ${dim('─'.repeat(bootBarWidth))}`,
  )

  return lines.join('\n')
}

/** Last response stored for reference */
let lastOutput = ''

/** Print response output in chat-flow style (no screen clearing) */
function printOutput(content: string) {
  if (!content) return
  process.stdout.write(content + '\n')
}

// ── Thinking Display (Kitz electric style) ─────────────

/** Kitz-flavored synonyms for "thinking" — rotates each run */
const KITZ_THINK_LABELS = [
  'Armando la jugada',
  'Mapeando el hustle',
  'Ruteando la señal',
  'Conectando',
  'Ejecutando el plan',
  'Cargando energía',
  'Construyendo el plano',
  'Cocinando',
  'Procesando',
  'Calibrando',
]
let thinkLabelIdx = 0

/** Phase verbs — Kitz-style action words instead of generic labels */
const PHASE_VERBS: Record<string, string> = {
  READ: 'Escaneado',
  COMPREHEND: 'Clasificado',
  BRAINSTORM: 'Estrategia',
  EXECUTE: 'Ejecutado',
  VOICE: 'Entregado',
}

function showThinking(steps: ThinkingStep[]): string {
  if (steps.length === 0) return ''
  const label = KITZ_THINK_LABELS[thinkLabelIdx++ % KITZ_THINK_LABELS.length]
  const zap = chalk.hex('#A855F7')  // kitz purple
  const bolt = chalk.hex('#7C3AED') // kitz deep

  const lines = [
    `  ${bolt('┌')} ${zap('⚡')} ${chalk.hex('#A855F7').bold(label)}`,
  ]
  for (const step of steps) {
    const dur = step.durationMs ? dim(` ${step.durationMs}ms`) : ''
    const verb = PHASE_VERBS[step.phase] || step.phase
    const phaseColor = step.phase === 'EXECUTE' ? chalk.hex('#22C55E') : zap
    lines.push(`  ${bolt('│')} ${phaseColor('⚡')} ${chalk.white.bold(verb)} ${dim('—')} ${step.detail}${dur}`)
  }
  lines.push(`  ${bolt('└')}`)
  return lines.join('\n')
}

// ── Commands ───────────────────────────────────────────

// ── Local File Reading ────────────────────────────────

const SPREADSHEET_EXTS = new Set(['.xlsx', '.xls', '.csv', '.numbers', '.tsv'])
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff', '.svg'])
const TEXT_EXTS = new Set(['.txt', '.md', '.json', '.ts', '.tsx', '.js', '.jsx', '.py', '.html', '.css', '.yml', '.yaml', '.toml', '.xml', '.sql', '.sh', '.env', '.log', '.cfg', '.ini', '.conf'])

/** Detect file path(s) in user input. Returns { filePath, question } or null */
function detectFilePath(input: string): { filePath: string; question: string } | null {
  // Match absolute paths: /Users/..., ~/..., or C:\...
  const absMatch = input.match(/((?:\/[\w.\-@]+)+(?:\.\w+)?|~\/[\w.\-@/]+(?:\.\w+)?)/)
  if (absMatch) {
    const raw = absMatch[1]
    const expanded = raw.replace(/^~/, os.homedir())
    if (fs.existsSync(expanded)) {
      const question = input.replace(raw, '').trim()
      return { filePath: expanded, question: question || 'Analyze this file and tell me the key points, trends, and insights.' }
    }
  }
  return null
}

/** Read spreadsheet file (.xlsx, .xls, .csv, .numbers) and return text table */
async function readSpreadsheet(filePath: string): Promise<string> {
  const xlsxModule = await import('xlsx')
  const XLSX = xlsxModule.default || xlsxModule
  const workbook = XLSX.readFile(filePath, { type: 'file' })
  const sheets: string[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
    if (data.length === 0) continue

    sheets.push(`### Sheet: ${sheetName} (${data.length} rows)`)

    // Show all rows up to 200, then summarize
    const maxRows = Math.min(data.length, 200)
    for (let i = 0; i < maxRows; i++) {
      const row = data[i] as unknown[]
      sheets.push(row.map(cell => cell ?? '').join('\t'))
    }
    if (data.length > maxRows) {
      sheets.push(`... and ${data.length - maxRows} more rows`)
    }
  }

  return sheets.join('\n') || 'Empty spreadsheet'
}

/** Read a text-based file and return content (truncated to limit) */
function readTextFile(filePath: string, maxChars = 15000): string {
  const content = fs.readFileSync(filePath, 'utf-8')
  if (content.length > maxChars) {
    return content.slice(0, maxChars) + `\n\n... (truncated, ${content.length} chars total)`
  }
  return content
}

/** Read an image file and return base64 for Claude Vision */
function readImageAsBase64(filePath: string): { base64: string; mediaType: string } {
  const ext = path.extname(filePath).toLowerCase()
  const mediaTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
  }
  const mediaType = mediaTypes[ext] || 'image/png'
  const data = fs.readFileSync(filePath)
  return { base64: data.toString('base64'), mediaType }
}

/** Send image to Claude Vision API for analysis */
async function analyzeImageWithVision(
  base64: string,
  mediaType: string,
  question: string,
): Promise<string | null> {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || ''
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: question },
          ],
        }],
      }),
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) return null
    const d = await res.json() as { content: Array<{ type: string; text?: string }> }
    return d.content?.find(c => c.type === 'text')?.text || null
  } catch {
    return null
  }
}

/** Handle a user message that contains a file path — read and analyze */
async function cmdFileAnalysis(filePath: string, question: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase()
  const fileName = path.basename(filePath)

  orbMood = 'thinking'
  const startMs = Date.now()

  // Image files → Claude Vision
  if (IMAGE_EXTS.has(ext)) {
    const spinner = showSpinner('Analizando imagen...')
    try {
      const { base64, mediaType } = readImageAsBase64(filePath)
      const fileSizeMB = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(1)
      const analysis = await analyzeImageWithVision(base64, mediaType, question)
      stopSpinner(spinner)

      if (!analysis) {
        orbMood = 'error'
        setTimeout(() => { orbMood = 'idle' }, 3000)
        return chalk.red('\n  ❌ No AI API key configured for image analysis. Set ANTHROPIC_API_KEY.\n')
      }

      orbMood = 'success'
      const elapsed = Date.now() - startMs
      const formatted = formatReplyForTerminal(analysis)

      chatHistory.push({ role: 'user', content: `[Analyzed image: ${fileName}] ${question}`, ts: Date.now() })
      chatHistory.push({ role: 'assistant', content: analysis, ts: Date.now() })

      setTimeout(() => { orbMood = 'idle' }, 3000)
      return [
        '',
        purpleBold(`  📸 ${fileName}`) + dim(` (${fileSizeMB} MB · ${ext.slice(1).toUpperCase()})`),
        `  ${line(50)}`,
        '',
        `  ${purpleBold('Kitz:')}`,
        chalk.white(formatted),
        '',
        `  ${dim(`${elapsed}ms`)}`,
        '',
      ].join('\n')
    } catch (err) {
      stopSpinner(spinner)
      orbMood = 'error'
      setTimeout(() => { orbMood = 'idle' }, 3000)
      return chalk.red(`\n  ❌ Failed to read image: ${(err as Error).message}\n`)
    }
  }

  // Spreadsheet files → xlsx parse + LLM analysis
  if (SPREADSHEET_EXTS.has(ext)) {
    const spinner = showSpinner('Leyendo datos...')
    try {
      const tableContent = await readSpreadsheet(filePath)
      stopSpinner(spinner)

      const fileHeader = [
        '',
        purpleBold(`  📊 ${fileName}`) + dim(` (${ext.slice(1).toUpperCase()})`),
        `  ${line(50)}`,
        '',
      ].join('\n')
      process.stdout.write(fileHeader)

      // Show preview of the data
      const previewLines = tableContent.split('\n').slice(0, 8)
      for (const pl of previewLines) {
        process.stdout.write(dim(`    ${pl.slice(0, 100)}\n`))
      }
      if (tableContent.split('\n').length > 8) {
        process.stdout.write(dim(`    ... (${tableContent.split('\n').length} total rows)\n`))
      }
      process.stdout.write('\n')

      // AI analysis
      const aiSpinner = showSpinner('Analizando...')
      const aiResult = await callLLM(
        `You are KITZ, an AI business analyst. Analyze the spreadsheet data provided. Be specific about numbers, trends, patterns, and actionable insights. Reference actual data points. Use markdown formatting. Keep response under 500 words.`,
        `File: ${fileName}\nUser question: ${question}\n\nSpreadsheet data:\n${tableContent.slice(0, 12000)}`,
        { maxTokens: 2000, temperature: 0.3, timeoutMs: 30000 },
      )
      stopSpinner(aiSpinner)

      orbMood = 'success'
      const elapsed = Date.now() - startMs

      if (aiResult && !aiResult.includes('"error"')) {
        const formatted = formatReplyForTerminal(aiResult)
        chatHistory.push({ role: 'user', content: `[Analyzed spreadsheet: ${fileName}] ${question}`, ts: Date.now() })
        chatHistory.push({ role: 'assistant', content: aiResult, ts: Date.now() })

        setTimeout(() => { orbMood = 'idle' }, 3000)
        const out = [
          `  ${purpleBold('Kitz:')}`,
          chalk.white(formatted),
          '',
          `  ${dim(`${elapsed}ms`)}`,
          '',
        ].join('\n')
        await typewriterPrint(out)
        return ''
      }

      setTimeout(() => { orbMood = 'idle' }, 3000)
      return dim('\n  💡 Set ANTHROPIC_API_KEY or OPENAI_API_KEY for AI analysis\n')
    } catch (err) {
      stopSpinner(spinner)
      orbMood = 'error'
      setTimeout(() => { orbMood = 'idle' }, 3000)
      return chalk.red(`\n  ❌ Failed to read spreadsheet: ${(err as Error).message}\n`)
    }
  }

  // Text/code files → read + LLM analysis
  if (TEXT_EXTS.has(ext) || ext === '') {
    const spinner = showSpinner('Leyendo archivo...')
    try {
      const content = readTextFile(filePath)
      stopSpinner(spinner)

      const fileHeader = [
        '',
        purpleBold(`  📄 ${fileName}`) + dim(` (${content.length.toLocaleString()} chars)`),
        `  ${line(50)}`,
        '',
      ].join('\n')
      process.stdout.write(fileHeader)

      // AI analysis
      const aiSpinner = showSpinner('Analizando...')
      const aiResult = await callLLM(
        `You are KITZ, an AI assistant. Analyze the file provided and answer the user's question. Be specific and reference actual content. Use markdown formatting. Keep response under 500 words.`,
        `File: ${fileName}\nUser question: ${question}\n\nFile content:\n${content.slice(0, 12000)}`,
        { maxTokens: 2000, temperature: 0.3, timeoutMs: 30000 },
      )
      stopSpinner(aiSpinner)

      orbMood = 'success'
      const elapsed = Date.now() - startMs

      if (aiResult && !aiResult.includes('"error"')) {
        const formatted = formatReplyForTerminal(aiResult)
        chatHistory.push({ role: 'user', content: `[Analyzed file: ${fileName}] ${question}`, ts: Date.now() })
        chatHistory.push({ role: 'assistant', content: aiResult, ts: Date.now() })

        setTimeout(() => { orbMood = 'idle' }, 3000)
        const out = [
          `  ${purpleBold('Kitz:')}`,
          chalk.white(formatted),
          '',
          `  ${dim(`${elapsed}ms`)}`,
          '',
        ].join('\n')
        await typewriterPrint(out)
        return ''
      }

      setTimeout(() => { orbMood = 'idle' }, 3000)
      return dim('\n  💡 Set ANTHROPIC_API_KEY or OPENAI_API_KEY for AI analysis\n')
    } catch (err) {
      stopSpinner(spinner)
      orbMood = 'error'
      setTimeout(() => { orbMood = 'idle' }, 3000)
      return chalk.red(`\n  ❌ Failed to read file: ${(err as Error).message}\n`)
    }
  }

  // Unknown extension — try as text
  return chalk.yellow(`\n  ⚠ Unsupported file type: ${ext}\n  Supported: spreadsheets (.xlsx, .csv, .numbers), images (.png, .jpg, .gif, .webp), text (.txt, .md, .json, .ts, .py)\n`)
}

async function cmdChat(message: string): Promise<string> {
  orbMood = 'thinking'
  const startMs = Date.now()
  const spinner = showSpinner('Thinking...')

  try {
    const history = chatHistory.slice(-20).map(m => ({ role: m.role, content: m.content }))
    // Inject mode prefix for plan/ask modes
    const modePrefix = MODE_INFO[currentMode].chatPrefix
    // Inject KITZ identity, learning capabilities, and remembered context
    const memoryCtx = getMemoryContext()
    const parts: string[] = []
    parts.push(`[KITZ System Context]
You are KITZ, an AI-powered business operating system. You CAN learn and remember things about the user across sessions.
The user can teach you facts with /remember, remove them with /forget, and see what you know with /memories.
You also auto-detect facts from conversation (name, company, location, products, preferences).
When asked if you can learn: YES, you can. You have a persistent memory system.${cliMemories.length > 0 ? ` You currently remember ${cliMemories.length} thing${cliMemories.length !== 1 ? 's' : ''} about this user.` : ''}
Always respond in the same language the user writes in.`)
    if (memoryCtx) parts.push(`[KITZ Memory — what I know about this user]\n${memoryCtx}`)
    if (modePrefix) parts.push(modePrefix)
    const fullMessage = `${parts.join('\n\n')}\n\nUser message: ${message}`

    const res = await kitzFetch<{
      response?: string; reply?: string; message?: string
      tools_used?: string[]; credits_consumed?: number
      thinking?: ThinkingStep[]
      draft_token?: string
    }>('/api/kitz', {
      method: 'POST',
      body: JSON.stringify({ message: fullMessage, channel: 'terminal', user_id: `cli:${bootInfo.user}`, chat_history: history }),
    })

    stopSpinner(spinner)

    const reply = res.response ?? res.reply ?? res.message ?? 'Done.'
    const tools = res.tools_used ?? []
    const credits = res.credits_consumed ?? 0
    const elapsed = Date.now() - startMs

    chatHistory.push({ role: 'user', content: message, ts: Date.now() })
    chatHistory.push({ role: 'assistant', content: reply, ts: Date.now() })

    // Auto-learn facts from user messages (non-blocking)
    detectAndLearn(message).then(learned => {
      if (learned) process.stdout.write(`\n  ${dim(learned)}\n`)
    }).catch(() => { /* silent */ })

    // Track draft token for approve/reject workflow
    if (res.draft_token) {
      lastDraftToken = res.draft_token
    }

    orbMood = 'success'

    // Build thinking steps
    const thinking: ThinkingStep[] = res.thinking ?? []
    if (thinking.length === 0 && tools.length > 0) {
      thinking.push({ phase: 'READ', detail: 'Understood intent' })
      thinking.push({ phase: 'EXECUTE', detail: `Used ${tools.length} tool${tools.length > 1 ? 's' : ''}: ${tools.join(', ')}` })
      thinking.push({ phase: 'VOICE', detail: 'Formatted response' })
    }

    const displayReply = formatReplyForTerminal(reply)

    let out = '\n'
    if (thinking.length > 0) out += showThinking(thinking) + '\n'
    out += `\n  ${purpleBold('Kitz:')}\n${chalk.white(displayReply)}\n`
    if (tools.length > 0) out += `    ${chalk.cyan('🔧 ' + tools.join(', '))}\n`

    // Detect and save artifacts (code blocks) from response
    const artifactInfo = extractAndSaveArtifacts(reply)
    if (artifactInfo) out += artifactInfo

    // Auto-approve drafts in GO + auto-accept mode
    if (res.draft_token && autoAccept && currentMode === 'go') {
      try {
        await kitzFetch<Record<string, unknown>>('/api/kitz/approve', {
          method: 'POST',
          body: JSON.stringify({ token: lastDraftToken, action: 'approve', user_id: `cli:${bootInfo.user}` }),
        })
        lastDraftToken = null
        out += `\n  ${chalk.green('⚡ Auto-approved')} ${dim('(go + auto-accept)')}\n`
      } catch {
        out += `\n  ${chalk.yellow('📋 Draft pending')} — auto-approve failed, type ${chalk.cyan('/approve')} manually.\n`
      }
    } else if (res.draft_token || /\bdraft\b/i.test(reply) || /\bapproval\b/i.test(reply) || /\bapprove\b/i.test(reply)) {
      // Show draft approval hint
      if (res.draft_token) {
        out += `\n  ${chalk.yellow('📋 Draft pending')} — type ${chalk.cyan('/approve')} or ${chalk.cyan('/reject')}\n`
      }
    }

    const meta: string[] = []
    if (credits > 0) meta.push(`⚡ ${credits.toFixed(2)} credits`)
    meta.push(`${elapsed}ms`)
    if (meta.length) out += `  ${dim(meta.join(' · '))}\n`

    setTimeout(() => { orbMood = 'idle' }, 3000)
    return out
  } catch (err) {
    stopSpinner(spinner)
    orbMood = 'error'
    setTimeout(() => { orbMood = 'idle' }, 3000)
    const errMsg = err instanceof Error ? err.message : 'Failed to reach KITZ'
    if (errMsg.includes('API 404') || errMsg.includes('fetch')) {
      const now = Date.now()
      // Suppress repeated "not reachable" errors within 5 seconds (e.g. multiline paste)
      if (now - lastUnreachableTs < 5000) return ''
      lastUnreachableTs = now
      return chalk.yellow(`\n  ⚠ kitz_os no alcanzable en ${KITZ_OS_URL}\n  Inicia con: ${dim('cd kitz_os && npm run dev')}\n`)
    }
    return chalk.red(`\n  ❌ ${errMsg}\n`)
  }
}

// ── Local Artifact Preview Server ─────────────────────

function getArtifactMime(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const mimes: Record<string, string> = {
    '.html': 'text/html', '.htm': 'text/html', '.css': 'text/css',
    '.js': 'application/javascript', '.ts': 'text/plain', '.tsx': 'text/plain',
    '.json': 'application/json', '.md': 'text/markdown', '.txt': 'text/plain',
    '.svg': 'image/svg+xml', '.xml': 'application/xml', '.yml': 'text/yaml',
    '.yaml': 'text/yaml', '.sql': 'text/plain', '.sh': 'text/plain',
    '.py': 'text/plain', '.csv': 'text/csv',
  }
  return mimes[ext] || 'text/plain'
}

function buildIndexPage(): string {
  const files = artifactRegistry.slice().reverse()
  const rows = files.map((f, i) => {
    const name = path.basename(f.file)
    const isHtml = f.file.endsWith('.html')
    const viewLink = isHtml
      ? `<a href="${f.url}" target="_blank" class="btn view">▶ View</a>`
      : `<a href="${f.url}" target="_blank" class="btn raw">📄 Raw</a>`
    const age = timeAgoDate(f.created)
    return `<tr>
      <td class="num">${files.length - i}</td>
      <td><span class="lang">${f.lang}</span></td>
      <td class="name">${name}</td>
      <td>${f.sizeKB.toFixed(1)} KB</td>
      <td>${age}</td>
      <td>${viewLink}</td>
    </tr>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="5">
  <title>KITZ Artifacts — Preview Server</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'SF Mono', 'Fira Code', monospace; background: #0d0d0d; color: #e0e0e0; padding: 2rem; }
    h1 { color: #a855f7; font-size: 1.5rem; margin-bottom: 0.5rem; }
    .sub { color: #666; font-size: 0.85rem; margin-bottom: 2rem; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; color: #888; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.5rem; border-bottom: 1px solid #222; }
    td { padding: 0.6rem 0.5rem; border-bottom: 1px solid #1a1a1a; font-size: 0.85rem; }
    tr:hover { background: #1a1a2e; }
    .num { color: #555; width: 2rem; }
    .name { color: #e0e0e0; font-weight: 500; }
    .lang { background: #1e1e3a; color: #a855f7; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }
    .btn { display: inline-block; padding: 4px 12px; border-radius: 6px; text-decoration: none; font-size: 0.8rem; font-weight: 500; }
    .btn.view { background: #a855f7; color: #fff; }
    .btn.view:hover { background: #9333ea; }
    .btn.raw { background: #222; color: #aaa; border: 1px solid #333; }
    .btn.raw:hover { background: #333; }
    .empty { color: #555; padding: 3rem; text-align: center; }
    .orb { display: inline-block; width: 10px; height: 10px; background: #a855f7; border-radius: 50%; margin-right: 8px; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .footer { margin-top: 2rem; color: #444; font-size: 0.75rem; }
  </style>
</head>
<body>
  <h1><span class="orb"></span>KITZ Artifact Preview</h1>
  <p class="sub">localhost:${PREVIEW_PORT} · Auto-refreshes every 5s · ${files.length} artifact${files.length !== 1 ? 's' : ''}</p>
  ${files.length === 0
    ? '<p class="empty">No artifacts yet. Ask Kitz to generate code, HTML, or documents.</p>'
    : `<table>
    <thead><tr><th>#</th><th>Type</th><th>File</th><th>Size</th><th>Age</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`}
  <p class="footer">KITZ Command Center v${VERSION} · Artifacts stored in ${ARTIFACT_DIR}</p>
</body>
</html>`
}

function wrapCodePreview(content: string, lang: string, filename: string): string {
  const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${filename} — KITZ Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'SF Mono', 'Fira Code', monospace; background: #0d0d0d; color: #e0e0e0; padding: 1rem; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 1rem; background: #1a1a2e; border-radius: 8px 8px 0 0; border-bottom: 1px solid #333; }
    .header h2 { color: #a855f7; font-size: 0.9rem; }
    .header .lang { color: #888; font-size: 0.75rem; }
    pre { background: #111; padding: 1.5rem; border-radius: 0 0 8px 8px; overflow-x: auto; font-size: 0.85rem; line-height: 1.6; tab-size: 2; }
    .back { display: inline-block; margin-bottom: 1rem; color: #a855f7; text-decoration: none; font-size: 0.85rem; }
    .back:hover { color: #c084fc; }
  </style>
</head>
<body>
  <a href="/" class="back">← All artifacts</a>
  <div class="header">
    <h2>${filename}</h2>
    <span class="lang">${lang}</span>
  </div>
  <pre><code>${escaped}</code></pre>
</body>
</html>`
}

function timeAgoDate(d: Date): string {
  const secs = Math.floor((Date.now() - d.getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

async function startPreviewServer(): Promise<string> {
  if (previewRunning && previewServer) {
    return `\n  ${chalk.green('●')} Preview server already running at ${chalk.cyan(`http://localhost:${PREVIEW_PORT}`)}\n`
  }

  // Ensure artifact dir exists
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true })
  }

  return new Promise((resolve) => {
    previewServer = http.createServer((req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${PREVIEW_PORT}`)
      const urlPath = decodeURIComponent(url.pathname)

      // CORS headers for local dev
      res.setHeader('Access-Control-Allow-Origin', '*')

      if (urlPath === '/' || urlPath === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(buildIndexPage())
        return
      }

      // Serve artifact files
      const filename = urlPath.slice(1) // strip leading /
      const filePath = path.join(ARTIFACT_DIR, filename)

      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/html' })
        res.end(`<html><body style="background:#0d0d0d;color:#e0e0e0;font-family:monospace;padding:2rem;"><h2>404 — Not found</h2><p>${filename}</p><a href="/" style="color:#a855f7;">← Back</a></body></html>`)
        return
      }

      const mime = getArtifactMime(filePath)

      // HTML files render directly, code files get a pretty preview
      if (mime === 'text/html') {
        const content = fs.readFileSync(filePath, 'utf-8')
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(content)
      } else if (url.searchParams.get('raw') === '1') {
        // Raw file download
        const content = fs.readFileSync(filePath, 'utf-8')
        res.writeHead(200, { 'Content-Type': mime })
        res.end(content)
      } else {
        // Pretty code preview
        const content = fs.readFileSync(filePath, 'utf-8')
        const lang = path.extname(filePath).slice(1) || 'txt'
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(wrapCodePreview(content, lang, filename))
      }
    })

    previewServer.listen(PREVIEW_PORT, '127.0.0.1', () => {
      previewRunning = true
      resolve(`\n  ${chalk.green('●')} Preview server started at ${chalk.cyan.underline(`http://localhost:${PREVIEW_PORT}`)}\n  ${dim('Artifacts render live in your browser.')}\n`)
    })

    previewServer.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        previewRunning = true // assume it's already us
        resolve(`\n  ${chalk.yellow('⚠')} Port ${PREVIEW_PORT} already in use — preview may already be running.\n  ${chalk.cyan.underline(`http://localhost:${PREVIEW_PORT}`)}\n`)
      } else {
        resolve(chalk.red(`\n  ❌ Preview server failed: ${err.message}\n`))
      }
    })
  })
}

function stopPreviewServer(): string {
  if (previewServer) {
    previewServer.close()
    previewServer = null
    previewRunning = false
    return `\n  ${chalk.red('○')} Preview server stopped.\n`
  }
  return dim('\n  Preview server not running.\n')
}

/** Register an artifact in the preview server registry */
function registerArtifact(file: string, lang: string): void {
  const stat = fs.statSync(file)
  const filename = path.basename(file)
  artifactRegistry.push({
    file,
    lang,
    created: new Date(),
    sizeKB: stat.size / 1024,
    url: `/${filename}`,
  })
}

// ── Terminal Reply Formatting ─────────────────────────

/** Convert markdown image links to clean terminal output with clickable URLs */
function formatReplyForTerminal(reply: string): string {
  const captured: { imageUrl?: string; previewUrl?: string } = {}

  // Replace ![alt](url) with a clean image card
  let formatted = reply.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,
    (_match, alt, url) => {
      const label = alt || 'Generated Image'
      captured.imageUrl = url as string
      return `\n🖼️  ${chalk.bold(label as string)}\n`
    }
  )

  // Extract and clean up Preview: URL lines
  formatted = formatted.replace(
    /Preview:\s*(https?:\/\/[^\s]+)/g,
    (_match, url) => {
      captured.previewUrl = url as string
      return ''
    }
  )

  // Convert markdown bold **text** → chalk bold
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, (_m, text) => chalk.bold(text as string))

  // Convert markdown italic *text* → chalk dim/italic
  formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_m, text) => chalk.italic(text as string))

  // Convert markdown headers ## text → purple bold
  formatted = formatted.replace(/^#{1,3}\s+(.+)$/gm, (_m, text) => chalk.hex('#A855F7').bold(text as string))

  // Convert markdown inline code `code` → gray background
  formatted = formatted.replace(/`([^`]+)`/g, (_m, text) => chalk.bgGray.white(` ${text as string} `))

  // Convert markdown bullet lists - item → bullet
  formatted = formatted.replace(/^(\s*)[-*]\s+/gm, '$1• ')

  // Clean up excessive blank lines
  formatted = formatted.replace(/\n{3,}/g, '\n\n').trim()

  // Word-wrap to terminal width
  formatted = wrapText(formatted, 4)

  // Append clean links at the bottom
  if (captured.previewUrl) {
    formatted += `\n\n    ${chalk.cyan('🌐')} ${chalk.cyan.underline(captured.previewUrl)}`
    // Auto-open the preview in browser (cross-platform)
    try {
      const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
      execSync(`${openCmd} "${captured.previewUrl}"`, { timeout: 3000 })
    } catch {}
  } else if (captured.imageUrl) {
    const shortUrl = captured.imageUrl.length > 80 ? captured.imageUrl.slice(0, 77) + '...' : captured.imageUrl
    formatted += `\n\n    ${chalk.cyan('🔗')} ${chalk.cyan.underline(shortUrl)}`
  }

  return formatted
}

// ── Audit AI Analysis Formatting ──────────────────────

/** Format AI audit analysis with KITZ branding and health score color coding */
function formatAuditAnalysis(raw: string): string {
  let formatted = formatReplyForTerminal(raw)

  // Color-code health score
  formatted = formatted.replace(
    /Health Score[:\s]*(\d+)\/10/i,
    (_match: string, score: string) => {
      const n = parseInt(score, 10)
      const color = n >= 8 ? chalk.green : n >= 5 ? chalk.yellow : chalk.red
      return `Health Score: ${color(`${n}/10`)}`
    }
  )

  const lines = [
    '',
    purpleBold('  🧠 KITZ AI ANALYSIS'),
    `  ${line(50)}`,
    '',
    formatted,
    '',
    `  ${line(50)}`,
    dim('  Powered by KITZ · Claude Haiku'),
    '',
  ]
  return lines.join('\n')
}

// ── Typewriter Print (natural pacing) ─────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/** Print text line-by-line with pacing for a natural feel */
async function typewriterPrint(text: string, delayMs = 35): Promise<void> {
  const lines = text.split('\n')
  for (const ln of lines) {
    process.stdout.write(ln + '\n')
    await sleep(delayMs)
  }
}

// ── Artifact Extraction & Saving ──────────────────────

function extractAndSaveArtifacts(reply: string): string | null {
  // Match code blocks: ```lang\ncontent\n```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const artifacts: Array<{ lang: string; content: string; file: string }> = []
  let match

  while ((match = codeBlockRegex.exec(reply)) !== null) {
    const lang = match[1] || 'txt'
    const content = match[2].trim()
    if (content.length < 50) continue // skip tiny snippets

    // Determine file extension
    const extMap: Record<string, string> = {
      html: '.html', htm: '.html', css: '.css', javascript: '.js', js: '.js',
      typescript: '.ts', ts: '.ts', tsx: '.tsx', jsx: '.jsx', json: '.json',
      python: '.py', py: '.py', sql: '.sql', yaml: '.yml', yml: '.yml',
      markdown: '.md', md: '.md', sh: '.sh', bash: '.sh', xml: '.xml',
      svg: '.svg', csv: '.csv',
    }
    const ext = extMap[lang.toLowerCase()] || `.${lang}`

    // Ensure artifact directory exists
    if (!fs.existsSync(ARTIFACT_DIR)) {
      fs.mkdirSync(ARTIFACT_DIR, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `kitz-${timestamp}${ext}`
    const filepath = path.join(ARTIFACT_DIR, filename)

    try {
      fs.writeFileSync(filepath, content, 'utf-8')
      artifacts.push({ lang, content, file: filepath })
      lastArtifactPath = filepath
      registerArtifact(filepath, lang)
    } catch {}
  }

  // NOTE: We do NOT auto-detect "document-like" keywords in plain replies.
  // Artifacts are ONLY created from explicit code blocks (```lang ... ```).
  // Conversational answers — even long ones — stay as terminal text.
  // Artifacts = deliverables the user would create in PowerPoint/Word/Excel/Canva.

  if (artifacts.length === 0) return null

  const lines: string[] = ['']
  for (const a of artifacts) {
    const sizeKB = (Buffer.byteLength(a.content) / 1024).toFixed(1)
    const filename = path.basename(a.file)
    const previewUrl = `http://localhost:${PREVIEW_PORT}/${filename}`

    lines.push(`  ${chalk.green('💾 Artifact saved')} ${dim(`(${a.lang}, ${sizeKB}KB)`)}`)

    if (previewRunning) {
      lines.push(`  ${chalk.cyan('🌐')} ${chalk.cyan.underline(previewUrl)}`)
    } else {
      lines.push(`  ${chalk.cyan('📂')} ${chalk.underline(`file://${a.file}`)}`)
      lines.push(`  ${dim('Tip: type')} ${chalk.cyan('preview')} ${dim('to start the local render server')}`)
    }
  }

  // Auto-open the first HTML artifact in browser if preview server is running
  if (previewRunning && artifacts.length > 0) {
    const firstHtml = artifacts.find(a => a.file.endsWith('.html'))
    if (firstHtml) {
      const url = `http://localhost:${PREVIEW_PORT}/${path.basename(firstHtml.file)}`
      try {
        const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
        execSync(`${openCmd} "${url}"`, { timeout: 3000 })
        lines.push(`  ${dim('Abierto en el navegador ↗')}`)
      } catch {}
    }
  }

  lines.push('')
  return lines.join('\n')
}

/** Wrap markdown/text document content as a styled, printable HTML page */
function wrapDocumentAsHtml(content: string): string {
  // Simple markdown-to-HTML conversion for document rendering
  let html = content
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')

  // Wrap list items
  html = html.replace(/(<li>.*?<\/li>(\s*<br>)*)+/g, (match) => `<ul>${match.replace(/<br>/g, '')}</ul>`)

  // Detect document type for header styling
  let docType = 'Document'
  let accentColor = '#a855f7'
  if (/invoice|factura/i.test(content)) { docType = 'Invoice'; accentColor = '#22c55e' }
  else if (/quote|quotation|cotización|estimate/i.test(content)) { docType = 'Quote'; accentColor = '#3b82f6' }
  else if (/order|pedido|purchase/i.test(content)) { docType = 'Order'; accentColor = '#f59e0b' }
  else if (/proposal|propuesta/i.test(content)) { docType = 'Proposal'; accentColor = '#8b5cf6' }
  else if (/deck|presentation|pitch/i.test(content)) { docType = 'Pitch Deck'; accentColor = '#ec4899' }
  else if (/report|reporte|informe/i.test(content)) { docType = 'Report'; accentColor = '#06b6d4' }
  else if (/contract|contrato|agreement/i.test(content)) { docType = 'Contract'; accentColor = '#ef4444' }
  else if (/compliance|cumplimiento/i.test(content)) { docType = 'Compliance'; accentColor = '#f97316' }
  else if (/letter|carta|memo/i.test(content)) { docType = 'Letter'; accentColor = '#64748b' }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KITZ ${docType}</title>
  <style>
    @media print { body { background: white !important; } .no-print { display: none !important; } }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; background: #fafafa; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 2rem; }
    .doc-header { border-bottom: 3px solid ${accentColor}; padding-bottom: 1rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end; }
    .doc-header .brand { color: ${accentColor}; font-size: 1.5rem; font-weight: 700; }
    .doc-header .meta { text-align: right; color: #666; font-size: 0.85rem; }
    .doc-type { display: inline-block; background: ${accentColor}; color: white; padding: 2px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
    h1 { font-size: 1.4rem; margin: 1.5rem 0 0.75rem; color: #111; }
    h2 { font-size: 1.15rem; margin: 1.25rem 0 0.5rem; color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.3rem; }
    h3 { font-size: 1rem; margin: 1rem 0 0.4rem; color: #444; }
    p { line-height: 1.7; margin: 0.5rem 0; }
    ul, ol { margin: 0.5rem 0 0.5rem 1.5rem; }
    li { line-height: 1.6; margin: 0.2rem 0; }
    strong { color: #111; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.5rem; border: 1px solid #ddd; text-align: left; font-size: 0.9rem; }
    th { background: #f5f5f5; font-weight: 600; }
    .back { display: inline-block; margin-bottom: 1rem; color: ${accentColor}; text-decoration: none; font-size: 0.85rem; }
    .back:hover { opacity: 0.8; }
    .actions { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e0e0e0; }
    .actions button { padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; margin-right: 0.5rem; }
    .btn-print { background: ${accentColor}; color: white; }
    .btn-print:hover { opacity: 0.9; }
    .footer { margin-top: 3rem; text-align: center; color: #999; font-size: 0.75rem; }
  </style>
</head>
<body>
  <a href="/" class="back no-print">← All artifacts</a>
  <div class="doc-header">
    <div>
      <span class="doc-type">${docType}</span>
      <div class="brand">KITZ</div>
    </div>
    <div class="meta">
      Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br>
      ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
    </div>
  </div>
  <div class="content">
    <p>${html}</p>
  </div>
  <div class="actions no-print">
    <button class="btn-print" onclick="window.print()">🖨 Print / PDF</button>
  </div>
  <div class="footer">Generated by KITZ AI Business OS · kitz.services</div>
</body>
</html>`
}

// ── Draft Approve / Reject ────────────────────────────

async function cmdApprove(): Promise<string> {
  if (!lastDraftToken) {
    return chalk.yellow('\n  ⚠ No hay borrador pendiente. Envía un mensaje primero.\n')
  }

  const spinner = showSpinner('Aprobando borrador...')
  try {
    const res = await kitzFetch<{ response?: string; message?: string; status?: string }>('/api/kitz/approve', {
      method: 'POST',
      body: JSON.stringify({ token: lastDraftToken, action: 'approve', user_id: `cli:${bootInfo.user}` }),
    })
    stopSpinner(spinner)
    lastDraftToken = null
    const reply = res.response ?? res.message ?? 'Borrador aprobado y ejecutado.'
    orbMood = 'success'
    setTimeout(() => { orbMood = 'idle' }, 3000)
    return `\n  ${chalk.green('✅ Aprobado')}: ${chalk.white(reply)}\n`
  } catch (err) {
    stopSpinner(spinner)
    return chalk.red(`\n  ❌ Aprobación falló: ${err instanceof Error ? err.message : String(err)}\n`)
  }
}

async function cmdReject(): Promise<string> {
  if (!lastDraftToken) {
    return chalk.yellow('\n  ⚠ No hay borrador pendiente para rechazar.\n')
  }

  try {
    await kitzFetch<{ status?: string }>('/api/kitz/approve', {
      method: 'POST',
      body: JSON.stringify({ token: lastDraftToken, action: 'reject', user_id: `cli:${bootInfo.user}` }),
    })
    lastDraftToken = null
    return `\n  ${chalk.yellow('❌ Borrador rechazado.')}\n`
  } catch (err) {
    return chalk.red(`\n  ❌ Rechazo falló: ${err instanceof Error ? err.message : String(err)}\n`)
  }
}

/** Open the last saved artifact */
function cmdOpenArtifact(): string {
  if (!lastArtifactPath || !fs.existsSync(lastArtifactPath)) {
    return chalk.yellow('\n  ⚠ No artifact to open. Ask Kitz to generate something first.\n')
  }

  try {
    const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
    execSync(`${openCmd} "${lastArtifactPath}"`, { timeout: 5000 })
    return `\n  ${chalk.green('📂 Abierto:')} ${dim(lastArtifactPath)}\n`
  } catch {
    return `\n  ${chalk.cyan('📂')} ${chalk.underline(`file://${lastArtifactPath}`)}\n  ${dim('Copia la ruta para abrir manualmente.')}\n`
  }
}

async function cmdSwarm(teamsArg?: string): Promise<string> {
  orbMood = 'swarm'
  process.stdout.write(chalk.cyan('\n  🐝 Launching swarm...\n'))

  try {
    const body: Record<string, unknown> = { concurrency: 6 }
    if (teamsArg) body.teams = teamsArg.split(',').map(t => t.trim())

    const result = await kitzFetch<SwarmResult>('/api/kitz/swarm/run', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    lastSwarm = result
    orbMood = result.status === 'completed' ? 'success' : 'error'
    setTimeout(() => { orbMood = 'idle' }, 5000)

    const lines: string[] = [
      '',
      purpleBold('  🐝 KITZ AOS SWARM'),
      `  ${line(50)}`,
      `  Run:        ${chalk.white(result.id.slice(0, 8))}...`,
      `  Status:     ${result.status === 'completed' ? chalk.green('COMPLETED') : chalk.yellow(result.status.toUpperCase())}`,
      `  Teams:      ${chalk.white(`${result.teamsCompleted}/${result.teamsTotal}`)}`,
      `  Handoffs:   ${chalk.cyan(String(result.handoffCount))}`,
      `  Knowledge:  ${chalk.green(String(result.knowledgeWritten))} entries`,
      `  Duration:   ${chalk.white(`${(result.durationMs / 1000).toFixed(1)}s`)}`,
      `  ${line(50)}`,
      '',
    ]
    for (const tr of result.teamResults) {
      const succeeded = tr.agentResults.filter(a => a.success).length
      const total = tr.agentResults.length
      const icon = tr.status === 'completed' ? chalk.green('✅') : chalk.red('❌')
      const teamBar = bar(succeeded, total, 8)
      const ms = dim(`${tr.durationMs}ms`)
      lines.push(`  ${icon} ${chalk.bold(tr.team.padEnd(22))} [${teamBar}] ${succeeded}/${total}  ${ms}`)
      for (const ar of tr.agentResults) {
        const s = ar.success ? chalk.green('✔') : chalk.red('✖')
        const tool = chalk.cyan(ar.tool.slice(0, 28).padEnd(28))
        const ams = dim(`${ar.durationMs}ms`)
        const err = ar.error ? chalk.red(` ⚠ ${ar.error.slice(0, 35)}`) : ''
        lines.push(`     ${s} ${chalk.white(ar.agent.padEnd(23))} ${tool} ${ams}${err}`)
      }
      lines.push('')
    }
    const totalAgents = result.teamResults.reduce((s, t) => s + t.agentResults.length, 0)
    const succeeded = result.teamResults.reduce((s, t) => s + t.agentResults.filter(a => a.success).length, 0)
    lines.push(`  ${line(50)}`)
    lines.push(`  Total: ${chalk.green(`${succeeded} ✔`)}  ${totalAgents - succeeded > 0 ? chalk.red(`${totalAgents - succeeded} ✖`) : ''}  (${totalAgents} agents)`)
    lines.push('')
    return lines.join('\n')
  } catch (err) {
    orbMood = 'error'
    setTimeout(() => { orbMood = 'idle' }, 3000)
    return chalk.red(`\n  ❌ Swarm failed: ${err instanceof Error ? err.message : String(err)}\n`)
  }
}

async function cmdAgents(): Promise<string> {
  try {
    const data = await kitzFetch<{ agents: Array<{ name: string; team?: string; tier: string; online: boolean; lastAction?: string; actionsToday: number }> }>('/api/kitz/agents')
    const agents = data.agents || []
    const lines = ['', purpleBold('  🤖 AGENTS'), `  ${line(50)}`, '']
    const byTeam = new Map<string, typeof agents>()
    for (const a of agents) {
      const team = a.team || 'governance'
      if (!byTeam.has(team)) byTeam.set(team, [])
      byTeam.get(team)!.push(a)
    }
    for (const [team, members] of byTeam) {
      lines.push(`  ${purpleBold(team)} ${dim(`(${members.length})`)}`)
      for (const a of members) {
        const status = a.online ? chalk.green('●') : chalk.red('○')
        const action = a.lastAction ? dim(` → ${a.lastAction}`) : ''
        lines.push(`    ${status} ${chalk.white(a.name.padEnd(25))} ${dim(`${a.actionsToday} actions`)}${action}`)
      }
      lines.push('')
    }
    return lines.join('\n')
  } catch (err) {
    return chalk.red(`\n  ❌ ${err instanceof Error ? err.message : 'Failed to fetch agents'}\n`)
  }
}

async function cmdBattery(): Promise<string> {
  try {
    const data = await kitzFetch<{
      todayCredits: number; totalCredits: number; dailyLimit: number; remaining: number
      byProvider?: Record<string, number>; todayCalls: number
    }>('/api/kitz/battery')
    const batteryBar = bar(data.todayCredits, data.dailyLimit, 20)
    const lines = [
      '', purpleBold('  ⚡ AI BATTERY'), `  ${line(50)}`, '',
      `  Today:     [${batteryBar}] ${data.todayCredits.toFixed(1)}/${data.dailyLimit} credits`,
      `  Remaining: ${chalk.white(data.remaining.toFixed(1))} credits`,
      `  Total:     ${chalk.white(data.totalCredits.toFixed(1))} all-time`,
      `  Calls:     ${chalk.white(String(data.todayCalls))} API calls today`,
      '',
    ]
    if (data.byProvider) {
      lines.push('  By Provider:')
      for (const [provider, credits] of Object.entries(data.byProvider)) {
        lines.push(`    ${chalk.cyan(provider.padEnd(15))} ${credits.toFixed(3)} credits`)
      }
      lines.push('')
    }
    return lines.join('\n')
  } catch (err) {
    return chalk.red(`\n  ❌ ${err instanceof Error ? err.message : 'Failed to fetch battery'}\n`)
  }
}

async function cmdLaunch(): Promise<string> {
  orbMood = 'thinking'
  process.stdout.write(chalk.yellow('\n  ⚖️  Running launch review (33 agents voting)...\n'))
  try {
    const data = await kitzFetch<{ decision: string; summary: string; reviews: Array<{ agent: string; vote: string; confidence: number; summary: string }> }>('/api/kitz/launch')
    orbMood = 'success'
    setTimeout(() => { orbMood = 'idle' }, 5000)
    const lines = [
      '', purpleBold('  ⚖️  LAUNCH REVIEW'), `  ${line(50)}`, '',
      `  Decision: ${data.decision === 'go' ? chalk.green.bold('GO ✅') : chalk.red.bold('NO-GO ❌')}`,
      `  ${chalk.white(data.summary)}`, '',
    ]
    if (data.reviews) {
      for (const r of data.reviews.slice(0, 15)) {
        const vote = r.vote === 'go' ? chalk.green('GO') : r.vote === 'no-go' ? chalk.red('NO') : chalk.yellow('??')
        const conf = bar(r.confidence, 100, 5)
        lines.push(`    ${vote} ${chalk.white(r.agent.padEnd(22))} [${conf}] ${dim(r.summary.slice(0, 40))}`)
      }
      if (data.reviews.length > 15) lines.push(dim(`    ... and ${data.reviews.length - 15} more`))
    }
    lines.push('')
    return lines.join('\n')
  } catch (err) {
    orbMood = 'error'
    setTimeout(() => { orbMood = 'idle' }, 3000)
    return chalk.red(`\n  ❌ ${err instanceof Error ? err.message : 'Failed'}\n`)
  }
}

async function cmdWhatsApp(): Promise<string> {
  const zap = chalk.hex('#A855F7')

  // Check if already connected
  if (bootInfo.waConnected && bootInfo.waPhone) {
    return `\n  ${chalk.green('●')} WhatsApp ya vinculado: ${chalk.white(`+${bootInfo.waPhone}`)}\n  ${dim('Para reconectar, reinicia el conector de WhatsApp primero.')}\n`
  }

  // Set linking state — top bar will show it
  bootInfo.waLinking = true
  bootInfo.waCountdown = 60

  process.stdout.write('\x1B[2J\x1B[H') // clear
  process.stdout.write(renderTopBar() + '\n\n')
  process.stdout.write(`  ${zap('⚡')} ${chalk.white.bold('Vincular WhatsApp')}\n`)
  process.stdout.write(`  ${dim('─'.repeat(40))}\n`)
  process.stdout.write(dim('  Conectando al motor Baileys...\n\n'))

  return new Promise((resolve) => {
    const url = `${WA_URL}/whatsapp/connect?userId=cli-${Date.now()}`
    let timeout: ReturnType<typeof setTimeout>
    let resolved = false

    const cleanup = () => {
      bootInfo.waLinking = false
      bootInfo.waCountdown = 0
    }

    fetch(url).then(async (res) => {
      if (!res.ok || !res.body) {
        cleanup()
        resolve(chalk.red(`  ❌ WhatsApp connector not reachable at ${WA_URL}\n  ${dim('Start: cd kitz-whatsapp-connector && npm run dev')}\n`))
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      const countdownTimer = setInterval(() => {
        bootInfo.waCountdown--
        if (bootInfo.waCountdown <= 0) clearInterval(countdownTimer)
      }, 1000)

      timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true
          clearInterval(countdownTimer)
          cleanup()
          reader.cancel()
          resolve(chalk.yellow('\n  ⏱ QR expirado. Escribe `/wa` para intentar de nuevo.\n'))
        }
      }, 65000)

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done || resolved) break

          buffer += decoder.decode(value, { stream: true })
          const sseLines = buffer.split('\n')
          buffer = sseLines.pop() || ''

          let currentEvent = ''
          for (const l of sseLines) {
            if (l.startsWith('event: ')) {
              currentEvent = l.slice(7).trim()
            } else if (l.startsWith('data: ') && currentEvent) {
              const rawData = l.slice(6)

              if (currentEvent === 'qr') {
                try {
                  const qrcode = await import('qrcode-terminal')

                  // Persistent redraw: top bar (shows linking + countdown) → QR
                  process.stdout.write('\x1B[2J\x1B[H')
                  process.stdout.write(renderTopBar() + '\n\n')
                  process.stdout.write(`  ${zap('⚡')} ${chalk.white.bold('Vincular WhatsApp')}  ${chalk.yellow(`⏱ ${bootInfo.waCountdown}s`)}\n`)
                  process.stdout.write(`  ${dim('─'.repeat(40))}\n\n`)

                  // Render QR code
                  qrcode.default.generate(rawData, { small: true }, (qr: string) => {
                    const qrLines = qr.split('\n').map(ql => `    ${ql}`)
                    process.stdout.write(qrLines.join('\n') + '\n\n')
                  })

                  process.stdout.write(`  ${dim('WhatsApp → Ajustes → Dispositivos vinculados → Escanear')}\n`)
                  process.stdout.write(`  ${dim('Ctrl+C para cancelar')}\n`)
                } catch {
                  process.stdout.write(dim(`  QR: ${rawData.slice(0, 50)}...\n`))
                }
              } else if (currentEvent === 'connected') {
                resolved = true
                clearInterval(countdownTimer)
                clearTimeout(timeout)
                reader.cancel()
                cleanup()
                try {
                  const d = JSON.parse(rawData)
                  bootInfo.waConnected = true
                  bootInfo.waPhone = d.phone || ''
                  resolve(`\n  ${chalk.green('⚡')} ${chalk.green.bold('WhatsApp vinculado!')}  ${chalk.white(`+${d.phone || 'unknown'}`)}\n  ${dim('Los mensajes fluirán por KITZ.')}\n`)
                } catch {
                  bootInfo.waConnected = true
                  resolve(`\n  ${chalk.green('⚡')} ${chalk.green.bold('WhatsApp vinculado!')}\n`)
                }
                return
              } else if (currentEvent === 'error') {
                resolved = true
                clearInterval(countdownTimer)
                clearTimeout(timeout)
                reader.cancel()
                cleanup()
                resolve(chalk.red(`\n  ❌ Connection error: ${rawData}\n`))
                return
              }
              currentEvent = ''
            }
          }
        }
      } catch (err) {
        if (!resolved) {
          resolved = true
          clearInterval(countdownTimer)
          clearTimeout(timeout)
          cleanup()
          resolve(chalk.red(`\n  ❌ SSE error: ${err instanceof Error ? err.message : String(err)}\n`))
        }
      }
    }).catch(() => {
      if (!resolved) {
        resolved = true
        cleanup()
        resolve(chalk.red(`\n  ❌ Cannot reach WhatsApp connector at ${WA_URL}\n  ${dim('Start: cd kitz-whatsapp-connector && npm run dev')}\n`))
      }
    })
  })
}

async function cmdStatus(): Promise<string> {
  await gatherBootInfo()
  const b = bootInfo
  const lines = [
    '', purpleBold('  🟢 SYSTEM STATUS'), `  ${line(50)}`, '',
  ]

  // kitz_os
  const kernelIcon = b.kernelStatus === 'online' ? chalk.green('●') :
                     b.kernelStatus === 'degraded' ? chalk.yellow('●') : chalk.red('●')
  lines.push(`  ${kernelIcon} kitz_os        ${b.kernelStatus} ${b.uptime > 0 ? dim(`· up ${timeAgo(b.uptime)}`) : ''}`)
  lines.push(`    ${dim(`${b.toolCount} tools · ${b.agentCount} agents · ${b.teamCount} teams`)}`)

  // WhatsApp
  const waIcon = b.waConnected ? chalk.green('●') : chalk.red('○')
  lines.push(`  ${waIcon} WhatsApp       ${b.waConnected ? chalk.green('connected') : chalk.red('disconnected')} ${b.waPhone ? dim(`+${b.waPhone}`) : ''}`)

  // Battery
  lines.push('')
  lines.push(`  ${purpleBold('Battery')}: [${bar(b.batteryUsed, b.batteryLimit, 15)}] ${b.batteryUsed.toFixed(1)}/${b.batteryLimit}`)

  // Git
  lines.push('')
  lines.push(`  ${purpleBold('Repo')}: ${dim(b.repoPath)}`)
  lines.push(`  Branch: ${chalk.cyan(b.gitBranch || '?')}${b.gitDirty ? chalk.yellow(' (dirty)') : ''} @ ${dim(b.gitCommit || '?')}`)
  lines.push(`  Services: ${chalk.white(String(b.serviceCount))} packages`)

  // Runtime
  lines.push('')
  lines.push(`  Node: ${dim(b.nodeVersion)} · ${dim(b.platform)} · ${dim(b.hostname)}`)
  lines.push('')
  return lines.join('\n')
}

async function cmdDigest(): Promise<string> {
  try {
    const data = await kitzFetch<{
      autoFixed?: Array<{ summary: string; agent: string }>
      recommendations?: Array<{ summary: string; agent: string }>
      escalations?: Array<{ summary: string; agent: string }>
    }>('/api/kitz/agents/cto/digest')
    const lines = ['', purpleBold('  🧠 CTO DIGEST'), `  ${line(50)}`, '']
    if (data.autoFixed?.length) {
      lines.push(chalk.green('  Auto-Fixed:'))
      for (const e of data.autoFixed) lines.push(`    ✅ ${e.agent}: ${e.summary}`)
      lines.push('')
    }
    if (data.recommendations?.length) {
      lines.push(chalk.yellow('  Recommendations:'))
      for (const e of data.recommendations) lines.push(`    💡 ${e.agent}: ${e.summary}`)
      lines.push('')
    }
    if (data.escalations?.length) {
      lines.push(chalk.red('  Escalations:'))
      for (const e of data.escalations) lines.push(`    🚨 ${e.agent}: ${e.summary}`)
      lines.push('')
    }
    if (!data.autoFixed?.length && !data.recommendations?.length && !data.escalations?.length) {
      lines.push(dim('  All clear — no items to report.'))
      lines.push('')
    }
    return lines.join('\n')
  } catch (err) {
    return chalk.red(`\n  ❌ ${err instanceof Error ? err.message : 'Failed'}\n`)
  }
}

async function cmdDaily(): Promise<string> {
  orbMood = 'thinking'
  process.stdout.write(chalk.yellow('\n  📋 Generating daily brief...\n'))
  try {
    const res = await kitzFetch<{ response?: string; reply?: string }>('/api/kitz', {
      method: 'POST',
      body: JSON.stringify({ message: '/daily', channel: 'terminal', user_id: `cli:${bootInfo.user}` }),
    })
    orbMood = 'success'
    setTimeout(() => { orbMood = 'idle' }, 3000)
    return `\n  ${purpleBold('Daily Brief')}:\n  ${chalk.white(res.response ?? res.reply ?? 'No report available.')}\n`
  } catch (err) {
    orbMood = 'error'
    setTimeout(() => { orbMood = 'idle' }, 3000)
    return chalk.red(`\n  ❌ ${err instanceof Error ? err.message : 'Failed'}\n`)
  }
}

// ── Missing Design Doc Commands ────────────────────────

async function cmdWeekly(): Promise<string> {
  orbMood = 'thinking'
  process.stdout.write(chalk.yellow('\n  📊 Generating weekly board packet...\n'))
  try {
    const res = await kitzFetch<{ response?: string; reply?: string }>('/api/kitz', {
      method: 'POST',
      body: JSON.stringify({ message: '/weekly', channel: 'terminal', user_id: `cli:${bootInfo.user}` }),
    })
    orbMood = 'success'
    setTimeout(() => { orbMood = 'idle' }, 3000)
    return `\n  ${purpleBold('Weekly Board Packet')}:\n  ${chalk.white(res.response ?? res.reply ?? 'No report available.')}\n`
  } catch (err) {
    orbMood = 'error'
    setTimeout(() => { orbMood = 'idle' }, 3000)
    return chalk.red(`\n  ❌ ${err instanceof Error ? err.message : 'Failed'}\n`)
  }
}

async function cmdWarRoom(): Promise<string> {
  try {
    const data = await kitzFetch<{
      warRooms?: Array<{ id: string; title: string; severity: string; owner: string; status: string; createdAt: string; participants: string[] }>
    }>('/api/kitz/warrooms')

    const rooms = data.warRooms ?? []
    const lines = ['', purpleBold('  🚨 ACTIVE WAR ROOMS'), `  ${line(50)}`, '']

    if (rooms.length === 0) {
      lines.push(dim('  All clear — no active war rooms.'))
      lines.push('')
      return lines.join('\n')
    }

    for (const r of rooms) {
      const sevIcon = r.severity === 'critical' ? chalk.red('🔴') :
                      r.severity === 'high' ? chalk.yellow('🟡') : chalk.green('🟢')
      const statusIcon = r.status === 'active' ? chalk.red('ACTIVE') :
                         r.status === 'mitigated' ? chalk.yellow('MITIGATED') : chalk.green('RESOLVED')
      lines.push(`  ${sevIcon} ${chalk.bold(r.title)}`)
      lines.push(`    Status: ${statusIcon}  Owner: ${chalk.cyan(r.owner)}`)
      if (r.participants?.length) {
        lines.push(`    Team: ${dim(r.participants.join(', '))}`)
      }
      lines.push(`    Created: ${dim(r.createdAt)}`)
      lines.push('')
    }
    return lines.join('\n')
  } catch (err) {
    // Endpoint may not exist yet — show empty state
    if (err instanceof Error && (err.message.includes('404') || err.message.includes('fetch'))) {
      return [
        '', purpleBold('  🚨 WAR ROOMS'), `  ${line(50)}`, '',
        dim('  No active war rooms. All systems nominal.'),
        dim(`  (War room API not yet wired — endpoint: /api/kitz/warrooms)`), '',
      ].join('\n')
    }
    return chalk.red(`\n  ❌ ${err instanceof Error ? err.message : 'Failed'}\n`)
  }
}

function cmdWorkflows(): string {
  // Read n8n workflow templates from the repo
  const workflowDirs = [
    path.join(REPO_ROOT, 'kitz_os', 'src', 'tools'),
    path.join(REPO_ROOT, 'docs', 'plans'),
  ]

  const lines = ['', purpleBold('  ⚙️  N8N WORKFLOWS'), `  ${line(50)}`, '']

  // Scan for n8n workflow references in the codebase
  try {
    const result = execSync(
      `grep -rn "n8n\\|workflow" "${REPO_ROOT}/kitz_os/src/tools" --include="*.ts" 2>/dev/null | head -20`,
      { timeout: 5000 }
    ).toString().trim()

    if (result) {
      const workflows = new Map<string, string[]>()
      for (const line of result.split('\n')) {
        const match = line.match(/([^/]+\.ts):(\d+):(.+)/)
        if (match) {
          const file = match[1]
          if (!workflows.has(file)) workflows.set(file, [])
          workflows.get(file)!.push(match[3].trim().slice(0, 60))
        }
      }

      for (const [file, refs] of workflows) {
        lines.push(`  ${chalk.cyan('⚙')} ${chalk.white(file.replace('.ts', ''))}`)
        for (const ref of refs.slice(0, 3)) {
          lines.push(`    ${dim(ref)}`)
        }
        lines.push('')
      }
    }
  } catch {}

  // Known workflow categories from design docs
  const categories = [
    { name: 'Marketing Automation', count: 14, status: 'templates' },
    { name: 'Content Creation', count: 7, status: 'templates' },
    { name: 'Sales Pipeline', count: 5, status: 'templates' },
    { name: 'Customer Onboarding', count: 4, status: 'templates' },
    { name: 'Billing & Payments', count: 3, status: 'templates' },
    { name: 'DevOps & CI', count: 3, status: 'templates' },
    { name: 'Compliance', count: 2, status: 'templates' },
  ]

  lines.push(chalk.bold('  Workflow Categories:'))
  for (const c of categories) {
    const statusTag = c.status === 'live' ? chalk.green('LIVE') :
                      c.status === 'templates' ? chalk.yellow('TEMPLATE') : chalk.red('DRAFT')
    lines.push(`    ${chalk.white(c.name.padEnd(25))} ${chalk.white(String(c.count).padStart(2))} workflows  [${statusTag}]`)
  }

  const total = categories.reduce((s, c) => s + c.count, 0)
  lines.push('')
  lines.push(`  ${dim(`Total: ${total} workflow templates · n8n integration pending`)}`)
  lines.push(`  ${dim('Deploy: self-hosted n8n or n8n.cloud with KITZ webhooks')}`)
  lines.push('')
  return lines.join('\n')
}

async function cmdContent(): Promise<string> {
  try {
    const data = await kitzFetch<{
      pipeline?: Array<{ type: string; status: string; title: string; channel: string; scheduledAt?: string }>
      stats?: { drafts: number; published: number; scheduled: number }
    }>('/api/kitz/content')

    const pipeline = data.pipeline ?? []
    const stats = data.stats ?? { drafts: 0, published: 0, scheduled: 0 }
    const lines = ['', purpleBold('  📣 CONTENT PIPELINE'), `  ${line(50)}`, '']

    lines.push(`  Drafts: ${chalk.yellow(String(stats.drafts))}  Published: ${chalk.green(String(stats.published))}  Scheduled: ${chalk.cyan(String(stats.scheduled))}`)
    lines.push('')

    if (pipeline.length === 0) {
      lines.push(dim('  No content in pipeline. Ask Kitz to create content.'))
    } else {
      for (const item of pipeline.slice(0, 15)) {
        const statusIcon = item.status === 'published' ? chalk.green('✔') :
                           item.status === 'scheduled' ? chalk.cyan('⏰') :
                           item.status === 'draft' ? chalk.yellow('📝') : chalk.gray('○')
        const channel = chalk.dim(`[${item.channel}]`)
        lines.push(`  ${statusIcon} ${chalk.white(item.title.slice(0, 45).padEnd(45))} ${channel}`)
        if (item.scheduledAt) lines.push(`    ${dim(`Scheduled: ${item.scheduledAt}`)}`)
      }
    }
    lines.push('')
    return lines.join('\n')
  } catch (err) {
    // Endpoint may not exist — show capability overview
    if (err instanceof Error && (err.message.includes('404') || err.message.includes('fetch'))) {
      const tools = [
        'social_post_create', 'blog_draft', 'email_campaign_create',
        'ig_carousel_generate', 'video_script_write', 'seo_optimize',
        'brand_voice_apply', 'content_calendar_plan', 'ab_test_copy',
        'hashtag_research', 'competitor_content_audit', 'repurpose_content',
      ]
      const lines = [
        '', purpleBold('  📣 CONTENT CREATION'), `  ${line(50)}`, '',
        chalk.bold('  Available Tools (24):'),
      ]
      for (let i = 0; i < tools.length; i += 3) {
        const row = tools.slice(i, i + 3).map(t => chalk.cyan(t.padEnd(25))).join(' ')
        lines.push(`    ${row}`)
      }
      lines.push('')
      lines.push(dim('  Ask Kitz: "create an IG post about my new product"'))
      lines.push(dim('  Ask Kitz: "plan next week\'s content calendar"'))
      lines.push(dim(`  (Content API not yet wired — endpoint: /api/kitz/content)`))
      lines.push('')
      return lines.join('\n')
    }
    return chalk.red(`\n  ❌ ${err instanceof Error ? err.message : 'Failed'}\n`)
  }
}

async function cmdCoaching(): Promise<string> {
  try {
    const data = await kitzFetch<{
      agents?: Array<{ name: string; team: string; score: number; trend: string; lastTraining?: string; recommendation?: string }>
      summary?: { avgScore: number; needsTraining: number; topPerformer: string }
    }>('/api/kitz/coaching')

    const agents = data.agents ?? []
    const summary = data.summary
    const lines = ['', purpleBold('  🎓 AGENT COACHING & PERFORMANCE'), `  ${line(50)}`, '']

    if (summary) {
      lines.push(`  Avg Score: ${chalk.white(String(summary.avgScore))}  Needs Training: ${chalk.yellow(String(summary.needsTraining))}  Top: ${chalk.green(summary.topPerformer)}`)
      lines.push('')
    }

    if (agents.length === 0) {
      lines.push(dim('  No coaching data yet. Run a swarm first.'))
    } else {
      for (const a of agents.slice(0, 20)) {
        const scoreBar = bar(a.score, 100, 8)
        const trendIcon = a.trend === 'up' ? chalk.green('↑') : a.trend === 'down' ? chalk.red('↓') : chalk.gray('→')
        lines.push(`  ${trendIcon} ${chalk.white(a.name.padEnd(22))} [${scoreBar}] ${a.score}%  ${dim(a.team)}`)
        if (a.recommendation) lines.push(`    ${chalk.yellow('💡')} ${dim(a.recommendation)}`)
      }
    }
    lines.push('')
    return lines.join('\n')
  } catch (err) {
    // Endpoint may not exist — show FeedbackCoach overview
    if (err instanceof Error && (err.message.includes('404') || err.message.includes('fetch'))) {
      const coachAgents = [
        { name: 'FeedbackCoach', role: 'Lead coach — identifies skill gaps, recommends training' },
        { name: 'AgentSkillTrainer', role: 'Trains agents on new tools and workflows' },
        { name: 'PerformanceReviewer', role: 'Scores agent effectiveness per task' },
        { name: 'KnowledgeLibrarian', role: 'Manages shared knowledge base entries' },
        { name: 'OnboardingMentor', role: 'Guides new agents through first tasks' },
      ]
      const lines = [
        '', purpleBold('  🎓 COACHING TEAM'), `  ${line(50)}`, '',
      ]
      for (const a of coachAgents) {
        lines.push(`  ${chalk.cyan('●')} ${chalk.white(a.name.padEnd(22))} ${dim(a.role)}`)
      }
      lines.push('')
      lines.push(dim('  Run `swarm coaches` to activate the coaching team.'))
      lines.push(dim(`  (Coaching API not yet wired — endpoint: /api/kitz/coaching)`))
      lines.push('')
      return lines.join('\n')
    }
    return chalk.red(`\n  ❌ ${err instanceof Error ? err.message : 'Failed'}\n`)
  }
}

// ── KITZ Code Intelligence ─────────────────────────────

function cmdSearch(query: string): string {
  if (!query) return chalk.yellow('\n  Usage: search <pattern>\n  Searches all code in the KITZ monorepo.\n')

  // Sanitize query for safe shell execution — only allow alphanumeric, spaces, common punctuation
  const safeQuery = query.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ _.:\-\/*+(){}[\]@#$%^&=<>,?!']/g, '')
  if (!safeQuery) return chalk.yellow('\n  ⚠ Patrón de búsqueda inválido.\n')

  try {
    const result = execSync(
      `grep -rn --include="*.ts" --include="*.tsx" --include="*.md" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=.next -- "${safeQuery}" "${REPO_ROOT}" | head -30`,
      { timeout: 15000, maxBuffer: 1024 * 1024 }
    ).toString().trim()

    if (!result) return dim(`\n  No results for "${query}"\n`)

    const lines = ['', purpleBold(`  🔍 Search: "${query}"`), `  ${line(50)}`, '']
    for (const match of result.split('\n').slice(0, 25)) {
      // Format: /path/to/file:linenum:content
      const firstColon = match.indexOf(':')
      const secondColon = match.indexOf(':', firstColon + 1)
      if (firstColon > 0 && secondColon > 0) {
        const filePath = match.slice(0, firstColon).replace(REPO_ROOT + '/', '')
        const lineNum = match.slice(firstColon + 1, secondColon)
        const content = match.slice(secondColon + 1).trim().slice(0, 80)
        lines.push(`  ${chalk.cyan(filePath)}${dim(`:${lineNum}`)}`)
        lines.push(`    ${chalk.white(content)}`)
      }
    }
    const totalLine = result.split('\n').length
    if (totalLine >= 30) lines.push(dim(`\n  ... showing 25 of 30+ matches`))
    lines.push('')
    return lines.join('\n')
  } catch (err) {
    if ((err as any)?.status === 1) return dim(`\n  No results for "${query}"\n`)
    return chalk.red(`\n  ❌ Search error: ${err instanceof Error ? err.message : String(err)}\n`)
  }
}

function cmdFiles(pattern?: string): string {
  const target = pattern || '.'
  try {
    const result = execSync(
      `find "${REPO_ROOT}/${target}" -maxdepth 3 -type f -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" 2>/dev/null | grep -v node_modules | grep -v dist | grep -v .git | sort | head -40`,
      { timeout: 5000 }
    ).toString().trim()

    if (!result) return dim(`\n  No files found matching "${target}"\n`)

    const lines = ['', purpleBold(`  📂 Files: ${target}`), `  ${line(50)}`, '']
    for (const f of result.split('\n')) {
      const relative = f.replace(REPO_ROOT + '/', '')
      const ext = path.extname(f)
      const color = ext === '.ts' || ext === '.tsx' ? chalk.cyan : ext === '.json' ? chalk.yellow : ext === '.md' ? chalk.green : chalk.white
      lines.push(`  ${color(relative)}`)
    }
    lines.push('')
    return lines.join('\n')
  } catch {
    return chalk.red('\n  ❌ File listing failed\n')
  }
}

function cmdGit(subcmd?: string): string {
  if (!subcmd) {
    try {
      const status = execSync('git status --short', { cwd: REPO_ROOT, timeout: 5000 }).toString().trim()
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: REPO_ROOT, timeout: 3000 }).toString().trim()
      const log = execSync('git log --oneline -5', { cwd: REPO_ROOT, timeout: 3000 }).toString().trim()

      const lines = ['', purpleBold('  🌿 Git Status'), `  ${line(50)}`, '']
      lines.push(`  Branch: ${chalk.cyan(branch)}`)
      lines.push('')
      if (status) {
        lines.push('  Changes:')
        for (const l of status.split('\n').slice(0, 15)) {
          const flag = l.slice(0, 2)
          const file = l.slice(3)
          const color = flag.includes('M') ? chalk.yellow : flag.includes('A') ? chalk.green : flag.includes('D') ? chalk.red : chalk.white
          lines.push(`    ${color(flag)} ${chalk.white(file)}`)
        }
      } else {
        lines.push(dim('  Working tree clean'))
      }
      lines.push('')
      lines.push('  Recent commits:')
      for (const l of log.split('\n')) {
        const [hash, ...msg] = l.split(' ')
        lines.push(`    ${chalk.yellow(hash)} ${dim(msg.join(' '))}`)
      }
      lines.push('')
      return lines.join('\n')
    } catch (err) {
      return chalk.red(`\n  ❌ ${err instanceof Error ? err.message : 'Git error'}\n`)
    }
  }

  // Sub-commands: git log, git diff, git branches
  try {
    if (subcmd === 'log') {
      const log = execSync('git log --oneline -20', { cwd: REPO_ROOT, timeout: 5000 }).toString().trim()
      const lines = ['', purpleBold('  📜 Git Log'), `  ${line(50)}`, '']
      for (const l of log.split('\n')) {
        const [hash, ...msg] = l.split(' ')
        lines.push(`  ${chalk.yellow(hash)} ${dim(msg.join(' '))}`)
      }
      lines.push('')
      return lines.join('\n')
    }
    if (subcmd === 'diff') {
      const diff = execSync('git diff --stat', { cwd: REPO_ROOT, timeout: 5000 }).toString().trim()
      return `\n${purpleBold('  Git Diff')}\n  ${line(50)}\n\n${diff ? diff.split('\n').map(l => '  ' + l).join('\n') : dim('  No changes')}\n`
    }
    if (subcmd === 'branches') {
      const branches = execSync('git branch -a --sort=-committerdate | head -15', { cwd: REPO_ROOT, timeout: 5000 }).toString().trim()
      const lines = ['', purpleBold('  🌿 Branches'), `  ${line(50)}`, '']
      for (const l of branches.split('\n')) {
        if (l.startsWith('*')) lines.push(`  ${chalk.green(l)}`)
        else lines.push(`  ${dim(l.trim())}`)
      }
      lines.push('')
      return lines.join('\n')
    }
    return dim(`\n  Unknown git command: ${subcmd}. Try: git, git log, git diff, git branches\n`)
  } catch (err) {
    return chalk.red(`\n  ❌ ${err instanceof Error ? err.message : 'Git error'}\n`)
  }
}

function cmdServices(): string {
  try {
    const dirs = fs.readdirSync(REPO_ROOT, { withFileTypes: true })
    const services = dirs
      .filter(d => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'node_modules')
      .map(d => {
        const pkgPath = path.join(REPO_ROOT, d.name, 'package.json')
        if (!fs.existsSync(pkgPath)) return null
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
          return {
            name: d.name,
            version: pkg.version || '?',
            scripts: Object.keys(pkg.scripts || {}),
            hasDev: !!(pkg.scripts?.dev),
          }
        } catch { return null }
      })
      .filter(Boolean) as Array<{ name: string; version: string; scripts: string[]; hasDev: boolean }>

    const lines = ['', purpleBold('  📦 KITZ SERVICES'), `  ${line(50)}`, '']
    for (const s of services) {
      const devIcon = s.hasDev ? chalk.green('▶') : chalk.gray('○')
      lines.push(`  ${devIcon} ${chalk.white(s.name.padEnd(30))} ${dim(`v${s.version}`)}`)
      if (s.scripts.length > 0) {
        lines.push(`    ${dim('scripts: ' + s.scripts.join(', '))}`)
      }
    }
    lines.push('')
    lines.push(`  ${dim(`Total: ${services.length} services`)}`)
    lines.push('')
    return lines.join('\n')
  } catch {
    return chalk.red('\n  ❌ Failed to list services\n')
  }
}

function cmdTools(): string {
  try {
    const toolsDir = path.join(REPO_ROOT, 'kitz_os', 'src', 'tools')
    const files = fs.readdirSync(toolsDir).filter(f => f.endsWith('.ts') && !f.includes('.test.') && !f.startsWith('custom'))
    const lines = ['', purpleBold('  🔧 TOOL MODULES'), `  ${line(50)}`, '']
    for (const f of files.sort()) {
      const name = f.replace('.ts', '')
      lines.push(`  ${chalk.cyan('⚙')} ${chalk.white(name)}`)
    }
    lines.push('')
    lines.push(`  ${dim(`${files.length} modules · ${bootInfo.toolCount}+ individual tools`)}`)
    lines.push('')
    return lines.join('\n')
  } catch {
    return chalk.red('\n  ❌ Failed to list tools\n')
  }
}

function cmdTeams(): string {
  if (lastSwarm) {
    const lines = ['', purpleBold('  📊 TEAMS (last swarm)'), `  ${line(50)}`, '']
    for (const tr of lastSwarm.teamResults) {
      const succeeded = tr.agentResults.filter(a => a.success).length
      const total = tr.agentResults.length
      const icon = tr.status === 'completed' ? chalk.green('✅') : chalk.red('❌')
      const teamBar = bar(succeeded, total, 12)
      lines.push(`  ${icon} ${chalk.white(tr.team.padEnd(22))} [${teamBar}] ${succeeded}/${total}`)
    }
    lines.push('')
    return lines.join('\n')
  }

  // Static team listing from known data
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
  const lines = ['', purpleBold('  📊 KITZ AOS TEAMS'), `  ${line(50)}`, '']
  for (const t of teams) {
    lines.push(`  ${chalk.cyan('◆')} ${chalk.white(t.name.padEnd(24))} Lead: ${purpleBold(t.lead.padEnd(20))} ${dim(`${t.count} agents`)}`)
  }
  lines.push('')
  lines.push(`  ${dim(`${teams.length} teams · ${teams.reduce((s, t) => s + t.count, 0)} agents`)}`)
  lines.push(`  ${dim('Run `swarm` to see them in action')}`)
  lines.push('')
  return lines.join('\n')
}

function cmdRead(filePath?: string): string {
  if (!filePath) return chalk.yellow('\n  Usage: read <path>  (relative to repo root)\n')

  const fullPath = filePath.startsWith('/') ? filePath : path.join(REPO_ROOT, filePath)
  if (!fs.existsSync(fullPath)) return chalk.red(`\n  ❌ File not found: ${fullPath}\n`)

  try {
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      const entries = fs.readdirSync(fullPath, { withFileTypes: true })
      const lines = ['', purpleBold(`  📂 ${filePath}`), `  ${line(50)}`, '']
      for (const e of entries.slice(0, 40)) {
        const icon = e.isDirectory() ? chalk.cyan('📁') : chalk.white('📄')
        lines.push(`  ${icon} ${e.name}`)
      }
      if (entries.length > 40) lines.push(dim(`  ... and ${entries.length - 40} more`))
      lines.push('')
      return lines.join('\n')
    }

    if (stat.size > 50000) return chalk.yellow(`\n  ⚠ File too large (${(stat.size / 1024).toFixed(0)}KB). Use search instead.\n`)

    const content = fs.readFileSync(fullPath, 'utf-8')
    const contentLines = content.split('\n')
    const lines = ['', purpleBold(`  📄 ${filePath}`), dim(`  ${stat.size} bytes · ${contentLines.length} lines`), `  ${line(50)}`, '']

    for (let i = 0; i < Math.min(contentLines.length, 50); i++) {
      const num = chalk.gray(String(i + 1).padStart(4))
      lines.push(`  ${num} ${contentLines[i].slice(0, 120)}`)
    }
    if (contentLines.length > 50) lines.push(dim(`\n  ... ${contentLines.length - 50} more lines`))
    lines.push('')
    return lines.join('\n')
  } catch (err) {
    return chalk.red(`\n  ❌ ${err instanceof Error ? err.message : 'Read failed'}\n`)
  }
}

// ── KITZ Deep Code Intelligence ────────────────────────

/** explain <file> — AI-powered file analysis via kitz_os */
async function cmdExplain(filePath?: string): Promise<string> {
  if (!filePath) return chalk.yellow('\n  Usage: explain <path>  (relative to repo root)\n  AI analyzes the file and explains its purpose, patterns, and connections.\n')

  const fullPath = filePath.startsWith('/') ? filePath : path.join(REPO_ROOT, filePath)
  if (!fs.existsSync(fullPath)) return chalk.red(`\n  ❌ File not found: ${fullPath}\n`)

  const stat = fs.statSync(fullPath)
  if (stat.isDirectory()) return chalk.yellow(`\n  ⚠ Can't explain a directory. Use: read ${filePath}\n`)
  if (stat.size > 30000) return chalk.yellow(`\n  ⚠ File too large (${(stat.size / 1024).toFixed(0)}KB). Try a smaller file.\n`)

  const content = fs.readFileSync(fullPath, 'utf-8')
  const relativePath = fullPath.replace(REPO_ROOT + '/', '')

  orbMood = 'thinking'
  const spinner = showSpinner('Analyzing...')

  try {
    const res = await kitzFetch<{ response?: string; reply?: string; tools_used?: string[] }>('/api/kitz', {
      method: 'POST',
      body: JSON.stringify({
        message: `Explain this file concisely. Purpose, key patterns, exports, connections to other KITZ services. File: ${relativePath}\n\n\`\`\`\n${content.slice(0, 8000)}\n\`\`\``,
        channel: 'terminal', user_id: `cli:${bootInfo.user}`,
      }),
    })
    stopSpinner(spinner)
    orbMood = 'success'
    setTimeout(() => { orbMood = 'idle' }, 3000)

    const reply = res.response ?? res.reply ?? 'No analysis available.'
    return [
      '', purpleBold(`  📖 Explain: ${relativePath}`), `  ${line(50)}`, '',
      `  ${chalk.white(reply)}`, '',
    ].join('\n')
  } catch (err) {
    stopSpinner(spinner)
    orbMood = 'error'
    setTimeout(() => { orbMood = 'idle' }, 3000)
    return chalk.red(`\n  ❌ ${err instanceof Error ? err.message : 'Analysis failed'}\n`)
  }
}

// ── AI Audit Analysis ─────────────────────────────────

/** Feed structured audit data to the LLM for expert analysis */
async function analyzeAuditWithAI(
  auditData: Record<string, unknown>,
  auditType: 'github' | 'local',
): Promise<string | null> {
  if (process.env.KILL_SWITCH === 'true') return null

  const systemPrompt = `You are KITZ, an AI-powered Business Operating System. You are performing a code audit.
Analyze the repository data and give a concise expert assessment.

Your response MUST follow this structure:

## Health Score: X/10

## Key Strengths
- (2-3 bullets)

## Risks & Concerns
- (2-4 bullets, most critical first)

## Recommendations
- (3-5 actionable items, ordered by priority)

## Architecture Notes
- (1-3 observations about structure, patterns, or tech stack)

Rules:
- Be direct, specific, and reference actual data from the audit
- Score honestly: 8+ solid, 5-7 needs work, below 5 concerning
- For GitHub audits: comment on repo hygiene (README, license, CI config, tests)
- For local audits: focus on type safety, test coverage, code debt markers
- Keep total response under 400 words
- Use markdown formatting`

  const userPrompt = `Audit type: ${auditType}\n\nAudit data:\n${JSON.stringify(auditData, null, 2)}`

  try {
    const result = await callLLM(systemPrompt, userPrompt, {
      maxTokens: 1500,
      temperature: 0.3,
      timeoutMs: 25_000,
    })
    if (!result || result.includes('"error"') || result.includes('No AI available')) return null
    return result
  } catch {
    return null
  }
}

/** audit a GitHub repo remotely via API */
async function cmdAuditGitHub(url: string): Promise<string> {
  const GH_API = 'https://api.github.com'
  const GH_TOKEN = process.env.GITHUB_TOKEN || ''
  const ghHeaders: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'KitzBot/1.0',
    ...(GH_TOKEN ? { 'Authorization': `token ${GH_TOKEN}` } : {}),
  }

  // Parse owner/repo from URL
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    const parts = parsed.pathname.replace(/^\//, '').replace(/\/$/, '').split('/')
    if (parts.length < 2) return chalk.red('\n  ❌ Invalid GitHub URL. Use: github.com/owner/repo\n')
    const owner = parts[0]
    const repo = parts[1]

    const lines = ['', purpleBold(`  🔬 REMOTE AUDIT: ${owner}/${repo}`), `  ${line(50)}`, '']

    // Fetch repo metadata
    const repoRes = await fetch(`${GH_API}/repos/${owner}/${repo}`, {
      headers: ghHeaders, signal: AbortSignal.timeout(10000),
    })
    if (!repoRes.ok) return chalk.red(`\n  ❌ GitHub API error: ${repoRes.status} — ${repoRes.statusText}\n`)
    const repoData = await repoRes.json() as any

    lines.push(`  Name:          ${chalk.white(repoData.full_name)}`)
    lines.push(`  Description:   ${chalk.white(repoData.description || '(none)')}`)
    lines.push(`  Language:      ${chalk.white(repoData.language || '?')}`)
    lines.push(`  Stars:         ${chalk.white(String(repoData.stargazers_count))}`)
    lines.push(`  Forks:         ${chalk.white(String(repoData.forks_count))}`)
    lines.push(`  Open issues:   ${chalk.white(String(repoData.open_issues_count))}`)
    lines.push(`  License:       ${chalk.white(repoData.license?.name || 'None')}`)
    lines.push(`  Last updated:  ${chalk.white(new Date(repoData.updated_at).toLocaleDateString())}`)
    lines.push(`  Default branch:${chalk.white(` ${repoData.default_branch}`)}`)
    lines.push(`  Size:          ${chalk.white(`${repoData.size} KB`)}`)

    // Fetch root tree to analyze structure
    lines.push('')
    lines.push(chalk.bold('  Repository Structure:'))
    const treeRes = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/`, {
      headers: ghHeaders, signal: AbortSignal.timeout(10000),
    })
    if (treeRes.ok) {
      const items = await treeRes.json() as any[]
      const dirs = items.filter((i: any) => i.type === 'dir').sort((a: any, b: any) => a.name.localeCompare(b.name))
      const files = items.filter((i: any) => i.type !== 'dir').sort((a: any, b: any) => a.name.localeCompare(b.name))
      for (const d of dirs) lines.push(`    ${chalk.cyan('📁')} ${d.name}/`)
      for (const f of files) lines.push(`    ${dim('📄')} ${f.name}  ${dim(`(${f.size} B)`)}`)
    }

    // Check for package.json
    lines.push('')
    lines.push(chalk.bold('  Package Info:'))
    const pkgRes = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/package.json`, {
      headers: ghHeaders, signal: AbortSignal.timeout(10000),
    })
    if (pkgRes.ok) {
      const pkgFile = await pkgRes.json() as any
      if (pkgFile.content) {
        const pkgContent = Buffer.from(pkgFile.content, 'base64').toString('utf-8')
        const pkg = JSON.parse(pkgContent)
        const deps = Object.keys(pkg.dependencies || {})
        const devDeps = Object.keys(pkg.devDependencies || {})
        lines.push(`    Version:      ${chalk.white(pkg.version || '?')}`)
        lines.push(`    Dependencies: ${chalk.white(String(deps.length))} prod · ${chalk.white(String(devDeps.length))} dev`)
        if (deps.length > 0) {
          lines.push(`    ${chalk.bold('Prod deps:')} ${deps.slice(0, 10).join(', ')}${deps.length > 10 ? ` +${deps.length - 10} more` : ''}`)
        }
        if (pkg.scripts) {
          const scripts = Object.keys(pkg.scripts)
          lines.push(`    ${chalk.bold('Scripts:')}   ${scripts.join(', ')}`)
        }
      }
    } else {
      lines.push(dim('    No package.json found'))
    }

    // Check for key config files
    lines.push('')
    lines.push(chalk.bold('  Config Files:'))
    const configFiles = ['tsconfig.json', '.env.example', 'CLAUDE.md', 'README.md', 'Dockerfile', 'docker-compose.yml', 'vitest.config.ts', 'eslint.config.js']
    for (const cf of configFiles) {
      const cfRes = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/${cf}`, {
        headers: ghHeaders, signal: AbortSignal.timeout(5000),
      })
      const icon = cfRes.ok ? chalk.green('✔') : chalk.red('✖')
      lines.push(`    ${icon} ${cf}`)
    }

    // Check src/ structure
    lines.push('')
    lines.push(chalk.bold('  Source Layout:'))
    const srcRes = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/src`, {
      headers: ghHeaders, signal: AbortSignal.timeout(10000),
    })
    if (srcRes.ok) {
      const srcItems = await srcRes.json() as any[]
      const srcDirs = srcItems.filter((i: any) => i.type === 'dir')
      const srcFiles = srcItems.filter((i: any) => i.type === 'file')
      lines.push(`    ${chalk.white(String(srcDirs.length))} directories · ${chalk.white(String(srcFiles.length))} files in src/`)
      for (const d of srcDirs) lines.push(`      ${chalk.cyan('📁')} ${d.name}/`)
    } else {
      lines.push(dim('    No src/ directory found'))
    }

    lines.push('')
    lines.push(dim(`  🔗 ${repoData.html_url}`))
    lines.push('')

    // Print raw audit data immediately
    const rawOutput = lines.join('\n')
    await typewriterPrint(rawOutput)

    // Build structured data for AI analysis
    const treeItems = treeRes.ok ? await Promise.resolve(undefined) : undefined // already consumed
    const auditData: Record<string, unknown> = {
      owner, repo,
      description: repoData.description,
      language: repoData.language,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
      license: repoData.license?.name || null,
      lastUpdated: repoData.updated_at,
      defaultBranch: repoData.default_branch,
      sizeKB: repoData.size,
      hasTests: false,
      hasCI: false,
    }

    // Gather file names already displayed
    const rootDirs: string[] = []
    const rootFiles: string[] = []
    // Re-parse from lines since we already consumed the response
    for (const l of lines) {
      const dirMatch = l.match(/📁\s+(\S+)\//)
      const fileMatch = l.match(/📄\s+(\S+)\s/)
      if (dirMatch) rootDirs.push(dirMatch[1])
      if (fileMatch) rootFiles.push(fileMatch[1])
    }
    auditData.rootDirs = rootDirs
    auditData.rootFiles = rootFiles
    auditData.hasTests = rootDirs.includes('tests') || rootDirs.includes('test') || rootDirs.includes('__tests__')

    // Extract package info already parsed
    const pkgInfoLines = lines.filter(l => l.includes('Prod deps:') || l.includes('Scripts:') || l.includes('Dependencies:') || l.includes('Version:'))
    if (pkgInfoLines.length > 0) auditData.packageSummary = pkgInfoLines.map(l => l.trim()).join('; ')

    // Extract config file presence from what we displayed
    const configPresent: Record<string, boolean> = {}
    for (const cf of ['tsconfig.json', '.env.example', 'CLAUDE.md', 'README.md', 'Dockerfile', 'docker-compose.yml', 'vitest.config.ts', 'eslint.config.js']) {
      configPresent[cf] = lines.some(l => l.includes('✔') && l.includes(cf))
    }
    auditData.configFiles = configPresent
    auditData.hasCI = configPresent['Dockerfile'] || configPresent['docker-compose.yml']

    // Fetch README content for deeper context (if it exists)
    if (configPresent['README.md']) {
      try {
        const readmeRes = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/README.md`, {
          headers: ghHeaders, signal: AbortSignal.timeout(5000),
        })
        if (readmeRes.ok) {
          const readmeFile = await readmeRes.json() as any
          if (readmeFile.content) {
            auditData.readmeExcerpt = Buffer.from(readmeFile.content, 'base64').toString('utf-8').slice(0, 2000)
          }
        }
      } catch { /* skip */ }
    }

    // Fetch CLAUDE.md content for project context (if it exists)
    if (configPresent['CLAUDE.md']) {
      try {
        const claudeRes = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/CLAUDE.md`, {
          headers: ghHeaders, signal: AbortSignal.timeout(5000),
        })
        if (claudeRes.ok) {
          const claudeFile = await claudeRes.json() as any
          if (claudeFile.content) {
            auditData.claudeMdExcerpt = Buffer.from(claudeFile.content, 'base64').toString('utf-8').slice(0, 2000)
          }
        }
      } catch { /* skip */ }
    }

    // Source layout summary
    if (srcRes.ok) {
      auditData.srcDirs = lines.filter(l => l.includes('📁') && l.includes('      ')).map(l => {
        const m = l.match(/📁\s+(\S+)/)
        return m ? m[1] : ''
      }).filter(Boolean)
    }

    // AI analysis phase
    const spinner = showSpinner('Analizando...')
    orbMood = 'thinking'
    const analysis = await analyzeAuditWithAI(auditData, 'github')
    stopSpinner(spinner)

    if (analysis) {
      orbMood = 'success'
      await typewriterPrint(formatAuditAnalysis(analysis))
    } else {
      lines.push(dim('  💡 Set ANTHROPIC_API_KEY or OPENAI_API_KEY for AI analysis'))
      process.stdout.write(dim('  💡 Set ANTHROPIC_API_KEY or OPENAI_API_KEY for AI analysis\n'))
    }
    setTimeout(() => { orbMood = 'idle' }, 3000)

    // Inject audit context into chat history for follow-up conversation
    chatHistory.push({ role: 'user', content: `I just audited the GitHub repo ${owner}/${repo}`, ts: Date.now() })
    chatHistory.push({
      role: 'assistant',
      content: `[Audit of ${owner}/${repo}]: ${JSON.stringify(auditData)}\n\n${analysis || 'No AI analysis available.'}`,
      ts: Date.now(),
    })

    return '' // already printed via typewriter
  } catch (err) {
    return chalk.red(`\n  ❌ GitHub audit failed: ${(err as Error).message}\n`)
  }
}

/** audit [service|path|url] — code health check for a service */
async function cmdAudit(service?: string): Promise<string> {
  const target = service || 'kitz_os'

  // GitHub URL support — fetch repo info via API
  if (target.includes('github.com')) {
    return cmdAuditGitHub(target)
  }

  // Support absolute paths (e.g. ~/renewflo or /Users/.../renewflo)
  let servicePath: string
  const expanded = target.replace(/^~/, os.homedir())
  if (path.isAbsolute(expanded) || target.startsWith('~')) {
    servicePath = expanded
  } else {
    servicePath = path.join(REPO_ROOT, target)
  }
  if (!fs.existsSync(servicePath)) return chalk.red(`\n  ❌ Service not found: ${target}\n`)

  const lines = ['', purpleBold(`  🔬 AUDIT: ${target}`), `  ${line(50)}`, '']

  // File count
  try {
    const tsFiles = execSync(
      `find "${servicePath}/src" -name "*.ts" -not -path "*/node_modules/*" 2>/dev/null | wc -l`,
      { timeout: 5000 }
    ).toString().trim()
    const testFiles = execSync(
      `find "${servicePath}/src" -name "*.test.ts" -not -path "*/node_modules/*" 2>/dev/null | wc -l`,
      { timeout: 5000 }
    ).toString().trim()
    const totalLines = execSync(
      `find "${servicePath}/src" -name "*.ts" -not -path "*/node_modules/*" -exec cat {} + 2>/dev/null | wc -l`,
      { timeout: 10000 }
    ).toString().trim()

    lines.push(`  Source files:  ${chalk.white(tsFiles.trim())} .ts files`)
    lines.push(`  Test files:    ${chalk.white(testFiles.trim())} .test.ts files`)
    lines.push(`  Total lines:   ${chalk.white(Number(totalLines.trim()).toLocaleString())}`)
  } catch {}

  // Package deps
  try {
    const pkgPath = path.join(servicePath, 'package.json')
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
      const deps = Object.keys(pkg.dependencies || {}).length
      const devDeps = Object.keys(pkg.devDependencies || {}).length
      lines.push(`  Dependencies:  ${chalk.white(String(deps))} prod · ${chalk.white(String(devDeps))} dev`)
      lines.push(`  Version:       ${chalk.white(pkg.version || '?')}`)
    }
  } catch {}

  // TypeScript check
  lines.push('')
  lines.push(chalk.bold('  Type Check:'))
  try {
    execSync(`cd "${servicePath}" && npx tsc --noEmit 2>&1`, { timeout: 30000 })
    lines.push(`    ${chalk.green('✔')} No type errors`)
  } catch (err) {
    const output = (err as any)?.stdout?.toString() || (err as any)?.stderr?.toString() || ''
    const errorCount = (output.match(/error TS/g) || []).length
    if (errorCount > 0) {
      lines.push(`    ${chalk.red('✖')} ${errorCount} type error${errorCount > 1 ? 's' : ''}`)
      // Show first 3 errors
      const errorLines = output.split('\n').filter((l: string) => l.includes('error TS')).slice(0, 3)
      for (const el of errorLines) {
        const short = el.replace(servicePath + '/', '').slice(0, 80)
        lines.push(`      ${chalk.red(short)}`)
      }
      if (errorCount > 3) lines.push(dim(`      ... and ${errorCount - 3} more`))
    } else {
      lines.push(`    ${chalk.yellow('⚠')} tsc not available or failed`)
    }
  }

  // TODO/FIXME scan
  lines.push('')
  lines.push(chalk.bold('  Code Markers:'))
  try {
    const todos = execSync(
      `grep -rn "TODO\\|FIXME\\|HACK\\|XXX" "${servicePath}/src" --include="*.ts" 2>/dev/null | wc -l`,
      { timeout: 5000 }
    ).toString().trim()
    const todoCount = parseInt(todos) || 0
    const icon = todoCount > 20 ? chalk.red('⚠') : todoCount > 5 ? chalk.yellow('⚠') : chalk.green('✔')
    lines.push(`    ${icon} ${todoCount} TODO/FIXME/HACK markers`)

    if (todoCount > 0 && todoCount <= 10) {
      const todoList = execSync(
        `grep -rn "TODO\\|FIXME\\|HACK\\|XXX" "${servicePath}/src" --include="*.ts" 2>/dev/null | head -5`,
        { timeout: 5000 }
      ).toString().trim()
      for (const t of todoList.split('\n')) {
        const short = t.replace(servicePath + '/', '').slice(0, 80)
        lines.push(`      ${dim(short)}`)
      }
    }
  } catch {}

  lines.push('')

  // Print raw audit data immediately
  const rawOutput = lines.join('\n')
  await typewriterPrint(rawOutput)

  // Build structured data for AI analysis
  const localAuditData: Record<string, unknown> = { target }
  // Extract metrics from displayed lines
  for (const l of lines) {
    const srcMatch = l.match(/Source files:\s*(\d+)/)
    const testMatch = l.match(/Test files:\s*(\d+)/)
    const locMatch = l.match(/Total lines:\s*([\d,]+)/)
    const depsMatch = l.match(/Dependencies:\s*(\d+)\s*prod\s*·\s*(\d+)\s*dev/)
    const typeErrMatch = l.match(/(\d+)\s*type error/)
    const markerMatch = l.match(/(\d+)\s*TODO/)
    if (srcMatch) localAuditData.tsFileCount = parseInt(srcMatch[1])
    if (testMatch) localAuditData.testFileCount = parseInt(testMatch[1])
    if (locMatch) localAuditData.totalLines = parseInt(locMatch[1].replace(/,/g, ''))
    if (depsMatch) { localAuditData.prodDeps = parseInt(depsMatch[1]); localAuditData.devDeps = parseInt(depsMatch[2]) }
    if (typeErrMatch) localAuditData.typeErrors = parseInt(typeErrMatch[1])
    if (markerMatch) localAuditData.todoCount = parseInt(markerMatch[1])
  }
  if (lines.some(l => l.includes('No type errors'))) localAuditData.typeErrors = 0

  // Check for key files
  const hasReadme = fs.existsSync(path.join(servicePath, 'README.md'))
  const hasDockerfile = fs.existsSync(path.join(servicePath, 'Dockerfile'))
  const hasTests = (localAuditData.testFileCount as number) > 0
  localAuditData.configFiles = {
    'README.md': hasReadme,
    'Dockerfile': hasDockerfile,
    'package.json': fs.existsSync(path.join(servicePath, 'package.json')),
    'tsconfig.json': fs.existsSync(path.join(servicePath, 'tsconfig.json')),
    '.env.example': fs.existsSync(path.join(servicePath, '.env.example')),
    'CLAUDE.md': fs.existsSync(path.join(servicePath, 'CLAUDE.md')),
  }

  // AI analysis phase
  const spinner = showSpinner('Analizando...')
  orbMood = 'thinking'
  const analysis = await analyzeAuditWithAI(localAuditData, 'local')
  stopSpinner(spinner)

  if (analysis) {
    orbMood = 'success'
    await typewriterPrint(formatAuditAnalysis(analysis))
  } else {
    process.stdout.write(dim('  💡 Set ANTHROPIC_API_KEY or OPENAI_API_KEY for AI analysis\n'))
  }
  setTimeout(() => { orbMood = 'idle' }, 3000)

  // Inject audit context into chat history
  chatHistory.push({ role: 'user', content: `I just audited ${target}`, ts: Date.now() })
  chatHistory.push({
    role: 'assistant',
    content: `[Local audit of ${target}]: ${JSON.stringify(localAuditData)}\n\n${analysis || 'No AI analysis available.'}`,
    ts: Date.now(),
  })

  return '' // already printed via typewriter
}

/** deps [service] — dependency graph for a service */
function cmdDeps(service?: string): string {
  const target = service || 'kitz_os'
  const pkgPath = path.join(REPO_ROOT, target, 'package.json')
  if (!fs.existsSync(pkgPath)) return chalk.red(`\n  ❌ No package.json found for: ${target}\n`)

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    const deps = pkg.dependencies || {}
    const devDeps = pkg.devDependencies || {}
    const lines = ['', purpleBold(`  📦 Dependencies: ${target}`), `  ${line(50)}`, '']

    // Production deps
    lines.push(chalk.bold('  Production:'))
    for (const [name, ver] of Object.entries(deps)) {
      const isLocal = (ver as string).startsWith('file:')
      const icon = isLocal ? chalk.yellow('🔗') : chalk.green('📦')
      lines.push(`    ${icon} ${chalk.white(name.padEnd(30))} ${dim(String(ver))}`)
    }
    if (Object.keys(deps).length === 0) lines.push(dim('    None'))

    // Dev deps
    lines.push('')
    lines.push(chalk.bold('  Development:'))
    for (const [name, ver] of Object.entries(devDeps)) {
      lines.push(`    ${chalk.gray('📦')} ${chalk.white(name.padEnd(30))} ${dim(String(ver))}`)
    }
    if (Object.keys(devDeps).length === 0) lines.push(dim('    None'))

    // Cross-service deps
    lines.push('')
    lines.push(chalk.bold('  Cross-Service:'))
    const localDeps = Object.entries(deps).filter(([, v]) => (v as string).startsWith('file:'))
    if (localDeps.length > 0) {
      for (const [name, ver] of localDeps) {
        const linkedPath = (ver as string).replace('file:', '')
        lines.push(`    ${chalk.yellow('→')} ${chalk.white(name)} ${dim(`→ ${linkedPath}`)}`)
      }
    } else {
      lines.push(dim('    No local file: dependencies'))
    }

    lines.push('')
    lines.push(`  ${dim(`Total: ${Object.keys(deps).length} prod · ${Object.keys(devDeps).length} dev`)}`)
    lines.push('')
    return lines.join('\n')
  } catch (err) {
    return chalk.red(`\n  ❌ ${err instanceof Error ? err.message : 'Failed to read deps'}\n`)
  }
}

/** env — show environment variables (redacted) */
function cmdEnv(): string {
  const envPath = path.join(REPO_ROOT, 'kitz_os', '.env')
  const envExamplePath = path.join(REPO_ROOT, 'kitz_os', '.env.example')

  const lines = ['', purpleBold('  🔐 ENVIRONMENT'), `  ${line(50)}`, '']

  // Show .env status
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    const envLines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'))
    lines.push(chalk.bold('  Active (.env):'))
    for (const l of envLines) {
      const [key] = l.split('=')
      if (!key) continue
      const val = process.env[key.trim()]
      const sensitive = /KEY|SECRET|TOKEN|PASSWORD|URL/i.test(key)
      if (sensitive && val) {
        lines.push(`    ${chalk.green('●')} ${chalk.white(key.trim().padEnd(30))} ${dim('••••' + val.slice(-4))}`)
      } else if (val) {
        lines.push(`    ${chalk.green('●')} ${chalk.white(key.trim().padEnd(30))} ${dim(val.slice(0, 40))}`)
      } else {
        lines.push(`    ${chalk.red('○')} ${chalk.white(key.trim().padEnd(30))} ${chalk.red('NOT SET')}`)
      }
    }
  } else {
    lines.push(chalk.yellow('  ⚠ No .env file found'))
  }

  // Key runtime vars
  lines.push('')
  lines.push(chalk.bold('  Runtime:'))
  const runtimeVars = [
    ['NODE_ENV', process.env.NODE_ENV || 'undefined'],
    ['KITZ_OS_URL', KITZ_OS_URL],
    ['WA_CONNECTOR_URL', WA_URL],
    ['KILL_SWITCH', process.env.KILL_SWITCH || 'false'],
  ]
  for (const [k, v] of runtimeVars) {
    const icon = v && v !== 'undefined' && v !== 'false' ? chalk.green('●') : chalk.yellow('○')
    lines.push(`    ${icon} ${chalk.white(k.padEnd(30))} ${dim(v)}`)
  }

  lines.push('')
  return lines.join('\n')
}

/** map — show KITZ architecture map */
function cmdMap(): string {
  return [
    '',
    purpleBold('  🗺  KITZ ARCHITECTURE MAP'),
    `  ${line(55)}`,
    '',
    `  ${chalk.bold('User Channels')}`,
    `  ${chalk.green('┌─────────────┐')}  ${chalk.cyan('┌─────────────┐')}  ${chalk.yellow('┌─────────────┐')}`,
    `  ${chalk.green('│  WhatsApp   │')}  ${chalk.cyan('│  Web (SPA)  │')}  ${chalk.yellow('│  Terminal   │')}`,
    `  ${chalk.green('│  :3006      │')}  ${chalk.cyan('│  :5173      │')}  ${chalk.yellow('│  CLI        │')}`,
    `  ${chalk.green('└──────┬──────┘')}  ${chalk.cyan('└──────┬──────┘')}  ${chalk.yellow('└──────┬──────┘')}`,
    `         ${dim('│')}                ${dim('│')}                ${dim('│')}`,
    `         ${dim('└────────────────┼────────────────┘')}`,
    `                          ${dim('│')}`,
    `  ${chalk.hex('#A855F7')('┌──────────────────┴──────────────────┐')}`,
    `  ${chalk.hex('#A855F7')('│')}        ${purpleBold('kitz_os (Kernel)')}             ${chalk.hex('#A855F7')('│')}`,
    `  ${chalk.hex('#A855F7')('│')}  5-Phase Router · 155+ Tools       ${chalk.hex('#A855F7')('│')}`,
    `  ${chalk.hex('#A855F7')('│')}  AI Battery · 107 Agents · AOS     ${chalk.hex('#A855F7')('│')}`,
    `  ${chalk.hex('#A855F7')('│')}  Semantic: READ→COMPREHEND→BRAIN   ${chalk.hex('#A855F7')('│')}`,
    `  ${chalk.hex('#A855F7')('│')}           →EXECUTE→VOICE           ${chalk.hex('#A855F7')('│')}`,
    `  ${chalk.hex('#A855F7')('└──┬──────────┬──────────┬─────────┬──┘')}`,
    `     ${dim('│')}          ${dim('│')}          ${dim('│')}         ${dim('│')}`,
    `  ${chalk.cyan('┌──┴──┐')}  ${chalk.green('┌──┴──┐')}  ${chalk.yellow('┌──┴──┐')}  ${chalk.red('┌──┴──┐')}`,
    `  ${chalk.cyan('│ LLM │')}  ${chalk.green('│ CRM │')}  ${chalk.yellow('│ Pay │')}  ${chalk.red('│ AOS │')}`,
    `  ${chalk.cyan('│ Hub │')}  ${chalk.green('│ MCP │')}  ${chalk.yellow('│ mts │')}  ${chalk.red('│Swarm│')}`,
    `  ${chalk.cyan('└─────┘')}  ${chalk.green('└─────┘')}  ${chalk.yellow('└─────┘')}  ${chalk.red('└─────┘')}`,
    `  ${dim('Claude')}   ${dim('Supabase')}  ${dim('Stripe')}   ${dim('107 agents')}`,
    `  ${dim('OpenAI')}   ${dim('Postgres')}  ${dim('PayPal')}   ${dim('19 teams')}`,
    `  ${dim('Gemini')}              ${dim('Yappy')}    ${dim('Events')}`,
    '',
    `  ${chalk.bold('External Integrations')}`,
    `  ${chalk.green('●')} Railway         ${dim('Production deploy · kitz-whatsapp-connector')}`,
    `  ${chalk.yellow('●')} GitHub Pages    ${dim('workspace.kitz.services · SPA hosting')}`,
    `  ${chalk.hex('#A855F7')('●')} Supabase        ${dim('Database · Edge functions · Auth')}`,
    '',
  ].join('\n')
}

/** health — quick health check across all services */
async function cmdHealth(): Promise<string> {
  const lines = ['', purpleBold('  🏥 HEALTH CHECK'), `  ${line(50)}`, '']

  // Probe services in parallel
  const services = [
    { name: 'kitz_os', url: KITZ_OS_URL, port: 3012 },
    { name: 'whatsapp-connector', url: WA_URL, port: 3006 },
    { name: 'workspace', url: 'http://localhost:3001', port: 3001 },
    { name: 'gateway', url: 'http://localhost:4000', port: 4000 },
    { name: 'llm-hub', url: 'http://localhost:4010', port: 4010 },
    { name: 'payments', url: 'http://localhost:3005', port: 3005 },
    { name: 'admin', url: 'http://localhost:3011', port: 3011 },
    { name: 'ui (vite)', url: 'http://localhost:5173', port: 5173 },
    { name: 'preview (artifacts)', url: `http://localhost:${PREVIEW_PORT}`, port: PREVIEW_PORT },
  ]

  const results = await Promise.all(
    services.map(async (s) => {
      const start = Date.now()
      const ok = await probeService(s.url, 2000)
      return { ...s, ok, latency: Date.now() - start }
    })
  )

  for (const r of results) {
    const icon = r.ok ? chalk.green('●') : chalk.red('○')
    const lat = r.ok ? dim(`${r.latency}ms`) : chalk.red('unreachable')
    lines.push(`  ${icon} ${chalk.white(r.name.padEnd(25))} :${String(r.port).padEnd(6)} ${lat}`)
  }

  const online = results.filter(r => r.ok).length
  const total = results.length
  lines.push('')
  lines.push(`  ${online === total ? chalk.green('✔') : chalk.yellow('⚠')} ${online}/${total} services responding`)

  // External endpoints
  lines.push('')
  lines.push(chalk.bold('  External:'))
  const externals = [
    { name: 'Railway (production)', url: 'https://kitzv1-production.up.railway.app/health' },
    { name: 'workspace.kitz.services', url: 'https://workspace.kitz.services' },
  ]
  for (const ext of externals) {
    try {
      const start = Date.now()
      const res = await fetch(ext.url, { signal: AbortSignal.timeout(5000) })
      const lat = Date.now() - start
      lines.push(`  ${res.ok ? chalk.green('●') : chalk.yellow('●')} ${chalk.white(ext.name.padEnd(25))} ${res.ok ? dim(`${lat}ms`) : chalk.yellow(`${res.status}`)}`)
    } catch {
      lines.push(`  ${chalk.red('○')} ${chalk.white(ext.name.padEnd(25))} ${chalk.red('unreachable')}`)
    }
  }

  lines.push('')
  return lines.join('\n')
}

/** diff <service> — show what changed in a service since last commit */
function cmdDiffService(service?: string): string {
  if (!service) {
    try {
      const diff = execSync('git diff --stat HEAD', { cwd: REPO_ROOT, timeout: 5000 }).toString().trim()
      if (!diff) return dim('\n  No uncommitted changes.\n')
      const lines = ['', purpleBold('  📝 Uncommitted Changes'), `  ${line(50)}`, '']
      for (const l of diff.split('\n')) lines.push(`  ${l}`)
      lines.push('')
      return lines.join('\n')
    } catch { return chalk.red('\n  ❌ Git diff failed\n') }
  }

  try {
    const diff = execSync(`git diff HEAD -- "${service}/"`, { cwd: REPO_ROOT, timeout: 10000 }).toString().trim()
    if (!diff) return dim(`\n  No changes in ${service}/\n`)

    const lines = ['', purpleBold(`  📝 Changes: ${service}`), `  ${line(50)}`, '']
    const diffLines = diff.split('\n')
    for (const l of diffLines.slice(0, 60)) {
      if (l.startsWith('+') && !l.startsWith('+++')) lines.push(`  ${chalk.green(l.slice(0, 100))}`)
      else if (l.startsWith('-') && !l.startsWith('---')) lines.push(`  ${chalk.red(l.slice(0, 100))}`)
      else if (l.startsWith('@@')) lines.push(`  ${chalk.cyan(l.slice(0, 80))}`)
      else if (l.startsWith('diff')) lines.push(`\n  ${chalk.bold(l.replace('diff --git ', '').slice(0, 60))}`)
      else lines.push(`  ${dim(l.slice(0, 100))}`)
    }
    if (diffLines.length > 60) lines.push(dim(`\n  ... ${diffLines.length - 60} more lines`))
    lines.push('')
    return lines.join('\n')
  } catch (err) {
    return chalk.red(`\n  ❌ ${err instanceof Error ? err.message : 'Diff failed'}\n`)
  }
}

// ── Spinner Helper ─────────────────────────────────────

/** Electric spinner — Kitz branded zap animation */
function showSpinner(_label: string): ReturnType<typeof setInterval> {
  // Electric bolt frames cycling through purple shades
  const bolts = ['⚡', '⚡', '✦', '⚡', '✧', '⚡', '⚡', '✦']
  const purples = ['#A855F7', '#9333EA', '#7C3AED', '#6D28D9', '#8B5CF6', '#A78BFA', '#C084FC', '#7C3AED']
  // Kitz-flavored "processing" labels that rotate
  const labels = [
    'Conectando...',
    'Ruteando señal...',
    'Armando la jugada...',
    'Cargando...',
    'Cocinando...',
    'Construyendo...',
    'Procesando...',
    'Desplegando...',
  ]
  let i = 0
  const labelPick = labels[Math.floor(Math.random() * labels.length)]
  return setInterval(() => {
    const frame = bolts[i % bolts.length]
    const color = purples[i % purples.length]
    process.stdout.write(`\r  ${chalk.hex(color)(frame)} ${chalk.hex(color)(labelPick)}`)
    i++
  }, 120)
}

function stopSpinner(interval: ReturnType<typeof setInterval>): void {
  clearInterval(interval)
  process.stdout.write('\r' + ' '.repeat(40) + '\r')
}

// ── KITZ Integrations ──────────────────────────────────

// ── Mode Commands ──────────────────────────────────────

function cmdMode(arg?: string): string {
  if (!arg) {
    // Show current mode + all options
    const lines = ['', purpleBold('  🎛  MODO DE EJECUCIÓN'), `  ${line(50)}`, '']
    for (const [key, info] of Object.entries(MODE_INFO)) {
      const active = key === currentMode
      const marker = active ? chalk.green(' ◀ activo') : ''
      lines.push(`  ${info.emoji} ${info.color(info.label.padEnd(6))} ${dim(info.desc)}${marker}`)
    }
    lines.push('')
    lines.push(dim('  Cambiar: /plan, /ask, /go (o /vibe)'))
    lines.push('')
    return lines.join('\n')
  }

  const normalized = arg.toLowerCase().trim()
  const modeMap: Record<string, KitzMode> = {
    plan: 'plan', p: 'plan',
    ask: 'ask', a: 'ask', safe: 'ask',
    go: 'go', g: 'go', vibe: 'go', yolo: 'go', ship: 'go', execute: 'go',
  }

  const newMode = modeMap[normalized]
  if (!newMode) {
    return chalk.yellow(`\n  ⚠ Modo desconocido: "${arg}". Opciones: /plan, /ask, /go (/vibe)\n`)
  }

  const prev = currentMode
  currentMode = newMode
  const info = MODE_INFO[newMode]

  if (prev === newMode) {
    return dim(`\n  Ya estás en modo ${info.emoji} ${info.label}.\n`)
  }

  // Reset auto-accept when leaving GO mode
  if (newMode !== 'go' && autoAccept) {
    autoAccept = false
  }

  return `\n  ${info.emoji} Cambiado a modo ${info.color(info.label)}\n  ${dim(info.desc)}\n`
}

function cmdAutoAccept(): string {
  autoAccept = !autoAccept
  if (autoAccept && currentMode !== 'go') {
    autoAccept = false
    return `\n  ${chalk.yellow('⚠')} Auto-accept solo funciona en modo ${chalk.green('GO')}.\n  Cambia primero: ${chalk.cyan('/go')}\n`
  }
  if (autoAccept) {
    return `\n  ${chalk.green('⚡ Auto-accept ON')} — Borradores aprobados automáticamente en modo GO.\n  ${dim('Desactivar: /auto')}\n`
  }
  return `\n  ${chalk.yellow('⏸ Auto-accept OFF')} — Se te pedirá aprobar borradores.\n`
}

// ── Help ───────────────────────────────────────────────

function cmdHelp(): string {
  return [
    '',
    purpleBold('  Centro de Comando KITZ'),
    `  ${line(55)}`,
    '',
    chalk.bold('  🎛  Modos'),
    `    ${chalk.cyan('/plan')}                📋 Modo plan — Kitz planifica antes de actuar`,
    `    ${chalk.cyan('/ask')}                 🤔 Modo preguntar — Kitz confirma cada acción`,
    `    ${chalk.cyan('/go')}                  🚀 Modo go — autonomía total, solo ejecuta`,
    `    ${chalk.cyan('/auto')}                ⚡ Auto-aprobar borradores (solo modo GO)`,
    `    ${chalk.cyan('/mode')}                Mostrar/cambiar modo actual`,
    '',
    chalk.bold('  💬 Chat'),
    `    ${chalk.cyan('<mensaje>')}            Enviar a KITZ AI (router semántico 5 fases)`,
    `    ${chalk.cyan('/approve')}             Aprobar borrador pendiente`,
    `    ${chalk.cyan('/reject')}              Rechazar borrador pendiente`,
    `    ${chalk.cyan('/daily')}               Reporte diario de operaciones`,
    `    ${chalk.cyan('/weekly')}              Paquete semanal para junta`,
    '',
    chalk.bold('  🌐 Preview'),
    `    ${chalk.cyan('/preview')}             Iniciar servidor de artefactos (:${PREVIEW_PORT})`,
    `    ${chalk.cyan('/preview stop')}        Detener servidor preview`,
    `    ${chalk.cyan('/open')}                Abrir último artefacto en navegador`,
    `    ${chalk.cyan('/artifact')}            Mostrar ruta del último artefacto`,
    '',
    chalk.bold('  🤖 Agentes & Swarm'),
    `    ${chalk.cyan('/swarm')}               Ejecución completa de 19 equipos`,
    `    ${chalk.cyan('/swarm <equipos>')}     Equipos específicos (separados por coma)`,
    `    ${chalk.cyan('/agents')}              Todos los agentes con estado`,
    `    ${chalk.cyan('/teams')}               Panel de equipos`,
    `    ${chalk.cyan('/launch')}              Revisión de lanzamiento (33 agentes)`,
    `    ${chalk.cyan('/digest')}              Resumen del CTO`,
    `    ${chalk.cyan('/warroom')}             Salas de guerra activas`,
    `    ${chalk.cyan('/coaching')}            Entrenamiento y rendimiento de agentes`,
    '',
    chalk.bold('  📣 Contenido & Workflows'),
    `    ${chalk.cyan('/content')}             Pipeline de creación de contenido`,
    `    ${chalk.cyan('/workflows')}           Estado de workflows n8n`,
    '',
    chalk.bold('  ⚡ Sistema'),
    `    ${chalk.cyan('/status')}              Estado completo del sistema`,
    `    ${chalk.cyan('/battery')}             Desglose de AI Battery`,
    `    ${chalk.cyan('/services')}            Listar servicios del monorepo`,
    `    ${chalk.cyan('/tools')}               Listar módulos de herramientas`,
    `    ${chalk.cyan('/health')}              Verificar todos los servicios`,
    `    ${chalk.cyan('/env')}                 Variables de entorno (redactadas)`,
    '',
    chalk.bold('  📱 Canales'),
    `    ${chalk.cyan('/wa')}                  Conectar WhatsApp (QR en terminal)`,
    '',
    chalk.bold('  🔍 Inteligencia de Código'),
    `    ${chalk.cyan('/search <patrón>')}     Buscar en todo el código`,
    `    ${chalk.cyan('/files [ruta]')}        Listar archivos fuente`,
    `    ${chalk.cyan('/read <ruta>')}         Leer un archivo (relativo al repo)`,
    `    ${chalk.cyan('/explain <ruta>')}      Análisis de archivo con IA`,
    `    ${chalk.cyan('/audit [servicio]')}    Auditoría de código (tipos, TODOs, deps)`,
    `    ${chalk.cyan('/deps [servicio]')}     Grafo de dependencias`,
    `    ${chalk.cyan('/diff [servicio]')}     Cambios sin commit`,
    `    ${chalk.cyan('/map')}                 Diagrama de arquitectura`,
    `    ${chalk.cyan('/git')}                 Git status + commits recientes`,
    '',
    chalk.bold('  🛠 Utilidades'),
    `    ${chalk.cyan('/clear')}               Limpiar pantalla`,
    `    ${chalk.cyan('/')}                    Paleta rápida de comandos`,
    `    ${chalk.cyan('/help')}                Este menú completo`,
    `    ${chalk.cyan('!!')}                   Repetir último comando`,
    `    ${chalk.cyan('/quit')}                Salir`,
    '',
    dim('  Tab para autocompletar · Todo lo demás se envía como chat a KITZ AI.'),
    '',
  ].join('\n')
}

// ── Command Router ─────────────────────────────────────

/** Detect when a natural language message references a CLI command */
function detectCommandHint(message: string): string | null {
  const lower = message.toLowerCase()
  const hints: Array<{ keywords: string[]; command: string; desc: string }> = [
    { keywords: ['swarm', 'run swarm', 'activate swarm', 'launch swarm', 'start swarm', 'aos swarm'], command: 'swarm', desc: 'Run the 19-team AOS swarm' },
    { keywords: ['launch review', 'launch check', 'go/no-go', 'ready to launch'], command: 'launch', desc: 'Run 33-agent launch review' },
    { keywords: ['show agents', 'list agents', 'agent status', 'all agents'], command: 'agents', desc: 'Show all agents with status' },
    { keywords: ['show teams', 'list teams', 'team status'], command: 'teams', desc: 'Show team dashboard' },
    { keywords: ['battery status', 'check battery', 'ai credits', 'credit balance'], command: 'battery', desc: 'AI Battery breakdown' },
    { keywords: ['system status', 'health check', 'service status'], command: 'health', desc: 'Probe all services' },
    { keywords: ['connect whatsapp', 'whatsapp qr', 'link whatsapp', 'scan qr'], command: 'wa', desc: 'Connect WhatsApp via QR' },
    { keywords: ['daily report', 'daily brief', 'morning brief'], command: 'daily', desc: 'Generate daily ops brief' },
    { keywords: ['weekly report', 'weekly brief', 'board packet', 'week in review'], command: 'weekly', desc: 'Generate weekly board packet' },
    { keywords: ['war room', 'warroom', 'incident', 'outage', 'escalation'], command: 'warroom', desc: 'Show active war rooms' },
    { keywords: ['workflow', 'n8n', 'automation'], command: 'workflows', desc: 'Show n8n workflow status' },
    { keywords: ['content pipeline', 'content creation', 'social media', 'blog post'], command: 'content', desc: 'Content creation pipeline' },
    { keywords: ['coaching', 'training', 'agent performance', 'skill gap'], command: 'coaching', desc: 'Agent training & performance' },
  ]

  for (const h of hints) {
    if (h.keywords.some(kw => lower.includes(kw))) {
      return `\n  ${chalk.yellow('💡 Tip')}: Type ${chalk.cyan('/' + h.command)} to ${h.desc} directly.\n`
    }
  }
  return null
}

const cmdHistory: string[] = []
let lastUnreachableTs = 0 // cooldown for "not reachable" error

async function handleInput(input: string): Promise<string> {
  let trimmed = input.trim()
  if (!trimmed) return ''

  // History recall: !! reruns last command
  if (trimmed === '!!') {
    if (cmdHistory.length === 0) return dim('\n  Sin historial de comandos.\n')
    trimmed = cmdHistory[cmdHistory.length - 1]
  }

  // Slash command support: strip leading / if it's a known command
  if (trimmed.startsWith('/')) {
    const potentialCmd = trimmed.slice(1).split(/\s+/)[0].toLowerCase()
    if (KNOWN_COMMANDS.has(potentialCmd) || trimmed === '/') {
      trimmed = trimmed.slice(1)
    }
  }

  // Record in history (skip empty after strip)
  if (trimmed) cmdHistory.push(trimmed)

  // Just "/" with nothing after = command palette
  if (!trimmed) return cmdPalette()

  // ── File path detection (before command parsing) ──────
  // Detect local file paths → read and analyze directly
  const fileDetect = detectFilePath(trimmed)
  if (fileDetect) {
    return cmdFileAnalysis(fileDetect.filePath, fileDetect.question)
  }

  const [cmd, ...args] = trimmed.split(/\s+/)
  const arg = args.join(' ')

  switch (cmd.toLowerCase()) {
    // Modes
    case 'mode': return cmdMode(arg || undefined)
    case 'plan': case 'p': return cmdMode('plan')
    case 'ask': case 'a': return cmdMode('ask')
    case 'go': case 'vibe': case 'yolo': case 'ship': return cmdMode('go')
    case 'auto': case 'autoaccept': case 'auto-accept': return cmdAutoAccept()

    // Draft workflow
    case 'approve': case 'approved': case 'yes': case 'confirm': return cmdApprove()
    case 'reject': case 'rejected': case 'deny': case 'cancel': return cmdReject()

    // Artifacts & Preview
    case 'preview': case 'render': case 'server':
      if (arg === 'stop' || arg === 'off') return stopPreviewServer()
      return startPreviewServer()
    case 'open': return cmdOpenArtifact()
    case 'artifact': case 'artifacts':
      if (lastArtifactPath && fs.existsSync(lastArtifactPath)) {
        const previewUrl = previewRunning ? `\n  ${chalk.cyan('🌐')} ${chalk.cyan.underline(`http://localhost:${PREVIEW_PORT}/${path.basename(lastArtifactPath)}`)}` : ''
        return `\n  ${chalk.cyan('📂 Last artifact')}: ${chalk.underline(`file://${lastArtifactPath}`)}${previewUrl}\n  Type ${chalk.cyan('open')} to view · ${chalk.cyan('preview')} to start render server.\n`
      }
      return chalk.yellow('\n  ⚠ No artifacts yet. Ask Kitz to generate code or content.\n')

    // Chat & AI
    case 'daily': return cmdDaily()
    case 'weekly': return cmdWeekly()

    // Agents & Swarm
    case 'swarm': return cmdSwarm(arg || undefined)
    case 'agents': return cmdAgents()
    case 'teams': return cmdTeams()
    case 'launch': return cmdLaunch()
    case 'digest': return cmdDigest()
    case 'warroom': case 'warrooms': case 'war': return cmdWarRoom()
    case 'coaching': case 'coach': case 'training': return cmdCoaching()

    // Content & Workflows
    case 'content': case 'pipeline': return cmdContent()
    case 'workflows': case 'workflow': case 'n8n': return cmdWorkflows()

    // System
    case 'status': return cmdStatus()
    case 'battery': return cmdBattery()
    case 'services': return cmdServices()
    case 'tools': return cmdTools()

    // Channels
    case 'whatsapp': case 'wa': return cmdWhatsApp()

    // KITZ code intelligence
    case 'search': case 'grep': case 'find': return cmdSearch(arg)
    case 'files': case 'ls': return cmdFiles(arg || undefined)
    case 'read': case 'cat': return cmdRead(arg || undefined)
    case 'explain': return cmdExplain(arg || undefined)
    case 'audit': return cmdAudit(arg || undefined)
    case 'deps': return cmdDeps(arg || undefined)
    case 'diff': return cmdDiffService(arg || undefined)
    case 'map': case 'arch': case 'architecture': return cmdMap()
    case 'health': case 'ping': return cmdHealth()
    case 'env': return cmdEnv()
    case 'git': return cmdGit(arg || undefined)

    // Memory & Learning
    case 'remember': case 'learn': return cmdRemember(arg)
    case 'forget': return cmdForget(arg)
    case 'memories': case 'memory': case 'brain': return cmdMemories()

    // Utilities
    case 'clear': process.stdout.write('\x1B[2J\x1B[H'); return ''
    case '?': return cmdPalette()
    case 'help': return cmdHelp()
    case 'quit': case 'exit': case 'q':
      process.stdout.write(dim('\n  👋 KITZ fuera. Sigue construyendo.\n') + '\n')
      process.exit(0)

    // Default: chat with smart hints
    default: {
      const chatResult = await cmdChat(trimmed)
      const hint = detectCommandHint(trimmed)
      return hint ? chatResult + hint : chatResult
    }
  }
}

// ── Command Palette ────────────────────────────────────

function cmdPalette(): string {
  const categories: Record<string, SlashCommand[]> = {}
  for (const cmd of SLASH_COMMANDS) {
    if (!categories[cmd.category]) categories[cmd.category] = []
    categories[cmd.category].push(cmd)
  }

  const categoryLabels: Array<[string, string]> = [
    ['mode', '🎛  Modos'],
    ['draft', '📋 Borradores'],
    ['chat', '💬 Chat'],
    ['agents', '🤖 Agentes'],
    ['system', '⚡ Sistema'],
    ['code', '🔍 Código'],
    ['preview', '🌐 Preview'],
    ['channel', '📱 Canales'],
    ['content', '📣 Contenido'],
    ['memory', '🧠 Memoria'],
    ['util', '🛠  Utilidades'],
  ]

  const lines = ['', purpleBold('  Comandos KITZ'), `  ${line(60)}`, '']

  for (const [cat, label] of categoryLabels) {
    const cmds = categories[cat]
    if (!cmds || cmds.length === 0) continue
    const cmdStr = cmds.map(c => {
      const hint = c.argHint ? ` ${dim(c.argHint)}` : ''
      return chalk.cyan(`/${c.name}`) + hint
    }).join('  ')
    lines.push(`  ${label}  ${cmdStr}`)
  }

  lines.push('')
  lines.push(dim('  Tab para completar · /help para detalles · Escribe para chatear'))
  lines.push('')
  return lines.join('\n')
}

// ── Tab Completion ────────────────────────────────────

function kitzCompleter(line: string): [string[], string] {
  const trimmed = line.trimStart()
  const hasSlash = trimmed.startsWith('/')
  const partial = hasSlash ? trimmed.slice(1) : trimmed

  // Only complete the first word (command name)
  if (partial.includes(' ')) return [[], line]

  const primaryNames = SLASH_COMMANDS.map(c => c.name)
  const prefix = hasSlash ? '/' : ''

  if (partial === '' && hasSlash) {
    // Show all commands when just "/" is typed
    return [primaryNames.map(n => `${prefix}${n}`), line]
  }

  if (partial === '') return [[], line]

  const allNames = SLASH_COMMANDS.flatMap(c => [c.name, ...c.aliases])
  const matches = allNames
    .filter(name => name.startsWith(partial.toLowerCase()))
    .map(name => `${prefix}${name}`)

  return [matches, line]
}

// ── Main Boot ──────────────────────────────────────────

async function main() {
  // Clear screen + scrollback — clean slate, nothing above
  process.stdout.write('\x1B[2J\x1B[3J\x1B[H')

  // Boot animation — like Claude Code thinking
  const bootFrames = ['⚡', '✦', '⚡', '✧', '⚡', '✦', '⚡']
  const bootPurples = ['#A855F7', '#9333EA', '#7C3AED', '#6D28D9', '#8B5CF6', '#A78BFA', '#C084FC']
  let frame = 0
  const bootAnim = setInterval(() => {
    const c = chalk.hex(bootPurples[frame % bootPurples.length])
    process.stdout.write(`\r  ${c(bootFrames[frame % bootFrames.length])} ${c('KitZ (OS)')}`)
    frame++
  }, 100)

  // Gather system info while animation plays
  await gatherBootInfo()

  // Auto-start preview server (silent)
  await startPreviewServer().catch(() => {})

  // Stop animation, pin boot screen to top
  clearInterval(bootAnim)
  process.stdout.write('\x1B[2J\x1B[3J\x1B[H')
  process.stdout.write(renderBootScreen())

  // Start REPL
  function getPrompt(): string {
    const mInfo = MODE_INFO[currentMode]
    const modeTag = currentMode === 'go' ? '' : ` ${mInfo.color(`[${mInfo.label}]`)}`

    const indicators: string[] = []
    if (lastDraftToken) indicators.push(chalk.yellow('📋'))
    if (autoAccept) indicators.push(chalk.green('⚡'))
    const indicatorStr = indicators.length > 0 ? ` ${indicators.join('')}` : ''

    return `  ${purple('kitz')}${modeTag}${indicatorStr} ${dim('›')} `
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: getPrompt(),
    terminal: true,
    completer: kitzCompleter,
  })

  // Auto-show WhatsApp QR if not connected and connector is reachable
  if (!bootInfo.waConnected) {
    const waReachable = await probeService(WA_URL, 2000)
    if (waReachable) {
      process.stdout.write(`  ${chalk.hex('#A855F7')('⚡')} ${chalk.white.bold('Escanea para vincular WhatsApp')}\n\n`)
      await showBootQR(rl, getPrompt)
      return // showBootQR starts the REPL loop
    }
  }

  rl.prompt()
  wireRepl(rl, getPrompt)
}

/** Show QR code at boot — renders once, stays static until scanned or skipped */
async function showBootQR(rl: readline.Interface, getPrompt: () => string): Promise<void> {
  const zap = chalk.hex('#A855F7')

  bootInfo.waLinking = true
  bootInfo.waCountdown = 60

  const url = `${WA_URL}/whatsapp/connect?userId=cli-${Date.now()}`
  let qrRendered = false // only render QR once — keep it static

  try {
    const res = await fetch(url)
    if (!res.ok || !res.body) {
      bootInfo.waLinking = false
      rl.prompt()
      wireRepl(rl, getPrompt)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let resolved = false

    const countdownTimer = setInterval(() => {
      bootInfo.waCountdown--
      if (bootInfo.waCountdown <= 0) clearInterval(countdownTimer)
    }, 1000)

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        clearInterval(countdownTimer)
        bootInfo.waLinking = false
        reader.cancel()
        process.stdout.write(chalk.yellow('\n  ⏱ QR expirado. Escribe `/wa` para intentar de nuevo.\n\n'))
        rl.prompt()
        wireRepl(rl, getPrompt)
      }
    }, 65000)

    const processStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done || resolved) break

          buffer += decoder.decode(value, { stream: true })
          const sseLines = buffer.split('\n')
          buffer = sseLines.pop() || ''

          let currentEvent = ''
          for (const l of sseLines) {
            if (l.startsWith('event: ')) {
              currentEvent = l.slice(7).trim()
            } else if (l.startsWith('data: ') && currentEvent) {
              const rawData = l.slice(6)

              if (currentEvent === 'qr' && !qrRendered) {
                // Render QR exactly once — it stays on screen
                try {
                  const qrcode = await import('qrcode-terminal')

                  process.stdout.write('\x1B[2J\x1B[H')
                  // Wordmark at top
                  for (const wl of KITZ_WORDMARK) process.stdout.write(`  ${wl}\n`)
                  process.stdout.write('\n')
                  process.stdout.write(`  ${zap('⚡')} ${chalk.white.bold('Scan to link WhatsApp')}\n\n`)

                  qrcode.default.generate(rawData, { small: true }, (qr: string) => {
                    const qrLines = qr.split('\n').map(ql => `    ${ql}`)
                    process.stdout.write(qrLines.join('\n') + '\n\n')
                  })

                  process.stdout.write(`  ${dim('WhatsApp → Ajustes → Dispositivos vinculados → Escanear')}\n`)
                  process.stdout.write(`  ${dim('Presiona Enter para saltar')}\n`)

                  qrRendered = true
                } catch {
                  process.stdout.write(dim(`  QR: ${rawData.slice(0, 50)}...\n`))
                }
              } else if (currentEvent === 'connected') {
                resolved = true
                clearInterval(countdownTimer)
                clearTimeout(timeout)
                reader.cancel()
                bootInfo.waLinking = false
                try {
                  const d = JSON.parse(rawData)
                  bootInfo.waConnected = true
                  bootInfo.waPhone = d.phone || ''
                  process.stdout.write(`\n\n  ${chalk.green('⚡')} ${chalk.green.bold('WhatsApp vinculado!')}  ${chalk.white(`+${d.phone || 'unknown'}`)}\n\n`)
                } catch {
                  bootInfo.waConnected = true
                  process.stdout.write(`\n\n  ${chalk.green('⚡')} ${chalk.green.bold('WhatsApp vinculado!')}\n\n`)
                }
                rl.prompt()
                wireRepl(rl, getPrompt)
                return
              } else if (currentEvent === 'error') {
                resolved = true
                clearInterval(countdownTimer)
                clearTimeout(timeout)
                reader.cancel()
                bootInfo.waLinking = false
                process.stdout.write(chalk.red(`\n  ❌ Connection error: ${rawData}\n\n`))
                rl.prompt()
                wireRepl(rl, getPrompt)
                return
              }
              currentEvent = ''
            }
          }
        }
      } catch {
        // Stream ended
      }

      if (!resolved) {
        resolved = true
        clearInterval(countdownTimer)
        clearTimeout(timeout)
        bootInfo.waLinking = false
        rl.prompt()
        wireRepl(rl, getPrompt)
      }
    }

    // Allow Enter to skip QR and drop into REPL
    rl.once('line', () => {
      if (!resolved) {
        resolved = true
        clearInterval(countdownTimer)
        clearTimeout(timeout)
        bootInfo.waLinking = false
        reader.cancel()
        process.stdout.write('\x1B[2J\x1B[H')
        process.stdout.write(renderTopBar() + '\n')
        rl.prompt()
        wireRepl(rl, getPrompt)
      }
    })

    processStream()
  } catch {
    bootInfo.waLinking = false
    rl.prompt()
    wireRepl(rl, getPrompt)
  }
}

/** Wire up the standard REPL event handlers */
function wireRepl(rl: readline.Interface, getPrompt: () => string) {
  // ── Paste buffer: collects rapid multiline pastes into a single message ──
  let pasteBuffer: string[] = []
  let pasteTimer: ReturnType<typeof setTimeout> | null = null
  let processing = false // prevent re-entrance while awaiting response

  const flushPaste = async () => {
    pasteTimer = null
    if (pasteBuffer.length === 0) return
    // Join all buffered lines into a single input
    const fullInput = pasteBuffer.join('\n').trim()
    pasteBuffer = []
    if (!fullInput) { rl.prompt(); return }

    processing = true
    const output = await handleInput(fullInput)
    if (output) {
      lastOutput = output
      printOutput(output)
    }
    processing = false
    rl.setPrompt(getPrompt())
    rl.prompt()
  }

  rl.on('line', (input) => {
    if (processing) {
      // Silently buffer lines that arrive while we're waiting for a response
      pasteBuffer.push(input)
      return
    }
    pasteBuffer.push(input)
    // Debounce: wait 50ms for more lines before flushing (pastes arrive rapidly)
    if (pasteTimer) clearTimeout(pasteTimer)
    pasteTimer = setTimeout(flushPaste, 50)
  })

  rl.on('close', () => {
    stopPreviewServer()
    process.stdout.write(dim('\n  👋 KITZ out. Keep building.\n') + '\n')
    process.exit(0)
  })

  // Graceful shutdown
  process.on('SIGINT', () => {
    stopPreviewServer()
    process.stdout.write(dim('\n  👋 KITZ out. Keep building.\n') + '\n')
    process.exit(0)
  })
}

main().catch((err) => {
  process.stderr.write(chalk.red(`\n  Boot failed: ${err.message}\n`) + '\n')
  process.exit(1)
})
