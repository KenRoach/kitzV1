#!/usr/bin/env tsx
/**
 * ╔═══════════════════════════════════════════════════════╗
 * ║  KITZ Command Center — Terminal Intelligence System   ║
 * ║                                                       ║
 * ║  Inspired by: Claude Code boot · OpenClaw gateway     ║
 * ║  Channels: WhatsApp · Web · Terminal · (future multi)  ║
 * ║  Engine: kitz_os kernel · 155+ tools · 107 agents     ║
 * ╚═══════════════════════════════════════════════════════╝
 *
 * Run:  npx tsx kitz_os/src/cli.ts
 *       cd kitz_os && npm run cli
 *       kitz (if installed globally)
 */

import * as readline from 'node:readline'
import * as path from 'node:path'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as http from 'node:http'
import { execSync } from 'node:child_process'
import chalk from 'chalk'

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

// ── Orb ASCII Art ──────────────────────────────────────

const KITZ_FACE = {
  idle: `    ${chalk.hex('#A855F7')('██')}${chalk.red('████')}${chalk.hex('#A855F7')('██')}
  ${chalk.hex('#A855F7')('██')}${chalk.red('██  ██')}${chalk.hex('#A855F7')('██')}
  ${chalk.red('█')} ${chalk.white('·')}    ${chalk.white('·')} ${chalk.red('█')}
  ${chalk.red('█')}  ${chalk.white(' ── ')}  ${chalk.red('█')}
  ${chalk.hex('#A855F7')('██')}${chalk.red('██  ██')}${chalk.hex('#A855F7')('██')}
    ${chalk.hex('#A855F7')('██')}${chalk.red('████')}${chalk.hex('#A855F7')('██')}`,

  thinking: `    ${chalk.yellow('██')}${chalk.hex('#F59E0B')('████')}${chalk.yellow('██')}
  ${chalk.yellow('██')}${chalk.hex('#F59E0B')('██  ██')}${chalk.yellow('██')}
  ${chalk.hex('#F59E0B')('█')} ${chalk.white('◉')}    ${chalk.white('◉')} ${chalk.hex('#F59E0B')('█')}
  ${chalk.hex('#F59E0B')('█')}  ${chalk.white(' ~~ ')}  ${chalk.hex('#F59E0B')('█')}
  ${chalk.yellow('██')}${chalk.hex('#F59E0B')('██  ██')}${chalk.yellow('██')}
    ${chalk.yellow('██')}${chalk.hex('#F59E0B')('████')}${chalk.yellow('██')}`,

  success: `    ${chalk.green('██')}${chalk.hex('#22C55E')('████')}${chalk.green('██')}
  ${chalk.green('██')}${chalk.hex('#22C55E')('██  ██')}${chalk.green('██')}
  ${chalk.hex('#22C55E')('█')} ${chalk.white('◕')}    ${chalk.white('◕')} ${chalk.hex('#22C55E')('█')}
  ${chalk.hex('#22C55E')('█')}  ${chalk.white(' ◡◡ ')}  ${chalk.hex('#22C55E')('█')}
  ${chalk.green('██')}${chalk.hex('#22C55E')('██  ██')}${chalk.green('██')}
    ${chalk.green('██')}${chalk.hex('#22C55E')('████')}${chalk.green('██')}`,

  error: `    ${chalk.red('██')}${chalk.hex('#EF4444')('████')}${chalk.red('██')}
  ${chalk.red('██')}${chalk.hex('#EF4444')('██  ██')}${chalk.red('██')}
  ${chalk.hex('#EF4444')('█')} ${chalk.white('✖')}    ${chalk.white('✖')} ${chalk.hex('#EF4444')('█')}
  ${chalk.hex('#EF4444')('█')}  ${chalk.white(' ── ')}  ${chalk.hex('#EF4444')('█')}
  ${chalk.red('██')}${chalk.hex('#EF4444')('██  ██')}${chalk.red('██')}
    ${chalk.red('██')}${chalk.hex('#EF4444')('████')}${chalk.red('██')}`,

  swarm: `    ${chalk.cyan('██')}${chalk.hex('#06B6D4')('████')}${chalk.cyan('██')}
  ${chalk.cyan('██')}${chalk.hex('#06B6D4')('██  ██')}${chalk.cyan('██')}
  ${chalk.hex('#06B6D4')('█')} ${chalk.white('≋')}    ${chalk.white('≋')} ${chalk.hex('#06B6D4')('█')}
  ${chalk.hex('#06B6D4')('█')}  ${chalk.white(' ≈≈ ')}  ${chalk.hex('#06B6D4')('█')}
  ${chalk.cyan('██')}${chalk.hex('#06B6D4')('██  ██')}${chalk.cyan('██')}
    ${chalk.cyan('██')}${chalk.hex('#06B6D4')('████')}${chalk.cyan('██')}`,
}

