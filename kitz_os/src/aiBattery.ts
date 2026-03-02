/**
 * AI Battery — Unified Spend Tracking for KITZ OS
 *
 * Tracks ALL AI API consumption across providers:
 *   - OpenAI gpt-4o-mini (tool-routing loops in semantic router)
 *   - Claude Haiku (fallback tool-routing)
 *   - ElevenLabs (TTS voice generation — characters)
 *
 * Storage layers:
 *   1. In-memory ledger (always available, resets on restart)
 *   2. NDJSON file (append-only, survives restarts)
 *   3. Supabase agent_audit_log (when configured — persistent)
 *
 * Credit model:
 *   - 1 credit = ~1000 LLM tokens OR ~500 ElevenLabs characters
 *   - Read operations: 0 credits
 *   - Tool-routing loop: ~0.5–2 credits per request
 *   - Voice note (TTS): ~0.5–5 credits depending on text length
 *
 * Budget enforcement (from governance/ai_battery.md):
 *   - Daily: ≤ 5 credits
 *   - Weekly: ≤ 15 credits
 *   - Monthly: ≤ 30 credits
 */

import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('aiBattery');

// ── Config ──────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const LEDGER_FILE = join(DATA_DIR, 'battery-ledger.ndjson');

// Credit conversion rates
const TOKENS_PER_CREDIT = 1000;       // ~1000 LLM tokens = 1 credit
const TTS_CHARS_PER_CREDIT = 500;     // ~500 ElevenLabs chars = 1 credit

// Daily credit limit (configurable via env, default 5)
const DAILY_LIMIT = Number(process.env.AI_BATTERY_DAILY_LIMIT) || 5;

// Supabase config (optional — for persistent tracking)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BUSINESS_ID = process.env.BUSINESS_ID || '134f52d0-90a3-4806-a1bd-c37ef31d4f6f';

// ── Types ───────────────────────────────────────────────

export type SpendProvider = 'openai' | 'claude' | 'elevenlabs';
export type SpendCategory = 'llm_tokens' | 'tts_characters' | 'voice_call' | 'recharge';

export interface SpendEntry {
  id: string;
  ts: string;
  provider: SpendProvider;
  category: SpendCategory;
  /** Raw usage units (tokens or characters) */
  units: number;
  /** Credits consumed (converted from units) */
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
  /** Total credits consumed today */
  todayCredits: number;
  /** Total credits consumed all-time (since last restart) */
  totalCredits: number;
  /** Daily credit budget */
  dailyLimit: number;
  /** Credits remaining today */
  remaining: number;
  /** Whether budget is depleted */
  depleted: boolean;
  /** Breakdown by provider */
  byProvider: Record<SpendProvider, number>;
  /** Total LLM tokens consumed today */
  todayTokens: number;
  /** Total TTS characters consumed today */
  todayTtsChars: number;
  /** Number of AI calls today */
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

// ── Core Functions ────────────────────────────────────────

/**
 * Record an AI spend event.
 * Called after every chatCompletion() and textToSpeech() call.
 */
export async function recordSpend(entry: Omit<SpendEntry, 'id' | 'ts'>): Promise<SpendEntry> {
  const fullEntry: SpendEntry = {
    ...entry,
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
  log.info('spend_recorded', {
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
}): Promise<SpendEntry> {
  const credits = opts.totalTokens / TOKENS_PER_CREDIT;

  return recordSpend({
    provider: opts.provider,
    category: 'llm_tokens',
    units: opts.totalTokens,
    credits: Math.round(credits * 1000) / 1000, // 3 decimal places
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
}): Promise<SpendEntry> {
  const credits = opts.characterCount / TTS_CHARS_PER_CREDIT;

  return recordSpend({
    provider: 'elevenlabs',
    category: 'tts_characters',
    units: opts.characterCount,
    credits: Math.round(credits * 1000) / 1000,
    model: `${opts.modelId}/${opts.voiceId}`,
    traceId: opts.traceId,
    toolContext: opts.toolContext,
  });
}

/**
 * Record a manual credit recharge.
 */
export async function recordRecharge(credits: number, traceId: string): Promise<SpendEntry> {
  return recordSpend({
    provider: 'openai', // Placeholder — recharges aren't provider-specific
    category: 'recharge',
    units: 0,
    credits: -credits, // Negative = credits added
    model: 'recharge',
    traceId,
  });
}

/**
 * Get current battery status.
 */
export function getBatteryStatus(): BatteryStatus {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // Filter today's entries (exclude recharges from credit count)
  const todayEntries = ledger.filter(e => e.ts >= todayStart && e.category !== 'recharge');
  const todayRecharges = ledger.filter(e => e.ts >= todayStart && e.category === 'recharge');

  const todayCredits = todayEntries.reduce((sum, e) => sum + e.credits, 0);
  const todayRecharged = todayRecharges.reduce((sum, e) => sum + Math.abs(e.credits), 0);
  const totalCredits = ledger.filter(e => e.category !== 'recharge').reduce((sum, e) => sum + e.credits, 0);

  // By-provider breakdown (today)
  const byProvider: Record<SpendProvider, number> = {
    openai: 0,
    claude: 0,
    elevenlabs: 0,
  };
  for (const e of todayEntries) {
    byProvider[e.provider] += e.credits;
  }

  // Token/character counts
  const todayTokens = todayEntries
    .filter(e => e.category === 'llm_tokens')
    .reduce((sum, e) => sum + e.units, 0);
  const todayTtsChars = todayEntries
    .filter(e => e.category === 'tts_characters')
    .reduce((sum, e) => sum + e.units, 0);

  const effectiveSpend = Math.max(0, todayCredits - todayRecharged);
  const remaining = Math.max(0, DAILY_LIMIT - effectiveSpend);

  return {
    todayCredits: Math.round(effectiveSpend * 1000) / 1000,
    totalCredits: Math.round(totalCredits * 1000) / 1000,
    dailyLimit: DAILY_LIMIT,
    remaining: Math.round(remaining * 1000) / 1000,
    depleted: remaining <= 0,
    byProvider,
    todayTokens,
    todayTtsChars,
    todayCalls: todayEntries.length,
  };
}

/**
 * Check if the user has enough credits for an AI operation.
 * Returns false if daily limit would be exceeded.
 */
export function hasBudget(estimatedCredits = 1): boolean {
  // Feature-flagged: battery enforcement disabled until AI_BATTERY_ENABLED=true
  if (process.env.AI_BATTERY_ENABLED !== 'true') return true;
  const status = getBatteryStatus();
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
 */
export function getLedger(): SpendEntry[] {
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
    // Fetch today's spend entries from Supabase
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/agent_audit_log?business_id=eq.${BUSINESS_ID}&action=like.spend.*&created_at=gte.${todayStart.toISOString()}&order=created_at.asc&limit=500`,
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
      trace_id: string;
      action: string;
      credits_consumed: number;
      args: { provider?: string; model?: string; units?: number };
      created_at: string;
      tool_name: string;
    }>;

    let count = 0;
    for (const row of rows) {
      const category = row.action.replace('spend.', '') as SpendCategory;
      const entry: SpendEntry = {
        id: row.trace_id + '_' + count,
        ts: row.created_at,
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
    business_id: BUSINESS_ID,
    agent_type: 'system',
    action: `spend.${entry.category}`,
    tool_name: entry.toolContext || entry.category,
    args: {
      provider: entry.provider,
      model: entry.model,
      units: entry.units,
    },
    result_summary: `${entry.credits} credits (${entry.units} ${entry.category === 'llm_tokens' ? 'tokens' : 'chars'})`,
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
