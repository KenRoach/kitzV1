import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });
const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:4000';

const page = (title: string, body: string) => `<!doctype html><html><body><h1>${title}</h1>${body}</body></html>`;

type RouteStats = { count: number; errors: number; latencies: number[] };
const routeStats = new Map<string, RouteStats>();
const featureUsage = new Map<string, number>();
const funnel = {
  visitor: 0,
  signup: 0,
  firstAction: 0,
  confusingStepDropoff: 0
};
let authFailures = 0;

const trackUsage = (name: string): void => {
  featureUsage.set(name, (featureUsage.get(name) || 0) + 1);
};

app.addHook('onRequest', async (req) => {
  (req as any).__startMs = Date.now();
  if (req.headers.authorization === 'invalid') authFailures += 1;
  funnel.visitor += 1;
});

app.addHook('onResponse', async (req, reply) => {
  const key = req.routeOptions.url || req.url;
  const existing = routeStats.get(key) || { count: 0, errors: 0, latencies: [] };
  const latency = Date.now() - Number((req as any).__startMs || Date.now());
  existing.count += 1;
  existing.latencies.push(latency);
  if (reply.statusCode >= 400) existing.errors += 1;
  if (existing.latencies.length > 200) existing.latencies = existing.latencies.slice(-200);
  routeStats.set(key, existing);
});

app.get('/leads', async () => {
  trackUsage('leads.view');
  return page('Leads', '<p>Manual mode is always available. AI suggestions consume AI Battery credits.</p>');
});

app.get('/orders', async () => {
  trackUsage('orders.view');
  return page('Orders', '<p>Track open orders and update statuses with approval controls.</p>');
});

app.get('/tasks', async () => {
  trackUsage('tasks.view');
  return page('Tasks', '<p>Create, assign, and close sales/ops tasks.</p>');
});

app.get('/ai-direction', async () => {
  trackUsage('ai-direction.view');
  return page('AI Direction', '<button disabled>Run AI Plan (disabled when AI Battery is 0)</button>');
});

app.get('/checkout-links', async () => {
  trackUsage('checkout-links.view');
  return page('Checkout Links', '<form method="post" action="/checkout-links/create"><input name="orderId" placeholder="order id"/><input name="amount" placeholder="amount"/><button>Create mobile link</button></form><p>After creation: copy/share via WhatsApp or Email (draft-only via queue).</p>');
});

app.post('/api/funnel/signup', async () => {
  funnel.signup += 1;
  return { ok: true };
});

app.post('/api/funnel/first-action', async () => {
  funnel.firstAction += 1;
  return { ok: true };
});

app.post('/api/funnel/confusing-step', async () => {
  funnel.confusingStepDropoff += 1;
  return { ok: true };
});

app.get('/api/ai-battery', async () => {
  trackUsage('ai-battery.check');
  const traceId = randomUUID();
  const response = await fetch(`${gatewayUrl}/ai-battery/balance`, {
    headers: {
      authorization: 'Bearer xyz-user-token',
      'x-org-id': 'demo-org',
      'x-trace-id': traceId,
      'x-scopes': 'battery:read'
    }
  });

  return response.json();
});

app.post('/checkout-links/create', async (req: any) => {
  trackUsage('checkout-links.create');
  funnel.firstAction += 1;
  const traceId = randomUUID();
  const payload = {
    orderId: req.body?.orderId || 'manual-order',
    amount: Number(req.body?.amount || 0),
    currency: 'USD'
  };

  const sessionResponse = await fetch(`${gatewayUrl}/payments/checkout-session`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer xyz-user-token',
      'x-org-id': 'demo-org',
      'x-trace-id': traceId,
      'x-scopes': 'payments:write'
    },
    body: JSON.stringify(payload)
  });

  const session = await sessionResponse.json();
  return {
    ...session,
    actions: ['copy-link', 'share-whatsapp-draft', 'share-email-draft']
  };
});

app.get('/api/ops/metrics', async () => {
  const routeMetrics = Array.from(routeStats.entries()).map(([route, stats]) => {
    const sorted = [...stats.latencies].sort((a, b) => a - b);
    const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95) - 1] || sorted[sorted.length - 1] : 0;
    return {
      route,
      requests: stats.count,
      errorRate: stats.count ? Number((stats.errors / stats.count).toFixed(4)) : 0,
      p95LatencyMs: p95
    };
  });

  const topFeatures = Array.from(featureUsage.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([feature, count]) => ({ feature, count }));

  return {
    generatedAt: new Date().toISOString(),
    p95LatencyByRoute: routeMetrics,
    errorRateByRoute: routeMetrics.map(({ route, errorRate }) => ({ route, errorRate })),
    authFailures,
    conversion: {
      visitorToSignup: funnel.visitor ? Number((funnel.signup / funnel.visitor).toFixed(4)) : 0,
      signupToFirstAction: funnel.signup ? Number((funnel.firstAction / funnel.signup).toFixed(4)) : 0,
      visitorToFirstAction: funnel.visitor ? Number((funnel.firstAction / funnel.visitor).toFixed(4)) : 0
    },
    featureUsageTop10: topFeatures,
    confusingStepDropoff: funnel.confusingStepDropoff,
    manualModeAlwaysAvailable: true,
    aiModeGatedByCredits: true
  };
});

app.get('/health', async () => health);

if (process.env.NODE_ENV !== 'test') {
  app.listen({ port: Number(process.env.PORT || 3001), host: '0.0.0.0' });
}

export default app;
