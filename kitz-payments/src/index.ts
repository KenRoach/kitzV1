import Fastify from 'fastify';
import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import type { CheckoutSession, PaymentWebhookEvent, StandardError } from 'kitz-schemas';
import { insertLedgerEntry, getLedger, queryLedger, upsertSubscription, getSubscription, hasDB, type SubscriptionRecord } from './db.js';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });

// Security headers
app.addHook('onSend', async (_req, reply) => {
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-XSS-Protection', '1; mode=block');
});

// ── Webhook secrets (env vars from docker-compose) ──
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const YAPPY_WEBHOOK_SECRET = process.env.YAPPY_WEBHOOK_SECRET || '';
const BAC_WEBHOOK_SECRET = process.env.BAC_WEBHOOK_SECRET || '';

// ── Cryptographic webhook verification ──
function verifyHmac(rawBody: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const sig = signature.replace(/^sha256=/, '');
  const computed = createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(computed);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

function verifyStripe(rawBody: string, header: string, secret: string): { valid: boolean; error?: string } {
  if (!header || !secret) return { valid: false, error: 'Missing signature or secret' };
  const parts: Record<string, string> = {};
  for (const item of header.split(',')) {
    const [key, ...v] = item.split('=');
    if (key && v.length) parts[key] = v.join('=');
  }
  const ts = parts['t'];
  const sig = parts['v1'];
  if (!ts || !sig) return { valid: false, error: 'Invalid stripe-signature format' };
  // Replay tolerance: 5 minutes
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(ts)) > 300) {
    return { valid: false, error: 'Timestamp outside tolerance' };
  }
  const computed = createHmac('sha256', secret).update(`${ts}.${rawBody}`).digest('hex');
  const a = Buffer.from(computed);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { valid: false, error: 'Signature mismatch' };
  return { valid: true };
}

function getWebhookSecret(provider: string): string {
  switch (provider) {
    case 'stripe': return STRIPE_WEBHOOK_SECRET;
    case 'yappy': return YAPPY_WEBHOOK_SECRET;
    case 'bac': return BAC_WEBHOOK_SECRET;
    default: return '';
  }
}

// ── Auth hook (validates x-service-secret; skips health + webhooks) ──
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';

app.addHook('onRequest', async (req, reply) => {
  const path = req.url.split('?')[0];
  if (path === '/health' || path.startsWith('/webhooks/')) return;

  if (SERVICE_SECRET) {
    const secret = req.headers['x-service-secret'] as string | undefined;
    const devSecret = req.headers['x-dev-secret'] as string | undefined;
    if (secret !== SERVICE_SECRET && devSecret !== process.env.DEV_TOKEN_SECRET) {
      const traceId = String(req.headers['x-trace-id'] || randomUUID());
      return reply.code(401).send({ code: 'AUTH_REQUIRED', message: 'Missing or invalid service secret', traceId });
    }
  }
});

const allowedReceiveProviders = new Set(['stripe', 'paypal', 'yappy', 'bac']);

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

  await insertLedgerEntry({ orgId, deltaCredits: 0, reason: `incoming_payment_session:${provider}:${sessionId}`, traceId, ts: new Date().toISOString() });
  return { sessionId, provider, session };
});

// Health check — verify webhook secrets are configured
app.get('/health', async () => {
  const checks: Record<string, string> = { service: 'ok' };
  checks.stripe = STRIPE_WEBHOOK_SECRET ? 'configured' : 'missing';
  checks.yappy = YAPPY_WEBHOOK_SECRET ? 'configured' : 'missing';
  checks.bac = BAC_WEBHOOK_SECRET ? 'configured' : 'missing';
  checks.database = hasDB() ? 'configured' : 'in-memory';
  checks.ledgerEntries = String(getLedger().length);
  const allOk = checks.stripe !== 'missing';
  return { status: allOk ? 'ok' : 'degraded', service: 'kitz-payments', checks };
});

// ── Helper: log webhook + record ledger entry ──
async function recordWebhook(provider: string, eventType: string, orgId: string, traceId: string): Promise<void> {
  await insertLedgerEntry({ orgId, deltaCredits: 0, reason: `incoming_webhook:${provider}:${eventType}`, traceId, ts: new Date().toISOString() });
}

