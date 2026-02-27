/**
 * Notification queue DB — Supabase persistence with in-memory fallback.
 * Table: notification_jobs
 */

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
