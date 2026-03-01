import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import type { EventEnvelope, StandardError } from 'kitz-schemas';
import { persistJob, updateJobStatus, getJobById, getMetrics } from './db.js';

export const health = { status: 'ok' };

// ── Connector URLs (from docker-compose env) ──
const WA_CONNECTOR_URL = process.env.WA_CONNECTOR_URL || 'http://kitz-whatsapp-connector:3006';
const EMAIL_CONNECTOR_URL = process.env.EMAIL_CONNECTOR_URL || 'http://kitz-email-connector:3007';
const COMMS_API_URL = process.env.COMMS_API_URL || 'http://comms-api:3013';

/** Map channel to its connector endpoint */
function getConnectorUrl(channel: NotificationJob['channel']): string {
  switch (channel) {
    case 'whatsapp': return `${WA_CONNECTOR_URL}/send`;
    case 'email': return `${EMAIL_CONNECTOR_URL}/send`;
    case 'sms': return `${COMMS_API_URL}/text`;
    case 'voice': return `${COMMS_API_URL}/talk`;
  }
}

/** Attempt to deliver a notification via the appropriate connector */
async function deliverNotification(job: NotificationJob): Promise<boolean> {
  const url = getConnectorUrl(job.channel);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-trace-id': job.traceId,
        'x-org-id': job.orgId,
      },
      body: JSON.stringify(job.payload),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch (err) {
    app.log.warn({ channel: job.channel, error: (err as Error).message }, 'Delivery failed');
    return false;
  }
}

interface NotificationJob {
  id: string;
  idempotencyKey: string;
  channel: 'whatsapp' | 'email' | 'sms' | 'voice';
  draftOnly: boolean;
  orgId: string;
  traceId: string;
  payload: Record<string, unknown>;
  attempts: number;
}

const app = Fastify({ logger: true });

// ── Auth hook (validates x-service-secret for inter-service calls) ──
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';

app.addHook('onRequest', async (req, reply) => {
  const path = req.url.split('?')[0];
  if (path === '/health') return;

  if (SERVICE_SECRET) {
    const secret = req.headers['x-service-secret'] as string | undefined;
    const devSecret = req.headers['x-dev-secret'] as string | undefined;
    if (secret !== SERVICE_SECRET && devSecret !== process.env.DEV_TOKEN_SECRET) {
      const traceId = String(req.headers['x-trace-id'] || randomUUID());
      return reply.code(401).send({ code: 'AUTH_REQUIRED', message: 'Missing or invalid service secret', traceId });
    }
  }
});

const queue: NotificationJob[] = [];
const deadLetter: NotificationJob[] = [];
const seenKeys = new Set<string>();

const emitAudit = (event: string, payload: unknown, traceId: string): void => {
  const envelope: EventEnvelope = {
    orgId: 'queue-system',
    userId: 'queue-worker',
    source: 'kitz-notifications-queue',
    event,
    payload,
    traceId,
    ts: new Date().toISOString(),
  };
  app.log.info(envelope, 'audit.event');
};

// ── Enqueue ──
app.post('/enqueue', async (req: any, reply) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const orgId = String(req.headers['x-org-id'] || 'unknown-org');
  const incoming = req.body as Omit<NotificationJob, 'id' | 'attempts' | 'traceId' | 'orgId'>;

  if (seenKeys.has(incoming.idempotencyKey)) {
    return reply.code(202).send({ duplicate: true, traceId });
  }

  const id = `nj_${Date.now()}_${randomUUID().slice(0, 8)}`;
  seenKeys.add(incoming.idempotencyKey);

  const job: NotificationJob = {
    id,
    ...incoming,
    attempts: 0,
    traceId,
    orgId,
    draftOnly: incoming.draftOnly ?? true,
  };

  queue.push(job);

  // Persist to DB (fire-and-forget)
  persistJob({ ...job, status: 'queued' }).catch(() => {});

  emitAudit('notifications.enqueued', incoming, traceId);
  return { queued: true, id, traceId };
});

const processJob = async (job: NotificationJob): Promise<boolean> => {
  if (job.draftOnly) {
    emitAudit('notifications.draft.saved', job.payload, job.traceId);
    return true;
  }
  return deliverNotification(job);
};

// ── Health — verify connectors are reachable ──
app.get('/health', async () => {
  const checks: Record<string, string> = { service: 'ok' };
  try {
    const res = await fetch(`${WA_CONNECTOR_URL.replace('/send', '')}/health`, { signal: AbortSignal.timeout(3000) });
    checks.whatsapp = res.ok ? 'ok' : 'unreachable';
  } catch { checks.whatsapp = 'unreachable'; }
  try {
    const res = await fetch(`${EMAIL_CONNECTOR_URL.replace('/send', '')}/health`, { signal: AbortSignal.timeout(3000) });
    checks.email = res.ok ? 'ok' : 'unreachable';
  } catch { checks.email = 'unreachable'; }
  const allOk = Object.values(checks).every(v => v === 'ok');
  return { status: allOk ? 'ok' : 'degraded', service: 'kitz-notifications-queue', checks, queued: queue.length, deadLetter: deadLetter.length };
});

// ── Get job by ID ──
app.get('/job/:id', async (req: any, reply) => {
  // Check in-memory first
  const inQueue = queue.find((j) => j.id === req.params.id);
  if (inQueue) return { ...inQueue, status: 'queued' };

  const inDL = deadLetter.find((j) => j.id === req.params.id);
  if (inDL) return { ...inDL, status: 'dead_letter' };

  // Check DB
  const dbJob = await getJobById(req.params.id);
  if (dbJob) return dbJob;

  return reply.code(404).send({ error: 'Job not found' });
});

// ── Metrics ──
app.get('/metrics', async () => {
  const dbMetrics = await getMetrics();
  return {
    inMemory: { queued: queue.length, deadLetter: deadLetter.length },
    db: dbMetrics,
  };
});

// ── Process queue on 1-second interval ──
setInterval(async () => {
  const job = queue.shift();
  if (!job) return;

  job.attempts += 1;
  const delivered = await processJob(job);

  if (delivered) {
    updateJobStatus(job.id, 'delivered', job.attempts).catch(() => {});
    emitAudit('notifications.delivered', { channel: job.channel, attempts: job.attempts }, job.traceId);
    return;
  }

  if (job.attempts >= 3) {
    deadLetter.push(job);
    updateJobStatus(job.id, 'dead_letter', job.attempts).catch(() => {});
    emitAudit('notifications.deadletter', job, job.traceId);
    return;
  }

  queue.push(job);
  updateJobStatus(job.id, 'queued', job.attempts).catch(() => {});
  emitAudit('notifications.retry', { idempotencyKey: job.idempotencyKey, attempts: job.attempts }, job.traceId);
}, 1000);

app.get('/queue', async () => ({ queued: queue.length, deadLetter: deadLetter.length }));
app.get('/dead-letter', async () => ({ deadLetter }));

app.listen({ port: Number(process.env.PORT || 3008), host: '0.0.0.0' });
