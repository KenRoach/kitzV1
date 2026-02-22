/**
 * KITZ WhatsApp Connector — Fastify API + Multi-Session Baileys Bridge
 *
 * This service:
 *   1. Runs a Fastify REST API for outbound messaging (port 3006)
 *   2. Manages multiple WhatsApp sessions (one per user)
 *   3. Serves a web login page at /whatsapp/login for QR scanning
 *   4. Streams QR codes via SSE at /whatsapp/connect
 *
 * Users visit /whatsapp/login, scan the QR with WhatsApp, and their
 * messages flow through their own Baileys session to KITZ OS.
 */

import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import type { EventEnvelope } from 'kitz-schemas';
import { startBaileys, getConnectionStatus, sendWhatsAppMessage, sendWhatsAppAudio } from './baileys.js';
import { sessionManager } from './sessions.js';

export const health = { status: 'ok' };
const app = Fastify({ logger: true });

const templates = new Map<string, string>();
const consent = new Map<string, boolean>();

const audit = (event: string, payload: unknown, traceId: string): EventEnvelope => ({
  orgId: 'connector-system',
  userId: 'whatsapp-bot',
  source: 'kitz-whatsapp-connector',
  event,
  payload,
  traceId,
  ts: new Date().toISOString()
});

// ── Health + WhatsApp status ──
app.get('/health', async () => ({
  status: 'ok',
  service: 'kitz-whatsapp-connector',
  whatsapp: getConnectionStatus(),
}));

// ── WhatsApp connection status ──
app.get('/whatsapp/status', async () => getConnectionStatus());

// ═══════════════════════════════════════════
//  Multi-Session Endpoints
// ═══════════════════════════════════════════

// ── Login page — serves HTML for QR scanning ──
app.get('/whatsapp/login', async (_req, reply) => {
  reply.type('text/html').send(LOGIN_HTML);
});

