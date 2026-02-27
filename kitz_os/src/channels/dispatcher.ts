/**
 * Multi-Channel Dispatcher — Routes formatted output to connector endpoints.
 *
 * Reuses existing connector infrastructure:
 * - WhatsApp → kitz-whatsapp-connector /outbound/send
 * - Email → kitz-email-connector /outbound/send
 * - SMS → comms-api /text
 * - Voice → comms-api /talk
 * - Web → no-op (returned inline)
 */

import type {
  OutputChannel,
  MultiChannelDispatchRequest,
  MultiChannelDispatchResult,
} from 'kitz-schemas';
import { formatForChannel } from './responseFormatter.js';

const WA_CONNECTOR_URL = process.env.WA_CONNECTOR_URL || 'http://localhost:3006';
const EMAIL_CONNECTOR_URL = process.env.EMAIL_CONNECTOR_URL || 'http://localhost:3007';
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

async function sendToChannel(
  channel: OutputChannel,
  rawResponse: string,
  recipient: MultiChannelDispatchRequest['recipientInfo'],
  traceId: string,
  orgId?: string,
  draftOnly = true,
): Promise<{ status: string; error?: string }> {
  const formatted = formatForChannel(rawResponse, channel);

  try {
    switch (channel) {
      case 'whatsapp': {
        if (!recipient.phone) return { status: 'skipped', error: 'No phone number' };
        const res = await fetch(`${WA_CONNECTOR_URL}/outbound/send`, {
          method: 'POST',
          headers: serviceHeaders(traceId, orgId),
          body: JSON.stringify({
            phone: recipient.phone,
            message: formatted.body,
            draftOnly,
            userId: recipient.whatsappUserId || recipient.userId,
          }),
          signal: AbortSignal.timeout(15_000),
        });
        return res.ok ? { status: draftOnly ? 'draft' : 'sent' } : { status: 'failed', error: `WA ${res.status}` };
      }

      case 'email': {
        if (!recipient.email) return { status: 'skipped', error: 'No email address' };
        const res = await fetch(`${EMAIL_CONNECTOR_URL}/outbound/send`, {
          method: 'POST',
          headers: serviceHeaders(traceId, orgId),
          body: JSON.stringify({
            to: recipient.email,
            subject: formatted.subject || 'KITZ Update',
            body: formatted.body,
            html: formatted.html,
            draftOnly,
          }),
          signal: AbortSignal.timeout(10_000),
        });
        return res.ok ? { status: draftOnly ? 'draft' : 'sent' } : { status: 'failed', error: `Email ${res.status}` };
      }

      case 'sms': {
        if (!recipient.phone) return { status: 'skipped', error: 'No phone number' };
        const res = await fetch(`${COMMS_API_URL}/text`, {
          method: 'POST',
          headers: serviceHeaders(traceId, orgId),
          body: JSON.stringify({
            to: recipient.phone,
            message: formatted.body,
          }),
          signal: AbortSignal.timeout(10_000),
        });
        return res.ok ? { status: 'draft' } : { status: 'failed', error: `SMS ${res.status}` };
      }

      case 'voice': {
        if (!recipient.phone) return { status: 'skipped', error: 'No phone number' };
        const res = await fetch(`${COMMS_API_URL}/talk`, {
          method: 'POST',
          headers: serviceHeaders(traceId, orgId),
          body: JSON.stringify({
            to: recipient.phone,
            message: formatted.ttsText || formatted.body,
          }),
          signal: AbortSignal.timeout(10_000),
        });
        return res.ok ? { status: 'draft' } : { status: 'failed', error: `Voice ${res.status}` };
      }

      case 'web':
        return { status: 'inline' };

      default:
        return { status: 'skipped', error: `Unknown channel: ${channel}` };
    }
  } catch (err) {
    return { status: 'failed', error: err instanceof Error ? err.message : String(err) };
  }
}

export async function dispatchMultiChannel(
  request: MultiChannelDispatchRequest,
): Promise<MultiChannelDispatchResult> {
  const { rawResponse, originChannel, echoChannels, recipientInfo, traceId, orgId, draftOnly } = request;

  // Origin channel is already handled inline (web) or by the caller (whatsapp)
  const originDelivery = { channel: originChannel, status: 'inline' };

  // Dispatch to all echo channels in parallel
  const echoResults = await Promise.allSettled(
    echoChannels
      .filter(ch => ch !== originChannel)
      .map(async (channel) => {
        const result = await sendToChannel(channel, rawResponse, recipientInfo, traceId, orgId, draftOnly);
        return { channel, ...result };
      }),
  );

  const echoDeliveries = echoResults.map((r) => {
    if (r.status === 'fulfilled') return r.value;
    return { channel: 'web' as OutputChannel, status: 'failed', error: String(r.reason) };
  });

  return { originDelivery, echoDeliveries, traceId };
}
