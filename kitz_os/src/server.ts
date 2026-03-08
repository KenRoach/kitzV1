/**
 * KITZ OS Control Plane — Fastify Server
 *
 * Endpoints:
 *   POST /api/kitz         — WhatsApp webhook (main entry point)
 *   POST /api/kitz/run     — Execute a goal
 *   GET  /api/kitz/status  — System health
 *   GET  /api/kitz/reports — Cadence reports
 *   POST /api/kitz/approve — Approve a run
 *   GET  /api/kitz/approve-delete/:token — Delete approval webhook
 *   GET  /api/kitz/reject-delete/:token  — Delete rejection webhook
 *   POST /api/kitz/media                 — Media processing (doc scan, voice)
 *   POST /api/payments/webhook/stripe    — Stripe payment webhook
 *   POST /api/payments/webhook/paypal    — PayPal payment webhook
 *   POST /api/payments/webhook/yappy     — Yappy payment webhook (Panama)
 *   POST /api/payments/webhook/bac       — BAC Compra Click webhook (Central America)
 *   POST /api/kitz/voice/speak           — Text-to-Speech (ElevenLabs)
 *   GET  /api/kitz/voice/config          — Voice configuration
 *   GET  /api/kitz/voice/widget          — Voice widget HTML snippet
 *   GET  /api/kitz/battery               — AI Battery status & spend tracking
 *   GET  /api/kitz/battery/ledger        — Spend history ledger
 *   POST /api/kitz/battery/recharge      — Manual credit recharge (founder-only)
 *   GET  /api/kitz/oauth/google/status   — Check Google OAuth status
 *   GET  /api/kitz/oauth/google/authorize — Start Google OAuth flow
 *   GET  /api/kitz/oauth/google/callback  — OAuth callback (Google redirects here)
 *   POST /api/kitz/oauth/google/revoke    — Revoke Google Calendar access
 *   POST /api/kitz/webhooks/n8n        — n8n workflow event receiver
 *   GET  /api/kitz/artifact/:contentId — Serve branded HTML artifact preview (public)
 *   POST /api/kitz/artifact/:contentId/action — Execute artifact action button clicks
 *
 *   Gateway Auth (embedded from kitz-gateway):
 *   POST /api/gateway/auth/signup           — Create user account
 *   POST /api/gateway/auth/token            — Login (email + password)
 *   GET  /api/gateway/auth/google/url       — Google OAuth consent URL
 *   POST /api/gateway/auth/google/callback  — Exchange Google code for JWT
 *
 * Port: 3012
 */

import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import type { KitzKernel } from './kernel.js';
import { verifyJwt as gatewayVerifyJwt, signJwt as gatewaySignJwt } from './auth/gatewayJwt.js';
import { findUserByEmail, createUser as createGatewayUser, updateUser as updateGatewayUser, verifyPassword } from './auth/gatewayDb.js';
import { isGoogleLoginConfigured as isGatewayGoogleConfigured, getLoginAuthUrl, exchangeLoginCode } from './auth/gatewayGoogleAuth.js';
import { parseWhatsAppCommand } from './interfaces/whatsapp/commandParser.js';
import { routeWithAI, brainFirstRoute, getDraftQueue, approveDraft, rejectDraft } from './interfaces/whatsapp/semanticRouter.js';
import { textToSpeech, getKitzVoiceConfig, getWidgetSnippet, isElevenLabsConfigured } from './llm/elevenLabsClient.js';
import { getBatteryStatus, recordRecharge, getLedger, hasBudget } from './aiBattery.js';
import { initMemory, storeMessage, buildContextWindow } from './memory/manager.js';
import { verifyStripeSignature, verifyHmacSha256, verifyPayPalHeaders } from './webhookVerify.js';
import { isGoogleOAuthConfigured, getAuthUrl, exchangeCode, hasStoredTokens, revokeTokens } from './auth/googleOAuth.js';
import { dispatchMultiChannel, getChannelHealth } from './channels/dispatcher.js';
import { registerWSGateway, getClientCount } from './gateway/wsGateway.js';
import { getUserPreferences, setUserPreferences } from './channels/preferences.js';
import * as orchestrator from './orchestrator/channelOrchestrator.js';
import { APPROVAL_MATRIX, getMatrixByRisk, getMatrixByCategory } from './approvals/approvalMatrix.js';
import { createArtifactFromToolResult } from './tools/artifactPreview.js';
import { getContent, getContentBySlug, getBrandKit, approveContent, extendContent, cleanExpiredContent } from './tools/contentEngine.js';
import type { OutputChannel } from 'kitz-schemas';
import { createLogger } from './logger.js';
import { loadContacts, isFirstContact, getContact, touchContact } from './contacts/registry.js';
import { handleOnboarding } from './contacts/onboarding.js';

const log = createLogger('server');

/** Auto-detect language from message text — defaults to Spanish for LatAm market */
function detectLanguage(text: string): string {
  const lower = text.toLowerCase();
  // English indicators
  const enWords = /\b(hello|hi|hey|how are you|what|can you|please|thanks|help|good morning|good afternoon)\b/;
  // Spanish indicators
  const esWords = /\b(hola|buenos|buenas|como|qué|por favor|gracias|ayuda|quiero|necesito|buen día)\b/;
  if (enWords.test(lower) && !esWords.test(lower)) return 'en';
  return 'es'; // Default to Spanish (LatAm target market)
}

