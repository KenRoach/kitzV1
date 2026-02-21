import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });

const WA_CONNECTOR_URL = process.env.WA_CONNECTOR_URL || 'http://localhost:3006';

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

// ═══════════════════════════════════════════
//  WhatsApp Login — QR Code Page
// ═══════════════════════════════════════════

app.get('/whatsapp/login', async (_req, reply) => {
  reply.type('text/html').send(WA_LOGIN_HTML);
});

// SSE proxy — streams QR codes from the whatsapp connector
app.get('/whatsapp/connect', async (req: any, reply) => {
  const userId = (req.query as any).userId || randomUUID();
  const upstreamUrl = WA_CONNECTOR_URL + '/whatsapp/connect?userId=' + encodeURIComponent(userId);

  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  try {
    const upstream = await fetch(upstreamUrl, {
      signal: AbortSignal.timeout(120_000),
    });

    if (!upstream.ok || !upstream.body) {
      reply.raw.write('event: error\ndata: {"error":"WhatsApp connector unavailable"}\n\n');
      reply.raw.end();
      return;
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();

    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply.raw.write(decoder.decode(value, { stream: true }));
      }
      reply.raw.end();
    };

    req.raw.on('close', () => {
      reader.cancel();
    });

    pump().catch(() => reply.raw.end());
  } catch (err) {
    reply.raw.write('event: error\ndata: {"error":"Could not reach WhatsApp connector"}\n\n');
    reply.raw.end();
  }
});

// WhatsApp session management proxy
app.get('/whatsapp/sessions', async () => {
  try {
    const res = await fetch(WA_CONNECTOR_URL + '/whatsapp/sessions');
    return await res.json();
  } catch {
    return { error: 'WhatsApp connector unavailable' };
  }
});

app.delete('/whatsapp/sessions/:userId', async (req: any) => {
  try {
    const res = await fetch(WA_CONNECTOR_URL + '/whatsapp/sessions/' + req.params.userId, { method: 'DELETE' });
    return await res.json();
  } catch {
    return { error: 'WhatsApp connector unavailable' };
  }
});

// ── WhatsApp Login Page HTML ──
const WA_LOGIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KITZ — Connect WhatsApp</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      max-width: 420px;
      padding: 40px 24px;
    }
    .logo {
      font-size: 48px;
      font-weight: 800;
      letter-spacing: -2px;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #00d4aa, #00b4d8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      color: #888;
      font-size: 14px;
      margin-bottom: 32px;
    }
    #qr-container {
      background: #fff;
      border-radius: 16px;
      padding: 24px;
      display: inline-block;
      margin-bottom: 24px;
      min-width: 280px;
      min-height: 280px;
      position: relative;
    }
    #qr-container canvas {
      display: block;
      margin: 0 auto;
    }
    #status {
      font-size: 16px;
      color: #00d4aa;
      margin-bottom: 16px;
      min-height: 24px;
    }
    .instructions {
      color: #666;
      font-size: 13px;
      line-height: 1.6;
    }
    .instructions strong { color: #aaa; }
    .connected {
      display: none;
      text-align: center;
    }
    .connected .check {
      font-size: 64px;
      margin-bottom: 16px;
    }
    .connected .phone {
      font-size: 20px;
      font-weight: 600;
      color: #00d4aa;
      margin-bottom: 8px;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 3px solid #333;
      border-top-color: #00d4aa;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 100px auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error { color: #ff6b6b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">KITZ</div>
    <div class="subtitle">Connect your WhatsApp to your AI Business OS</div>

    <div id="scan-view">
      <div id="qr-container">
        <div class="spinner" id="spinner"></div>
        <canvas id="qr-canvas"></canvas>
      </div>
      <div id="status">Generating QR code...</div>
      <div class="instructions">
        <strong>1.</strong> Open WhatsApp on your phone<br>
        <strong>2.</strong> Go to Settings &gt; Linked Devices<br>
        <strong>3.</strong> Tap "Link a Device"<br>
        <strong>4.</strong> Scan this QR code
      </div>
    </div>

    <div class="connected" id="connected-view">
      <div class="check">\u2705</div>
      <div class="phone" id="phone-number"></div>
      <div id="status2">WhatsApp connected to KITZ</div>
      <br>
      <div class="instructions">
        Messages to your number are now powered by KITZ AI.<br>
        You can close this page.
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"><\/script>
  <script>
    const scanView = document.getElementById('scan-view');
    const connView = document.getElementById('connected-view');
    const statusEl = document.getElementById('status');
    const spinner = document.getElementById('spinner');
    const canvas = document.getElementById('qr-canvas');
    const phoneEl = document.getElementById('phone-number');

    const evtSource = new EventSource('/whatsapp/connect');

    evtSource.addEventListener('session', (e) => {
      const data = JSON.parse(e.data);
      console.log('Session ID:', data.userId);
    });

    evtSource.addEventListener('qr', (e) => {
      spinner.style.display = 'none';
      statusEl.textContent = 'Scan with WhatsApp';
      QRCode.toCanvas(canvas, e.data, {
        width: 256,
        margin: 0,
        color: { dark: '#000', light: '#fff' },
      });
    });

    evtSource.addEventListener('connected', (e) => {
      const data = JSON.parse(e.data);
      scanView.style.display = 'none';
      connView.style.display = 'block';
      phoneEl.textContent = '+' + (data.phone || 'Connected');
      evtSource.close();
    });

    evtSource.addEventListener('error', (e) => {
      statusEl.textContent = 'Connection error - refresh to retry';
      statusEl.classList.add('error');
    });

    evtSource.addEventListener('logged_out', () => {
      statusEl.textContent = 'Session expired - refresh to reconnect';
      statusEl.classList.add('error');
    });

    evtSource.onerror = () => {
      statusEl.textContent = 'Server disconnected - refresh to retry';
      statusEl.classList.add('error');
    };
  <\/script>
</body>
</html>`;

app.listen({ port: Number(process.env.PORT || 3011), host: '0.0.0.0' });
