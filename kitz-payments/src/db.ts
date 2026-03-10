/**
 * kitz-payments DB — Supabase persistence with in-memory fallback.
 * Tables: payment_ledger, subscriptions
 */

import type { AIBatteryLedgerEntry } from 'kitz-schemas';
import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const LEDGER_FILE = join(DATA_DIR, 'payment-ledger.ndjson');
const SUBS_FILE = join(DATA_DIR, 'subscriptions.ndjson');

const DATABASE_URL = process.env.DATABASE_URL || '';

function supabaseHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: process.env.SUPABASE_ANON_KEY || '',
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''}`,
  };
}

// ── Ledger ──

const memLedger: AIBatteryLedgerEntry[] = [];
const MAX_MEM = 10_000;

async function ensureDataDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
}

async function persistLedgerEntry(entry: AIBatteryLedgerEntry): Promise<void> {
  try {
    await ensureDataDir();
    await appendFile(LEDGER_FILE, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (err) { console.warn('[kitz-payments] ledger_entry_persist_failed', (err as Error).message); }
}

async function persistSubscription(record: SubscriptionRecord): Promise<void> {
  try {
    await ensureDataDir();
    await appendFile(SUBS_FILE, JSON.stringify(record) + '\n', 'utf-8');
  } catch (err) { console.warn('[kitz-payments] subscription_persist_failed', (err as Error).message); }
}

export async function restoreLedger(): Promise<number> {
  try {
    if (!existsSync(LEDGER_FILE)) return 0;
    const raw = await readFile(LEDGER_FILE, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    let count = 0;
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as AIBatteryLedgerEntry;
        if (entry.orgId && entry.ts) { memLedger.push(entry); count++; }
      } catch (err) { console.warn('[kitz-payments] ledger_line_parse_failed', (err as Error).message); }
    }
    if (memLedger.length > MAX_MEM) memLedger.splice(0, memLedger.length - MAX_MEM);
    return count;
  } catch (err) { console.warn('[kitz-payments] ledger_restore_failed', (err as Error).message); return 0; }
}

export async function restoreSubscriptions(): Promise<number> {
  try {
    if (!existsSync(SUBS_FILE)) return 0;
    const raw = await readFile(SUBS_FILE, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    let count = 0;
    for (const line of lines) {
      try {
        const record = JSON.parse(line) as SubscriptionRecord;
        if (record.orgId) { memSubscriptions.set(record.orgId, record); count++; }
      } catch (err) { console.warn('[kitz-payments] subscription_line_parse_failed', (err as Error).message); }
    }
    return count;
  } catch (err) { console.warn('[kitz-payments] subscriptions_restore_failed', (err as Error).message); return 0; }
}

export async function insertLedgerEntry(entry: AIBatteryLedgerEntry): Promise<void> {
  memLedger.push(entry);
  persistLedgerEntry(entry).catch((err) => { console.warn('[kitz-payments] ledger_entry_file_persist_failed', (err as Error).message); });
  if (memLedger.length > MAX_MEM) memLedger.splice(0, memLedger.length - MAX_MEM);

  if (!DATABASE_URL) return;

  await fetch(`${DATABASE_URL}/rest/v1/payment_ledger`, {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify({
      org_id: entry.orgId,
      delta_credits: entry.deltaCredits,
      reason: entry.reason,
      trace_id: entry.traceId,
      ts: entry.ts,
    }),
  }).catch((err) => { console.warn('[kitz-payments] ledger_entry_db_write_failed', (err as Error).message); });
}

export function getLedger(): AIBatteryLedgerEntry[] {
  return memLedger;
}

export async function queryLedger(orgId?: string): Promise<AIBatteryLedgerEntry[]> {
  if (DATABASE_URL && orgId) {
    try {
      const res = await fetch(
        `${DATABASE_URL}/rest/v1/payment_ledger?org_id=eq.${orgId}&order=ts.desc&limit=500`,
        { headers: supabaseHeaders() },
      );
      if (res.ok) {
        const rows = (await res.json()) as Array<Record<string, unknown>>;
        return rows.map((r) => ({
          orgId: String(r.org_id),
          deltaCredits: Number(r.delta_credits),
          reason: String(r.reason),
          traceId: String(r.trace_id),
          ts: String(r.ts),
        }));
      }
    } catch (err) { console.warn('[kitz-payments] ledger_query_failed', (err as Error).message); }
  }

  if (orgId) return memLedger.filter((e) => e.orgId === orgId);
  return memLedger;
}

// ── Subscriptions ──

export interface SubscriptionRecord {
  orgId: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'paused' | 'canceled';
  traceId: string;
}

const memSubscriptions = new Map<string, SubscriptionRecord>();

export async function upsertSubscription(record: SubscriptionRecord): Promise<void> {
  memSubscriptions.set(record.orgId, record);
  persistSubscription(record).catch((err) => { console.warn('[kitz-payments] subscription_file_persist_failed', (err as Error).message); });

  if (!DATABASE_URL) return;

  await fetch(`${DATABASE_URL}/rest/v1/subscriptions`, {
    method: 'POST',
    headers: { ...supabaseHeaders(), Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      org_id: record.orgId,
      plan: record.plan,
      status: record.status,
      trace_id: record.traceId,
    }),
  }).catch((err) => { console.warn('[kitz-payments] subscription_db_upsert_failed', (err as Error).message); });
}

export async function getSubscription(orgId: string): Promise<SubscriptionRecord | null> {
  const mem = memSubscriptions.get(orgId);
  if (mem) return mem;

  if (!DATABASE_URL) return null;

  try {
    const res = await fetch(
      `${DATABASE_URL}/rest/v1/subscriptions?org_id=eq.${orgId}&limit=1`,
      { headers: supabaseHeaders() },
    );
    if (res.ok) {
      const rows = (await res.json()) as Array<Record<string, unknown>>;
      if (rows.length > 0) {
        const r = rows[0];
        const record: SubscriptionRecord = {
          orgId: String(r.org_id),
          plan: r.plan as SubscriptionRecord['plan'],
          status: r.status as SubscriptionRecord['status'],
          traceId: String(r.trace_id),
        };
        memSubscriptions.set(record.orgId, record);
        return record;
      }
    }
  } catch (err) { console.warn('[kitz-payments] subscription_fetch_failed', (err as Error).message); }

  return null;
}

export function hasDB(): boolean {
  return Boolean(DATABASE_URL);
}
