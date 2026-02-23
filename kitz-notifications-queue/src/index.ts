import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import type { EventEnvelope } from 'kitz-schemas';

export const health = { status: 'ok' };

// ── Connector URLs (from docker-compose env) ──
const WA_CONNECTOR_URL = process.env.WA_CONNECTOR_URL || 'http://kitz-whatsapp-connector:3006';
const EMAIL_CONNECTOR_URL = process.env.EMAIL_CONNECTOR_URL || 'http://kitz-email-connector:3007';

/** Attempt to deliver a notification via the appropriate connector */
async function deliverNotification(job: NotificationJob): Promise<boolean> {
  const url = job.channel === 'whatsapp'
    ? `${WA_CONNECTOR_URL}/send`
    : `${EMAIL_CONNECTOR_URL}/send`;

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
    console.warn(`[queue] Delivery failed (${job.channel}):`, (err as Error).message);
    return false;
  }
}

interface NotificationJob {
  idempotencyKey: string;
  channel: 'whatsapp' | 'email';
  draftOnly: boolean;
  orgId: string;
  traceId: string;
  payload: Record<string, unknown>;
  attempts: number;
}

const app = Fastify({ logger: true });
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
    ts: new Date().toISOString()
  };
  app.log.info(envelope, 'audit.event');
};

app.post('/enqueue', async (req: any, reply) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const orgId = String(req.headers['x-org-id'] || 'unknown-org');
  const incoming = req.body as Omit<NotificationJob, 'attempts' | 'traceId' | 'orgId'>;

  if (seenKeys.has(incoming.idempotencyKey)) {
    return reply.code(202).send({ duplicate: true, traceId });
  }

  seenKeys.add(incoming.idempotencyKey);
  queue.push({ ...incoming, attempts: 0, traceId, orgId, draftOnly: incoming.draftOnly ?? true });
  emitAudit('notifications.enqueued', incoming, traceId);
  return { queued: true, traceId };
});

const processJob = async (job: NotificationJob): Promise<boolean> => {
  if (job.draftOnly) {
    emitAudit('notifications.draft.saved', job.payload, job.traceId);
    return true;
  }
  // Actually deliver via the appropriate connector
  return deliverNotification(job);
};

// Health check
app.get('/health', async () => ({ status: 'ok', service: 'kitz-notifications-queue', queued: queue.length, deadLetter: deadLetter.length }));

// Process queue on 1-second interval
setInterval(async () => {
  const job = queue.shift();
  if (!job) return;

  job.attempts += 1;
  const delivered = await processJob(job);

  if (delivered) {
    emitAudit('notifications.delivered', { channel: job.channel, attempts: job.attempts }, job.traceId);
    return;
  }

  if (job.attempts >= 3) {
    deadLetter.push(job);
    emitAudit('notifications.deadletter', job, job.traceId);
    return;
  }

  queue.push(job);
  emitAudit('notifications.retry', { idempotencyKey: job.idempotencyKey, attempts: job.attempts }, job.traceId);
}, 1000);

app.get('/queue', async () => ({ queued: queue.length, deadLetter: deadLetter.length }));
app.get('/dead-letter', async () => ({ deadLetter }));

app.listen({ port: Number(process.env.PORT || 3008), host: '0.0.0.0' });
