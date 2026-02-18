
import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { randomUUID } from 'node:crypto';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

app.addHook('onRequest', async (req) => {
  const traceId = (req.headers['x-trace-id'] as string) || randomUUID();
  req.headers['x-trace-id'] = traceId;
});

app.addHook('preHandler', async (req, reply) => {
  if (!req.headers.authorization) {
    return reply.code(401).send({ code: 'AUTH_REQUIRED', message: 'JWT verification placeholder', traceId: req.headers['x-trace-id'] });
  }
});

app.addHook('preHandler', async (req, reply) => {
  if (!req.headers['x-org-id']) {
    return reply.code(400).send({ code: 'ORG_REQUIRED', message: 'x-org-id header required', traceId: req.headers['x-trace-id'] });
  }
});

const audit = (action: string, payload: unknown, traceId: string) => app.log.info({ action, payload, traceId }, 'audit');

app.post('/events', async (req) => ({ accepted: true, traceId: req.headers['x-trace-id'] }));
app.post('/tool-calls', async (req) => ({ routed: true, traceId: req.headers['x-trace-id'] }));
app.get('/ai-battery/balance', async (req) => ({ orgId: req.headers['x-org-id'], credits: 100, traceId: req.headers['x-trace-id'] }));
app.post('/approvals/request', async (req) => {
  audit('approvals.request', req.body, String(req.headers['x-trace-id']));
  return { approvalId: randomUUID(), status: 'pending', traceId: req.headers['x-trace-id'] };
});
app.post('/payments/checkout-session', async (req) => ({ sessionId: randomUUID(), traceId: req.headers['x-trace-id'], body: req.body }));
app.post('/notifications/enqueue', async (req) => ({ queued: true, traceId: req.headers['x-trace-id'], body: req.body }));
app.all('/proxy/:target/*', async (req) => {
  const target = (req.params as { target: string }).target;
  audit('proxy.' + target, req.body, String(req.headers['x-trace-id']));
  return { proxied: true, target, traceId: req.headers['x-trace-id'] };
});

const port = Number(process.env.PORT || 4000);
app.listen({ port, host: '0.0.0.0' });
