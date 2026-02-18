import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import type { AIBatteryLedgerEntry, CheckoutSession, PaymentWebhookEvent } from 'kitz-schemas';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });

interface SubscriptionRecord {
  orgId: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'paused' | 'canceled';
  traceId: string;
}

const ledger: AIBatteryLedgerEntry[] = [];
const subscriptions = new Map<string, SubscriptionRecord>();

app.post('/checkout-session', async (req: any) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const orgId = String(req.headers['x-org-id'] || 'unknown-org');
  const payload = req.body as Partial<CheckoutSession>;
  const sessionId = randomUUID();

  const session: CheckoutSession = {
    orgId,
    orderId: payload.orderId || 'manual-order',
    amount: payload.amount || 0,
    currency: payload.currency || 'USD',
    mobileCheckoutLink: `https://pay.kitz.local/${sessionId}`,
    traceId
  };

  ledger.push({ orgId, deltaCredits: 0, reason: `checkout_created:${sessionId}`, traceId, ts: new Date().toISOString() });
  return { sessionId, session };
});

app.post('/webhooks/provider', async (req: any, reply) => {
  const signature = req.headers['x-provider-signature'];
  if (!signature) {
    return reply.code(400).send({ ok: false, message: 'Missing signature (placeholder validator)' });
  }

  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const event = req.body as PaymentWebhookEvent;
  ledger.push({ orgId: event.orgId, deltaCredits: 0, reason: `webhook:${event.eventType}`, traceId, ts: new Date().toISOString() });
  return { ok: true, traceId };
});

app.post('/subscriptions', async (req: any) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const orgId = String(req.headers['x-org-id'] || 'unknown-org');
  const plan = (req.body?.plan || 'starter') as SubscriptionRecord['plan'];
  const record: SubscriptionRecord = { orgId, plan, status: 'active', traceId };
  subscriptions.set(orgId, record);
  return record;
});

app.get('/subscriptions/:orgId', async (req: any) => subscriptions.get(req.params.orgId) || null);
app.get('/ledger', async () => ({ entries: ledger }));

app.listen({ port: Number(process.env.PORT || 3005), host: '0.0.0.0' });