// ── SSE: Stream QR codes for a new session ──
app.get('/whatsapp/connect', async (req: any, reply) => {
  const userId = (req.query as any).userId || randomUUID();

  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send the userId so the client knows its session ID
  reply.raw.write(`event: session\ndata: ${JSON.stringify({ userId })}\n\n`);

  // SSE listener — forwards session events to the client
  const listener = (event: string, data: string) => {
    reply.raw.write(`event: ${event}\ndata: ${data}\n\n`);
  };

  // Start the session — listener is wired BEFORE Baileys connects (prevents race condition)
  try {
    const session = await sessionManager.startSession(userId, { onEvent: listener });

    // If already connected (restored session), notify immediately
    if (session.isConnected) {
      reply.raw.write(`event: connected\ndata: ${JSON.stringify({ phone: session.phoneNumber })}\n\n`);
    }
  } catch (err) {
    reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: (err as Error).message })}\n\n`);
  }

  // Clean up on disconnect
  req.raw.on('close', () => {
    sessionManager.removeListener(userId, listener);
  });
});

// ── List all sessions ──
app.get('/whatsapp/sessions', async () => {
  return { sessions: sessionManager.listSessions() };
});

// ── Session status ──
app.get('/whatsapp/sessions/:userId/status', async (req: any) => {
  const session = sessionManager.getSession(req.params.userId);
  if (!session) return { error: 'Session not found' };
  return {
    userId: session.userId,
    isConnected: session.isConnected,
    phoneNumber: session.phoneNumber,
    hasQr: !!session.lastQr,
  };
});

// ── Disconnect a session ──
app.delete('/whatsapp/sessions/:userId', async (req: any) => {
  const deleted = await sessionManager.deleteSession(req.params.userId);
  return { ok: deleted, userId: req.params.userId };
});

// ═══════════════════════════════════════════
//  Legacy Outbound Endpoints (unchanged)
// ═══════════════════════════════════════════

// ── Inbound webhook (legacy — kept for gateway compatibility) ──
app.post('/webhooks/inbound', async (req: any, reply) => {
  if (!req.headers['x-provider-signature']) {
    return reply.code(400).send({ ok: false, message: 'Missing signature (placeholder validator)' });
  }

  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  app.log.info(audit('whatsapp.inbound', req.body, traceId));
  return { ok: true, traceId };
});

// ── Outbound text message ──
app.post('/outbound/send', async (req: any, reply) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const { phone, message, draftOnly: draftOnlyParam, userId } = req.body || {};
  const draftOnly = Boolean(draftOnlyParam ?? false);

  if (draftOnly) {
    app.log.info(audit('whatsapp.outbound.draft', req.body, traceId));
    return { queued: true, provider: 'draft', draftOnly: true, traceId };
  }

  if (phone && message) {
    const jid = phone.includes('@') ? phone : `${phone.replace(/\D/g, '')}@s.whatsapp.net`;

    // If userId specified, send through that specific session
    if (userId) {
      const sent = await sessionManager.sendMessage(userId, jid, message);
      return { ok: sent, provider: 'baileys', userId, traceId };
    }

    // Otherwise use legacy (first connected session)
    const sent = await sendWhatsAppMessage(jid, message);

    app.log.info(audit('whatsapp.outbound.send', {
      phone, jid, sent,
      message_length: (message as string).length,
    }, traceId));

    return { ok: sent, provider: 'baileys', traceId };
  }

  return reply.code(400).send({ ok: false, message: 'phone and message required', traceId });
});

// ── Templates (legacy) ──
app.post('/templates/:name', async (req: any) => {
  templates.set(req.params.name, req.body?.content || '');
  return { ok: true, count: templates.size };
});

// ── Consent (legacy) ──
app.post('/consent/:contact', async (req: any) => {
  consent.set(req.params.contact, Boolean(req.body?.granted));
  return { ok: true, contact: req.params.contact };
});

// ── Voice Note Sending ──
app.post('/outbound/send-voice', async (req: any) => {
  const traceId = String(req.headers['x-trace-id'] || req.body?.trace_id || randomUUID());
  const { phone, audio_base64, mime_type, caption, userId } = req.body || {};

  if (!phone || !audio_base64) {
    return { ok: false, error: 'phone and audio_base64 required' };
  }

  app.log.info(audit('whatsapp.outbound.voice_note', {
    phone, mime_type,
    audio_size_bytes: Math.round((audio_base64 as string).length * 0.75),
    caption: (caption as string)?.slice(0, 100),
  }, traceId));

  const jid = phone.includes('@') ? phone : `${phone.replace(/\D/g, '')}@s.whatsapp.net`;

  // If userId specified, send through that session
  if (userId) {
    const sent = await sessionManager.sendAudio(userId, jid, audio_base64, mime_type || 'audio/mpeg');
    if (sent && caption) {
      await sessionManager.sendMessage(userId, jid, caption);
    }
    return { ok: sent, provider: 'baileys', userId, traceId };
  }

  const sent = await sendWhatsAppAudio(jid, audio_base64, mime_type || 'audio/mpeg');

  if (sent && caption) {
    await sendWhatsAppMessage(jid, caption);
  }

  return {
    ok: sent,
    status: sent ? 'sent' : 'failed',
    provider: 'baileys',
    phone,
    mime_type: mime_type || 'audio/mpeg',
    audio_size_kb: Math.round((audio_base64 as string).length * 0.75 / 1024),
    traceId,
  };
});

// ── Outbound media (image, video, document, poll, reaction) ──
app.post('/outbound/send-media', async (req: any, reply) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const {
    phone, userId, mediaType, mediaBase64, caption, fileName,
    gifPlayback, draftOnly: draftOnlyParam,
    // Poll-specific
    poll,
    // Reaction-specific
    reaction,
  } = req.body || {};

  const draftOnly = Boolean(draftOnlyParam ?? true); // Draft-first by default

  if (draftOnly) {
    app.log.info(audit('whatsapp.outbound.media.draft', {
      phone, mediaType, draftOnly: true,
      ...(poll ? { poll_question: poll.question } : {}),
      ...(reaction ? { reaction_emoji: reaction.emoji } : {}),
    }, traceId));
    return { queued: true, provider: 'draft', draftOnly: true, traceId };
  }

  if (!userId) {
    return reply.code(400).send({ ok: false, error: 'userId required', traceId });
  }

  const session = sessionManager.getSession(userId);
  if (!session?.isConnected) {
    return reply.code(503).send({ ok: false, error: 'Session not connected', traceId });
  }

  // ── Reaction ──
  if (reaction) {
    const { emoji, messageId, fromMe, remoteJid } = reaction;
    if (!emoji || !messageId) {
      return reply.code(400).send({ ok: false, error: 'reaction.emoji and reaction.messageId required', traceId });
    }
    const jid = remoteJid || (phone?.includes('@') ? phone : `${phone?.replace(/\D/g, '')}@s.whatsapp.net`);
    const sent = await sessionManager.sendReaction(userId, jid, emoji, messageId, Boolean(fromMe));
    return { ok: sent, provider: 'baileys', type: 'reaction', traceId };
  }

  // ── Poll ──
  if (poll) {
    const { question, options, maxSelections } = poll;
    if (!question || !options || options.length < 2) {
      return reply.code(400).send({ ok: false, error: 'poll.question and poll.options (>=2) required', traceId });
    }
    const jid = phone?.includes('@') ? phone : `${phone?.replace(/\D/g, '')}@s.whatsapp.net`;
    const sent = await sessionManager.sendPoll(userId, jid, question, options.slice(0, 12), maxSelections ?? 1);
    return { ok: sent, provider: 'baileys', type: 'poll', traceId };
  }

  // ── Media (image, video, document) ──
  if (!phone || !mediaBase64 || !mediaType) {
    return reply.code(400).send({ ok: false, error: 'phone, mediaBase64, and mediaType required', traceId });
  }

  const jid = phone.includes('@') ? phone : `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
  const buffer = Buffer.from(mediaBase64, 'base64');

  let sent = false;
  if (mediaType.startsWith('image/')) {
    sent = await sessionManager.sendImage(userId, jid, buffer, mediaType, caption);
  } else if (mediaType.startsWith('audio/')) {
    sent = await sessionManager.sendAudio(userId, jid, mediaBase64, mediaType);
  } else if (mediaType.startsWith('video/')) {
    sent = await sessionManager.sendVideo(userId, jid, buffer, mediaType, caption, Boolean(gifPlayback));
  } else {
    sent = await sessionManager.sendDocument(userId, jid, buffer, mediaType, fileName || 'file', caption);
  }

  app.log.info(audit('whatsapp.outbound.media.send', {
    phone, jid, sent, mediaType,
    size_kb: Math.round(buffer.length / 1024),
    has_caption: !!caption,
  }, traceId));

  return { ok: sent, provider: 'baileys', type: 'media', mediaType, traceId };
});

