/**
 * AI Usage Tracking — Daily per-user credit system for KITZ OS
 *
 * Model: Each user gets AI_BATTERY_DAILY_LIMIT uses per UTC day (default: 5).
 * 1 AI call = 1 use (regardless of tokens, TTS chars, etc.)
 * Recharges add extra credits on top of the daily allowance.
 * Limits reset at midnight UTC each day.
 *
 * Multi-user: Every use is scoped by orgId so different users
 * get independent daily counters.
 *
 * Storage layers:
 *   1. In-memory ledger (always available, resets on restart)
 *   2. NDJSON file (append-only, survives restarts)
 *   3. Supabase agent_audit_log (when configured — persistent)
 *
 * Note: "Battery" references are kept in internal code for backwards
 * compatibility with existing callers, but user-facing messages say
 * "free uses" not "battery" or "credits".
 */

import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('aiUsage');

// ── Config ──────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const LEDGER_FILE = join(DATA_DIR, 'battery-ledger.ndjson');

// Daily limit: 5 AI uses per day per user (configurable via env)
// Supports both AI_BATTERY_DAILY_LIMIT (documented) and AI_FREE_USES (legacy)
const DAILY_LIMIT = Number(process.env.AI_BATTERY_DAILY_LIMIT)
  || Number(process.env.AI_FREE_USES)
  || 5;

// Default org for backwards compatibility
const DEFAULT_ORG = 'default';

// Supabase config (optional — for persistent tracking)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// ── Types ───────────────────────────────────────────────

export type SpendProvider = 'openai' | 'claude' | 'elevenlabs';
export type SpendCategory = 'llm_tokens' | 'tts_characters' | 'voice_call' | 'recharge';

export interface SpendEntry {
  id: string;
  ts: string;
  /** Organization/user ID — isolates usage per user */
  orgId: string;
  provider: SpendProvider;
  category: SpendCategory;
  /** Raw usage units (tokens or characters) */
  units: number;
  /** Credits consumed (1 per AI call, kept for granular tracking) */
  credits: number;
  /** Model or voice used */
  model: string;
  /** Trace ID for correlation */
  traceId: string;
  /** Tool that triggered the spend */
  toolContext?: string;
  /** Additional metadata */
  meta?: Record<string, unknown>;
}

export interface BatteryStatus {
  /** Organization/user ID */
  orgId: string;
  /** Total AI uses today */
  todayCredits: number;
  /** Total AI uses all-time (since last restart) */
  totalCredits: number;
  /** Free uses allowed */
  dailyLimit: number;
  /** Free uses remaining (0 = must pay) */
  remaining: number;
  /** Whether free tier is exhausted */
  depleted: boolean;
  /** Breakdown by provider */
  byProvider: Record<SpendProvider, number>;
  /** Total LLM tokens consumed */
  todayTokens: number;
  /** Total TTS characters consumed */
  todayTtsChars: number;
  /** Number of AI calls */
  todayCalls: number;
}

// ── In-Memory Ledger ─────────────────────────────────────

const ledger: SpendEntry[] = [];
const MAX_LEDGER_SIZE = 10_000;
let fileReady = false;

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
  if (fileReady) return;
  try {
    await mkdir(DATA_DIR, { recursive: true });
    fileReady = true;
  } catch {
    // Directory may already exist
    fileReady = true;
  }
}

/** Filter ledger entries for a specific org */
function orgEntries(orgId: string): SpendEntry[] {
  return ledger.filter(e => e.orgId === orgId);
}

/** Get the start of the current UTC day as ISO string */
function utcDayStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

/**
 * Sum credits used by an org since midnight UTC today.
 * Only counts positive-credit entries (usage, not recharges).
 */
export function getSpendToday(orgId?: string): number {
  const effectiveOrgId = orgId || DEFAULT_ORG;
  const todayStart = utcDayStart();
  const entries = effectiveOrgId === 'global' ? ledger : orgEntries(effectiveOrgId);
  return entries
    .filter(e => e.ts >= todayStart && e.category !== 'recharge')
    .reduce((sum, e) => sum + e.credits, 0);
}

// ── Core Functions ────────────────────────────────────────

/**
 * Record an AI spend event.
 * Called after every chatCompletion() and textToSpeech() call.
 */
export async function recordSpend(entry: Omit<SpendEntry, 'id' | 'ts'>): Promise<SpendEntry> {
  const fullEntry: SpendEntry = {
    ...entry,
    orgId: entry.orgId || DEFAULT_ORG,
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
  };

  // 1. In-memory ledger (capped to prevent unbounded growth)
  ledger.push(fullEntry);
  if (ledger.length > MAX_LEDGER_SIZE) ledger.splice(0, ledger.length - MAX_LEDGER_SIZE);

  // 2. NDJSON file (fire-and-forget — don't block on I/O)
  persistToFile(fullEntry).catch(err => {
    log.warn('file persist failed', { error: (err as Error).message });
  });

  // 3. Supabase agent_audit_log (fire-and-forget)
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    persistToSupabase(fullEntry).catch(err => {
      log.warn('supabase persist failed', { error: (err as Error).message });
    });
  }

  // Log spend
  log.info('use_recorded', {
    orgId: fullEntry.orgId,
    provider: fullEntry.provider,
    category: fullEntry.category,
    units: fullEntry.units,
    credits: fullEntry.credits,
    model: fullEntry.model,
    trace_id: fullEntry.traceId,
  });

  return fullEntry;
}

