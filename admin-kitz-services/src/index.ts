import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });

app.get('/dashboard', async () => ({
  apiKeysConfigured: 0,
  credits: 100,
  approvalsPending: 0,
  traceId: randomUUID()
}));

app.get('/api-keys', async () => ({ providers: ['openai/codex', 'google/gemini', 'anthropic/claude'], configured: [] }));
app.get('/credits', async () => ({ orgId: 'demo-org', aiBatteryCredits: 100 }));
app.get('/approvals', async () => ({ pending: [] }));
app.get('/audit', async () => ({ entries: [] }));

app.listen({ port: Number(process.env.PORT || 3011), host: '0.0.0.0' });
