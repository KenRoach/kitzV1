/**
 * kitz-payments DB — Supabase persistence with in-memory fallback.
 * Tables: payment_ledger, subscriptions
 */

import type { AIBatteryLedgerEntry } from 'kitz-schemas';

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

export async function insertLedgerEntry(entry: AIBatteryLedgerEntry): Promise<void> {
  memLedger.push(entry);
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
  }).catch(() => {});
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
    } catch { /* fall through to mem */ }
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
  }).catch(() => {});
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
  } catch { /* fall through */ }

  return null;
}

export function hasDB(): boolean {
  return Boolean(DATABASE_URL);
}