/**
 * Record LLM token usage after a chatCompletion() call.
 */
export async function recordLLMSpend(opts: {
  provider: 'openai' | 'claude';
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  traceId: string;
  toolContext?: string;
  orgId?: string;
}): Promise<SpendEntry> {
  // 1 AI call = 1 use (simple model)
  return recordSpend({
    orgId: opts.orgId || DEFAULT_ORG,
    provider: opts.provider,
    category: 'llm_tokens',
    units: opts.totalTokens,
    credits: 1, // 1 use per AI call
    model: opts.model,
    traceId: opts.traceId,
    toolContext: opts.toolContext,
    meta: {
      prompt_tokens: opts.promptTokens,
      completion_tokens: opts.completionTokens,
    },
  });
}

/**
 * Record ElevenLabs TTS character usage after a textToSpeech() call.
 */
export async function recordTTSSpend(opts: {
  characterCount: number;
  voiceId: string;
  modelId: string;
  traceId: string;
  toolContext?: string;
  orgId?: string;
}): Promise<SpendEntry> {
  return recordSpend({
    orgId: opts.orgId || DEFAULT_ORG,
    provider: 'elevenlabs',
    category: 'tts_characters',
    units: opts.characterCount,
    credits: 1, // 1 use per TTS call
    model: `${opts.modelId}/${opts.voiceId}`,
    traceId: opts.traceId,
    toolContext: opts.toolContext,
  });
}

/**
 * Record a manual credit recharge (purchase).
 */
export async function recordRecharge(credits: number, traceId: string, orgId?: string): Promise<SpendEntry> {
  return recordSpend({
    orgId: orgId || DEFAULT_ORG,
    provider: 'openai', // Placeholder — recharges aren't provider-specific
    category: 'recharge',
    units: 0,
    credits: -credits, // Negative = uses added
    model: 'recharge',
    traceId,
  });
}

/**
 * Get current usage status for a specific user/org.
 * Enforces DAILY limits — credits reset at midnight UTC each day.
 * Recharges add extra credits on top of the daily allowance.
 */
export function getBatteryStatus(orgId?: string): BatteryStatus {
  const effectiveOrgId = orgId || DEFAULT_ORG;

  // Get entries for this org (or all entries if orgId is 'global')
  const orgLedger = effectiveOrgId === 'global' ? ledger : orgEntries(effectiveOrgId);

  // All-time totals (for display / audit)
  const allUsageEntries = orgLedger.filter(e => e.category !== 'recharge');
  const totalUsesAllTime = allUsageEntries.reduce((sum, e) => sum + e.credits, 0);

  // Today's entries — daily limit enforcement uses UTC day boundary
  const todayStart = utcDayStart();
  const todayUsageEntries = allUsageEntries.filter(e => e.ts >= todayStart);
  const todayRechargeEntries = orgLedger.filter(e => e.category === 'recharge' && e.ts >= todayStart);

  const todayUses = todayUsageEntries.reduce((sum, e) => sum + e.credits, 0);
  const todayRecharged = todayRechargeEntries.reduce((sum, e) => sum + Math.abs(e.credits), 0);

  // By-provider breakdown (today only for actionable insight)
  const byProvider: Record<SpendProvider, number> = {
    openai: 0,
    claude: 0,
    elevenlabs: 0,
  };
  for (const e of todayUsageEntries) {
    byProvider[e.provider] += e.credits;
  }

  // Token/character counts (today)
  const todayTokens = todayUsageEntries
    .filter(e => e.category === 'llm_tokens')
    .reduce((sum, e) => sum + e.units, 0);
  const todayTtsChars = todayUsageEntries
    .filter(e => e.category === 'tts_characters')
    .reduce((sum, e) => sum + e.units, 0);

  // Daily budget = base daily limit + any recharges purchased today
  const effectiveDailyBudget = DAILY_LIMIT + todayRecharged;
  const remaining = Math.max(0, effectiveDailyBudget - todayUses);

  return {
    orgId: effectiveOrgId,
    todayCredits: todayUses,
    totalCredits: totalUsesAllTime,
    dailyLimit: DAILY_LIMIT,
    remaining: Math.round(remaining),
    depleted: remaining <= 0,
    byProvider,
    todayTokens,
    todayTtsChars,
    todayCalls: todayUsageEntries.length,
  };
}

/**
 * Check if the user has daily AI uses remaining.
 * Returns false if today's daily limit is exhausted (resets at midnight UTC).
 */
