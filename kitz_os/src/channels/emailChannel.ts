/**
 * Email Channel Plugin — Sends via kitz-email-connector.
 */

import type { ChannelFormattedOutput } from 'kitz-schemas';
import type { ChannelPlugin, ChannelCapabilities, ChannelStatus, SendOptions, SendResult } from './channelPlugin.js';

const EMAIL_CONNECTOR_URL = process.env.EMAIL_CONNECTOR_URL || 'http://localhost:3007';
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';
const FROM_EMAIL = process.env.FROM_EMAIL_NOREPLY || 'KITZ <noreply@kitz.services>';

function headers(traceId: string, orgId?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-trace-id': traceId,
    ...(orgId ? { 'x-org-id': orgId } : {}),
    ...(SERVICE_SECRET ? { 'x-service-secret': SERVICE_SECRET } : {}),
  };
}

export const emailChannel: ChannelPlugin = {
  id: 'email',
  name: 'Email',

  capabilities: {
    supportsMedia: true,
    supportsHtml: true,
    supportsTts: false,
    maxLength: 50_000,
    requiresPhone: false,
    requiresEmail: true,
  } satisfies ChannelCapabilities,

  async send(formatted: ChannelFormattedOutput, options: SendOptions): Promise<SendResult> {
    if (!options.email) return { status: 'skipped', error: 'No email address' };
    const draftOnly = options.draftOnly ?? true;

    try {
      const res = await fetch(`${EMAIL_CONNECTOR_URL}/outbound/send`, {
        method: 'POST',
        headers: headers(options.traceId, options.orgId),
        body: JSON.stringify({
          to: options.email,
          from: FROM_EMAIL,
          subject: formatted.subject || 'KITZ Update',
          body: formatted.body,
          html: formatted.html,
          draftOnly,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      return res.ok
        ? { status: draftOnly ? 'draft' : 'sent' }
        : { status: 'failed', error: `Email ${res.status}` };
    } catch (err) {
      return { status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
  },

  async getStatus(): Promise<ChannelStatus> {
    const start = Date.now();
    try {
      const res = await fetch(`${EMAIL_CONNECTOR_URL}/health`, {
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
