import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import type { EventEnvelope } from 'kitz-schemas';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });

const templates = new Map<string, string>();
const consent = new Map<string, boolean>();
const suppression = new Set<string>();

const audit = (event: string, payload: unknown, traceId: string): EventEnvelope => ({
  orgId: 'connector-system',
  userId: 'email-bot',
  source: 'kitz-email-connector',
  event,
  payload,
  traceId,
  ts: new Date().toISOString()
});

app.post('/webhooks/inbound', async (req: any, reply) => {
  if (!req.headers['x-provider-signature']) {
    return reply.code(400).send({ ok: false, message: 'Missing signature (placeholder validator)' });
  }
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  app.log.info(audit('email.inbound', req.body, traceId));
  return { ok: true, traceId };
});

app.post('/outbound/send', async (req: any, reply) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const recipient = String(req.body?.to || '');

  if (suppression.has(recipient)) {
    return reply.code(409).send({ ok: false, message: 'Recipient is in suppression list', traceId });
  }

  const draftOnly = Boolean(req.body?.draftOnly ?? true);
  if (!draftOnly) {
    return reply.code(412).send({ ok: false, message: 'Draft-first policy enabled; approval required', traceId });
  }

  app.log.info(audit('email.outbound.draft', req.body, traceId));
  return { queued: true, provider: 'stub', draftOnly, traceId };
});

app.post('/templates/:name', async (req: any) => {
  templates.set(req.params.name, req.body?.content || '');
  return { ok: true, count: templates.size };
});

app.post('/consent/:contact', async (req: any) => {
  consent.set(req.params.contact, Boolean(req.body?.granted));
  return { ok: true };
});

app.post('/unsubscribe/:email', async (req: any) => {
  suppression.add(req.params.email);
  return { ok: true, suppressed: req.params.email };
});

app.get('/suppression', async () => ({ entries: Array.from(suppression) }));

app.listen({ port: Number(process.env.PORT || 3007), host: '0.0.0.0' });