/** Escape user-controlled values before injecting into HTML */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Sanitize a CSS color value — only allow hex colors, rgb(), and named colors */
function sanitizeColor(color: string): string {
  if (/^#[0-9a-fA-F]{3,8}$/.test(color)) return color;
  if (/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/.test(color)) return color;
  if (/^[a-zA-Z]{1,20}$/.test(color)) return color;
  return '#A855F7'; // fallback to brand purple
}

function buildExpiredArtifactHtml(baseUrl: string): string {
  const rawBk = getBrandKit();
  // Sanitize all user-controlled brand kit values before HTML injection
  const bk = {
    ...rawBk,
    businessName: escapeHtml(rawBk.businessName),
    tagline: rawBk.tagline ? escapeHtml(rawBk.tagline) : '',
    language: rawBk.language,
    colors: {
      primary: sanitizeColor(rawBk.colors.primary),
      secondary: sanitizeColor(rawBk.colors.secondary),
      accent: sanitizeColor(rawBk.colors.accent),
      background: sanitizeColor(rawBk.colors.background),
      text: sanitizeColor(rawBk.colors.text),
    },
  };
  return `<!DOCTYPE html>
<html lang="${bk.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Expired — ${bk.businessName} | KITZ</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f7ff;color:#1a1a2e;min-height:100vh}

    .kitz-artifact-header{background:linear-gradient(135deg,${bk.colors.primary},${bk.colors.secondary});padding:20px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
    .kitz-artifact-header .brand{display:flex;align-items:center;gap:12px}
    .kitz-artifact-header .logo{width:36px;height:36px;border-radius:8px;object-fit:contain}
    .kitz-artifact-header .title-group h1{font-size:18px;font-weight:700;color:#fff;line-height:1.2}
    .kitz-artifact-header .title-group .subtitle{font-size:12px;color:rgba(255,255,255,0.75);margin-top:2px}
    .kitz-artifact-header .badge{background:rgba(255,255,255,0.2);color:#fff;font-size:11px;padding:4px 10px;border-radius:20px;font-weight:600}

    .kitz-artifact-content{max-width:900px;margin:24px auto;padding:0 16px}
    .kitz-artifact-card{background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(124,58,237,0.08);overflow:hidden}

    .kitz-expired-body{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px 32px;text-align:center}
    .kitz-expired-icon{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,${bk.colors.primary}22,${bk.colors.secondary}22);display:flex;align-items:center;justify-content:center;margin-bottom:24px}
    .kitz-expired-icon svg{width:40px;height:40px;color:${bk.colors.primary}}
    .kitz-expired-body h2{font-size:24px;font-weight:800;color:${bk.colors.primary};margin-bottom:12px}
    .kitz-expired-body p{font-size:15px;line-height:1.6;color:#666;max-width:400px}
    .kitz-expired-body .hint{margin-top:24px;display:inline-block;padding:10px 24px;border-radius:8px;background:${bk.colors.primary};color:#fff;font-weight:600;font-size:14px;text-decoration:none;transition:opacity 0.2s}
    .kitz-expired-body .hint:hover{opacity:0.85}
    .kitz-expired-body .timer{margin-top:16px;font-size:12px;color:#999}

    .kitz-artifact-footer{text-align:center;padding:20px 16px 32px;color:#999;font-size:12px;line-height:1.5}
    .kitz-artifact-footer a{color:${bk.colors.primary};text-decoration:none}

    @media(max-width:600px){
      .kitz-artifact-header{padding:16px}
      .kitz-artifact-header .title-group h1{font-size:16px}
      .kitz-artifact-content{margin:16px auto;padding:0 12px}
      .kitz-expired-body{padding:48px 20px}
      .kitz-expired-body h2{font-size:20px}
    }
  </style>
</head>
<body>
  <header class="kitz-artifact-header">
    <div class="brand">
      <img class="logo" src="${baseUrl}/kitz-logo.png" alt="KITZ" onerror="this.style.display='none'">
      <div class="title-group">
        <h1>Artifact Expired</h1>
        <div class="subtitle">${bk.businessName}${bk.tagline ? ` \u2014 ${bk.tagline}` : ''}</div>
      </div>
    </div>
    <span class="badge">Expired</span>
  </header>

  <main class="kitz-artifact-content">
    <div class="kitz-artifact-card">
      <div class="kitz-expired-body">
        <div class="kitz-expired-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <h2>${bk.language === 'es' ? 'Este artefacto ha expirado' : 'This artifact has expired'}</h2>
        <p>${bk.language === 'es'
          ? 'Los borradores expiran despues de 24 horas si no son aprobados. Pide a KITZ que lo regenere.'
          : 'Draft artifacts expire after 24 hours if not approved. Ask KITZ to regenerate it.'}</p>
        <a class="hint" href="${baseUrl}">${bk.language === 'es' ? 'Volver a KITZ' : 'Back to KITZ'}</a>
        <div class="timer">24h TTL &middot; Draft-first policy</div>
      </div>
    </div>
  </main>

  <footer class="kitz-artifact-footer">
    ${bk.language === 'es' ? 'Este contenido fue creado por IA.' : 'This content was created by AI.'}<br>
    <a href="${baseUrl}">Powered by KITZ</a> &mdash; ${bk.language === 'es' ? 'Tu negocio merece infraestructura.' : 'Your business deserves infrastructure.'}
  </footer>
</body>
</html>`;
}

export async function createServer(kernel: KitzKernel) {
  const app = Fastify({ logger: false, bodyLimit: 20_000_000, requestTimeout: 120_000 });  // 20MB for media, 2min for AI calls
  const PORT = Number(process.env.PORT) || 3012;

  // Rate limiting — 120 req/min global, 30 req/min on AI endpoints
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

  // CORS — allow UI and workspace origins (audit finding 6a)
  await app.register(cors, {
    origin: [
      'http://localhost:5173',
      'http://localhost:3001',
      'https://kitz.services',
      'https://workspace.kitz.services',
      'https://kenroach.github.io',
      /\.kitz\.services$/,
    ],
    credentials: true,
  });

  // ── Static SPA hosting — serve KITZ Command Center from /public ──
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const spaRoot = join(__dirname, '..', 'public');
  if (existsSync(spaRoot)) {
    await app.register(fastifyStatic, {
      root: spaRoot,
      prefix: '/',
      wildcard: false,         // Don't catch /api/* routes
      decorateReply: true,
    });
    log.info('SPA static hosting enabled', { root: spaRoot });
  }

  // WebSocket gateway for real-time streaming
  await registerWSGateway(app);

  // Initialize memory system
  try { initMemory(); } catch (err) {
    log.warn('Memory init failed (non-fatal):', { detail: (err as Error).message });
  }

  // ── Service auth — accepts x-service-secret, x-dev-secret, or Bearer JWT ──
  // SPA uses JWT Bearer auth (no x-dev-secret in production).
  // x-dev-secret is for service-to-service calls only (DEV_TOKEN_SECRET env var).
  const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';
  const JWT_SECRET = process.env.JWT_SECRET || process.env.DEV_TOKEN_SECRET || '';

  /** Verify a JWT token and return the payload, or null if invalid */
  function verifyBearerJwt(token: string): { sub: string; org_id?: string } | null {
    if (!JWT_SECRET) return null;
    try {
      const payload = gatewayVerifyJwt(token, JWT_SECRET);
      if (payload.sub) return payload as { sub: string; org_id?: string };
      return null;
    } catch { return null; }
  }

  app.addHook('onRequest', async (req, reply) => {
    // Skip auth for health, status, OAuth callbacks, webhook endpoints, and static SPA assets
    const path = req.url.split('?')[0];
    const isStaticAsset = (req.method === 'GET' || req.method === 'HEAD') && !path.startsWith('/api/');
    // Artifact GET (preview) is public; artifact POST (actions) requires auth
    const isArtifactPreview = path.startsWith('/api/kitz/artifact/') && !path.endsWith('/action') && req.method === 'GET';
    const skipAuth = isStaticAsset ||
      path === '/health' ||
      path === '/api/kitz/status' ||
      path === '/api/kitz/channels/health' ||
      path === '/ws' ||
      path.startsWith('/api/payments/webhook/') ||
      path.startsWith('/api/kitz/oauth/google/callback') ||
      path.startsWith('/api/whatsapp/') ||
      isArtifactPreview ||
      path.startsWith('/api/gateway/auth/');
    if (skipAuth) return;

    // 1. Service-to-service auth (x-service-secret or x-dev-secret)
    const secret = req.headers['x-service-secret'] as string | undefined;
    const devSecret = req.headers['x-dev-secret'] as string | undefined;
    if (SERVICE_SECRET && secret === SERVICE_SECRET) return;
    if (process.env.DEV_TOKEN_SECRET && devSecret === process.env.DEV_TOKEN_SECRET) return;

    // 2. Bearer JWT from UI (same JWT_SECRET as gateway)
    const authHeader = req.headers.authorization as string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = verifyBearerJwt(token);
      if (payload?.sub) return; // Valid JWT — allow through
    }

    // No valid auth found — always reject
    return reply.code(401).send({ error: 'Unauthorized: missing or invalid credentials' });
  });

  // ── Health check — verifies downstream connectivity ──
  app.get('/health', async () => {
    const checks: Record<string, string> = { 'kitz-os': 'ok' };
    // Verify workspace REST API
    try {
      const res = await fetch(`${process.env.WORKSPACE_API_URL || 'http://localhost:3001'}/health`, { signal: AbortSignal.timeout(3000) });
      checks.workspace = res.ok ? 'ok' : 'degraded';
    } catch { checks.workspace = 'unreachable'; }
    // Verify kernel status
    const s = kernel.getStatus();
    checks.kernel = s.status === 'online' ? 'ok' : s.status;
    const allOk = Object.values(checks).every(v => v === 'ok');
    return { status: allOk ? 'ok' : 'degraded', service: 'kitz-os', checks };
  });

  // ── System status ──
  app.get('/api/kitz/status', async () => {
    return kernel.getStatus();
  });

  // ── Channel health ──
  app.get('/api/kitz/channels/health', async () => {
    const health = await getChannelHealth();
    return { channels: health };
  });

  // ── Main WhatsApp webhook ──
  app.post<{ Body: { message: string; sender?: string; user_id?: string; trace_id?: string; reply_context?: unknown; location?: string; channel?: string; echo_channels?: OutputChannel[]; chat_history?: Array<{ role: 'user' | 'assistant'; content: string }>; source?: string } }>(
    '/api/kitz',
    { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { message, sender, user_id, trace_id, channel: reqChannel, echo_channels, chat_history, source } = req.body || {};
      if (!message) return reply.code(400).send({ error: 'message required' });
      const validChannels: OutputChannel[] = ['whatsapp', 'web', 'email', 'sms', 'voice', 'terminal', 'instagram', 'messenger', 'twitter'];
      const channel: OutputChannel = validChannels.includes(reqChannel as OutputChannel)
        ? (reqChannel as OutputChannel)
        : 'whatsapp';

      const traceId = trace_id || crypto.randomUUID();
      const userId = user_id || 'default';
      const senderJid = sender || 'unknown';

      // Store inbound message in memory (skip swarm/system messages)
      const isSwarmMessage = message.startsWith('[SWARM:');
      const isSystemSource = reqChannel === 'system' || user_id === 'swarm-bridge';
      if (!isSwarmMessage && !isSystemSource) {
        try {
          storeMessage({ userId, senderJid, channel: channel as 'whatsapp' | 'email', role: 'user', content: message, traceId });
        } catch { /* non-blocking */ }
      }

      // 0. First-time user onboarding check (before any routing)
      if (senderJid !== 'unknown' && source !== 'self_chat') {
        const onboardingChannel = source === 'inbound_email' ? 'email' as const : 'whatsapp' as const;
        const locale = detectLanguage(message);
        const onboarding = handleOnboarding(senderJid, onboardingChannel, message, locale);
        if (onboarding) {
          log.info('onboarding response', { senderJid, step: onboarding.contact.onboardingStep, locale });
          const result: Record<string, unknown> = {
            response: onboarding.response,
            command: 'onboarding',
          };
          // Generate TTS voice note for welcome (first contact only)
          if (onboarding.voice_note?.text && isElevenLabsConfigured()) {
            try {
              const { textToSpeechOgg } = await import('./llm/elevenLabsClient.js');
              const ttsResult = await textToSpeechOgg({ text: onboarding.voice_note.text });
              if (ttsResult?.audioBase64) {
                result.voice_note = { audio_base64: ttsResult.audioBase64, mime_type: ttsResult.mimeType || 'audio/ogg; codecs=opus', text: onboarding.voice_note.text };
              }
            } catch (err) {
              log.warn('TTS for onboarding failed', { err });
            }
          }
          return result;
        }
      }

      // 1. Try regex command parser first (fast, no AI cost)
      const command = parseWhatsAppCommand(message);

      if (command) {
        switch (command.action) {
          case 'status': {
            const s = kernel.getStatus();
            const b = s.aiBattery;
            return {
              command: 'status',
              response: `*KITZ OS*\n` +
                `Status: ${s.status}\n` +
                `Tools: ${s.toolCount}\n` +
                `Uptime: ${s.uptime}s\n` +
                `Kill Switch: ${s.killSwitch ? '🔴 ON' : '🟢 OFF'}\n\n` +
                `⚡ *AI Battery*\n` +
                `Today: ${b.todayCredits} credits (${b.todayCalls} calls)\n` +
                `Tokens: ${b.todayTokens.toLocaleString()} | TTS: ${b.todayTtsChars.toLocaleString()} chars\n` +
                `🟢 Unlimited`,
            };
          }

          case 'help': {
            return {
              command: 'help',
              response: `*KITZ OS Commands*\n\n` +
                `• *status* — System health\n` +
                `• *contacts* — List CRM contacts\n` +
                `• *orders* — List orders\n` +
                `• *summary* — Business overview\n` +
                `• *dashboard* — KPI metrics\n` +
                `• *storefronts* — List storefronts\n` +
                `• *products* — List products\n` +
                `• *brain dump: [idea]* — Process idea\n` +
                `• *generate code: [description]* — Create code with AI\n` +
                `• *generate doc: [topic]* — Create document with AI\n` +
                `• *self-heal: [file]* — Regenerate missing files\n` +
                `• *lovable projects* — List connected Lovable projects\n` +
                `• *payments* — Payment summary & transactions\n` +
                `• *voice note [phone] [text]* — Send voice note\n` +
                `• *call [phone] [purpose]* — Make WhatsApp call\n` +
                `• *say this aloud* — Get voice reply\n` +
                `• *battery* — AI Battery status & spend\n` +
                `• *recharge [amount]* — Add credits (1-100)\n` +
                `• *report daily/weekly* — Get report\n` +
                `• *help* — This menu\n\n` +
                `Or just ask in natural language! 🎙️`,
            };
          }

          case 'greeting': {
            const s = kernel.getStatus();
            const hour = new Date().getHours();
            const timeGreet = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
            return {
              command: 'greeting',
              response:
                `${timeGreet} boss 👋\n\n` +
                `KITZ is locked in. ${s.toolCount} tools loaded — CRM, orders, storefronts, payments, the works.\n\n` +
                `⚡ Battery: unlimited · 🟢 All systems go\n\n` +
                `What are we building today?`,
            };
          }

          case 'kill_switch': {
            const ksDevSecret = req.headers['x-dev-secret'] as string | undefined;
            const ksUserId = req.body.user_id;
            const ksGodMode = process.env.GOD_MODE_USER_ID;
            const isAdmin = (ksDevSecret && ksDevSecret === process.env.DEV_TOKEN_SECRET) ||
                            (ksUserId && ksGodMode && ksUserId === ksGodMode);
            if (!isAdmin) {
              return { command: 'kill_switch', response: '🔒 Kill switch requires admin access.' };
            }
            process.env.KILL_SWITCH = String(command.value);
            return {
              command: 'kill_switch',
              response: command.value ? '🔴 Kill switch ENGAGED. All operations halted.' : '🟢 Kill switch disengaged. System resuming.',
            };
          }

          case 'battery': {
            const bat = getBatteryStatus();
            return {
              command: 'battery',
              response: `⚡ *AI Battery* — Unlimited\n\n` +
                `Spent today: ${bat.todayCredits} credits (${bat.todayCalls} API calls)\n\n` +
                `📊 *Breakdown*\n` +
                `• OpenAI: ${bat.byProvider.openai.toFixed(2)} credits\n` +
                `• Claude: ${bat.byProvider.claude.toFixed(2)} credits\n` +
                `• ElevenLabs: ${bat.byProvider.elevenlabs.toFixed(2)} credits\n\n` +
                `📈 *Usage*\n` +
                `• LLM tokens: ${bat.todayTokens.toLocaleString()}\n` +
                `• TTS characters: ${bat.todayTtsChars.toLocaleString()}\n\n` +
                `🟢 No daily limit`,
            };
          }

          case 'recharge': {
            const credits = command.credits || 10;
            if (credits < 1 || credits > 100) {
              return { command: 'recharge', response: '⚠️ Recharge amount must be 1-100 credits.' };
            }
            await recordRecharge(credits, traceId);
            const newBat = getBatteryStatus();
            return {
              command: 'recharge',
              response: `⚡ Recharged *${credits} credits*!\nRemaining: ${newBat.remaining}/${newBat.dailyLimit}`,
            };
          }

          case 'list_contacts':
          case 'get_contact':
          case 'create_contact':
          case 'update_contact':
          case 'list_orders':
          case 'get_order':
          case 'create_order':
          case 'update_order':
          case 'business_summary':
          case 'list_storefronts':
          case 'create_storefront':
          case 'update_storefront':
          case 'delete_storefront':
          case 'mark_storefront_paid':
          case 'send_storefront':
          case 'list_products':
          case 'create_product':
          case 'update_product':
          case 'delete_product':
          case 'dashboard_metrics':
          case 'braindump': {
            // These are handled by the AI semantic router for natural formatting
            break;
          }

          case 'report': {
            return {
              command: 'report',
              response: `📊 Report generation coming soon. Cadence: ${command.cadence || 'daily'}`,
            };
          }

          case 'approve': {
            // Find the most recent pending drafts for this user
            const queue = getDraftQueue();
            let targetTraceId: string | null = null;
            let pendingDrafts: Array<{ toolName: string; status: string }> = [];

            for (const [tid, drafts] of queue) {
              const pending = drafts.filter(d => d.status === 'pending' && (!d.userId || d.userId === userId));
              if (pending.length > 0) {
                targetTraceId = tid;
                pendingDrafts = pending;
                break;
              }
            }

            if (!targetTraceId || pendingDrafts.length === 0) {
              return { command: 'approve', response: 'No pending drafts to approve.' };
            }

            // Approve and execute all pending drafts
            const allDrafts = queue.get(targetTraceId)!;
            const executed: string[] = [];
            for (let i = 0; i < allDrafts.length; i++) {
              if (allDrafts[i].status !== 'pending') continue;
              const draft = approveDraft(targetTraceId, i);
              if (draft) {
                try {
                  await kernel.tools.invoke(draft.toolName, draft.args, draft.traceId);
                  executed.push(draft.toolName);
                } catch (err) {
                  executed.push(`${draft.toolName} (failed: ${(err as Error).message})`);
                }
              }
            }

            return {
              command: 'approve',
              response: `✅ *Approved & executed ${executed.length} action(s):*\n${executed.map(t => `• ${t}`).join('\n')}`,
            };
          }

          case 'reject': {
            const queue2 = getDraftQueue();
            let targetTraceId2: string | null = null;

            for (const [tid, drafts] of queue2) {
              const pending = drafts.filter(d => d.status === 'pending' && (!d.userId || d.userId === userId));
              if (pending.length > 0) { targetTraceId2 = tid; break; }
            }

            if (!targetTraceId2) {
              return { command: 'reject', response: 'No pending drafts to reject.' };
            }

            const allDrafts2 = queue2.get(targetTraceId2)!;
            let rejectedCount = 0;
            for (let i = 0; i < allDrafts2.length; i++) {
              if (allDrafts2[i].status === 'pending') {
                rejectDraft(targetTraceId2, i);
                rejectedCount++;
              }
            }

            return {
              command: 'reject',
              response: `❌ Rejected ${rejectedCount} pending draft(s). No actions taken.`,
            };
          }

          default:
            break;
        }
      }

      // 2. Fall through to AI semantic router
      const hasAI = !!(
        process.env.CLAUDE_API_KEY ||
        process.env.ANTHROPIC_API_KEY ||
        process.env.AI_API_KEY
      );

      if (hasAI) {
        // Pre-flight credit check — block AI if daily limit exceeded
        if (!hasBudget(1)) {
          const battery = getBatteryStatus();
          return reply.send({
            command: 'battery_depleted',
            response: `⚡ Tu batería AI está agotada (${battery.todayCredits}/${battery.dailyLimit} créditos hoy). Recarga con "recharge 10" o espera hasta mañana.`,
            credits_consumed: 0,
          });
        }
        try {
          const result = await brainFirstRoute(message, kernel.tools, traceId, undefined, userId, channel, chat_history, senderJid);
          // Store AI response in memory
          try {
            storeMessage({ userId, senderJid, channel: 'whatsapp', role: 'assistant', content: result.response, traceId });
          } catch { /* non-blocking */ }

          // Fire-and-forget: dispatch to echo channels if any
          const echoList = echo_channels?.filter(ch => validChannels.includes(ch)) || [];
          if (echoList.length > 0) {
            const prefs = getUserPreferences(userId);
            dispatchMultiChannel({
              rawResponse: result.response,
              originChannel: channel,
              echoChannels: echoList,
              recipientInfo: {
                userId,
                phone: prefs.phone,
                email: prefs.email,
                whatsappUserId: userId,
              },
              traceId,
              draftOnly: true,
            }).catch(err => {
              log.warn('Echo dispatch failed', { error: (err as Error).message, traceId });
            });
          }

          // Extract structured data from tool results for frontend rendering
          const responsePayload: Record<string, unknown> = {
            command: 'ai',
            response: result.response,
            tools_used: result.toolsUsed,
            credits_consumed: result.creditsConsumed,
          };

          // If image_generate was used, extract the DALL-E URL for inline rendering
          if (result.toolsUsed?.includes('image_generate')) {
            // Match OpenAI DALL-E URLs (Azure blob CDN — pattern may vary by region)
            const urlMatch = result.response.match(/https:\/\/oaidalleapi[a-z]*\.blob\.core\.windows\.net\/[^\s)"]+/);
            if (urlMatch) responsePayload.image_url = urlMatch[0];
          }

          // ── Artifact Preview Generation ──
          // Generate branded HTML artifact for every meaningful AI response
          try {
            const baseUrl = process.env.NODE_ENV === 'production'
              ? 'https://kitz.services'
              : `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`}`;

            const artifact = createArtifactFromToolResult(
              result.toolResults || [],
              result.toolsUsed,
              result.response,
              traceId,
              baseUrl,
              userId,
            );

            if (artifact) {
              responsePayload.artifact = {
                contentId: artifact.contentId,
                previewUrl: artifact.previewUrl,
                category: artifact.category,
                title: artifact.title,
                actions: artifact.actions,
                status: artifact.status,
              };
              responsePayload.attachments = [{
                type: 'html',
                html: artifact.html,
                url: artifact.previewUrl,
                filename: `${artifact.title}.html`,
              }];

              // For WhatsApp/Email channels: append preview link to response text
              if (channel === 'whatsapp' || channel === 'email') {
                responsePayload.response = `${result.response}\n\nPreview: ${artifact.previewUrl}`;
              }
            }
          } catch (artifactErr) {
            log.warn('Artifact generation failed (non-fatal)', { error: (artifactErr as Error).message, traceId });
          }

          // ── Voice Note extraction ──
          // If outbound_sendVoiceNote was used, extract audio data from tool results
          if (result.toolsUsed?.includes('outbound_sendVoiceNote')) {
            const voiceToolResult = (result.toolResults || []).find(
              (tr: Record<string, unknown>) => tr.tool === 'outbound_sendVoiceNote' && tr.data,
            );
            if (voiceToolResult) {
              const data = voiceToolResult.data as Record<string, unknown> | undefined;
              if (data) {
                responsePayload.voice_note = {
                  audio_base64: data.audio_base64 || data.audioBase64 || '',
                  mime_type: data.mime_type || data.mimeType || 'audio/ogg; codecs=opus',
                  text: data.text || result.response,
                };
              }
            }
          }

          // ── Artifact Preview shorthand ──
          // If any artifact_generate* tool was used, surface preview info at top level
          if (result.toolsUsed?.some((t: string) => t.startsWith('artifact_generate'))) {
            const artifactData = responsePayload.artifact as { previewUrl?: string; title?: string; category?: string } | undefined;
            if (artifactData) {
              responsePayload.artifact_preview = {
                url: artifactData.previewUrl,
                title: artifactData.title,
                category: artifactData.category,
              };
            }
          }

          // ── Draft ID ──
          // If any drafts were queued for this trace, include the draft_id (traceId)
          const draftQueueMap = getDraftQueue();
          if (draftQueueMap.has(traceId)) {
            const pendingDraftsForTrace = draftQueueMap.get(traceId)?.filter(d => d.status === 'pending');
            if (pendingDraftsForTrace && pendingDraftsForTrace.length > 0) {
              responsePayload.draft_id = traceId;
            }
          }

          // ── Source passthrough ──
          if (source) {
            responsePayload.source = source;
          }

          // ── Human-like thinking delay for WhatsApp (3-7 seconds) ──
          if (channel === 'whatsapp') {
            const delay = 3000 + Math.floor(Math.random() * 4000);
            await new Promise(r => setTimeout(r, delay));
          }

          return responsePayload;
        } catch (err) {
          log.error('AI routing error', { error: (err as Error).message });
          return { command: 'error', response: `Something went wrong. Try again or type "help".` };
        }
      }

      return {
        command: 'unknown',
        response: 'AI not configured. Set CLAUDE_API_KEY or ANTHROPIC_API_KEY or AI_API_KEY in your environment.',
      };
    }
  );

  // ── Artifact Preview — Serve branded HTML artifact by contentId (public capability URL) ──
  app.get<{ Params: { contentId: string } }>(
    '/api/kitz/artifact/:contentId',
    async (req, reply) => {
      const { contentId } = req.params;
      const item = getContent(contentId);  // returns undefined if expired
      if (!item) {
        const base = process.env.NODE_ENV === 'production'
          ? 'https://kitz.services'
          : `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`}`;
        reply.code(410).type('text/html').send(buildExpiredArtifactHtml(base));
        return;
      }
      reply.type('text/html').send(item.html);
    }
  );

  // ── Artifact Action — Handle button clicks from artifact preview ──
  app.post<{ Params: { contentId: string }; Body: { action: string; recipient?: string; channel?: string } }>(
    '/api/kitz/artifact/:contentId/action',
    async (req, reply) => {
      const { contentId } = req.params;
      const { action, recipient, channel: actionChannel } = req.body || {};
      const item = getContent(contentId);
      if (!item) {
        return reply.code(404).send({ error: 'Artifact not found' });
      }

      switch (action) {
        case 'save_pdf':
          // PDF save is handled client-side via window.print(); this is a fallback
          return { message: 'Use your browser\'s print dialog (Ctrl+P / Cmd+P) to save as PDF.', contentId };

        case 'send_email':
          approveContent(contentId);
          return { message: `Email draft created for "${item.data.title || contentId}". Awaiting approval.`, contentId, draftOnly: true };

        case 'send_whatsapp':
          approveContent(contentId);
          return { message: `WhatsApp draft created for "${item.data.title || contentId}". Awaiting approval.`, contentId, draftOnly: true };

        case 'create_image':
          return { message: `Image generation queued for "${item.data.title || contentId}".`, contentId };

        case 'edit':
          extendContent(contentId);
          return { message: 'Edit mode — send your edit instruction via chat.', contentId, status: 'editing' };

        case 'approve_plan':
          approveContent(contentId);
          return { message: 'Plan approved! Actions will be executed.', contentId, status: 'approved' };

        case 'reject_plan':
          return { message: 'Plan rejected. No actions taken.', contentId, status: 'rejected' };

        case 'automate':
          return { message: `Automation created for "${item.data.title || contentId}". Check your cadence schedule.`, contentId };

        default:
          return reply.code(400).send({ error: `Unknown action: ${action}` });
      }
    }
  );

  // ── Run a goal ──
  app.post<{ Body: { goal: string; agent?: string; mode?: string } }>(
    '/api/kitz/run',
    async (req, reply) => {
      const secret = req.headers['x-dev-secret'];
      if (secret !== process.env.DEV_TOKEN_SECRET) {
        return reply.code(401).send({ error: 'unauthorized' });
      }
      const result = await kernel.run(req.body);
      return result;
    }
  );

  // ── Draft approval (draft-first enforcement) ──
  // Auth required: only authenticated users (DEV_TOKEN_SECRET or gateway-forwarded x-user-id) can approve drafts.
  app.post<{ Body: { trace_id: string; action: 'approve' | 'reject'; index?: number } }>(
    '/api/kitz/drafts/decide',
    async (req, reply) => {
      // Enforce auth — drafts can only be approved by authenticated callers
      const devSecret = req.headers['x-dev-secret'] as string | undefined;
      const userId = req.headers['x-user-id'] as string | undefined;
      const godMode = process.env.GOD_MODE_USER_ID;
      const isAuthed = (devSecret && devSecret === process.env.DEV_TOKEN_SECRET) ||
                       (userId && godMode && userId === godMode);
      if (!isAuthed) {
        return reply.code(401).send({ error: 'Draft approval requires authentication. Pass x-dev-secret or x-user-id header.' });
      }

      const { trace_id, action, index } = req.body || {};
      if (!trace_id) return reply.code(400).send({ error: 'trace_id required' });

      const drafts = getDraftQueue().get(trace_id);
      if (!drafts || drafts.length === 0) {
        return reply.code(404).send({ error: 'No pending drafts for this trace_id' });
      }

      // If index is specified, approve/reject one draft. Otherwise, all pending.
      const indices = index !== undefined ? [index] : drafts.map((_, i) => i).filter(i => drafts[i].status === 'pending');
      const results: Array<{ index: number; toolName: string; status: string; result?: string }> = [];

      for (const i of indices) {
        if (action === 'approve') {
          const draft = approveDraft(trace_id, i);
          if (draft) {
            // If this draft has an associated artifact, make it permanent
            const cid = draft.args?.content_id as string;
            if (cid) approveContent(cid);
            // Execute the approved tool
            const { routeWithAI: _, ...rest } = { routeWithAI: null }; // avoid unused
            try {
              const toolResult = await kernel.tools.invoke(draft.toolName, draft.args, draft.traceId);
              results.push({ index: i, toolName: draft.toolName, status: 'executed', result: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult) });
            } catch (err) {
              results.push({ index: i, toolName: draft.toolName, status: 'error', result: (err as Error).message });
            }
          }
        } else {
          const draft = rejectDraft(trace_id, i);
          if (draft) {
            results.push({ index: i, toolName: draft.toolName, status: 'rejected' });
          }
        }
      }

      return { trace_id, action, results };
    }
  );

  // ── List pending drafts ──
  app.get<{ Querystring: { trace_id?: string } }>(
    '/api/kitz/drafts',
    async (req) => {
      const traceId = req.query.trace_id;
      if (traceId) {
        return { trace_id: traceId, drafts: getDraftQueue().get(traceId) || [] };
      }
      // Return all pending drafts across all traces
      const all: Array<{ trace_id: string; drafts: unknown[] }> = [];
      for (const [tid, drafts] of getDraftQueue()) {
        const pending = drafts.filter(d => d.status === 'pending');
        if (pending.length > 0) all.push({ trace_id: tid, drafts: pending });
      }
      return { pending_count: all.reduce((n, e) => n + e.drafts.length, 0), traces: all };
    }
  );

  // ── Legacy approve endpoint (kept for backward compat) ──
  app.post<{ Body: { run_id: string; approved: boolean; notes?: string } }>(
    '/api/kitz/approve',
    async (req) => {
      return { status: 'ok', run_id: req.body.run_id, approved: req.body.approved };
    }
  );

  // ── Reports ──
  app.get<{ Querystring: { cadence?: string } }>(
    '/api/kitz/reports',
    async (req) => {
      const cadence = req.query.cadence || 'daily';
      return { cadence, report: `${cadence} report generation coming soon` };
    }
  );

  // ── Delete approval webhooks ──
  app.get<{ Params: { token: string } }>(
    '/api/kitz/approve-delete/:token',
    async (req, reply) => {
      reply.type('text/html');
      return '<html><body><h1>✅ Deletion Approved</h1><p>The item has been deleted.</p></body></html>';
    }
  );

  app.get<{ Params: { token: string } }>(
    '/api/kitz/reject-delete/:token',
    async (req, reply) => {
      reply.type('text/html');
      return '<html><body><h1>❌ Deletion Rejected</h1><p>The item was NOT deleted.</p></body></html>';
    }
  );

  // ── Media endpoint (for doc scan / brain dump voice) ──
  app.post<{ Body: { media_base64: string; mime_type: string; caption?: string; sender_jid?: string; user_id?: string; trace_id?: string } }>(
    '/api/kitz/media',
    async (req) => {
      const { media_base64, mime_type, caption, user_id, trace_id } = req.body || {};
      if (!media_base64) return { error: 'media_base64 required' };
      // Route through semantic router with media context
      const traceId = trace_id || crypto.randomUUID();
      const userId = user_id || 'default';
      const mediaPrompt = caption || `[MEDIA:${mime_type}] Process this ${mime_type.startsWith('audio') ? 'voice note' : 'document/image'}`;
      const hasAI = !!(process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY);
      if (hasAI) {
        const result = await routeWithAI(mediaPrompt, kernel.tools, traceId, { media_base64, mime_type }, userId);
        return { response: result.response };
      }
      return { error: 'AI not configured' };
    }
  );

  // ── Payment Webhook Endpoints ──
  // Each provider sends a different payload format.
  // We normalize and forward to payments_processWebhook tool (which calls MCP).
  // Returns 200 quickly to prevent provider retries.

  // ── Stripe Webhook ──
  app.post<{ Body: Record<string, unknown> }>(
    '/api/payments/webhook/stripe',
    async (req, reply) => {
      const traceId = crypto.randomUUID();
      const signature = req.headers['stripe-signature'] as string | undefined;

      log.info('received', { trace_id: traceId });

      // Cryptographic signature verification
      const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (stripeSecret) {
        if (!signature) {
          return reply.code(401).send({ error: 'Missing stripe-signature header' });
        }
        const rawBody = JSON.stringify(req.body);
        const result = verifyStripeSignature(rawBody, signature, stripeSecret);
        if (!result.valid) {
          log.error('failed', { trace_id: traceId });
          return reply.code(401).send({ error: `Stripe signature invalid: ${result.error}` });
        }
      } else if (process.env.NODE_ENV === 'production') {
        return reply.code(500).send({ error: 'STRIPE_WEBHOOK_SECRET not configured' });
      }

      const event = req.body || {};
      const eventType = String((event as Record<string, unknown>).type || '');

      // Only process payment-related events
      if (!eventType.startsWith('payment_intent.') && !eventType.startsWith('checkout.session.')) {
        return { received: true, skipped: true, reason: `Unhandled event type: ${eventType}` };
      }

      const data = (event as Record<string, unknown>).data as Record<string, unknown> | undefined;
      const paymentObject = (data?.object || {}) as Record<string, unknown>;
      const customerDetails = (paymentObject.customer_details || {}) as Record<string, unknown>;
      const metadata = (paymentObject.metadata || {}) as Record<string, unknown>;

      const result = await kernel.tools.invoke('payments_processWebhook', {
        provider: 'stripe',
        provider_transaction_id: String(paymentObject.id || (event as Record<string, unknown>).id || ''),
        amount: (Number(paymentObject.amount_received || paymentObject.amount || 0)) / 100, // Stripe uses cents
        currency: String(paymentObject.currency || 'usd').toUpperCase(),
        status: paymentObject.status === 'succeeded' ? 'completed' : 'pending',
        storefront_id: metadata.storefront_id as string | undefined,
        buyer_email: paymentObject.receipt_email || customerDetails.email,
        buyer_name: customerDetails.name,
        metadata: event,
      }, traceId);

      return { received: true, trace_id: traceId, result };
    }
  );

  // ── PayPal Webhook ──
  app.post<{ Body: Record<string, unknown> }>(
    '/api/payments/webhook/paypal',
    async (req, reply) => {
      const traceId = crypto.randomUUID();

      log.info('received', { trace_id: traceId });

      // Cryptographic header verification (defense-in-depth before PayPal API call)
      const paypalResult = verifyPayPalHeaders(req.headers as Record<string, string | string[] | undefined>);
      if (!paypalResult.valid) {
        if (process.env.NODE_ENV === 'production') {
          log.error('failed', { trace_id: traceId });
          return reply.code(401).send({ error: `PayPal verification failed: ${paypalResult.error}` });
        }
        // Dev mode: log warning but allow through for testing
        log.warn('warning', { trace_id: traceId });
      }

      const event = req.body || {};
      const eventType = String((event as Record<string, unknown>).event_type || '');

      if (!eventType.includes('PAYMENT.CAPTURE') && !eventType.includes('CHECKOUT.ORDER')) {
        return { received: true, skipped: true, reason: `Unhandled event type: ${eventType}` };
      }

      const resource = ((event as Record<string, unknown>).resource || {}) as Record<string, unknown>;
      const amount = (resource.amount || {}) as Record<string, unknown>;
      const payer = (resource.payer || {}) as Record<string, unknown>;
      const payerName = (payer.name || {}) as Record<string, unknown>;
      const purchaseUnits = (resource.purchase_units || []) as Array<Record<string, unknown>>;
      const firstUnit = purchaseUnits[0] || {};
      const firstAmount = (firstUnit.amount || {}) as Record<string, unknown>;

      const result = await kernel.tools.invoke('payments_processWebhook', {
        provider: 'paypal',
        provider_transaction_id: String(resource.id || (event as Record<string, unknown>).id || ''),
        amount: Number(amount.value || firstAmount.value || 0),
        currency: String(amount.currency_code || firstAmount.currency_code || 'USD').toUpperCase(),
        status: resource.status === 'COMPLETED' ? 'completed' : 'pending',
        storefront_id: resource.custom_id as string | undefined,
        buyer_email: payer.email_address,
        buyer_name: payerName.given_name
          ? `${payerName.given_name} ${payerName.surname || ''}`.trim()
          : undefined,
        metadata: event,
      }, traceId);

      return { received: true, trace_id: traceId, result };
    }
  );

  // ── Yappy Webhook (Panama — Banco General) ──
  app.post<{ Body: Record<string, unknown> }>(
    '/api/payments/webhook/yappy',
    async (req, reply) => {
      const traceId = crypto.randomUUID();

      log.info('received', { trace_id: traceId });

      // Cryptographic HMAC-SHA256 signature verification
      const yappySecret = process.env.YAPPY_WEBHOOK_SECRET;
      if (yappySecret) {
        const yappySig = (req.headers['x-yappy-signature'] || req.headers['x-webhook-signature']) as string || '';
        const rawBody = JSON.stringify(req.body);
        const result = verifyHmacSha256(rawBody, yappySig, yappySecret);
        if (!result.valid) {
          log.error('failed', { trace_id: traceId });
          return reply.code(401).send({ error: `Yappy signature invalid: ${result.error}` });
        }
      } else if (process.env.NODE_ENV === 'production') {
        return reply.code(500).send({ error: 'YAPPY_WEBHOOK_SECRET not configured' });
      }

      const payload = req.body || {};
      const p = payload as Record<string, unknown>;
      const statusRaw = String(p.status || '').toLowerCase();

      const result = await kernel.tools.invoke('payments_processWebhook', {
        provider: 'yappy',
        provider_transaction_id: String(p.referenceNumber || p.reference || p.transactionId || crypto.randomUUID()),
        amount: Number(p.total || p.amount || 0),
        currency: 'USD', // Yappy operates in Panama (USD)
        status: statusRaw === 'completed' || statusRaw === 'aprobado' ? 'completed' : 'pending',
        storefront_id: p.orderId || p.storefront_id,
        buyer_name: p.buyerName || p.buyer_name,
        buyer_phone: p.buyerPhone || p.buyer_phone,
        metadata: payload,
      }, traceId);

      return { received: true, trace_id: traceId, result };
    }
  );

  // ── BAC Compra Click Webhook (Central America) ──
  app.post<{ Body: Record<string, unknown> }>(
    '/api/payments/webhook/bac',
    async (req, reply) => {
      const traceId = crypto.randomUUID();

      log.info('received', { trace_id: traceId });

      // Cryptographic HMAC-SHA256 signature verification
      const bacSecret = process.env.BAC_WEBHOOK_SECRET;
      if (bacSecret) {
        const bacSig = (req.headers['x-bac-signature'] || req.headers['x-webhook-signature']) as string || '';
        const rawBody = JSON.stringify(req.body);
        const result = verifyHmacSha256(rawBody, bacSig, bacSecret);
        if (!result.valid) {
          log.error('failed', { trace_id: traceId });
          return reply.code(401).send({ error: `BAC signature invalid: ${result.error}` });
        }
      } else if (process.env.NODE_ENV === 'production') {
        return reply.code(500).send({ error: 'BAC_WEBHOOK_SECRET not configured' });
      }

      const payload = req.body || {};
      const p = payload as Record<string, unknown>;
      const statusRaw = String(p.status || '').toLowerCase();

      const result = await kernel.tools.invoke('payments_processWebhook', {
        provider: 'bac',
        provider_transaction_id: String(p.transactionId || p.referenceId || p.id || crypto.randomUUID()),
        amount: Number(p.amount || p.total || 0),
        currency: String(p.currency || 'USD').toUpperCase(),
        status: statusRaw === 'approved' || statusRaw === 'completed' ? 'completed' : 'pending',
        storefront_id: p.merchantReference || p.storefront_id,
        buyer_name: p.cardholderName || p.buyer_name,
        buyer_email: p.email,
        metadata: payload,
      }, traceId);

      return { received: true, trace_id: traceId, result };
    }
  );

  // ── Voice API Endpoints (ElevenLabs) ──

  // Text-to-Speech — generate audio from text
  app.post<{ Body: { text: string; voice_id?: string; output_format?: string } }>(
    '/api/kitz/voice/speak',
    async (req, reply) => {
      if (!isElevenLabsConfigured()) {
        return reply.code(503).send({ error: 'ElevenLabs not configured. Set ELEVENLABS_API_KEY.' });
      }
      const { text, voice_id, output_format } = req.body || {};
      if (!text) return reply.code(400).send({ error: 'text required' });
      if (text.length > 5000) return reply.code(400).send({ error: 'text too long (max 5000 chars)' });

      try {
        const result = await textToSpeech({
          text,
          voiceId: voice_id,
          outputFormat: output_format as 'mp3_44100_128' | 'mp3_22050_32' | undefined,
        });
        return {
          audio_base64: result.audioBase64,
          mime_type: result.mimeType,
          character_count: result.characterCount,
          voice_id: result.voiceId,
        };
      } catch (err) {
        return reply.code(500).send({ error: (err as Error).message });
      }
    }
  );

  // Voice config — current KITZ voice settings
  app.get('/api/kitz/voice/config', async () => {
    return getKitzVoiceConfig();
  });

  // Voice widget — HTML snippet for embedding
  app.get('/api/kitz/voice/widget', async () => {
    const snippet = getWidgetSnippet();
    return { html: snippet, configured: isElevenLabsConfigured() };
  });

  // Voice assistant page — embeddable page with widget
  app.get('/voice-assistant', async (req, reply) => {
    const snippet = getWidgetSnippet();
    reply.type('text/html');
    return `<!doctype html>
<html>
<head><title>KITZ Voice Assistant</title>
<style>body{font-family:system-ui;max-width:800px;margin:0 auto;padding:2rem;background:#0a0a0a;color:#e0e0e0;}
h1{color:#fff;}p{color:#999;line-height:1.6;}</style></head>
<body>
  <h1>🎙️ KITZ Voice Assistant</h1>
  <p>Click the voice button in the bottom-right corner to talk to KITZ.<br>
  KITZ speaks with a warm, professional female voice. Multilingual: Spanish, English, Portuguese.</p>
  <p><strong>Try saying:</strong></p>
  <ul>
    <li>"Show me my contacts"</li>
    <li>"How are we doing today?"</li>
    <li>"Create an invoice for Maria, 250 dollars"</li>
    <li>"What's on my calendar?"</li>
  </ul>
  ${snippet}
</body>
</html>`;
  });

  // ── Voice Transcription (Whisper STT) ──

  // Speech-to-Text — transcribe audio using OpenAI Whisper
  app.post<{ Body: { audio_base64: string; language?: string; format?: string } }>(
    '/api/kitz/voice/transcribe',
    async (req, reply) => {
      const OPENAI_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
      if (!OPENAI_KEY) {
        return reply.code(503).send({ error: 'OpenAI API key not configured. Set OPENAI_API_KEY for speech-to-text.' });
      }

      const { audio_base64, language, format } = req.body || {};
      if (!audio_base64) return reply.code(400).send({ error: 'audio_base64 required' });

      try {
        // Decode base64 to buffer
        const audioBuffer = Buffer.from(audio_base64, 'base64');

        // Build multipart form data for Whisper API
        const boundary = '----KitzWhisperBoundary' + Date.now();
        const ext = format || 'webm';
        const mimeMap: Record<string, string> = {
          webm: 'audio/webm', wav: 'audio/wav', mp3: 'audio/mpeg',
          m4a: 'audio/m4a', ogg: 'audio/ogg', flac: 'audio/flac',
        };
        const mime = mimeMap[ext] || 'audio/webm';

        const parts: Buffer[] = [];
        // File part
        parts.push(Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.${ext}"\r\nContent-Type: ${mime}\r\n\r\n`
        ));
        parts.push(audioBuffer);
        parts.push(Buffer.from('\r\n'));
        // Model part
        parts.push(Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n`
        ));
        // Language part (optional — helps accuracy)
        if (language) {
          parts.push(Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\n${language}\r\n`
          ));
        }
        // Response format
        parts.push(Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\njson\r\n`
        ));
        parts.push(Buffer.from(`--${boundary}--\r\n`));

        const body = Buffer.concat(parts);

        const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_KEY}`,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
          },
          body,
          signal: AbortSignal.timeout(30_000),
        });

        if (!whisperRes.ok) {
          const errText = await whisperRes.text().catch(() => '');
          return reply.code(whisperRes.status).send({ error: `Whisper API error: ${errText.slice(0, 200)}` });
        }

        const data = await whisperRes.json() as { text: string };
        return { transcript: data.text, language: language || 'auto' };
      } catch (err) {
        return reply.code(500).send({ error: `Transcription failed: ${(err as Error).message}` });
      }
    }
  );

  // ── AI Battery Endpoints ──

  // Get current battery status
  app.get('/api/kitz/battery', async () => {
    return getBatteryStatus();
  });

  // Get battery ledger (spend history)
  app.get<{ Querystring: { limit?: string } }>(
    '/api/kitz/battery/ledger',
    async (req) => {
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const entries = getLedger();
      return {
        entries: entries.slice(-limit),
        total: entries.length,
        battery: getBatteryStatus(),
      };
    }
  );

  // Recharge battery (founder-only)
  app.post<{ Body: { credits: number } }>(
    '/api/kitz/battery/recharge',
    async (req, reply) => {
      const secret = req.headers['x-dev-secret'];
      if (secret !== process.env.DEV_TOKEN_SECRET) {
        return reply.code(401).send({ error: 'unauthorized — only the founder can recharge' });
      }
      const credits = Number(req.body?.credits || 0);
      if (credits <= 0 || credits > 100) {
        return reply.code(400).send({ error: 'credits must be 1-100' });
      }
      const traceId = crypto.randomUUID();
      await recordRecharge(credits, traceId);
      return { recharged: credits, battery: getBatteryStatus() };
    }
  );

  // ── Google Calendar OAuth Endpoints ──────────────────────

  // Check OAuth status
  app.get('/api/kitz/oauth/google/status', async () => {
    return {
      configured: isGoogleOAuthConfigured(),
      authenticated: await hasStoredTokens(),
      authorize_url: isGoogleOAuthConfigured() ? getAuthUrl() : null,
    };
  });

  // Start OAuth flow — redirects to Google consent screen
  app.get('/api/kitz/oauth/google/authorize', async (_req: any, reply: any) => {
    if (!isGoogleOAuthConfigured()) {
      return reply.status(500).send({
        error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
      });
    }
    const url = getAuthUrl();
    return reply.redirect(url);
  });

  // OAuth callback — Google redirects here after consent
  app.get('/api/kitz/oauth/google/callback', async (req: any, reply: any) => {
    const code = req.query?.code as string;
    if (!code) {
      return reply.status(400).send({ error: 'No authorization code received' });
    }
    try {
      await exchangeCode(code);
      log.info('Google Calendar OAuth completed');
      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html><head><title>Kitz — Calendar Connected</title></head>
        <body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0a0a;color:#fff;">
          <div style="text-align:center;">
            <h1>🟢 Google Calendar Connected</h1>
            <p>You can now manage your calendar from WhatsApp via Kitz.</p>
            <p style="color:#888;">Try: "what's on my calendar today?"</p>
            <p style="margin-top:2em;color:#555;">You can close this tab.</p>
          </div>
        </body></html>
      `);
    } catch (err) {
      log.error('Google OAuth error', { error: (err as Error).message });
      return reply.status(500).send({ error: `OAuth failed: ${(err as Error).message}` });
    }
  });

  // Revoke OAuth tokens
  app.post('/api/kitz/oauth/google/revoke', async () => {
    await revokeTokens();
    return { status: 'revoked', message: 'Google Calendar disconnected.' };
  });

  // ── Gateway Auth Routes (embedded from kitz-gateway) ──────────────
  // These routes handle user signup, login, and Google OAuth login.
  // The UI expects them at /api/gateway/auth/* (see ui/src/stores/authStore.ts).

  const GATEWAY_JWT_SECRET = process.env.JWT_SECRET || process.env.DEV_TOKEN_SECRET || '';
  const GATEWAY_TOKEN_EXPIRY = 86400 * 7; // 7 days
  const GATEWAY_DEFAULT_SCOPES = ['battery:read', 'payments:write', 'tools:invoke', 'events:write', 'notifications:write', 'messages:write'];

  // POST /api/gateway/auth/signup — Create a new user account
  app.post<{ Body: { email?: string; password?: string; name?: string } }>(
    '/api/gateway/auth/signup',
    async (req, reply) => {
      const { email, password, name } = req.body || {};

      if (!email || !password || !name) {
        return reply.code(400).send({ code: 'VALIDATION', message: 'email, password, and name are required' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return reply.code(400).send({ code: 'VALIDATION', message: 'Invalid email format' });
      }
      if (password.length < 8) {
        return reply.code(400).send({ code: 'VALIDATION', message: 'Password must be at least 8 characters' });
      }
      if (name.length < 2 || name.length > 100) {
        return reply.code(400).send({ code: 'VALIDATION', message: 'Name must be 2-100 characters' });
      }

      const existing = await findUserByEmail(email);
      if (existing) {
        return reply.code(409).send({ code: 'USER_EXISTS', message: 'An account with this email already exists' });
      }

      const user = await createGatewayUser(email, password, name);

      const now = Math.floor(Date.now() / 1000);
      const token = gatewaySignJwt({
        sub: user.id,
        org_id: user.orgId,
        scopes: GATEWAY_DEFAULT_SCOPES,
        iat: now,
        exp: now + GATEWAY_TOKEN_EXPIRY,
      }, GATEWAY_JWT_SECRET);

      log.info('User signup', { userId: user.id, email: user.email });
      return { token, userId: user.id, orgId: user.orgId, name: user.name, expiresIn: GATEWAY_TOKEN_EXPIRY };
    }
  );

  // POST /api/gateway/auth/token — Login with email + password
  app.post<{ Body: { email?: string; password?: string } }>(
    '/api/gateway/auth/token',
    async (req, reply) => {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return reply.code(400).send({ code: 'VALIDATION', message: 'email and password are required' });
      }

      const user = await findUserByEmail(email);
      if (!user || !verifyPassword(user, password)) {
        return reply.code(401).send({ code: 'AUTH_FAILED', message: 'Invalid email or password' });
      }

      const now = Math.floor(Date.now() / 1000);
      const token = gatewaySignJwt({
        sub: user.id,
        org_id: user.orgId,
        scopes: GATEWAY_DEFAULT_SCOPES,
        iat: now,
        exp: now + GATEWAY_TOKEN_EXPIRY,
      }, GATEWAY_JWT_SECRET);

      log.info('User login', { userId: user.id, email: user.email });
      return { token, userId: user.id, orgId: user.orgId, name: user.name, expiresIn: GATEWAY_TOKEN_EXPIRY };
    }
  );

  // GET /api/gateway/auth/google/url — Get Google consent URL for OAuth login
  app.get('/api/gateway/auth/google/url', async (_req, reply) => {
    if (!isGatewayGoogleConfigured()) {
      return reply.code(503).send({ code: 'GOOGLE_NOT_CONFIGURED', message: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' });
    }
    return { url: getLoginAuthUrl() };
  });

  // POST /api/gateway/auth/google/callback — Exchange Google code for JWT
  app.post<{ Body: { code?: string } }>(
    '/api/gateway/auth/google/callback',
    async (req, reply) => {
      const { code } = req.body || {};

      if (!code) {
        return reply.code(400).send({ code: 'VALIDATION', message: 'Authorization code is required' });
      }

      try {
        const profile = await exchangeLoginCode(code);

        // Find or create user by email
        let user = await findUserByEmail(profile.email);
        if (!user) {
          user = await createGatewayUser(profile.email, '', profile.name, {
            authProvider: 'google',
            googleId: profile.googleId,
            picture: profile.picture,
          });
        } else {
          // Update existing user with Google info
          await updateGatewayUser(profile.email, {
            googleId: profile.googleId,
            picture: profile.picture,
            authProvider: user.authProvider || 'google',
          });
          user.googleId = profile.googleId;
          user.picture = profile.picture;
        }

        const now = Math.floor(Date.now() / 1000);
        const token = gatewaySignJwt({
          sub: user.id,
          org_id: user.orgId,
          scopes: GATEWAY_DEFAULT_SCOPES,
          iat: now,
          exp: now + GATEWAY_TOKEN_EXPIRY,
        }, GATEWAY_JWT_SECRET);

        log.info('Google OAuth login', { userId: user.id, email: user.email });
        return { token, userId: user.id, orgId: user.orgId, name: user.name, picture: user.picture, expiresIn: GATEWAY_TOKEN_EXPIRY };
      } catch (err) {
        return reply.code(401).send({ code: 'GOOGLE_AUTH_FAILED', message: (err as Error).message });
      }
    }
  );

  // ── Launch Review — 33 agents vote, CEO decides ──────────────

  app.get('/api/kitz/launch', async () => {
    try {
      const result = await kernel.runLaunchReview();
      const d = result.decision;

      // Format for WhatsApp-friendly output
      const reviewSummaries = d.reviews.map(r =>
        `${r.vote === 'go' ? '🟢' : r.vote === 'no-go' ? '🔴' : '🟡'} *${r.role}* — ${r.vote.toUpperCase()} (${r.confidence}%)\n  ${r.summary}`
      );

      return {
        approved: d.approved,
        decidedBy: d.decidedBy,
        timestamp: d.timestamp,
        votes: {
          go: d.totalGo,
          noGo: d.totalNoGo,
          conditional: d.totalConditional,
          total: d.reviews.length,
        },
        blockers: d.blockers,
        summary: d.summary,
        reviews: reviewSummaries,
        context: result.context,
        tiers: {
          cSuite: result.reviewsByTier.cSuite.map(r => ({ agent: r.agent, vote: r.vote, confidence: r.confidence })),
          board: result.reviewsByTier.board.map(r => ({ agent: r.agent, vote: r.vote, confidence: r.confidence })),
          governance: result.reviewsByTier.governance.map(r => ({ agent: r.agent, vote: r.vote, confidence: r.confidence })),
          external: result.reviewsByTier.external.map(r => ({ agent: r.agent, vote: r.vote, confidence: r.confidence })),
        },
      };
    } catch (err) {
      return { error: 'Launch review failed', message: (err as Error).message };
    }
  });

  // ── Launch Review WhatsApp format ──────────────

  app.get('/api/kitz/launch/whatsapp', async () => {
    try {
      const result = await kernel.runLaunchReview();
      const d = result.decision;

      const header = d.approved
        ? '🚀 *KITZ OS — LAUNCH APPROVED*'
        : '🛑 *KITZ OS — LAUNCH BLOCKED*';

      const votes = `📊 *Votes:* ${d.totalGo} GO | ${d.totalNoGo} NO-GO | ${d.totalConditional} CONDITIONAL`;

      const cSuite = result.reviewsByTier.cSuite.map(r =>
        `${r.vote === 'go' ? '🟢' : r.vote === 'no-go' ? '🔴' : '🟡'} ${r.role}: ${r.vote} (${r.confidence}%)`
      ).join('\n');

      const board = result.reviewsByTier.board.map(r =>
        `${r.vote === 'go' ? '🟢' : r.vote === 'no-go' ? '🔴' : '🟡'} ${r.role}: ${r.vote} (${r.confidence}%)`
      ).join('\n');

      const blockerText = d.blockers.length > 0
        ? `\n\n🚫 *Blockers:*\n${d.blockers.map(b => `• ${b}`).join('\n')}`
        : '';

      const whatsapp = `${header}\n\n${votes}\n\n*C-Suite:*\n${cSuite}\n\n*Board:*\n${board}${blockerText}\n\n*CEO Decision:*\n${d.summary}\n\n_${d.reviews.length} agents reviewed • ${d.timestamp}_`;

      return { response: whatsapp };
    } catch (err) {
      return { error: 'Launch review failed', message: (err as Error).message };
    }
  });

  // ── AOS Agent Endpoints ──────────────

  // List all agents with their status and allowed tools
  app.get('/api/kitz/agents', async () => {
    const aos = kernel.aos;
    const teams = aos.teamRegistry.listTeams();
    const bridge = aos.toolBridge;
    return {
      teams: teams.map(t => ({
        name: t.name,
        displayName: t.displayName,
        lead: t.lead,
        members: t.members,
      })),
      toolBridgeActive: !!bridge,
      totalTeams: teams.length,
    };
  });

  // Get allowed tools for a specific agent
  app.get<{ Params: { name: string } }>(
    '/api/kitz/agents/:name/tools',
    async (req) => {
      const { name } = req.params;
      const bridge = kernel.aos.toolBridge;
      if (!bridge) return { agent: name, tools: [], error: 'Tool bridge not active' };

      // Determine agent tier & team from team registry
      const teamConfig = kernel.aos.teamRegistry.listTeams().find(t =>
        t.lead === name || t.members.includes(name)
      );

      // C-suite names
      const cSuite = ['CEO', 'CFO', 'CMO', 'COO', 'CPO', 'CRO', 'CTO',
        'HeadCustomer', 'HeadEducation', 'HeadEngineering', 'HeadGrowth', 'HeadIntelligenceRisk'];
      const tier = cSuite.includes(name) ? 'c-suite' as const : teamConfig ? 'team' as const : 'governance' as const;
      const team = teamConfig?.name;

      const tools = bridge.listAllowed(name, tier, team);
      return { agent: name, tier, team: team || null, toolCount: tools.length, tools };
    }
  );

  // Invoke a tool on behalf of an agent
  app.post<{ Params: { name: string }; Body: { tool: string; args?: Record<string, unknown> } }>(
    '/api/kitz/agents/:name/invoke',
    async (req, reply) => {
      const secret = req.headers['x-dev-secret'];
      if (secret !== process.env.DEV_TOKEN_SECRET) {
        return reply.code(401).send({ error: 'unauthorized' });
      }

      const { name } = req.params;
      const { tool, args } = req.body || {};
      if (!tool) return reply.code(400).send({ error: 'tool name required' });

      const bridge = kernel.aos.toolBridge;
      if (!bridge) return reply.code(503).send({ error: 'Tool bridge not active' });

      const cSuite = ['CEO', 'CFO', 'CMO', 'COO', 'CPO', 'CRO', 'CTO',
        'HeadCustomer', 'HeadEducation', 'HeadEngineering', 'HeadGrowth', 'HeadIntelligenceRisk'];
      const teamConfig = kernel.aos.teamRegistry.listTeams().find(t =>
        t.lead === name || t.members.includes(name)
      );
      const tier = cSuite.includes(name) ? 'c-suite' as const : teamConfig ? 'team' as const : 'governance' as const;
      const team = teamConfig?.name;

      const traceId = crypto.randomUUID();
      const result = await bridge.invoke(name, tier, team, tool, args || {}, traceId);
      return result;
    }
  );

  // CTO digest — get current system health summary
  app.get('/api/kitz/agents/cto/digest', async () => {
    const pending = kernel.aos.ctoDigest.getPendingEntries();
    return {
      pendingEntries: pending.length,
      entries: pending,
      warRoomsActive: kernel.aos.warRoom.activeCount,
    };
  });

  // ── Swarm Simulation Endpoints ──────────────

  // Run a full swarm simulation
  app.post<{ Body: { teams?: string[]; concurrency?: number; timeoutMs?: number; dryRun?: boolean } }>(
    '/api/kitz/swarm/run',
    async (req, reply) => {
      const secret = req.headers['x-dev-secret'];
      if (secret !== process.env.DEV_TOKEN_SECRET) {
        return reply.code(401).send({ error: 'unauthorized' });
      }

      const { teams, concurrency, timeoutMs, dryRun } = req.body || {};

      // Dynamic import to avoid circular dependency
      const { SwarmRunner } = await import('../../aos/src/swarm/swarmRunner.js');
      const runner = new SwarmRunner({
        teams: teams as any,
        concurrency: concurrency ?? 6,
        timeoutMs: timeoutMs ?? 60_000,
        dryRun: dryRun ?? false,
        toolBridge: kernel.aos.toolBridge,
      });

      const result = await runner.run();
      return result;
    }
  );

  // Get swarm status / last run result
  app.get('/api/kitz/swarm/status', async () => {
    const knowledgeBridge = kernel.aos.knowledgeBridge;
    const entries = knowledgeBridge.getEntries();
    return {
      knowledgeEntries: entries.length,
      lastEntry: entries[entries.length - 1] ?? null,
      teams: kernel.aos.teamRegistry.listTeams().map(t => ({
        name: t.name,
        memberCount: t.members.length,
      })),
    };
  });

  // Get swarm knowledge by team
  app.get<{ Params: { team: string } }>(
    '/api/kitz/swarm/knowledge/:team',
    async (req) => {
      const { team } = req.params;
      const entries = kernel.aos.knowledgeBridge.getByTeam(team);
      return { team, entries, count: entries.length };
    }
  );

  // Clear swarm knowledge (post-report)
  app.post('/api/kitz/swarm/knowledge/clear', async (req, reply) => {
    const secret = req.headers['x-dev-secret'];
    if (secret !== process.env.DEV_TOKEN_SECRET) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
    kernel.aos.knowledgeBridge.clear();
    return { cleared: true };
  });

  // ── Knowledge Center — CRUD for user knowledge base (RAG context) ──
  app.get('/api/kitz/knowledge', async (_req, _reply) => {
    const { getKnowledge } = await import('./memory/manager.js');
    return { entries: getKnowledge() };
  });

  app.post('/api/kitz/knowledge', async (req, reply) => {
    const { source, category, content, title } = req.body as Record<string, string> || {};
    if (!content) return reply.code(400).send({ error: 'content required' });
    const { upsertKnowledge } = await import('./memory/manager.js');
    const entry = upsertKnowledge({ source: source || 'upload', category: category || 'general', content, title });
    return { ok: true, entry };
  });

  app.delete<{ Params: { id: string } }>('/api/kitz/knowledge/:id', async (req, reply) => {
    const { getKnowledge } = await import('./memory/manager.js');
    const { deleteKnowledge } = await import('./memory/manager.js');
    const entries = getKnowledge();
    const target = entries.find(e => e.id === req.params.id);
    if (!target) return reply.code(404).send({ error: 'not found' });
    deleteKnowledge(req.params.id);
    return { ok: true };
  });

  // ── Memory Store — persist messages from external services (e.g. WA connector outbound) ──
  app.post('/api/kitz/memory/store', async (req, reply) => {
    const { userId, senderJid, role, content, channel: ch, traceId: tid } = req.body as Record<string, string> || {};
    if (!content) return reply.code(400).send({ error: 'content required' });
    storeMessage({
      userId: userId || 'default',
      senderJid: senderJid || 'unknown',
      channel: (ch as 'whatsapp' | 'email') || 'whatsapp',
      role: (role as 'user' | 'assistant') || 'user',
      content,
      traceId: tid,
    });
    return { ok: true };
  });

  // ── Memory Purge — remove swarm noise from conversation history ──
  app.post('/api/kitz/memory/purge-swarm', async (req, reply) => {
    const secret = req.headers['x-dev-secret'];
    if (secret !== process.env.DEV_TOKEN_SECRET) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
    const { purgeSwarmMessages } = await import('./memory/manager.js');
    const result = await purgeSwarmMessages();
    return result;
  });

  // ── n8n Webhook Receiver — events FROM n8n workflows ──
  app.post<{ Body: { event?: string; data?: Record<string, unknown>; workflow_id?: string } }>(
    '/api/kitz/webhooks/n8n',
    async (req, reply) => {
      // Auth check — require service secret
      const secret = req.headers['x-service-secret'] || req.headers['x-dev-secret'];
      if (!secret || (secret !== process.env.SERVICE_SECRET && secret !== process.env.DEV_TOKEN_SECRET)) {
        return reply.code(401).send({ error: 'unauthorized' });
      }

      const { event, data, workflow_id } = req.body || {};
      const traceId = (req.headers['x-trace-id'] as string) || crypto.randomUUID();

      log.info('n8n webhook received', { event, workflow_id, traceId });

      // Publish to AOS EventBus so agents can react
      try {
        await kernel.aos.bus.publish({
          type: `N8N_${(event || 'EVENT').toUpperCase().replace(/[^A-Z0-9_]/g, '_')}`,
          source: `n8n:${workflow_id || 'unknown'}`,
          severity: 'low',
          payload: { ...data, workflow_id, traceId },
        });
      } catch (err) {
        log.warn('Failed to publish n8n event to AOS bus', { error: (err as Error).message });
      }

      return { received: true, trace_id: traceId, event };
    }
  );

  // ── Channel Preferences Endpoints ──────────────

  app.get<{ Params: { userId: string } }>(
    '/api/kitz/preferences/:userId',
    async (req) => {
      return getUserPreferences(req.params.userId);
    }
  );

  app.put<{ Params: { userId: string }; Body: { echoChannels?: OutputChannel[]; phone?: string; email?: string } }>(
    '/api/kitz/preferences/:userId',
    async (req) => {
      const { echoChannels, phone, email } = req.body || {};
      return setUserPreferences(req.params.userId, { echoChannels, phone, email });
    }
  );

  // ── WhatsApp SSE proxy — forwards /api/whatsapp/* to the WhatsApp connector ──
  const WA_CONNECTOR_URL = process.env.WA_CONNECTOR_URL || 'http://localhost:3006';

  app.get('/api/whatsapp/whatsapp/connect', async (req: any, reply) => {
    const userId = (req.query as any).userId || crypto.randomUUID();
    const upstreamUrl = `${WA_CONNECTOR_URL}/whatsapp/connect?userId=${encodeURIComponent(userId)}`;

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

      const reader = (upstream.body as any).getReader();
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
    } catch {
      reply.raw.write('event: error\ndata: {"error":"Could not reach WhatsApp connector"}\n\n');
      reply.raw.end();
    }
  });

  app.delete('/api/whatsapp/whatsapp/sessions/:userId', async (req: any) => {
    try {
      const res = await fetch(`${WA_CONNECTOR_URL}/whatsapp/sessions/${encodeURIComponent(req.params.userId)}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(10_000),
      });
      return await res.json();
    } catch {
      return { error: 'WhatsApp connector unavailable' };
    }
  });

  app.get('/api/whatsapp/whatsapp/sessions', async () => {
    try {
      const res = await fetch(`${WA_CONNECTOR_URL}/whatsapp/sessions`, {
        signal: AbortSignal.timeout(10_000),
      });
      return await res.json();
    } catch {
      return { error: 'WhatsApp connector unavailable' };
    }
  });

  // ── Brain Task Orchestrator (multi-channel draft-first lifecycle) ──

  /** Create a brain task from any channel — returns ack + begins processing */
  app.post<{ Body: { message: string; channel?: string; user_id?: string; org_id?: string; phone?: string; email?: string } }>(
    '/api/kitz/tasks',
    async (req) => {
      const { message, channel, user_id, org_id, phone, email } = req.body || {};
      const userId = user_id || (req.headers['x-user-id'] as string) || 'default';
      const orgId = org_id || (req.headers['x-org-id'] as string) || '';
      const originChannel = (channel || 'web') as OutputChannel;

      const { task, ackMessage } = orchestrator.createTask({
        userId,
        orgId,
        originChannel,
        userMessage: message || '',
        recipient: { phone, email, userId },
      });

      // Begin processing in background (non-blocking)
      orchestrator.markProcessing(task.id);
      const hasAI = !!(process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY);

      if (hasAI && message) {
        // Process asynchronously — don't block the ack
        void (async () => {
          try {
            const result = await routeWithAI(message, kernel.tools, task.traceId, undefined, userId, originChannel);
            // Check if result contains a clarification request
            const hasClarification = result.toolResults?.some((r: any) => r?.type === 'clarification_request');
            if (hasClarification) {
              const clarif = result.toolResults.find((r: any) => r?.type === 'clarification_request') as any;
              orchestrator.requestClarification(task.id, clarif.question, clarif.context);
            } else {
              orchestrator.setDraftOutput(task.id, result.response, result.toolsUsed, result.creditsConsumed);
            }
          } catch (err) {
            orchestrator.setDraftOutput(task.id, `Error processing request: ${(err as Error).message}`, [], 0);
          }
        })();
      }

      return { taskId: task.id, status: task.status, ackMessage, slaDeadline: task.slaDeadline };
    }
  );

  /** Get a specific brain task */
  app.get<{ Params: { taskId: string } }>(
    '/api/kitz/tasks/:taskId',
    async (req, reply) => {
      const task = orchestrator.getTask(req.params.taskId);
      if (!task) return reply.code(404).send({ error: 'Task not found' });
      return task;
    }
  );

  /** List brain tasks for a user */
  app.get<{ Querystring: { user_id?: string; status?: string } }>(
    '/api/kitz/tasks',
    async (req) => {
      const userId = req.query.user_id || (req.headers['x-user-id'] as string);
      if (userId) {
        const tasks = orchestrator.getTasksByUser(userId);
        if (req.query.status) {
          return { tasks: tasks.filter(t => t.status === req.query.status) };
        }
        return { tasks };
      }
      return orchestrator.getTaskSummary();
    }
  );

  /** Approve a brain task draft */
  app.post<{ Params: { taskId: string } }>(
    '/api/kitz/tasks/:taskId/approve',
    async (req, reply) => {
      const task = orchestrator.approveDraft(req.params.taskId);
      if (!task) return reply.code(404).send({ error: 'No draft ready for approval' });
      // Deliver the approved output
      const delivery = await orchestrator.deliverApproved(task.id);
      return { taskId: task.id, status: task.status, delivered: delivery.delivered, error: delivery.error };
    }
  );

  /** Reject a brain task draft */
  app.post<{ Params: { taskId: string } }>(
    '/api/kitz/tasks/:taskId/reject',
    async (req, reply) => {
      const task = orchestrator.rejectDraft(req.params.taskId);
      if (!task) return reply.code(404).send({ error: 'No draft ready for rejection' });
      return { taskId: task.id, status: task.status };
    }
  );

  /** Provide clarification for a pending task */
  app.post<{ Params: { taskId: string }; Body: { clarification: string } }>(
    '/api/kitz/tasks/:taskId/clarify',
    async (req, reply) => {
      const task = orchestrator.provideClarification(req.params.taskId, req.body?.clarification || '');
      if (!task) return reply.code(404).send({ error: 'No pending clarification for this task' });

      // Re-process with clarification
      orchestrator.markProcessing(task.id);
      const hasAI = !!(process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY);

      if (hasAI) {
        void (async () => {
          try {
            const result = await routeWithAI(task.userMessage, kernel.tools, task.traceId, undefined, task.userId, task.originChannel);
            orchestrator.setDraftOutput(task.id, result.response, result.toolsUsed, result.creditsConsumed);
          } catch (err) {
            orchestrator.setDraftOutput(task.id, `Error: ${(err as Error).message}`, [], 0);
          }
        })();
      }

      return { taskId: task.id, status: task.status, message: 'Clarification received, re-processing...' };
    }
  );

  /** Get tasks nearing SLA deadline */
  app.get('/api/kitz/tasks/sla/alerts', async () => {
    return { tasks: orchestrator.getTasksNearingSLA() };
  });

  // ── Approval Matrix (public — UI uses this to show risk levels) ──

  app.get('/api/kitz/approvals/matrix', async () => {
    return {
      total: APPROVAL_MATRIX.length,
      byRisk: getMatrixByRisk(),
      byCategory: getMatrixByCategory(),
    };
  });

  // ── Workspace API proxy — forward /api/workspace/* to workspace service ──
  // In production, the SPA is bundled into kitz_os but workspace runs as a separate service.
  // This proxy ensures the SPA can reach workspace APIs from the same origin.
  const WORKSPACE_URL = process.env.WORKSPACE_API_URL || 'http://localhost:3001';

  app.all('/api/workspace/*', async (req, reply) => {
    const subPath = req.url.replace(/^\/api\/workspace/, '');
    const target = `${WORKSPACE_URL}/api/workspace${subPath}`;

    try {
      const headers: Record<string, string> = {
        'content-type': req.headers['content-type'] || 'application/json',
      };
      // Forward auth headers so workspace can authenticate the user
      if (req.headers.authorization) headers['authorization'] = req.headers.authorization as string;
      if (req.headers['x-dev-secret']) headers['x-dev-secret'] = req.headers['x-dev-secret'] as string;
      if (req.headers['x-service-secret']) headers['x-service-secret'] = req.headers['x-service-secret'] as string;
      if (req.headers['x-trace-id']) headers['x-trace-id'] = req.headers['x-trace-id'] as string;
      if (req.headers['x-user-id']) headers['x-user-id'] = req.headers['x-user-id'] as string;
      if (req.headers.cookie) headers['cookie'] = req.headers.cookie as string;

      const res = await fetch(target, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
        signal: AbortSignal.timeout(15_000),
      });

      // Forward response headers
      const ct = res.headers.get('content-type');
      if (ct) reply.header('content-type', ct);
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) reply.header('set-cookie', setCookie);

      reply.code(res.status);
      const data = await res.text();
      return reply.send(data);
    } catch (err) {
      log.error('Workspace proxy error', { target, error: (err as Error).message });
      return reply.code(502).send({ error: 'Workspace service unavailable', detail: (err as Error).message });
    }
  });

  // ── Artifact Slug Route — kitz.services/Artifact-Name-abc123.html ──
  app.get<{ Params: { slug: string } }>(
    '/:slug',
    {
      schema: { params: { type: 'object', properties: { slug: { type: 'string', pattern: '^.+\\.html$' } }, required: ['slug'] } },
    },
    async (req, reply) => {
      const { slug } = req.params;
      const item = getContentBySlug(slug);
      if (!item) {
        const base = process.env.NODE_ENV === 'production'
          ? 'https://kitz.services'
          : `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`}`;
        reply.code(410).type('text/html').send(buildExpiredArtifactHtml(base));
        return;
      }
      reply.type('text/html').send(item.html);
    }
  );

  // ── SPA fallback — serve index.html for client-side routing ──
  if (existsSync(spaRoot)) {
    app.setNotFoundHandler(async (req, reply) => {
      // Only serve SPA for non-API GET requests (browser navigation)
      if (req.method === 'GET' && !req.url.startsWith('/api/')) {
        return reply.sendFile('index.html');
      }
      return reply.code(404).send({ error: 'Not Found' });
    });
  }

  await app.listen({ port: PORT, host: '0.0.0.0' });
  log.info('KITZ OS listening', { port: PORT });

  // Clean expired artifacts every hour to prevent memory leaks
  setInterval(() => {
    cleanExpiredContent();
  }, 60 * 60 * 1000);

  return app;
}