type OrbMood = keyof typeof KITZ_FACE

// ── Execution Modes ────────────────────────────────────

type KitzMode = 'plan' | 'ask' | 'go'

const MODE_INFO: Record<KitzMode, { label: string; color: (s: string) => string; emoji: string; desc: string; chatPrefix: string }> = {
  plan: {
    label: 'PLAN',
    color: chalk.hex('#F59E0B'),
    emoji: '📋',
    desc: 'Kitz explains what it would do, step by step, before acting. You approve.',
    chatPrefix: '[MODE: PLAN — Think step-by-step. Outline what you would do, which tools you would call, and what the expected outcome is. Do NOT execute any tools yet. Present as a numbered plan and ask for approval.]',
  },
  ask: {
    label: 'ASK',
    color: chalk.hex('#3B82F6'),
    emoji: '🤔',
    desc: 'Kitz asks before each action. Safe mode — nothing happens without your OK.',
    chatPrefix: '[MODE: ASK — Before performing any action or calling any tool, explain what you want to do and ask for explicit permission. Be concise.]',
  },
  go: {
    label: 'GO',
    color: chalk.hex('#22C55E'),
    emoji: '🚀',
    desc: 'Kitz just does it. Full autonomy — execute tools, make decisions, ship.',
    chatPrefix: '',
  },
}

// ── State ──────────────────────────────────────────────

let currentMode: KitzMode = 'go'
let orbMood: OrbMood = 'idle'
let chatHistory: ChatMessage[] = []
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
  toolCount: 155, agentCount: 107, teamCount: 19,
  batteryUsed: 0, batteryLimit: 5, batteryRemaining: 5,
  kernelStatus: 'offline' as string,
  waConnected: false, waPhone: '',
  uptime: 0, nodeVersion: process.version,
  platform: `${os.platform()} ${os.arch()}`,
  hostname: os.hostname(),
  user: os.userInfo().username,
  repoPath: REPO_ROOT,
  serviceCount: 0,
  gitBranch: '', gitCommit: '', gitDirty: false,
}

// ── HTTP Helpers ───────────────────────────────────────

