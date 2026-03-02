/**
 * Multi-Channel Dispatcher — Routes formatted output via registered channel plugins.
 *
 * Replaces the hardcoded switch statement with a plugin-based architecture.
 * Channel plugins register themselves; the dispatcher iterates over them.
 *
 * Fallback: If no plugin is registered for a channel, uses legacy direct HTTP calls.
 */

import type {
  OutputChannel,
  MultiChannelDispatchRequest,
  MultiChannelDispatchResult,
} from 'kitz-schemas';
import { createSubsystemLogger } from 'kitz-schemas';
import { formatForChannel } from './responseFormatter.js';
import { getChannel, registerChannel, getAllChannels, getChannelHealth } from './channelPlugin.js';
import type { SendResult } from './channelPlugin.js';

// ── Register built-in channel plugins ──

import { whatsappChannel } from './whatsappChannel.js';
import { emailChannel } from './emailChannel.js';
import { webChannel } from './webChannel.js';

const log = createSubsystemLogger('dispatcher');

// Auto-register built-in channels on import
registerChannel(whatsappChannel);
registerChannel(emailChannel);
registerChannel(webChannel);

// ── Legacy fallback for SMS/Voice (no plugin yet) ──

const COMMS_API_URL = process.env.COMMS_API_URL || 'http://localhost:3013';
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';

function serviceHeaders(traceId: string, orgId?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-trace-id': traceId,
    ...(orgId ? { 'x-org-id': orgId } : {}),
    ...(SERVICE_SECRET ? { 'x-service-secret': SERVICE_SECRET } : {}),
  };
}

async function legacySendToChannel(
  channel: OutputChannel,
  rawResponse: string,
  recipient: MultiChannelDispatchRequest['recipientInfo'],
  traceId: string,
  orgId?: string,
): Promise<{ status: string; error?: string }> {
  const formatted = formatForChannel(rawResponse, channel);

  try {
    switch (channel) {
      case 'sms': {
        if (!recipient.phone) return { status: 'skipped', error: 'No phone number' };
        const res = await fetch(`${COMMS_API_URL}/text`, {
          method: 'POST',
          headers: serviceHeaders(traceId, orgId),
          body: JSON.stringify({ to: recipient.phone, message: formatted.body }),
          signal: AbortSignal.timeout(10_000),
        });
        return res.ok ? { status: 'draft' } : { status: 'failed', error: `SMS ${res.status}` };
      }

      case 'voice': {
        if (!recipient.phone) return { status: 'skipped', error: 'No phone number' };
        const res = await fetch(`${COMMS_API_URL}/talk`, {
          method: 'POST',
          headers: serviceHeaders(traceId, orgId),
          body: JSON.stringify({ to: recipient.phone, message: formatted.ttsText || formatted.body }),
          signal: AbortSignal.timeout(10_000),
        });
        return res.ok ? { status: 'draft' } : { status: 'failed', error: `Voice ${res.status}` };
      }

      default:
        return { status: 'skipped', error: `Unknown channel: ${channel}` };
    }
  } catch (err) {
    return { status: 'failed', error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Unified dispatch ──

async function sendViaPlugin(
  channel: OutputChannel,
  rawResponse: string,
  recipient: MultiChannelDispatchRequest['recipientInfo'],
  traceId: string,
  orgId?: string,
  draftOnly = true,
): Promise<SendResult> {
  const plugin = getChannel(channel);

  if (plugin) {
    const formatted = formatForChannel(rawResponse, channel);
    return plugin.send(formatted, {
      recipientId: recipient.userId,
      phone: recipient.phone,
      email: recipient.email,
      whatsappUserId: recipient.whatsappUserId,
      traceId,
      orgId,
      draftOnly,
    });
  }

  // Fallback for channels without plugins (SMS, Voice)
  const result = await legacySendToChannel(channel, rawResponse, recipient, traceId, orgId);
  return result as SendResult;
}

export async function dispatchMultiChannel(
  request: MultiChannelDispatchRequest,
): Promise<MultiChannelDispatchResult> {
  const { rawResponse, originChannel, echoChannels, recipientInfo, traceId, orgId, draftOnly } = request;

  // Origin channel is already handled inline (web) or by the caller (whatsapp)
  const originDelivery = { channel: originChannel, status: 'inline' };

  // Dispatch to all echo channels in parallel via plugins
  const echoResults = await Promise.allSettled(
    echoChannels
      .filter(ch => ch !== originChannel)
      .map(async (channel) => {
        const result = await sendViaPlugin(channel, rawResponse, recipientInfo, traceId, orgId, draftOnly);
        return { channel, ...result };
      }),
  );

  const echoDeliveries = echoResults.map((r) => {
    if (r.status === 'fulfilled') return r.value;
    return { channel: 'web' as OutputChannel, status: 'failed', error: String(r.reason) };
  });

  log.info('dispatch_complete', {
    traceId,
    origin: originChannel,
    echoCount: echoDeliveries.length,
    results: echoDeliveries.map(d => `${d.channel}:${d.status}`),
  });

  return { originDelivery, echoDeliveries, traceId };
}

// Re-export for convenience
export { registerChannel, getAllChannels, getChannelHealth };
