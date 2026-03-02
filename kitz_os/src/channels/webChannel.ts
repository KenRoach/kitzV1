/**
 * Web Channel Plugin — Inline delivery (no external connector).
 *
 * Web responses are returned directly in the HTTP response body.
 * Health is always "connected" since there's no external dependency.
 * Inbound messages arrive via the /api/kitz POST endpoint.
 */

import type { ChannelFormattedOutput } from 'kitz-schemas';
import type { ChannelPlugin, ChannelCapabilities, ChannelStatus, SendOptions, SendResult, InboundHandler } from './channelPlugin.js';
import { broadcastEvent } from '../gateway/wsGateway.js';

export const webChannel: ChannelPlugin = {
  id: 'web',
  name: 'Web UI',

  capabilities: {
    supportsMedia: true,
    supportsHtml: true,
    supportsTts: false,
    maxLength: 8192,
    requiresPhone: false,
    requiresEmail: false,
  } satisfies ChannelCapabilities,

  async send(formatted: ChannelFormattedOutput, options: SendOptions): Promise<SendResult> {
    // Web channel delivers inline — broadcast to connected WS clients
    broadcastEvent({
      type: 'text.done',
      traceId: options.traceId,
      timestamp: new Date().toISOString(),
      data: { text: formatted.body, channel: 'web' },
    });
    return { status: 'inline' };
  },

  onMessage(_handler: InboundHandler): void {
    // Inbound web messages arrive via POST /api/kitz — handled by server.ts
  },

  async getStatus(): Promise<ChannelStatus> {
    return { connected: true, lastPingMs: 0 };
  },
};