async function kitzFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-dev-secret': DEV_SECRET,
    ...(opts.headers as Record<string, string> || {}),
  }
  const res = await fetch(`${KITZ_OS_URL}${path}`, { ...opts, headers, signal: AbortSignal.timeout(30000) })
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

  // Probe services (async)
  const [kitzOk, waOk] = await Promise.all([
    probeService(KITZ_OS_URL),
    probeService(WA_URL),
  ])

  connectionMode = kitzOk ? 'http' : 'local'
  bootInfo.kernelStatus = kitzOk ? 'online' : 'offline'
  bootInfo.waConnected = waOk

  // Fetch live data from kitz_os
  if (kitzOk) {
    try {
      const status = await kitzFetch<{
        tools_registered?: number
        battery?: { todayCredits?: number; dailyLimit?: number; remaining?: number }
        uptime?: number
        status?: string
      }>('/api/kitz/status')
      bootInfo.toolCount = status.tools_registered ?? 155
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

function timeAgo(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${Math.floor(seconds / 86400)}d`
}

// ── Boot Screen (Claude Code inspired) ─────────────────

function renderBootScreen(): string {
  const b = bootInfo
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'

  // Status indicators
  const kernelIcon = b.kernelStatus === 'online' ? chalk.green('●') :
                     b.kernelStatus === 'degraded' ? chalk.yellow('●') : chalk.red('●')
  const waIcon = b.waConnected ? chalk.green('●') : chalk.red('○')
  const waLabel = b.waConnected ? (b.waPhone ? `+${b.waPhone}` : 'Connected') : 'Disconnected'
  const gitDirty = b.gitDirty ? chalk.yellow(' *') : ''
  const batteryBar = bar(b.batteryUsed, b.batteryLimit, 15)
  const batteryPct = ((b.batteryUsed / Math.max(b.batteryLimit, 1)) * 100).toFixed(0)

  // OpenClaw integration status
  let openclawLine = ''
  try {
    const ocConfig = path.join(os.homedir(), '.openclaw', 'openclaw.json')
    if (fs.existsSync(ocConfig)) {
      const oc = JSON.parse(fs.readFileSync(ocConfig, 'utf-8'))
      const ocVersion = oc.meta?.lastTouchedVersion || '?'
      const ocModel = oc.agents?.defaults?.model?.primary?.split('/').pop() || '?'
      const waPhone = oc.channels?.whatsapp?.allowFrom?.[0] || ''
      openclawLine = `  ${dim('│')}  ${chalk.cyan('●')} OpenClaw   ${dim(`v${ocVersion} · ${ocModel}`)}${waPhone ? dim(` · WA: ${waPhone}`) : ''}`
    }
  } catch {}

  const lines = [
    '',
    `  ${dim('┌─')} ${purpleBold('KITZ Command Center')} ${dim(`v${VERSION}`)}`,
    `  ${dim('│')}`,
    `  ${dim('│')}  ${KITZ_FACE[orbMood].split('\n')[0]}`,
    `  ${dim('│')}  ${KITZ_FACE[orbMood].split('\n')[1]}`,
    `  ${dim('│')}  ${KITZ_FACE[orbMood].split('\n')[2]}        ${purpleBold(`${greeting}, ${b.user}!`)}`,
    `  ${dim('│')}  ${KITZ_FACE[orbMood].split('\n')[3]}        ${dim('"Your hustle deserves infrastructure"')}`,
    `  ${dim('│')}  ${KITZ_FACE[orbMood].split('\n')[4]}`,
    `  ${dim('│')}  ${KITZ_FACE[orbMood].split('\n')[5]}`,
    `  ${dim('│')}`,
    `  ${dim('├─')} ${chalk.bold('System')}`,
    `  ${dim('│')}  ${kernelIcon} kitz_os    ${dim(b.kernelStatus)} ${b.uptime > 0 ? dim(`· up ${timeAgo(b.uptime)}`) : ''}`,
    `  ${dim('│')}  ${waIcon} WhatsApp   ${dim(waLabel)}`,
    openclawLine ? `${openclawLine}` : '',
    `  ${dim('│')}`,
    `  ${dim('├─')} ${chalk.bold('Infrastructure')}`,
    `  ${dim('│')}  🔧 ${chalk.white(String(b.toolCount))} tools   🤖 ${chalk.white(String(b.agentCount))} agents   📊 ${chalk.white(String(b.teamCount))} teams`,
    `  ${dim('│')}  📦 ${chalk.white(String(b.serviceCount))} services in monorepo`,
    `  ${dim('│')}`,
    `  ${dim('├─')} ${chalk.bold('AI Battery')}`,
    `  ${dim('│')}  [${batteryBar}] ${chalk.white(`${b.batteryUsed.toFixed(1)}/${b.batteryLimit}`)} credits ${dim(`(${batteryPct}%)`)}`,
    `  ${dim('│')}`,
    `  ${dim('├─')} ${chalk.bold('Environment')}`,
    `  ${dim('│')}  📂 ${dim(b.repoPath)}`,
    `  ${dim('│')}  🌿 ${chalk.cyan(b.gitBranch || '?')}${gitDirty} ${dim(`@ ${b.gitCommit || '?'}`)}`,
    `  ${dim('│')}  ⬡  ${dim(`Node ${b.nodeVersion} · ${b.platform}`)}`,
    `  ${dim('│')}  🖥  ${dim(b.hostname)}`,
    `  ${dim('│')}`,
    `  ${dim('└─')} ${dim('Type a message to chat · ')}${chalk.cyan('help')}${dim(' for commands · ')}${chalk.cyan('quit')}${dim(' to exit')}`,
    '',
  ].filter(Boolean)

  return lines.join('\n')
}

// ── Thinking Display (Claude Code style) ───────────────

function showThinking(steps: ThinkingStep[]): string {
  if (steps.length === 0) return ''
  const lines = [dim('  ┌ Thought process:')]
  for (const step of steps) {
    const dur = step.durationMs ? dim(` (${step.durationMs}ms)`) : ''
    lines.push(`  ${dim('│')} ${chalk.yellow('⟳')} ${chalk.bold(step.phase)} ${dim('→')} ${step.detail}${dur}`)
  }
  lines.push(dim('  └'))
  return lines.join('\n')
}

// ── Commands ───────────────────────────────────────────

async function cmdChat(message: string): Promise<string> {
  orbMood = 'thinking'
  const startMs = Date.now()
  const spinner = showSpinner('Thinking...')

  try {
    const history = chatHistory.slice(-10).map(m => ({ role: m.role, content: m.content }))
    // Inject mode prefix for plan/ask modes
    const modePrefix = MODE_INFO[currentMode].chatPrefix
    const fullMessage = modePrefix ? `${modePrefix}\n\nUser message: ${message}` : message

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

    let out = ''
    if (thinking.length > 0) out += showThinking(thinking) + '\n'
    out += `\n  ${purpleBold('Kitz')}: ${chalk.white(reply)}\n`
    if (tools.length > 0) out += `  ${chalk.cyan('🔧 ' + tools.join(', '))}\n`

    // Detect and save artifacts (code blocks) from response
    const artifactInfo = extractAndSaveArtifacts(reply)
    if (artifactInfo) out += artifactInfo

    // Show draft approval hint
    if (res.draft_token || /\bdraft\b/i.test(reply) || /\bapproval\b/i.test(reply) || /\bapprove\b/i.test(reply)) {
      if (res.draft_token) {
        out += `\n  ${chalk.yellow('📋 Draft pending')} — type ${chalk.cyan('approve')} or ${chalk.cyan('reject')}\n`
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
      return chalk.yellow(`\n  ⚠ kitz_os not reachable at ${KITZ_OS_URL}\n  Start it with: ${dim('cd kitz_os && npm run dev')}\n`)
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

  // Also detect inline document content (invoices, quotes, reports without code fences)
  // If tools generated artifact content but it wasn't in code blocks, save the full response
  if (artifacts.length === 0 && reply.length > 500) {
    const docPatterns = [
      /invoice|factura|receipt/i,
      /quote|quotation|cotización|estimate/i,
      /order|pedido|purchase order/i,
      /proposal|propuesta/i,
      /deck|presentation|pitch/i,
      /report|reporte|informe/i,
      /contract|contrato|agreement/i,
      /certificate|certificado/i,
      /letter|carta|memo/i,
      /compliance|cumplimiento/i,
    ]
    const isDocument = docPatterns.some(p => p.test(reply))

    if (isDocument) {
      if (!fs.existsSync(ARTIFACT_DIR)) {
        fs.mkdirSync(ARTIFACT_DIR, { recursive: true })
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

      // Wrap markdown content in a styled HTML document
      const htmlContent = wrapDocumentAsHtml(reply)
      const filename = `kitz-doc-${timestamp}.html`
      const filepath = path.join(ARTIFACT_DIR, filename)

      try {
        fs.writeFileSync(filepath, htmlContent, 'utf-8')
        artifacts.push({ lang: 'html', content: htmlContent, file: filepath })
        lastArtifactPath = filepath
        registerArtifact(filepath, 'document')
      } catch {}
    }
  }

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
        execSync(`open "${url}"`, { timeout: 3000 })
        lines.push(`  ${dim('Opened in browser ↗')}`)
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
    return chalk.yellow('\n  ⚠ No pending draft to approve. Send a message first.\n')
  }

  const spinner = showSpinner('Approving draft...')
  try {
    const res = await kitzFetch<{ response?: string; message?: string; status?: string }>('/api/kitz/approve', {
      method: 'POST',
      body: JSON.stringify({ token: lastDraftToken, action: 'approve', user_id: `cli:${bootInfo.user}` }),
    })
    stopSpinner(spinner)
    lastDraftToken = null
    const reply = res.response ?? res.message ?? 'Draft approved and executed.'
    orbMood = 'success'
    setTimeout(() => { orbMood = 'idle' }, 3000)
    return `\n  ${chalk.green('✅ Approved')}: ${chalk.white(reply)}\n`
  } catch (err) {
    stopSpinner(spinner)
    return chalk.red(`\n  ❌ Approval failed: ${err instanceof Error ? err.message : String(err)}\n`)
  }
}

async function cmdReject(): Promise<string> {
  if (!lastDraftToken) {
    return chalk.yellow('\n  ⚠ No pending draft to reject.\n')
  }

  try {
    await kitzFetch<{ status?: string }>('/api/kitz/approve', {
      method: 'POST',
      body: JSON.stringify({ token: lastDraftToken, action: 'reject', user_id: `cli:${bootInfo.user}` }),
    })
    lastDraftToken = null
    return `\n  ${chalk.yellow('❌ Draft rejected.')}\n`
  } catch (err) {
    return chalk.red(`\n  ❌ Reject failed: ${err instanceof Error ? err.message : String(err)}\n`)
  }
}

/** Open the last saved artifact */
function cmdOpenArtifact(): string {
  if (!lastArtifactPath || !fs.existsSync(lastArtifactPath)) {
    return chalk.yellow('\n  ⚠ No artifact to open. Ask Kitz to generate something first.\n')
  }

  try {
    execSync(`open "${lastArtifactPath}"`, { timeout: 5000 })
    return `\n  ${chalk.green('📂 Opened:')} ${dim(lastArtifactPath)}\n`
  } catch {
    return `\n  ${chalk.cyan('📂')} ${chalk.underline(`file://${lastArtifactPath}`)}\n  ${dim('Copy the path above to open manually.')}\n`
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
  process.stdout.write(chalk.green('\n  📱 Connecting to WhatsApp (OpenClaw Baileys engine)...\n'))
  process.stdout.write(dim('  Waiting for QR code...\n\n'))

  return new Promise((resolve) => {
    const url = `${WA_URL}/whatsapp/connect?userId=cli-${Date.now()}`
    let timeout: ReturnType<typeof setTimeout>
    let resolved = false

    fetch(url).then(async (res) => {
      if (!res.ok || !res.body) {
        resolve(chalk.red(`  ❌ WhatsApp connector not reachable at ${WA_URL}\n  ${dim('Start: cd kitz-whatsapp-connector && npm run dev')}\n`))
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let countdown = 60

      const countdownTimer = setInterval(() => {
        countdown--
        if (countdown <= 0) clearInterval(countdownTimer)
      }, 1000)

      timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true
          clearInterval(countdownTimer)
          reader.cancel()
          resolve(chalk.yellow('\n  ⏱ QR timeout. Type `wa` to try again.\n'))
        }
      }, 65000)

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done || resolved) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          let currentEvent = ''
          for (const l of lines) {
            if (l.startsWith('event: ')) {
              currentEvent = l.slice(7).trim()
            } else if (l.startsWith('data: ') && currentEvent) {
              const rawData = l.slice(6)

              if (currentEvent === 'qr') {
                try {
                  const qrcode = await import('qrcode-terminal')
                  process.stdout.write('\x1B[2J\x1B[H') // clear
                  process.stdout.write(purpleBold('\n  📱 KITZ — WhatsApp Connect (OpenClaw Baileys)\n'))
                  process.stdout.write(`  ${line(50)}\n\n`)
                  qrcode.default.generate(rawData, { small: true }, (qr: string) => {
                    process.stdout.write(qr.split('\n').map(l => '    ' + l).join('\n') + '\n\n')
                  })
                  process.stdout.write(chalk.yellow(`  ⏱ ${countdown}s remaining\n`))
                  process.stdout.write(dim('  Open WhatsApp → Settings → Linked Devices → Scan\n'))
                } catch {
                  process.stdout.write(dim(`  QR: ${rawData.slice(0, 50)}...\n`))
                }
              } else if (currentEvent === 'connected') {
                resolved = true
                clearInterval(countdownTimer)
                clearTimeout(timeout)
                reader.cancel()
                try {
                  const d = JSON.parse(rawData)
                  bootInfo.waConnected = true
                  bootInfo.waPhone = d.phone || ''
                  resolve(chalk.green(`\n  ✅ WhatsApp connected! Phone: +${d.phone || 'unknown'}\n`))
                } catch {
                  resolve(chalk.green('\n  ✅ WhatsApp connected!\n'))
                }
                return
              } else if (currentEvent === 'error') {
                resolved = true
                clearInterval(countdownTimer)
                clearTimeout(timeout)
                reader.cancel()
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
          resolve(chalk.red(`\n  ❌ SSE error: ${err instanceof Error ? err.message : String(err)}\n`))
        }
      }
    }).catch(() => {
      if (!resolved) {
        resolved = true
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

  // OpenClaw
  try {
    const ocConfig = path.join(os.homedir(), '.openclaw', 'openclaw.json')
    if (fs.existsSync(ocConfig)) {
      const oc = JSON.parse(fs.readFileSync(ocConfig, 'utf-8'))
      lines.push(`  ${chalk.cyan('●')} OpenClaw       ${dim(`v${oc.version || '?'} · agent: ${oc.agent?.identity?.name || '?'}`)}`)
    }
  } catch {}

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

// ── Claude Code Superpowers ────────────────────────────

function cmdSearch(query: string): string {
  if (!query) return chalk.yellow('\n  Usage: search <pattern>\n  Searches all code in the KITZ monorepo.\n')

  try {
    const result = execSync(
      `grep -rn --include="*.ts" --include="*.tsx" --include="*.md" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=.next "${query.replace(/"/g, '\\"')}" "${REPO_ROOT}" | head -30`,
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

// ── Claude Code Deep Superpowers ───────────────────────

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

/** audit [service] — code health check for a service */
async function cmdAudit(service?: string): Promise<string> {
  const target = service || 'kitz_os'
  const servicePath = path.join(REPO_ROOT, target)
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

  // OpenClaw patterns check
  lines.push('')
  lines.push(chalk.bold('  OpenClaw Patterns:'))
  try {
    const ocRefs = execSync(
      `grep -rn "OpenClaw\\|openclaw" "${servicePath}/src" --include="*.ts" 2>/dev/null | wc -l`,
      { timeout: 5000 }
    ).toString().trim()
    const ocCount = parseInt(ocRefs) || 0
    if (ocCount > 0) {
      lines.push(`    ${chalk.cyan('●')} ${ocCount} OpenClaw reference${ocCount > 1 ? 's' : ''} (ported patterns)`)
    } else {
      lines.push(`    ${dim('○ No OpenClaw patterns in this service')}`)
    }
  } catch {}

  lines.push('')
  return lines.join('\n')
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
    `  ${chalk.cyan('●')} OpenClaw v${(() => { try { const c = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.openclaw', 'openclaw.json'), 'utf-8')); return c.meta?.lastTouchedVersion || '?' } catch { return '?' } })()}  ${dim('Multi-channel gateway · Baileys patterns')}`,
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

function showSpinner(label: string): ReturnType<typeof setInterval> {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  let i = 0
  return setInterval(() => {
    process.stdout.write(`\r  ${chalk.yellow(frames[i++ % frames.length])} ${label}`)
  }, 80)
}

function stopSpinner(interval: ReturnType<typeof setInterval>): void {
  clearInterval(interval)
  process.stdout.write('\r' + ' '.repeat(40) + '\r')
}

// ── OpenClaw Integration ───────────────────────────────

function cmdOpenClaw(): string {
  try {
    const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json')
    if (!fs.existsSync(configPath)) {
      return chalk.yellow('\n  ⚠ OpenClaw not configured. Install: npm i -g openclaw\n')
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    const meta = config.meta || {}
    const agents = config.agents?.defaults || {}
    const gw = config.gateway || {}
    const channels = config.channels || {}
    const hooks = config.hooks || {}

    const lines = [
      '', purpleBold('  🐾 OPENCLAW GATEWAY'), `  ${line(50)}`, '',
      `  Version:    ${chalk.white(`v${meta.lastTouchedVersion || '?'}`)}`,
      `  Model:      ${chalk.cyan(agents.model?.primary || '?')}`,
      `  Workspace:  ${dim(agents.workspace || '~/.openclaw/workspace')}`,
      `  Gateway:    ${dim(`${gw.bind === 'loopback' ? '127.0.0.1' : '0.0.0.0'}:${gw.port || '?'} (${gw.mode || '?'})`)}`,
      `  Auth:       ${dim(gw.auth?.mode || 'none')}`,
      '',
    ]

    // Channels
    lines.push('  Channels:')
    if (channels.whatsapp) {
      const phones = channels.whatsapp.allowFrom || []
      const policy = channels.whatsapp.dmPolicy || 'open'
      lines.push(`    ${chalk.green('●')} WhatsApp  ${dim(`policy: ${policy}`)} ${phones.length ? dim(`· ${phones.join(', ')}`) : ''}`)
    }
    for (const [name, ch] of Object.entries(channels)) {
      if (name === 'whatsapp') continue
      lines.push(`    ${chalk.cyan('●')} ${chalk.white(name)} ${dim(JSON.stringify(ch).slice(0, 40))}`)
    }
    if (Object.keys(channels).length === 0) lines.push(dim('    No channels configured'))

    // Skills
    const skillsDir = path.join(os.homedir(), '.openclaw', 'workspace', 'skills')
    if (fs.existsSync(skillsDir)) {
      const skills = fs.readdirSync(skillsDir).filter(f => !f.startsWith('.'))
      if (skills.length > 0) {
        lines.push('')
        lines.push('  Skills:')
        for (const s of skills) lines.push(`    ${chalk.cyan('⚡')} ${s}`)
      }
    }

    // Memory
    const memDir = path.join(os.homedir(), '.openclaw', 'workspace', 'memory')
    if (fs.existsSync(memDir)) {
      const mems = fs.readdirSync(memDir).filter(f => f.endsWith('.md'))
      lines.push('')
      lines.push(`  Memory:     ${chalk.white(String(mems.length))} entries`)
    }

    // Hooks
    const internalHooks = hooks.internal?.entries || {}
    const hookNames = Object.keys(internalHooks)
    if (hookNames.length > 0) {
      lines.push('')
      lines.push('  Hooks:')
      for (const h of hookNames) {
        const enabled = internalHooks[h]?.enabled
        lines.push(`    ${enabled ? chalk.green('●') : chalk.red('○')} ${h}`)
      }
    }

    // Denied commands
    const denied = gw.nodes?.denyCommands || []
    if (denied.length > 0) {
      lines.push('')
      lines.push(`  Blocked:    ${dim(denied.join(', '))}`)
    }

    // Integration with KITZ
    lines.push('')
    lines.push(dim('  ─'.repeat(25)))
    lines.push(`  ${dim('KITZ ported from OpenClaw:')}`)
    lines.push(`    ${chalk.green('✔')} Baileys session management (creds backup, backoff, watchdog)`)
    lines.push(`    ${chalk.green('✔')} Message dedup + debounce`)
    lines.push(`    ${chalk.green('✔')} Access control (allowlist/open)`)
    lines.push(`    ${chalk.green('✔')} Media understanding tools`)
    lines.push(`    ${chalk.green('✔')} Memory manager pattern`)
    lines.push(`    ${chalk.green('✔')} Structured logging with PII redaction`)

    lines.push('')
    return lines.join('\n')
  } catch (err) {
    return chalk.red(`\n  ❌ ${err instanceof Error ? err.message : 'OpenClaw read failed'}\n`)
  }
}

// ── Mode Commands ──────────────────────────────────────

function cmdMode(arg?: string): string {
  if (!arg) {
    // Show current mode + all options
    const lines = ['', purpleBold('  🎛  EXECUTION MODE'), `  ${line(50)}`, '']
    for (const [key, info] of Object.entries(MODE_INFO)) {
      const active = key === currentMode
      const marker = active ? chalk.green(' ◀ active') : ''
      lines.push(`  ${info.emoji} ${info.color(info.label.padEnd(6))} ${dim(info.desc)}${marker}`)
    }
    lines.push('')
    lines.push(dim('  Switch: plan, ask, go (or vibe)'))
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
    return chalk.yellow(`\n  ⚠ Unknown mode: "${arg}". Options: plan, ask, go (vibe)\n`)
  }

  const prev = currentMode
  currentMode = newMode
  const info = MODE_INFO[newMode]

  if (prev === newMode) {
    return dim(`\n  Already in ${info.emoji} ${info.label} mode.\n`)
  }

  return `\n  ${info.emoji} Switched to ${info.color(info.label)} mode\n  ${dim(info.desc)}\n`
}

// ── Help ───────────────────────────────────────────────

function cmdHelp(): string {
  return [
    '',
    purpleBold('  KITZ Command Center'),
    `  ${line(50)}`,
    '',
    chalk.bold('  🎛  Modes'),
    `    ${chalk.cyan('plan')}                 📋 Plan mode — Kitz outlines before acting`,
    `    ${chalk.cyan('ask')}                  🤔 Ask mode — Kitz confirms each action`,
    `    ${chalk.cyan('go / vibe')}            🚀 Go mode — full autonomy, just ship`,
    `    ${chalk.cyan('mode')}                 Show current mode`,
    '',
    chalk.bold('  💬 Chat'),
    `    ${chalk.cyan('<message>')}            Send to KITZ AI (5-phase router)`,
    `    ${chalk.cyan('approve / reject')}     Approve or reject a pending draft`,
    `    ${chalk.cyan('daily')}                Daily ops brief`,
    `    ${chalk.cyan('weekly')}               Weekly board packet`,
    '',
    chalk.bold('  🌐 Preview Server'),
    `    ${chalk.cyan('preview')}              Start local artifact render server (:${PREVIEW_PORT})`,
    `    ${chalk.cyan('preview stop')}         Stop the preview server`,
    `    ${chalk.cyan('open')}                 Open last artifact in browser`,
    `    ${chalk.cyan('artifact')}             Show last artifact path`,
    `    ${dim('    Renders: HTML, invoices, quotes, orders, decks, reports, contracts')}`,
    '',
    chalk.bold('  🤖 Agents & Swarm'),
    `    ${chalk.cyan('swarm')}                Full 19-team swarm run`,
    `    ${chalk.cyan('swarm <teams>')}        Targeted teams (comma-separated)`,
    `    ${chalk.cyan('agents')}               All agents with status`,
    `    ${chalk.cyan('teams')}                Team dashboard`,
    `    ${chalk.cyan('launch')}               33-agent launch review`,
    `    ${chalk.cyan('digest')}               CTO digest`,
    `    ${chalk.cyan('warroom')}              Active war rooms`,
    `    ${chalk.cyan('coaching')}             Agent training & performance`,
    '',
    chalk.bold('  📣 Content & Workflows'),
    `    ${chalk.cyan('content')}              Content creation pipeline`,
    `    ${chalk.cyan('workflows')}            n8n workflow status`,
    '',
    chalk.bold('  ⚡ System'),
    `    ${chalk.cyan('status')}               Full system health`,
    `    ${chalk.cyan('battery')}              AI Battery breakdown`,
    `    ${chalk.cyan('services')}             List all monorepo services`,
    `    ${chalk.cyan('tools')}                List tool modules`,
    '',
    chalk.bold('  📱 Channels'),
    `    ${chalk.cyan('wa / whatsapp')}        Connect WhatsApp (QR in terminal)`,
    `    ${chalk.cyan('openclaw')}             OpenClaw gateway status`,
    '',
    chalk.bold('  🔍 Code Intelligence (Claude Code style)'),
    `    ${chalk.cyan('search <pattern>')}     Search entire codebase`,
    `    ${chalk.cyan('files [path]')}         List source files`,
    `    ${chalk.cyan('read <path>')}          Read a file (relative to repo)`,
    `    ${chalk.cyan('explain <path>')}       AI-powered file analysis`,
    `    ${chalk.cyan('audit [service]')}      Code health check (types, TODOs, deps)`,
    `    ${chalk.cyan('deps [service]')}       Dependency graph`,
    `    ${chalk.cyan('diff [service]')}       Uncommitted changes`,
    `    ${chalk.cyan('map')}                  Architecture diagram`,
    `    ${chalk.cyan('health')}               Probe all services`,
    `    ${chalk.cyan('env')}                  Environment variables (redacted)`,
    `    ${chalk.cyan('git')}                  Git status + recent commits`,
    `    ${chalk.cyan('git log/diff/branches')} Git sub-commands`,
    '',
    chalk.bold('  🛠 Utilities'),
    `    ${chalk.cyan('clear')}                Clear screen`,
    `    ${chalk.cyan('help / ?')}             This menu`,
    `    ${chalk.cyan('quit / exit')}          Exit`,
    '',
    dim('  Anything else is sent as a chat message to KITZ AI.'),
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
      return `\n  ${chalk.yellow('💡 Tip')}: Type ${chalk.cyan(h.command)} to ${h.desc} directly.\n`
    }
  }
  return null
}

async function handleInput(input: string): Promise<string> {
  const trimmed = input.trim()
  if (!trimmed) return ''

  const [cmd, ...args] = trimmed.split(/\s+/)
  const arg = args.join(' ')

  switch (cmd.toLowerCase()) {
    // Modes
    case 'mode': return cmdMode(arg || undefined)
    case 'plan': case 'p': return cmdMode('plan')
    case 'ask': case 'a': return cmdMode('ask')
    case 'go': case 'vibe': case 'yolo': case 'ship': return cmdMode('go')

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
    case 'openclaw': case 'oc': return cmdOpenClaw()

    // Claude Code superpowers
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

    // Utilities
    case 'clear': process.stdout.write('\x1B[2J\x1B[H'); return ''
    case 'help': case '?': return cmdHelp()
    case 'quit': case 'exit': case 'q':
      process.stdout.write(dim('\n  👋 KITZ out. Keep building.\n') + '\n')
      process.exit(0)

    // Default: chat with smart hints
    default: {
      const chatResult = await cmdChat(trimmed)
      const hint = detectCommandHint(trimmed)
      return hint ? chatResult + hint : chatResult
    }
  }
}

// ── Main Boot ──────────────────────────────────────────

async function main() {
  process.stdout.write('\x1B[2J\x1B[H') // clear screen

  // Gather system info
  process.stdout.write(dim('  Booting KITZ...\n'))
  await gatherBootInfo()

  // Auto-start preview server
  process.stdout.write(dim('  Starting preview server...\n'))
  await startPreviewServer().catch(() => {}) // non-fatal

  // Clear and show boot screen
  process.stdout.write('\x1B[2J\x1B[H')
  process.stdout.write(renderBootScreen() + '\n')

  // Show preview server status in boot
  if (previewRunning) {
    process.stdout.write(`  ${chalk.green('●')} Preview server: ${chalk.cyan.underline(`http://localhost:${PREVIEW_PORT}`)}\n\n`)
  }

  // Start REPL
  function getPrompt(): string {
    const mInfo = MODE_INFO[currentMode]
    const modeTag = currentMode === 'go' ? '' : ` ${mInfo.color(`[${mInfo.label}]`)}`
    return `  ${purple('kitz')}${modeTag} ${dim('›')} `
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: getPrompt(),
    terminal: true,
  })

  rl.prompt()

  rl.on('line', async (input) => {
    const output = await handleInput(input)
    if (output) process.stdout.write(output + '\n')
    rl.setPrompt(getPrompt()) // update prompt in case mode changed
    rl.prompt()
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
