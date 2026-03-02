/**
 * WhatsApp Channel Plugin — Sends via kitz-whatsapp-connector.
 */

import type { ChannelFormattedOutput } from 'kitz-schemas';
import type { ChannelPlugin, ChannelCapabilities, ChannelStatus, SendOptions, SendResult, InboundHandler } from './channelPlugin.js';

const WA_CONNECTOR_URL = process.env.WA_CONNECTOR_URL || 'http://localhost:3006';
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';

function headers(traceId: string, orgId?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-trace-id': traceId,
    ...(orgId ? { 'x-org-id': orgId } : {}),
    ...(SERVICE_SECRET ? { 'x-service-secret': SERVICE_SECRET } : {}),
  };
}

export const whatsappChannel: ChannelPlugin = {
  id: 'whatsapp',
  name: 'WhatsApp',

  capabilities: {
    supportsMedia: true,
    supportsHtml: false,
    supportsTts: false,
    maxLength: 4096,
    requiresPhone: true,
    requiresEmail: false,
  } satisfies ChannelCapabilities,

  async send(formatted: ChannelFormattedOutput, options: SendOptions): Promise<SendResult> {
    if (!options.phone) return { status: 'skipped', error: 'No phone number' };
    const draftOnly = options.draftOnly ?? true;

    try {
      const res = await fetch(`${WA_CONNECTOR_URL}/outbound/send`, {
        method: 'POST',
        headers: headers(options.traceId, options.orgId),
        body: JSON.stringify({
          phone: options.phone,
          message: formatted.body,
          draftOnly,
          userId: options.whatsappUserId || options.recipientId,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      return res.ok
        ? { status: draftOnly ? 'draft' : 'sent' }
        : { status: 'failed', error: `WA ${res.status}` };
    } catch (err) {
      return { status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
  },

  onMessage(_handler: InboundHandler): void {
    // Inbound WhatsApp messages are handled by the whatsapp connector webhook
    // The connector POSTs to kitz_os /api/kitz/whatsapp/inbound
  },

  async getStatus(): Promise<ChannelStatus> {
    const start = Date.now();
    try {
      const res = await fetch(`${WA_CONNECTOR_URL}/health`, {
        signal: AbortSignal.timeout(5_000),
      });
      return {
        connected: res.ok,
        lastPingMs: Date.now() - start,
      };
    } catch (err) {
      return {
        connected: false,
        lastPingMs: Date.now() - start,
        error: err instanceof Error ? err.message : 'Unreachable',
      };
    }
  },
};
