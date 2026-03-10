/**
 * KITZ Social Connector — Fastify API for Instagram DMs, Facebook Messenger, and X/Twitter DMs
 *
 * This service:
 *   1. Receives webhook events from Meta (Instagram + Messenger)
 *   2. Receives webhook events from X/Twitter (Account Activity API)
 *   3. Forwards inbound DMs to kitz_os /api/kitz for AI processing
 *   4. Sends AI replies back via each platform's Send API
 *
 * Endpoints:
 *   GET  /health                    — Service health
 *   GET  /webhooks/meta             — Meta webhook verification (GET challenge)
 *   POST /webhooks/meta             — Meta inbound events (Messenger + Instagram)
 *   GET  /webhooks/twitter          — X CRC challenge
 *   POST /webhooks/twitter          — X Account Activity events (DMs)
 *   GET  /status                    — Platform connection status
 *   POST /twitter/register-webhook  — Register X webhook (admin)
 *   POST /twitter/subscribe         — Subscribe to X Account Activity (admin)
 *
 * Port: 3016 (configurable via PORT env)
 */

import 'dotenv/config';
import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import { createSubsystemLogger } from 'kitz-schemas';
import {
  verifyWebhook as metaVerify,
  verifySignature as metaVerifySignature,
  processInbound as metaProcess,
  isMetaConfigured,
} from './meta.js';
import {
  handleCRCChallenge,
  processInbound as twitterProcess,
  registerWebhook as twitterRegisterWebhook,
  subscribeToActivity as twitterSubscribe,
  isTwitterConfigured,
} from './twitter.js';

const log = createSubsystemLogger('social-connector');
const app = Fastify({ logger: true });

const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';

// ── Security headers ──
app.addHook('onSend', async (_req, reply) => {
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-XSS-Protection', '1; mode=block');
});

// ── Auth hook for admin endpoints ──
app.addHook('onRequest', async (req, reply) => {
  const path = req.url.split('?')[0];
  const skipAuth = path === '/health' ||
    path === '/status' ||
    path.startsWith('/webhooks/');
  if (skipAuth) return;

  const secret = req.headers['x-service-secret'] as string | undefined;
  const devSecret = req.headers['x-dev-secret'] as string | undefined;
  if (!SERVICE_SECRET) {
    // No secret configured — reject in production, warn in dev
    if (process.env.NODE_ENV === 'production') {
      return reply.code(503).send({ error: 'Service not configured' });
    }
  } else if (secret !== SERVICE_SECRET && devSecret !== process.env.DEV_TOKEN_SECRET) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
});

// ── Health ──
app.get('/health', async () => ({
  status: 'ok',
  service: 'kitz-social-connector',
  platforms: {
    meta: isMetaConfigured() ? 'configured' : 'not_configured',
    twitter: isTwitterConfigured() ? 'configured' : 'not_configured',
  },
}));

// ── Status ──
app.get('/status', async () => ({
  meta: {
    configured: isMetaConfigured(),
    platforms: ['instagram', 'messenger'],
    webhook: '/webhooks/meta',
  },
  twitter: {
    configured: isTwitterConfigured(),
    platforms: ['twitter'],
    webhook: '/webhooks/twitter',
  },
}));

// ═══════════════════════════════════════════
//  Meta Webhooks (Instagram DMs + Messenger)
// ═══════════════════════════════════════════

// GET — Webhook verification
app.get('/webhooks/meta', async (req: any, reply) => {
  const result = metaVerify(req.query || {});
  return reply.code(result.status).send(result.body);
});

// POST — Inbound events
app.post('/webhooks/meta', async (req: any, reply) => {
  // Verify signature
  const rawBody = JSON.stringify(req.body);
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const valid = await metaVerifySignature(rawBody, signature);

  if (!valid) {
    log.warn('invalid Meta signature');
    return reply.code(401).send({ error: 'Invalid signature' });
  }

  const body = req.body;

  // Only process messaging events
  if (body?.object !== 'page' && body?.object !== 'instagram') {
    return reply.code(200).send({ status: 'ignored', object: body?.object });
  }

  // Process asynchronously — acknowledge webhook immediately (Meta requires < 5s response)
  metaProcess(body).catch(err => {
    log.error('meta processing error', { error: (err as Error).message });
  });

  return { status: 'ok' };
});

// ═══════════════════════════════════════════
//  X/Twitter Webhooks (DMs)
// ═══════════════════════════════════════════

// GET — CRC challenge verification
app.get('/webhooks/twitter', async (req: any, reply) => {
  const crcToken = (req.query as any)?.crc_token;
  if (!crcToken) {
    return reply.code(400).send({ error: 'crc_token required' });
  }
  const result = await handleCRCChallenge(crcToken);
  return result;
});

// POST — Account Activity events
app.post('/webhooks/twitter', async (req: any) => {
  const body = req.body;

  // Process asynchronously — acknowledge immediately
  twitterProcess(body).catch(err => {
    log.error('twitter processing error', { error: (err as Error).message });
  });

  return { status: 'ok' };
});

// ═══════════════════════════════════════════
//  Admin Endpoints
// ═══════════════════════════════════════════

// Register X webhook
app.post('/twitter/register-webhook', async (req: any) => {
  const { webhook_url, env_name } = req.body || {};
  if (!webhook_url) {
    return { error: 'webhook_url required' };
  }
  return twitterRegisterWebhook(webhook_url, env_name || 'production');
});

// Subscribe to X Account Activity
app.post('/twitter/subscribe', async (req: any) => {
  const { env_name } = req.body || {};
  const ok = await twitterSubscribe(env_name || 'production');
  return { ok, env_name: env_name || 'production' };
});

// ── Start ──
async function boot() {
  const port = Number(process.env.PORT || 3016);
  await app.listen({ port, host: '0.0.0.0' });

  log.info(`social connector listening on port ${port}`);
  log.info('platforms', {
    meta: isMetaConfigured() ? '✅ configured' : '⚠️ not configured',
    twitter: isTwitterConfigured() ? '✅ configured' : '⚠️ not configured',
  });
}

boot();
