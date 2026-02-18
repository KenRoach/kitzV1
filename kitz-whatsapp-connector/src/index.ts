import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import type { EventEnvelope } from 'kitz-schemas';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });

const templates = new Map<string, string>();
const consent = new Map<string, boolean>();

const audit = (event: string, payload: unknown, traceId: string): EventEnvelope => ({
  orgId: 'connector-system',
  userId: 'whatsapp-bot',
  source: 'kitz-whatsapp-connector',
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
  app.log.info(audit('whatsapp.inbound', req.body, traceId));
  return { ok: true, traceId };
});

app.post('/outbound/send', async (req: any, reply) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const draftOnly = Boolean(req.body?.draftOnly ?? true);
  if (!draftOnly) {
    return reply.code(412).send({ ok: false, message: 'Draft-first policy enabled; approval required', traceId });
  }
  app.log.info(audit('whatsapp.outbound.draft', req.body, traceId));
  return { queued: true, provider: 'stub', draftOnly, traceId };
});

app.post('/templates/:name', async (req: any) => {
  templates.set(req.params.name, req.body?.content || '');
  return { ok: true, count: templates.size };
});

app.post('/consent/:contact', async (req: any) => {
  consent.set(req.params.contact, Boolean(req.body?.granted));
  return { ok: true, contact: req.params.contact };
});

app.listen({ port: Number(process.env.PORT || 3006), host: '0.0.0.0' });
