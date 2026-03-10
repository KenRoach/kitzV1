/**
 * Notification queue DB — Supabase persistence with in-memory fallback.
 * NDJSON file-based persistence for durability across restarts.
 * Table: notification_jobs
 */

import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const QUEUE_FILE = join(DATA_DIR, 'notification-queue.ndjson');

const DATABASE_URL = process.env.DATABASE_URL || '';

interface JobRow {
  id: string;
  idempotency_key: string;
  channel: string;
  draft_only: boolean;
  org_id: string;
  trace_id: string;
  payload: Record<string, unknown>;
  attempts: number;
  status: 'queued' | 'delivered' | 'dead_letter';
  created_at: string;
  updated_at: string;
}

function supabaseHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: process.env.SUPABASE_ANON_KEY || '',
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''}`,
  };
}

export async function persistJob(job: {
  id: string;
  idempotencyKey: string;
  channel: string;
  draftOnly: boolean;
  orgId: string;
  traceId: string;
  payload: Record<string, unknown>;
  attempts: number;
  status: 'queued' | 'delivered' | 'dead_letter';
}): Promise<void> {
  if (!DATABASE_URL) return;

  await fetch(`${DATABASE_URL}/rest/v1/notification_jobs`, {
    method: 'POST',
    headers: { ...supabaseHeaders(), Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      id: job.id,
      idempotency_key: job.idempotencyKey,
      channel: job.channel,
      draft_only: job.draftOnly,
      org_id: job.orgId,
      trace_id: job.traceId,
      payload: job.payload,
      attempts: job.attempts,
      status: job.status,
      updated_at: new Date().toISOString(),
    }),
  });
}

export async function updateJobStatus(
  id: string,
  status: 'queued' | 'delivered' | 'dead_letter',
  attempts: number,
): Promise<void> {
  if (!DATABASE_URL) return;

  await fetch(`${DATABASE_URL}/rest/v1/notification_jobs?id=eq.${id}`, {
    method: 'PATCH',
    headers: supabaseHeaders(),
    body: JSON.stringify({ status, attempts, updated_at: new Date().toISOString() }),
  });
}

export async function getJobById(id: string): Promise<JobRow | null> {
  if (!DATABASE_URL) return null;

  const res = await fetch(
    `${DATABASE_URL}/rest/v1/notification_jobs?id=eq.${id}&select=*&limit=1`,
    { headers: supabaseHeaders() },
  );
  const rows = (await res.json()) as JobRow[];
  return rows[0] ?? null;
}

export async function getMetrics(): Promise<{
  total: number;
  queued: number;
  delivered: number;
  deadLetter: number;
}> {
  if (!DATABASE_URL) return { total: 0, queued: 0, delivered: 0, deadLetter: 0 };

  const [totalRes, queuedRes, deliveredRes, dlRes] = await Promise.all([
    fetch(`${DATABASE_URL}/rest/v1/notification_jobs?select=id&limit=0`, {
      headers: { ...supabaseHeaders(), Prefer: 'count=exact' },
    }),
    fetch(`${DATABASE_URL}/rest/v1/notification_jobs?status=eq.queued&select=id&limit=0`, {
      headers: { ...supabaseHeaders(), Prefer: 'count=exact' },
    }),
    fetch(`${DATABASE_URL}/rest/v1/notification_jobs?status=eq.delivered&select=id&limit=0`, {
      headers: { ...supabaseHeaders(), Prefer: 'count=exact' },
    }),
    fetch(`${DATABASE_URL}/rest/v1/notification_jobs?status=eq.dead_letter&select=id&limit=0`, {
      headers: { ...supabaseHeaders(), Prefer: 'count=exact' },
    }),
  ]);

  const parseCount = (res: Response) => Number(res.headers.get('content-range')?.split('/')[1] || '0');

  return {
    total: parseCount(totalRes),
    queued: parseCount(queuedRes),
    delivered: parseCount(deliveredRes),
    deadLetter: parseCount(dlRes),
  };
}

// ── NDJSON file-based persistence (durability layer) ──

export interface NdjsonJob {
  id: string;
  idempotencyKey: string;
  channel: 'whatsapp' | 'email' | 'sms' | 'voice';
  draftOnly: boolean;
  orgId: string;
  traceId: string;
  payload: Record<string, unknown>;
  attempts: number;
  status: 'queued' | 'delivered' | 'dead_letter';
}

async function ensureDataDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
}

/** Append a job to the NDJSON ledger (fire-and-forget). */
export async function persistJobNdjson(job: NdjsonJob): Promise<void> {
  try {
    await ensureDataDir();
    await appendFile(QUEUE_FILE, JSON.stringify(job) + '\n', 'utf-8');
  } catch (err) { console.warn('[kitz-notifications-queue] ndjson_persist_failed', (err as Error).message); }
}

/** Update a job's status in the NDJSON ledger by appending a newer entry (latest wins). */
export async function updateJobNdjson(id: string, status: NdjsonJob['status'], attempts: number): Promise<void> {
  try {
    await ensureDataDir();
    await appendFile(QUEUE_FILE, JSON.stringify({ id, status, attempts, _update: true }) + '\n', 'utf-8');
  } catch (err) { console.warn('[kitz-notifications-queue] ndjson_update_failed', (err as Error).message); }
}

/**
 * Restore queue state from NDJSON on startup.
 * Replays the append-only log: full job entries create, _update entries patch status.
 * Returns { queue, deadLetter, seenKeys } for the caller to merge into in-memory state.
 */
export async function restoreQueueFromNdjson(): Promise<{
  queue: NdjsonJob[];
  deadLetter: NdjsonJob[];
  seenKeys: Set<string>;
}> {
  const jobMap = new Map<string, NdjsonJob>();
  const seenKeys = new Set<string>();

  try {
    if (!existsSync(QUEUE_FILE)) return { queue: [], deadLetter: [], seenKeys };
    const raw = await readFile(QUEUE_FILE, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as NdjsonJob & { _update?: boolean };
        if (entry._update && entry.id) {
          // Status update — patch existing entry
          const existing = jobMap.get(entry.id);
          if (existing) {
            existing.status = entry.status;
            existing.attempts = entry.attempts;
          }
        } else if (entry.id && entry.channel) {
          // Full job entry
          jobMap.set(entry.id, {
            id: entry.id,
            idempotencyKey: entry.idempotencyKey,
            channel: entry.channel,
            draftOnly: entry.draftOnly,
            orgId: entry.orgId,
            traceId: entry.traceId,
            payload: entry.payload,
            attempts: entry.attempts,
            status: entry.status,
          });
          if (entry.idempotencyKey) seenKeys.add(entry.idempotencyKey);
        }
      } catch { /* skip malformed lines */ }
    }
  } catch (err) {
    console.warn('[kitz-notifications-queue] ndjson_restore_failed', (err as Error).message);
    return { queue: [], deadLetter: [], seenKeys };
  }

  const queue: NdjsonJob[] = [];
  const deadLetter: NdjsonJob[] = [];

  for (const job of jobMap.values()) {
    if (job.status === 'queued') queue.push(job);
    else if (job.status === 'dead_letter') deadLetter.push(job);
    // delivered jobs are not reloaded — they're done
  }

  return { queue, deadLetter, seenKeys };
}
