import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });
const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:4000';

const page = (title: string, body: string) => `<!doctype html><html><body><h1>${title}</h1>${body}</body></html>`;

app.get('/leads', async () => page('Leads', '<p>Manual mode is always available. AI suggestions consume AI Battery credits.</p>'));
app.get('/orders', async () => page('Orders', '<p>Track open orders and update statuses with approval controls.</p>'));
app.get('/tasks', async () => page('Tasks', '<p>Create, assign, and close sales/ops tasks.</p>'));
app.get('/ai-direction', async () => page('AI Direction', '<button disabled>Run AI Plan (disabled when AI Battery is 0)</button>'));
app.get('/checkout-links', async () => page('Checkout Links', '<form method="post" action="/checkout-links/create"><input name="orderId" placeholder="order id"/><input name="amount" placeholder="amount"/><button>Create mobile link</button></form><p>After creation: copy/share via WhatsApp or Email (draft-only via queue).</p>'));

app.get('/api/ai-battery', async () => {
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

app.get('/health', async () => health);

app.listen({ port: Number(process.env.PORT || 3001), host: '0.0.0.0' });
