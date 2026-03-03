/**
 * X/Twitter DM Connector — Receive and reply to Direct Messages
 *
 * Handles:
 *   1. Account Activity API (webhook registration)
 *   2. Inbound DMs via webhook events
 *   3. Outbound replies via DM Send API
 *
 * Architecture:
 *   - X sends DM events to our webhook (CRC challenge + events)
 *   - We forward to kitz_os /api/kitz for AI processing
 *   - kitz_os replies, we send back via X DM API
 *
 * Requires:
 *   X_API_KEY              — API Key (OAuth 1.0a consumer key)
 *   X_API_SECRET           — API Key Secret
 *   X_ACCESS_TOKEN         — Access Token
 *   X_ACCESS_SECRET        — Access Token Secret
 *   X_BEARER_TOKEN         — Bearer Token (for v2 API)
 *   X_WEBHOOK_ENV          — Account Activity API environment name
 *
 * X API v2 reference:
 *   https://developer.x.com/en/docs/twitter-api/direct-messages
 *   https://developer.x.com/en/docs/twitter-api/enterprise/account-activity-api
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('twitter-connector');

// ── Config ──
const X_API_KEY = process.env.X_API_KEY || '';
const X_API_SECRET = process.env.X_API_SECRET || '';
const X_ACCESS_TOKEN = process.env.X_ACCESS_TOKEN || '';
const X_ACCESS_SECRET = process.env.X_ACCESS_SECRET || '';
const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN || '';
const KITZ_OS_URL = process.env.KITZ_OS_URL || 'http://localhost:3012';
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';

const X_API_V2 = 'https://api.x.com/2';

// Track our own user ID to prevent echo loops
let ownUserId = '';

// ── OAuth 1.0a Signature (for Account Activity API) ──

async function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
): Promise<string> {
  const { createHmac, randomBytes } = await import('node:crypto');

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: X_API_KEY,
    oauth_nonce: randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: X_ACCESS_TOKEN,
    oauth_version: '1.0',
    ...params,
  };

  // Sort and encode parameters
  const sortedParams = Object.keys(oauthParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(oauthParams[k])}`)
    .join('&');

  const signatureBase = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(X_API_SECRET)}&${encodeURIComponent(X_ACCESS_SECRET)}`;
  const signature = createHmac('sha1', signingKey).update(signatureBase).digest('base64');

  oauthParams['oauth_signature'] = signature;

  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .filter(k => k.startsWith('oauth_'))
    .sort()
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ');

  return authHeader;
}

// ── CRC Challenge ──

/**
 * GET handler — X sends a CRC challenge to verify the webhook.
 * Returns the HMAC-SHA256 response token.
 */
export async function handleCRCChallenge(crcToken: string): Promise<{ response_token: string }> {
  const { createHmac } = await import('node:crypto');
  const hash = createHmac('sha256', X_API_SECRET).update(crcToken).digest('base64');
  const responseToken = `sha256=${hash}`;
  log.info('CRC challenge verified');
  return { response_token: responseToken };
}

// ── Inbound DM Processing ──

interface TwitterDMEvent {
  direct_message_events?: Array<{
    type: string;
    id: string;
    created_timestamp: string;
    message_create: {
      target: { recipient_id: string };
      sender_id: string;
      message_data: {
        text: string;
        entities?: Record<string, unknown>;
        attachment?: { type: string; media: { media_url_https: string } };
      };
    };
  }>;
  users?: Record<string, { id: string; name: string; screen_name: string }>;
  for_user_id?: string;
}

/**
 * Process inbound X/Twitter Account Activity webhook.
 * Filters for DM events and forwards to kitz_os.
 */
export async function processInbound(body: TwitterDMEvent): Promise<void> {
  // Track our own user ID to avoid echo loops
  if (body.for_user_id) ownUserId = body.for_user_id;

  const events = body.direct_message_events || [];

  for (const event of events) {
    if (event.type !== 'message_create') continue;

    const senderId = event.message_create.sender_id;
    const recipientId = event.message_create.target.recipient_id;
    const text = event.message_create.message_data.text;

    // Skip messages we sent (echo prevention)
    if (senderId === ownUserId) continue;

    if (!text) continue;

    const senderInfo = body.users?.[senderId];
    log.info('inbound_dm', {
      senderId: senderId.slice(0, 8) + '...',
      senderName: senderInfo?.screen_name || 'unknown',
      messageId: event.id.slice(0, 12),
      length: text.length,
    });

    // Forward to kitz_os
    try {
      const aiResponse = await forwardToKitzOS(text, senderId, senderInfo?.screen_name);
      if (aiResponse) {
        await sendDM(senderId, aiResponse);
      }
    } catch (err) {
      log.error('processing failed', { error: (err as Error).message, senderId: senderId.slice(0, 8) });
    }
  }
}

// ── Forward to KITZ OS ──