// ── WhatsApp Call ──
app.post('/outbound/call', async (req: any) => {
  const traceId = String(req.headers['x-trace-id'] || req.body?.trace_id || randomUUID());
  const { phone, purpose, language, max_duration_minutes, voice } = req.body || {};

  if (!phone || !purpose) {
    return { ok: false, error: 'phone and purpose required' };
  }

  app.log.info(audit('whatsapp.outbound.call', {
    phone, purpose,
    language: language || 'es',
    max_duration: max_duration_minutes || 5,
    voice: voice || 'kitz_female',
  }, traceId));

  return {
    ok: false,
    status: 'unsupported',
    message: 'Voice calls require WhatsApp Business API (Twilio). Use voice notes instead.',
    call_id: traceId,
    phone, purpose, traceId,
  };
});

// ═══════════════════════════════════════════
//  Login Page HTML
// ═══════════════════════════════════════════

const LOGIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KITZ \u2014 Connect WhatsApp</title>
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
    #qr-wrapper {
      position: relative;
      display: inline-block;
      margin-bottom: 16px;
    }
    #countdown-ring {
      position: absolute;
      top: -6px;
      left: -6px;
      pointer-events: none;
    }
    #countdown-ring circle {
      fill: none;
      stroke-width: 4;
    }
    #countdown-ring .track { stroke: #222; }
    #countdown-ring .progress {
      stroke: #00d4aa;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s linear;
    }
    #qr-container {
      background: #fff;
      border-radius: 16px;
      padding: 24px;
      display: inline-block;
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
      margin-bottom: 4px;
      min-height: 24px;
    }
    #countdown-text {
      font-size: 13px;
      color: #555;
      margin-bottom: 16px;
      min-height: 20px;
      font-variant-numeric: tabular-nums;
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
      <div id="qr-wrapper">
        <svg id="countdown-ring" width="292" height="292" viewBox="0 0 292 292" style="display:none;">
          <circle class="track" cx="146" cy="146" r="143"/>
          <circle class="progress" id="ring-progress" cx="146" cy="146" r="143"
            stroke-dasharray="898.5"
            stroke-dashoffset="0"
            transform="rotate(-90 146 146)"/>
        </svg>
        <div id="qr-container">
          <div class="spinner" id="spinner"></div>
          <canvas id="qr-canvas"></canvas>
        </div>
      </div>
      <div id="status">Generating QR code...</div>
      <div id="countdown-text"></div>
      <div class="instructions">
        <strong>1.</strong> Open WhatsApp on your phone<br>
        <strong>2.</strong> Go to Settings \u2192 Linked Devices<br>
        <strong>3.</strong> Tap "Link a Device"<br>
        <strong>4.</strong> Point your camera at this QR code
      </div>
    </div>

    <div class="connected" id="connected-view">
      <div class="check">\u2705</div>
      <div class="phone" id="phone-number"></div>
      <div id="status2" style="color:#00d4aa;font-size:16px;margin-bottom:16px;">WhatsApp connected to KITZ</div>
      <div class="instructions" style="margin-bottom:24px;">
        Messages to your number are now powered by KITZ AI.<br>
        Try sending "hola" to yourself to test it.
      </div>
      <button onclick="location.reload()" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:8px;border:1px solid #222;background:#111;color:#ccc;font-size:14px;font-weight:600;cursor:pointer;">Connect Another Device</button>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"><\/script>
  <script>
    const scanView = document.getElementById('scan-view');
    const connView = document.getElementById('connected-view');
    const statusEl = document.getElementById('status');
    const spinner = document.getElementById('spinner');
    const canvas = document.getElementById('qr-canvas');
    const phoneEl = document.getElementById('phone-number');
    const countdownText = document.getElementById('countdown-text');
    const ring = document.getElementById('countdown-ring');
    const ringProgress = document.getElementById('ring-progress');

    const QR_LIFETIME = 60;
    const CIRCUMFERENCE = 898.5;
    let countdownInterval = null;
    let secondsLeft = QR_LIFETIME;

    function startCountdown() {
      secondsLeft = QR_LIFETIME;
      ring.style.display = 'block';
      ringProgress.style.strokeDashoffset = '0';
      updateCountdownDisplay();

      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
          clearInterval(countdownInterval);
          countdownText.textContent = 'New QR loading...';
          ringProgress.style.strokeDashoffset = CIRCUMFERENCE;
          return;
        }
        updateCountdownDisplay();
      }, 1000);
    }

    function updateCountdownDisplay() {
      const pct = 1 - (secondsLeft / QR_LIFETIME);
      ringProgress.style.strokeDashoffset = (pct * CIRCUMFERENCE).toFixed(1);

      if (secondsLeft > 10) {
        countdownText.textContent = secondsLeft + 's remaining';
        ringProgress.style.stroke = '#00d4aa';
      } else {
        countdownText.textContent = secondsLeft + 's \u2014 scan now!';
        ringProgress.style.stroke = '#ff6b6b';
      }
    }

    const evtSource = new EventSource('/whatsapp/connect');

    evtSource.addEventListener('session', (e) => {
      const data = JSON.parse(e.data);
      console.log('Session ID:', data.userId);
    });

    evtSource.addEventListener('qr', (e) => {
      spinner.style.display = 'none';
      statusEl.textContent = 'Scan with WhatsApp';
      statusEl.classList.remove('error');
      QRCode.toCanvas(canvas, e.data, {
        width: 256,
        margin: 0,
        color: { dark: '#000', light: '#fff' },
      });
      startCountdown();
    });

    evtSource.addEventListener('connected', (e) => {
      if (countdownInterval) clearInterval(countdownInterval);
      const data = JSON.parse(e.data);
      scanView.style.display = 'none';
      connView.style.display = 'block';
      phoneEl.textContent = '+' + (data.phone || 'Connected');
      evtSource.close();
    });

    evtSource.addEventListener('error', (e) => {
      statusEl.textContent = 'Connection error \u2014 refresh to retry';
      statusEl.classList.add('error');
    });

    evtSource.addEventListener('logged_out', () => {
      statusEl.textContent = 'Session expired \u2014 refresh to reconnect';
      statusEl.classList.add('error');
    });

    evtSource.onerror = () => {
      statusEl.textContent = 'Server disconnected \u2014 refresh to retry';
      statusEl.classList.add('error');
    };
  <\/script>
</body>
</html>`;

// ── Start everything ──
async function boot() {
  // 1. Start Fastify REST API
  const port = Number(process.env.PORT || 3006);
  await app.listen({ port, host: '0.0.0.0' });
  console.log('[connector] REST API listening on port ' + port);

  // 2. Restore existing WhatsApp sessions
  try {
    await startBaileys();
  } catch (err) {
    console.error('[connector] Session restore failed:', (err as Error).message);
    console.error('[connector] REST API is still running — users can connect via /whatsapp/login');
  }
}

boot();
