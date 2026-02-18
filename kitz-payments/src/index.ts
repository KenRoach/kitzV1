
import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';

export const health = { status: 'ok' };
const app = Fastify();
const ledger: Array<{ orgId: string; deltaCredits: number; reason: string; traceId: string; ts: string }> = [];

app.post('/checkout-session', async (req: any) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const orgId = String(req.headers['x-org-id'] || 'unknown-org');
  const sessionId = randomUUID();
  ledger.push({ orgId, deltaCredits: 0, reason: 'checkout:' + sessionId, traceId, ts: new Date().toISOString() });
  return { sessionId, mobileCheckoutLink: 'https://pay.kitz.local/' + sessionId, traceId };
});

app.post('/webhooks/provider', async (req: any, reply) => {
  if (!req.headers['x-provider-signature']) return reply.code(400).send({ ok: false, message: 'signature placeholder missing' });
  return { ok: true, event: req.body };
});

app.get('/ledger', async () => ({ entries: ledger }));
app.listen({ port: Number(process.env.PORT || 3005), host: '0.0.0.0' });
