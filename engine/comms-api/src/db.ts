/**
 * Comms API DB — Supabase persistence with in-memory fallback.
 * Table: comms_log
 */

import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const COMMS_FILE = join(DATA_DIR, 'comms-log.ndjson');

const DATABASE_URL = process.env.DATABASE_URL || '';

export interface CommsRecord {
  id: string;
  channel: 'voice' | 'sms' | 'email' | 'whatsapp';
  to: string;
  message: string;
  subject?: string;
  status: 'draft' | 'approved' | 'sent' | 'failed';
  provider: string;
  providerSid?: string;
  orgId: string;
  traceId: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory fallback
const memComms = new Map<string, CommsRecord>();

async function ensureDataDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
}

async function persistComms(record: CommsRecord): Promise<void> {
  try {
    await ensureDataDir();
    await appendFile(COMMS_FILE, JSON.stringify(record) + '\n', 'utf-8');
  } catch { /* non-blocking */ }
}

export async function restoreComms(): Promise<number> {
  try {
    if (!existsSync(COMMS_FILE)) return 0;
    const raw = await readFile(COMMS_FILE, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    let count = 0;
    for (const line of lines) {
      try {
        const record = JSON.parse(line) as CommsRecord;
        if (record.id) { memComms.set(record.id, record); count++; }
      } catch { /* skip malformed */ }
    }
    return count;
  } catch { return 0; }
}

function supabaseHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: process.env.SUPABASE_ANON_KEY || '',
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''}`,
  };
}

export async function saveComms(record: CommsRecord): Promise<void> {
  memComms.set(record.id, record);
  persistComms(record).catch(() => {});

  if (!DATABASE_URL) return;

  await fetch(`${DATABASE_URL}/rest/v1/comms_log`, {
    method: 'POST',
    headers: { ...supabaseHeaders(), Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      id: record.id,
      channel: record.channel,
      to_addr: record.to,
      message: record.message,
      subject: record.subject,
      status: record.status,
      provider: record.provider,
      provider_sid: record.providerSid,
      org_id: record.orgId,
      trace_id: record.traceId,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    }),
  }).catch(() => {});
}

export async function updateCommsStatus(id: string, status: CommsRecord['status'], providerSid?: string): Promise<CommsRecord | null> {
  const mem = memComms.get(id);
  if (mem) {
    mem.status = status;
    mem.updatedAt = new Date().toISOString();
    if (providerSid) mem.providerSid = providerSid;
  }

  if (mem) persistComms(mem).catch(() => {});

  if (DATABASE_URL) {
    await fetch(`${DATABASE_URL}/rest/v1/comms_log?id=eq.${id}`, {
      method: 'PATCH',
      headers: supabaseHeaders(),
      body: JSON.stringify({
        status,
        provider_sid: providerSid,
        updated_at: new Date().toISOString(),
      }),
    }).catch(() => {});
  }

  return mem ?? null;
}

export async function getCommsById(id: string): Promise<CommsRecord | null> {
  const mem = memComms.get(id);
  if (mem) return mem;

  if (!DATABASE_URL) return null;

  const res = await fetch(
    `${DATABASE_URL}/rest/v1/comms_log?id=eq.${id}&select=*&limit=1`,
    { headers: supabaseHeaders() },
  );
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  if (!rows[0]) return null;

  const r = rows[0];
  return {
    id: String(r.id),
    channel: r.channel as CommsRecord['channel'],
    to: String(r.to_addr),
    message: String(r.message),
    subject: r.subject ? String(r.subject) : undefined,
    status: r.status as CommsRecord['status'],
    provider: String(r.provider),
    providerSid: r.provider_sid ? String(r.provider_sid) : undefined,
    orgId: String(r.org_id),
    traceId: String(r.trace_id),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}