async function forwardToKitzOS(message: string, senderId: string, screenName?: string): Promise<string> {
  const traceId = crypto.randomUUID();

  const res = await fetch(`${KITZ_OS_URL}/api/kitz`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-service-secret': SERVICE_SECRET,
      'x-dev-secret': SERVICE_SECRET,
      'x-trace-id': traceId,
    },
    body: JSON.stringify({
      message,
      sender: `twitter:${senderId}${screenName ? `(@${screenName})` : ''}`,
      user_id: senderId,
      trace_id: traceId,
      channel: 'twitter',
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`kitz_os ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json() as { response?: string; reply?: string; message?: string };
  return data.response || data.reply || data.message || '';
}

// ── Send DM via X API v2 ──

async function sendDM(recipientId: string, text: string): Promise<boolean> {
  if (!X_BEARER_TOKEN && !X_ACCESS_TOKEN) {
    log.warn('X API tokens not set — cannot send DM');
    return false;
  }

  // Split long messages (X DM limit is 10000 chars)
  const MAX_LENGTH = 10000;
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, MAX_LENGTH));
    remaining = remaining.slice(MAX_LENGTH);
  }

  let allSent = true;
  for (const chunk of chunks) {
    try {
      // Use v2 DM endpoint with OAuth 2.0 Bearer token
      const res = await fetch(`${X_API_V2}/dm_conversations/with/${recipientId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${X_BEARER_TOKEN}`,
        },
        body: JSON.stringify({
          text: chunk,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        log.error('dm_send_failed', { status: res.status, error: errText.slice(0, 200) });
        allSent = false;

        // Fallback: try OAuth 1.0a endpoint (v1.1 legacy)
        const fallbackSent = await sendDMLegacy(recipientId, chunk);
        if (fallbackSent) allSent = true;
      } else {
        log.info('dm_sent', { recipientId: recipientId.slice(0, 8) + '...', length: chunk.length });
      }
    } catch (err) {
      log.error('dm_send_error', { error: (err as Error).message });
      allSent = false;
    }
  }

  return allSent;
}

/** Fallback: Send DM via v1.1 API with OAuth 1.0a */
async function sendDMLegacy(recipientId: string, text: string): Promise<boolean> {
  if (!X_API_KEY || !X_ACCESS_TOKEN) return false;

  try {
    const url = 'https://api.twitter.com/1.1/direct_messages/events/new.json';
    const authHeader = await generateOAuthSignature('POST', url, {});

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        event: {
          type: 'message_create',
          message_create: {
            target: { recipient_id: recipientId },
            message_data: { text },
          },
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      log.error('dm_legacy_failed', { status: res.status, error: errText.slice(0, 200) });
      return false;
    }

    log.info('dm_legacy_sent', { recipientId: recipientId.slice(0, 8) + '...' });
    return true;
  } catch (err) {
    log.error('dm_legacy_error', { error: (err as Error).message });
    return false;
  }
}

/**
 * Register webhook with X Account Activity API.
 * Call this once during setup to register the webhook URL.
 */
export async function registerWebhook(webhookUrl: string, envName: string): Promise<{ id: string } | { error: string }> {
  if (!X_API_KEY || !X_ACCESS_TOKEN) {
    return { error: 'X API credentials not configured' };
  }

  try {
    const url = `https://api.twitter.com/1.1/account_activity/all/${envName}/webhooks.json`;
    const authHeader = await generateOAuthSignature('POST', url, { url: webhookUrl });

    const res = await fetch(`${url}?url=${encodeURIComponent(webhookUrl)}`, {
      method: 'POST',
      headers: { 'Authorization': authHeader },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { error: `X API ${res.status}: ${errText.slice(0, 200)}` };
    }

    const data = await res.json() as { id: string };
    log.info('webhook registered', { webhookId: data.id, envName });
    return { id: data.id };
  } catch (err) {
    return { error: `Registration failed: ${(err as Error).message}` };
  }
}

/**
 * Subscribe to user's Account Activity.
 * Call this after webhook registration to start receiving DMs.
 */
export async function subscribeToActivity(envName: string): Promise<boolean> {
  if (!X_API_KEY || !X_ACCESS_TOKEN) return false;

  try {
    const url = `https://api.twitter.com/1.1/account_activity/all/${envName}/subscriptions.json`;
    const authHeader = await generateOAuthSignature('POST', url, {});

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': authHeader },
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 204 || res.ok) {
      log.info('subscribed to activity', { envName });
      return true;
    }

    log.error('subscription failed', { status: res.status });
    return false;
  } catch (err) {
    log.error('subscription error', { error: (err as Error).message });
    return false;
  }
}

/**
 * Check if X/Twitter platform is configured.
 */
export function isTwitterConfigured(): boolean {
  return !!(X_BEARER_TOKEN || (X_API_KEY && X_ACCESS_TOKEN));
}