// ── Stripe Webhook ──
app.post('/webhooks/stripe', async (req: any, reply) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  if (STRIPE_WEBHOOK_SECRET) {
    const stripeHeader = String(req.headers['stripe-signature'] || '');
    const result = verifyStripe(rawBody, stripeHeader, STRIPE_WEBHOOK_SECRET);
    if (!result.valid) {
      app.log.warn({ traceId, provider: 'stripe', error: result.error }, 'webhook.signature.failed');
      return reply.code(401).send({ ok: false, message: `Stripe signature invalid: ${result.error}`, traceId });
    }
  } else {
    app.log.warn({ traceId, provider: 'stripe' }, 'webhook.no_secret_configured');
  }

  const event = req.body as PaymentWebhookEvent;
  await recordWebhook('stripe', event.eventType || 'unknown', event.orgId || 'unknown', traceId);
  app.log.info({ traceId, provider: 'stripe' }, 'webhook.processed');
  return { ok: true, provider: 'stripe', traceId };
});

// ── PayPal Webhook ──
app.post('/webhooks/paypal', async (req: any, reply) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());

  // PayPal uses certificate-based signing — verify required headers
  const txId = req.headers['paypal-transmission-id'];
  const txTime = req.headers['paypal-transmission-time'];
  const txSig = req.headers['paypal-transmission-sig'];
  const certUrl = req.headers['paypal-cert-url'];

  if (!txId || !txTime) {
    return reply.code(401).send({ ok: false, message: 'Missing PayPal transmission headers', traceId });
  }

  // Validate cert URL is from PayPal (prevent SSRF)
  if (certUrl) {
    try {
      const url = new URL(String(certUrl));
      if (!url.hostname.endsWith('.paypal.com') && !url.hostname.endsWith('.symantec.com')) {
        return reply.code(401).send({ ok: false, message: 'Certificate URL not from PayPal domain', traceId });
      }
    } catch {
      return reply.code(401).send({ ok: false, message: 'Invalid certificate URL', traceId });
    }
  }

  // Timestamp tolerance: 10 minutes
  const ts = new Date(String(txTime)).getTime();
  if (!isNaN(ts) && Math.abs(Date.now() - ts) > 600_000) {
    return reply.code(401).send({ ok: false, message: 'PayPal timestamp outside tolerance', traceId });
  }

  const event = req.body as PaymentWebhookEvent;
  await recordWebhook('paypal', event.eventType || 'unknown', event.orgId || 'unknown', traceId);
  app.log.info({ traceId, provider: 'paypal', transmissionId: txId }, 'webhook.processed');
  return { ok: true, provider: 'paypal', traceId };
});

// ── Yappy Webhook (Panama) ──
app.post('/webhooks/yappy', async (req: any, reply) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  if (YAPPY_WEBHOOK_SECRET) {
    const sig = String(req.headers['x-yappy-signature'] || '');
    if (!verifyHmac(rawBody, sig, YAPPY_WEBHOOK_SECRET)) {
      app.log.warn({ traceId, provider: 'yappy' }, 'webhook.signature.failed');
      return reply.code(401).send({ ok: false, message: 'Yappy signature invalid', traceId });
    }
  } else {
    app.log.warn({ traceId, provider: 'yappy' }, 'webhook.no_secret_configured');
  }

  const event = req.body as PaymentWebhookEvent;
  await recordWebhook('yappy', event.eventType || 'unknown', event.orgId || 'unknown', traceId);
  app.log.info({ traceId, provider: 'yappy' }, 'webhook.processed');
  return { ok: true, provider: 'yappy', traceId };
});

// ── BAC Compra Click Webhook (Central America) ──
app.post('/webhooks/bac', async (req: any, reply) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  if (BAC_WEBHOOK_SECRET) {
    const sig = String(req.headers['x-bac-signature'] || '');
    if (!verifyHmac(rawBody, sig, BAC_WEBHOOK_SECRET)) {
      app.log.warn({ traceId, provider: 'bac' }, 'webhook.signature.failed');
      return reply.code(401).send({ ok: false, message: 'BAC signature invalid', traceId });
    }
  } else {
    app.log.warn({ traceId, provider: 'bac' }, 'webhook.no_secret_configured');
  }

  const event = req.body as PaymentWebhookEvent;
  await recordWebhook('bac', event.eventType || 'unknown', event.orgId || 'unknown', traceId);
  app.log.info({ traceId, provider: 'bac' }, 'webhook.processed');
  return { ok: true, provider: 'bac', traceId };
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
  await upsertSubscription(record);
  return record;
});

app.get('/subscriptions/:orgId', async (req: any) => (await getSubscription(req.params.orgId)) || null);
app.get('/ledger', async (req: any) => {
  const orgId = req.query?.orgId as string | undefined;
  const entries = orgId ? await queryLedger(orgId) : getLedger();
  return { entries, policy: 'receive_only', providers: Array.from(allowedReceiveProviders) };
});

app.listen({ port: Number(process.env.PORT || 3005), host: '0.0.0.0' });
