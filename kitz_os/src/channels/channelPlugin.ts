/**
 * Channel Plugin Interface — Unified send/receive abstraction for all channels.
 *
 * Each channel (WhatsApp, Email, Web, SMS, Voice) implements this interface.
 * The dispatcher iterates over registered plugins instead of using a switch statement.
 */

import type { OutputChannel, ChannelFormattedOutput } from 'kitz-schemas';

// ── Types ──

export interface ChannelStatus {
  connected: boolean;
  lastPingMs?: number;
  error?: string;
}

export interface ChannelCapabilities {
  supportsMedia: boolean;
  supportsHtml: boolean;
  supportsTts: boolean;
  maxLength: number;
  requiresPhone: boolean;
  requiresEmail: boolean;
}

export interface SendOptions {
  recipientId: string;
  phone?: string;
  email?: string;
  whatsappUserId?: string;
  traceId: string;
  orgId?: string;
  draftOnly?: boolean;
}

export interface SendResult {
  status: 'sent' | 'draft' | 'inline' | 'skipped' | 'failed';
  error?: string;
}

export type InboundHandler = (message: {
  senderId: string;
  content: string;
  channel: OutputChannel;
  metadata?: Record<string, unknown>;
}) => void;

// ── Plugin Interface ──

export interface ChannelPlugin {
  /** Channel identifier */
  readonly id: OutputChannel;

  /** Human-readable name */
  readonly name: string;

  /** What this channel supports */
  readonly capabilities: ChannelCapabilities;

  /** Send a formatted message to a recipient */
  send(formatted: ChannelFormattedOutput, options: SendOptions): Promise<SendResult>;

  /** Register an inbound message handler (for bidirectional channels) */
  onMessage?(handler: InboundHandler): void;

  /** Health check — ping the underlying connector */
  getStatus(): Promise<ChannelStatus>;
}

// ── Plugin Registry ──

const plugins = new Map<OutputChannel, ChannelPlugin>();

/** Register a channel plugin */
export function registerChannel(plugin: ChannelPlugin): void {
  plugins.set(plugin.id, plugin);
}

/** Get a registered channel plugin by ID */
export function getChannel(id: OutputChannel): ChannelPlugin | undefined {
  return plugins.get(id);
}

/** Get all registered channel plugins */
export function getAllChannels(): ChannelPlugin[] {
  return Array.from(plugins.values());
}

/** Check health of all channels */
export async function getChannelHealth(): Promise<Record<string, ChannelStatus>> {
  const results: Record<string, ChannelStatus> = {};
  const checks = getAllChannels().map(async (plugin) => {
    try {
      results[plugin.id] = await plugin.getStatus();
    } catch {
      results[plugin.id] = { connected: false, error: 'Health check threw' };
    }
  });
  await Promise.allSettled(checks);
  return results;
}
