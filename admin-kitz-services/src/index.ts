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

// Root serves the admin dashboard
app.get('/', async (_req, reply) => {
  reply.type('text/html').send(ADMIN_HTML);
});

app.get('/whatsapp/login', async (_req, reply) => {
  reply.type('text/html').send(ADMIN_HTML);
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

// ── Admin Dashboard + WhatsApp Login HTML ──
const ADMIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KITZ Admin</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #fff;
      min-height: 100vh;
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 32px;
      border-bottom: 1px solid #1a1a1a;
    }
    .topbar .logo {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -1px;
      background: linear-gradient(135deg, #00d4aa, #00b4d8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .topbar .label {
      color: #555;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .main {
      max-width: 960px;
      margin: 0 auto;
      padding: 40px 24px;
    }
    h2 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #ccc;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 40px;
    }
    .card {
      background: #111;
      border: 1px solid #222;
      border-radius: 12px;
      padding: 20px;
    }
    .card .card-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .card .card-value {
      font-size: 28px;
      font-weight: 700;
      color: #00d4aa;
    }
    .card .card-sub {
      font-size: 12px;
      color: #444;
      margin-top: 4px;
    }

    /* WhatsApp section */
    .wa-section {
      background: #111;
      border: 1px solid #222;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 40px;
    }
    .wa-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .wa-header h3 {
      font-size: 16px;
      font-weight: 600;
      color: #ccc;
    }
    .wa-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }
    .wa-status .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #333;
    }
    .wa-status .dot.on { background: #00d4aa; }
    .wa-status .dot.off { background: #ff6b6b; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #00d4aa;
      color: #000;
    }
    .btn-primary:hover { background: #00e8bb; }
    .btn-danger {
      background: transparent;
      color: #ff6b6b;
      border: 1px solid #ff6b6b33;
    }
    .btn-danger:hover { background: #ff6b6b15; }
    .btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* QR Modal */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.85);
      z-index: 100;
      align-items: center;
      justify-content: center;
    }
    .modal-overlay.active { display: flex; }
    .modal {
      background: #111;
      border: 1px solid #222;
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      max-width: 400px;
      width: 90%;
      position: relative;
    }
    .modal-close {
      position: absolute;
      top: 12px;
      right: 16px;
      background: none;
      border: none;
      color: #666;
      font-size: 24px;
      cursor: pointer;
    }
    .modal-close:hover { color: #fff; }
    .modal h3 {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 4px;
    }
    .modal .modal-sub {
      color: #666;
      font-size: 13px;
      margin-bottom: 20px;
    }
    #qr-container {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      display: inline-block;
      margin-bottom: 16px;
      min-width: 240px;
      min-height: 240px;
    }
    #qr-container canvas {
      display: block;
      margin: 0 auto;
    }
    #qr-status {
      font-size: 14px;
      color: #00d4aa;
      min-height: 20px;
      margin-bottom: 12px;
    }
    .modal .instructions {
      color: #555;
      font-size: 12px;
      line-height: 1.5;
      text-align: left;
    }
    .modal .instructions strong { color: #888; }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #333;
      border-top-color: #00d4aa;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 80px auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error { color: #ff6b6b !important; }

    /* Connected state in modal */
    .modal-connected {
      display: none;
      text-align: center;
      padding: 20px 0;
    }
    .modal-connected .check { font-size: 48px; margin-bottom: 12px; }
    .modal-connected .phone {
      font-size: 18px;
      font-weight: 600;
      color: #00d4aa;
      margin-bottom: 4px;
    }
    .modal-connected .done-msg {
      color: #666;
      font-size: 13px;
    }

    /* Sessions list */
    .session-list {
      margin-top: 12px;
    }
    .session-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-top: 1px solid #1a1a1a;
    }
    .session-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .session-phone {
      font-size: 14px;
      font-weight: 500;
    }
    .session-id {
      font-size: 11px;
      color: #444;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="logo">KITZ</div>
    <div class="label">Admin</div>
  </div>

  <div class="main">
    <!-- WhatsApp Section -->
    <div class="wa-section">
      <div class="wa-header">
        <h3>WhatsApp</h3>
        <div class="wa-status" id="wa-status">
          <span class="dot" id="wa-dot"></span>
          <span id="wa-status-text">Checking...</span>
        </div>
      </div>
      <div id="sessions-list" class="session-list"></div>
      <div style="margin-top: 16px">
        <button class="btn btn-primary" id="connect-btn" onclick="openQrModal()">Connect WhatsApp</button>
      </div>
    </div>

    <!-- Dashboard Cards -->
    <h2>Overview</h2>
    <div class="cards">
      <div class="card">
        <div class="card-label">AI Battery</div>
        <div class="card-value">100</div>
        <div class="card-sub">credits remaining</div>
      </div>
      <div class="card">
        <div class="card-label">API Keys</div>
        <div class="card-value">0</div>
        <div class="card-sub">providers configured</div>
      </div>
      <div class="card">
        <div class="card-label">Approvals</div>
        <div class="card-value">0</div>
        <div class="card-sub">pending</div>
      </div>
    </div>
  </div>

  <!-- QR Code Modal -->
  <div class="modal-overlay" id="qr-modal">
    <div class="modal">
      <button class="modal-close" onclick="closeQrModal()">&times;</button>

      <div id="qr-scan-view">
        <h3>Connect WhatsApp</h3>
        <div class="modal-sub">Scan the QR code with your phone</div>
        <div id="qr-container">
          <div class="spinner" id="qr-spinner"></div>
          <canvas id="qr-canvas"></canvas>
        </div>
        <div id="qr-status">Generating QR code...</div>
        <div class="instructions">
          <strong>1.</strong> Open WhatsApp on your phone<br>
          <strong>2.</strong> Settings &gt; Linked Devices<br>
          <strong>3.</strong> Tap "Link a Device"<br>
          <strong>4.</strong> Scan this QR code
        </div>
      </div>

      <div class="modal-connected" id="qr-connected-view">
        <div class="check">\u2705</div>
        <div class="phone" id="qr-phone"></div>
        <div class="done-msg">WhatsApp connected to KITZ</div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"><\/script>
  <script>
    let evtSource = null;

    // Load sessions on page load
    async function loadSessions() {
      try {
        const res = await fetch('/whatsapp/sessions');
        const data = await res.json();
        const sessions = data.sessions || [];
        const list = document.getElementById('sessions-list');
        const dot = document.getElementById('wa-dot');
        const statusText = document.getElementById('wa-status-text');
        const connected = sessions.filter(s => s.isConnected);

        if (connected.length > 0) {
          dot.className = 'dot on';
          statusText.textContent = connected.length + ' connected';
        } else {
          dot.className = 'dot off';
          statusText.textContent = 'Not connected';
        }

        list.innerHTML = sessions.map(s =>
          '<div class="session-item">' +
            '<div class="session-info">' +
              '<span class="dot ' + (s.isConnected ? 'on' : 'off') + '"></span>' +
              '<span class="session-phone">' + (s.phoneNumber ? '+' + s.phoneNumber : 'Connecting...') + '</span>' +
              '<span class="session-id">' + s.userId.slice(0, 8) + '</span>' +
            '</div>' +
            '<button class="btn btn-danger" onclick="disconnectSession(\\'' + s.userId + '\\')">Disconnect</button>' +
          '</div>'
        ).join('');
      } catch {
        document.getElementById('wa-dot').className = 'dot off';
        document.getElementById('wa-status-text').textContent = 'Service unavailable';
      }
    }

    function openQrModal() {
      document.getElementById('qr-modal').classList.add('active');
      document.getElementById('qr-scan-view').style.display = 'block';
      document.getElementById('qr-connected-view').style.display = 'none';
      document.getElementById('qr-spinner').style.display = 'block';
      document.getElementById('qr-status').textContent = 'Generating QR code...';
      document.getElementById('qr-status').classList.remove('error');

      evtSource = new EventSource('/whatsapp/connect');

      evtSource.addEventListener('qr', function(e) {
        document.getElementById('qr-spinner').style.display = 'none';
        document.getElementById('qr-status').textContent = 'Scan with WhatsApp';
        QRCode.toCanvas(document.getElementById('qr-canvas'), e.data, {
          width: 240,
          margin: 0,
          color: { dark: '#000', light: '#fff' },
        });
      });

      evtSource.addEventListener('connected', function(e) {
        var data = JSON.parse(e.data);
        document.getElementById('qr-scan-view').style.display = 'none';
        document.getElementById('qr-connected-view').style.display = 'block';
        document.getElementById('qr-phone').textContent = '+' + (data.phone || 'Connected');
        evtSource.close();
        evtSource = null;
        loadSessions();
      });

      evtSource.addEventListener('error', function() {
        document.getElementById('qr-status').textContent = 'Connection error - close and retry';
        document.getElementById('qr-status').classList.add('error');
      });

      evtSource.onerror = function() {
        document.getElementById('qr-status').textContent = 'Server disconnected - close and retry';
        document.getElementById('qr-status').classList.add('error');
      };
    }

    function closeQrModal() {
      document.getElementById('qr-modal').classList.remove('active');
      if (evtSource) {
        evtSource.close();
        evtSource = null;
      }
    }

    async function disconnectSession(userId) {
      await fetch('/whatsapp/sessions/' + userId, { method: 'DELETE' });
      loadSessions();
    }

    // Close modal on overlay click
    document.getElementById('qr-modal').addEventListener('click', function(e) {
      if (e.target === this) closeQrModal();
    });

    // Close modal on Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeQrModal();
    });

    // Load on page load
    loadSessions();
  <\/script>
</body>
</html>`;

const WA_LOGIN_HTML = ADMIN_HTML;

app.listen({ port: Number(process.env.PORT || 3011), host: '0.0.0.0' });
