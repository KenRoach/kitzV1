/**
 * Meta Platform Connector — Instagram DMs + Facebook Messenger
 *
 * Handles:
 *   1. Webhook verification (GET challenge)
 *   2. Inbound messages (POST webhook)
 *   3. Outbound replies (Send API)
 *
 * Architecture:
 *   - Meta sends inbound DMs to our webhook endpoint
 *   - We forward to kitz_os /api/kitz for AI processing
 *   - kitz_os replies, we send back via Meta Send API
 *
 * Requires:
 *   META_VERIFY_TOKEN     — Webhook verification token (you choose this)
 *   META_PAGE_ACCESS_TOKEN — Page access token from Meta Developer App
 *   META_APP_SECRET        — App secret for signature verification
 *
 * Meta Messaging API reference:
 *   https://developers.facebook.com/docs/messenger-platform/reference/send-api
 *   https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('meta-connector');

// ── Config ──
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'kitz-verify-2024';
const META_PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const KITZ_OS_URL = process.env.KITZ_OS_URL || 'http://localhost:3012';
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';

const GRAPH_API = 'https://graph.facebook.com/v21.0';

// ── Webhook Verification ──

/**
 * GET handler — Meta sends a challenge to verify the webhook.
 * Returns the challenge string if the verify token matches.
 */
export function verifyWebhook(query: {
  'hub.mode'?: string;
  'hub.verify_token'?: string;
  'hub.challenge'?: string;
}): { status: number; body: string } {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
    log.info('webhook verified', { challenge: challenge?.slice(0, 20) });
    return { status: 200, body: challenge || '' };
  }

  log.warn('webhook verification failed', { mode, tokenMatch: token === META_VERIFY_TOKEN });
  return { status: 403, body: 'Forbidden' };
}

// ── Signature Verification ──

/**
 * Verify the X-Hub-Signature-256 header from Meta.
 * Returns true if signature matches (or if META_APP_SECRET not set — dev mode).
 */
export async function verifySignature(rawBody: string, signature: string | undefined): Promise<boolean> {
  if (!META_APP_SECRET) {
    log.warn('META_APP_SECRET not set — skipping signature verification (dev mode)');
    return true;
  }

  if (!signature) {
    log.warn('Missing X-Hub-Signature-256 header');
    return false;
  }

  try {
    const { createHmac } = await import('node:crypto');
    const expected = 'sha256=' + createHmac('sha256', META_APP_SECRET).update(rawBody).digest('hex');
    return signature === expected;
  } catch {
    return false;
  }
}

// ── Inbound Message Processing ──

interface MetaMessagingEntry {
  id: string;
  time: number;
  messaging?: Array<{
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
      mid: string;
      text?: string;
      attachments?: Array<{ type: string; payload: { url?: string } }>;
    };
    postback?: { title: string; payload: string };
  }>;
}

interface MetaWebhookBody {
  object: 'page' | 'instagram';
  entry: MetaMessagingEntry[];
}

/**
 * Process inbound Meta webhook (Messenger + Instagram DMs).
 * Extracts messages and forwards to kitz_os for AI processing.
 */
export async function processInbound(body: MetaWebhookBody): Promise<void> {
  const platform = body.object === 'instagram' ? 'instagram' : 'messenger';

  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      const senderId = event.sender.id;
      const recipientId = event.recipient.id;

      // Skip messages we sent (echo prevention)
      if (senderId === recipientId) continue;

      let messageText = '';

      if (event.message?.text) {
        messageText = event.message.text;
      } else if (event.postback) {
        messageText = event.postback.payload || event.postback.title;
      } else if (event.message?.attachments?.length) {
        // For media messages, describe the attachment
        const types = event.message.attachments.map(a => a.type).join(', ');
        messageText = `[${platform} attachment: ${types}]`;
      }

      if (!messageText) continue;

      log.info('inbound_message', {
        platform,
        senderId: senderId.slice(0, 8) + '...',
        messageId: event.message?.mid?.slice(0, 12),
        length: messageText.length,
      });

      // Forward to kitz_os
      try {
        const aiResponse = await forwardToKitzOS(messageText, senderId, platform);
        if (aiResponse) {
          await sendReply(senderId, aiResponse, platform);
        }
      } catch (err) {
        log.error('processing failed', { error: (err as Error).message, senderId: senderId.slice(0, 8) });
      }
    }
  }
}

// ── Forward to KITZ OS ──

async function forwardToKitzOS(message: string, senderId: string, platform: string): Promise<string> {
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
      sender: `${platform}:${senderId}`,
      user_id: senderId,
      trace_id: traceId,
      channel: platform === 'instagram' ? 'instagram' : 'messenger',
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

// ── Send Reply via Meta Send API ──

async function sendReply(recipientId: string, text: string, platform: string): Promise<boolean> {
  if (!META_PAGE_ACCESS_TOKEN) {
    log.warn('META_PAGE_ACCESS_TOKEN not set — cannot send reply', { platform });
    return false;
  }

  // Split long messages (Meta has 2000 char limit)
  const MAX_LENGTH = 2000;
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, MAX_LENGTH));
    remaining = remaining.slice(MAX_LENGTH);
  }

  let allSent = true;
  for (const chunk of chunks) {
    try {
      const endpoint = platform === 'instagram'
        ? `${GRAPH_API}/me/messages`
        : `${GRAPH_API}/me/messages`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          messaging_type: 'RESPONSE',
          message: { text: chunk },
          access_token: META_PAGE_ACCESS_TOKEN,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        log.error('send_failed', { platform, status: res.status, error: errText.slice(0, 200) });
        allSent = false;
      } else {
        log.info('reply_sent', { platform, recipientId: recipientId.slice(0, 8) + '...', length: chunk.length });
      }
    } catch (err) {
      log.error('send_error', { platform, error: (err as Error).message });
      allSent = false;
    }
  }

  return allSent;
}

/**
 * Check if Meta platform is configured.
 */
export function isMetaConfigured(): boolean {
  return !!(META_PAGE_ACCESS_TOKEN && META_VERIFY_TOKEN);
}
