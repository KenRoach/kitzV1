
import Fastify from 'fastify';

export const health = { status: 'ok' };
const app = Fastify();
const page = (title: string, body: string) => `<!doctype html><html><body><h1>${title}</h1>${body}</body></html>`;

app.get('/leads', async () => page('Leads', '<p>Manual mode available. AI suggestions depend on AI Battery.</p>'));
app.get('/orders', async () => page('Orders', '<p>Open orders and status updates.</p>'));
app.get('/tasks', async () => page('Tasks', '<p>Create and track CRM tasks.</p>'));
app.get('/ai-direction', async () => page('AI Direction', '<button disabled>Run AI Plan (disabled when battery is 0)</button>'));
app.get('/checkout-links', async () => page('Checkout Links', '<form method="post" action="/checkout-links/create"><input name="orderId" placeholder="order"/><button>Create link</button></form><p>Copy/share via WhatsApp or email (draft only).</p>'));
app.post('/checkout-links/create', async () => ({ mobileCheckoutLink: 'https://pay.kitz.local/session/demo', draftChannels: ['whatsapp', 'email'] }));
app.get('/health', async () => health);

app.listen({ port: Number(process.env.PORT || 3001), host: '0.0.0.0' });
