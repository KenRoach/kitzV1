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

// ── KITZ Voice Assistant (ElevenLabs widget) ──
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID || '';
app.get('/voice-assistant', async (req, reply) => {
  const widget = ELEVENLABS_AGENT_ID
    ? `<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script><elevenlabs-convai agent-id="${ELEVENLABS_AGENT_ID}"></elevenlabs-convai>`
    : '<p>Voice assistant not configured. Set ELEVENLABS_AGENT_ID env var.</p>';
  reply.type('text/html');
  return `<!doctype html><html><head><title>KITZ Voice Assistant</title></head><body>
    <h1>KITZ Voice Assistant</h1>
    <p>Click the voice button in the bottom-right corner to talk to KITZ.</p>
    ${widget}
  </body></html>`;
});
app.get('/voice-config', async () => ({
  elevenlabs_configured: ELEVENLABS_AGENT_ID.length > 0,
  agent_id: ELEVENLABS_AGENT_ID || null,
  voice_identity: 'Female, multilingual, warm professional tone',
  model: 'eleven_multilingual_v2',
}));

app.listen({ port: Number(process.env.PORT || 3011), host: '0.0.0.0' });
