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
const allowedReceiveProviders = new Set(['stripe', 'paypal']);

app.post('/checkout-session', async (req: any, reply) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const orgId = String(req.headers['x-org-id'] || 'unknown-org');
  const payload = req.body as Partial<CheckoutSession> & { provider?: string; direction?: 'incoming' | 'outgoing' };

  const amount = Number(payload.amount || 0);
  if (amount <= 0) {
    return reply.code(400).send({ code: 'INVALID_AMOUNT', message: 'Only positive incoming amounts are allowed.', traceId });
  }

  const provider = payload.provider || 'stripe';
  if (!allowedReceiveProviders.has(provider)) {
    return reply.code(400).send({ code: 'PROVIDER_NOT_ALLOWED', message: 'Only Stripe/PayPal receive flows are allowed.', traceId });
  }

  if (payload.direction === 'outgoing') {
    return reply.code(403).send({ code: 'SPEND_BLOCKED', message: 'Spending is blocked. Agents may only receive money.', traceId });
  }

  const sessionId = randomUUID();
  const session: CheckoutSession = {
    orgId,
    orderId: payload.orderId || 'manual-order',
    amount,
    currency: payload.currency || 'USD',
    mobileCheckoutLink: `https://pay.kitz.local/${sessionId}`,
    traceId
  };

  ledger.push({ orgId, deltaCredits: 0, reason: `incoming_payment_session:${provider}:${sessionId}`, traceId, ts: new Date().toISOString() });
  return { sessionId, provider, session };
});

app.post('/webhooks/provider', async (req: any, reply) => {
  const signature = req.headers['x-provider-signature'];
  if (!signature) {
    return reply.code(400).send({ ok: false, message: 'Missing signature (placeholder validator)' });
  }

  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const event = req.body as PaymentWebhookEvent;

  if (!allowedReceiveProviders.has(event.provider)) {
    return reply.code(400).send({ ok: false, message: 'Unsupported provider for receive-only mode', traceId });
  }

  ledger.push({ orgId: event.orgId, deltaCredits: 0, reason: `incoming_webhook:${event.provider}:${event.eventType}`, traceId, ts: new Date().toISOString() });
  return { ok: true, traceId };
});

app.post('/spend', async (req: any, reply) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  return reply.code(403).send({ code: 'SPEND_BLOCKED', message: 'Spend operations are blocked by policy. Only incoming payments are allowed.', traceId, requested: req.body });
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
app.get('/ledger', async () => ({ entries: ledger, policy: 'receive_only', providers: Array.from(allowedReceiveProviders) }));

app.listen({ port: Number(process.env.PORT || 3005), host: '0.0.0.0' });
