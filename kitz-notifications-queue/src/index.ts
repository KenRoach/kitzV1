import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import type { EventEnvelope } from 'kitz-schemas';

export const health = { status: 'ok' };

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

const processJob = (job: NotificationJob): boolean => {
  if (job.draftOnly) {
    emitAudit('notifications.draft.saved', job.payload, job.traceId);
    return true;
  }
  return job.attempts > 1;
};

setInterval(() => {
  const job = queue.shift();
  if (!job) return;

  job.attempts += 1;
  const delivered = processJob(job);

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