export function hasBudget(estimatedCredits = 1, orgId?: string): boolean {
  // Usage enforcement is ON by default. Set AI_BATTERY_ENABLED=false to explicitly disable.
  if (process.env.AI_BATTERY_ENABLED === 'false' || process.env.AI_USAGE_ENABLED === 'false') {
    return true;
  }
  const status = getBatteryStatus(orgId);
  return status.remaining >= estimatedCredits;
}

/**
 * Check if an AI action meets the minimum ROI threshold (2x).
 * Returns approval status and calculated ROI.
 * If ROI < 2x, recommend manual mode instead.
 */
export function checkROI(estimatedCost: number, estimatedValue: number): { approved: boolean; roi: number; recommendation: string } {
  if (estimatedCost <= 0) return { approved: true, roi: Infinity, recommendation: 'Zero-cost action — always approved' };
  const roi = estimatedValue / estimatedCost;
  if (roi >= 2) {
    return { approved: true, roi: Math.round(roi * 100) / 100, recommendation: `ROI ${roi.toFixed(1)}x — approved` };
  }
  return {
    approved: false,
    roi: Math.round(roi * 100) / 100,
    recommendation: `ROI ${roi.toFixed(1)}x is below 2x minimum. Recommend manual mode.`,
  };
}

/**
 * Get the full ledger (for debugging/audit).
 * If orgId provided, returns only that org's entries.
 */
export function getLedger(orgId?: string): SpendEntry[] {
  if (orgId) return [...orgEntries(orgId)];
  return [...ledger];
}

// ── Boot Restore ─────────────────────────────────────────

/**
 * Restore ledger from NDJSON file on boot.
 * Falls back to Supabase if the file is empty/missing.
 */
export async function initBattery(): Promise<void> {
  let restored = 0;

  // 1. Try restoring from local NDJSON file first (fastest)
  restored = await restoreFromFile();

  // 2. If file was empty, try Supabase
  if (restored === 0 && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    restored = await restoreFromSupabase();
  }

  log.info('boot_restore', { entries_restored: restored, source: restored > 0 ? 'file_or_supabase' : 'empty' });
}

async function restoreFromFile(): Promise<number> {
  try {
    const raw = await readFile(LEDGER_FILE, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    let count = 0;
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as SpendEntry;
        if (entry.id && entry.ts && entry.provider) {
          // Migrate legacy entries without orgId
          if (!entry.orgId) entry.orgId = DEFAULT_ORG;
          // Avoid duplicates
          if (!ledger.some(e => e.id === entry.id)) {
            ledger.push(entry);
            count++;
          }
        }
      } catch {
        // Skip malformed lines
      }
    }
    return count;
  } catch {
    // File doesn't exist yet — that's fine
    return 0;
  }
}

async function restoreFromSupabase(): Promise<number> {
  try {
    // Fetch recent spend entries from Supabase (all orgs — for daily limit enforcement)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/agent_audit_log?action=like.spend.*&order=created_at.asc&limit=1000`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!res.ok) return 0;

    const rows = await res.json() as Array<{
      business_id: string;
      trace_id: string;
      action: string;
      credits_consumed: number;
      args: { provider?: string; model?: string; units?: number; orgId?: string };
      created_at: string;
      tool_name: string;
    }>;

    let count = 0;
    for (const row of rows) {
      const category = row.action.replace('spend.', '') as SpendCategory;
      const entry: SpendEntry = {
        id: row.trace_id + '_' + count,
        ts: row.created_at,
        orgId: row.args?.orgId || row.business_id || DEFAULT_ORG,
        provider: (row.args?.provider || 'openai') as SpendProvider,
        category,
        units: row.args?.units || 0,
        credits: row.credits_consumed,
        model: row.args?.model || 'unknown',
        traceId: row.trace_id,
        toolContext: row.tool_name,
      };
      if (!ledger.some(e => e.traceId === entry.traceId && e.ts === entry.ts)) {
        ledger.push(entry);
        count++;
      }
    }
    return count;
  } catch {
    return 0;
  }
}

// ── Persistence ──────────────────────────────────────────

async function persistToFile(entry: SpendEntry): Promise<void> {
  await ensureDataDir();
  const line = JSON.stringify(entry) + '\n';
  await appendFile(LEDGER_FILE, line, 'utf-8');
}

async function persistToSupabase(entry: SpendEntry): Promise<void> {
  // Insert into agent_audit_log as a spend event
  const auditRow = {
    business_id: entry.orgId || DEFAULT_ORG,
    agent_type: 'system',
    action: `spend.${entry.category}`,
    tool_name: entry.toolContext || entry.category,
    args: {
      provider: entry.provider,
      model: entry.model,
      units: entry.units,
      orgId: entry.orgId,
    },
    result_summary: `${entry.credits} use(s) (${entry.units} ${entry.category === 'llm_tokens' ? 'tokens' : 'chars'})`,
    risk_level: 'low',
    trace_id: entry.traceId,
    credits_consumed: entry.credits,
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/agent_audit_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(auditRow),
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      log.warn('supabase insert failed', { status: res.status, detail: detail.slice(0, 200) });
    }
  } catch {
    // Silently fail — Supabase persistence is optional
  }
}
