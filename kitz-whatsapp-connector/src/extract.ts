/**
 * Message Extraction — ported from OpenClaw inbound/extract.ts
 *
 * Extracts reply context, location data, and media placeholders from
 * incoming WhatsApp messages.
 */

import type { WAMessage, proto } from '@whiskeysockets/baileys';

export interface ReplyContext {
  id: string;
  body: string | null;
  sender: string | null;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

/**
 * Extract the quoted message context from a reply.
 */
export function extractReplyContext(msg: WAMessage): ReplyContext | null {
  const ctx =
    msg.message?.extendedTextMessage?.contextInfo ??
    msg.message?.imageMessage?.contextInfo ??
    msg.message?.videoMessage?.contextInfo ??
    msg.message?.documentMessage?.contextInfo ??
    msg.message?.audioMessage?.contextInfo;

  if (!ctx?.quotedMessage) return null;

  const id = ctx.stanzaId ?? '';
  const sender = ctx.participant ?? null;

  const quoted = ctx.quotedMessage;
  const body =
    quoted.conversation ??
    quoted.extendedTextMessage?.text ??
    quoted.imageMessage?.caption ??
    quoted.videoMessage?.caption ??
    quoted.documentMessage?.caption ??
    null;

  return { id, body, sender };
}

/**
 * Extract location data from a message.
 */
export function extractLocationData(message: proto.IMessage | null | undefined): LocationData | null {
  if (!message) return null;

  const loc = message.locationMessage ?? message.liveLocationMessage;
  if (!loc?.degreesLatitude || !loc?.degreesLongitude) return null;

  return {
    latitude: loc.degreesLatitude,
    longitude: loc.degreesLongitude,
    name: (loc as any).name ?? undefined,
    address: (loc as any).address ?? undefined,
  };
}

/**
 * Format location data as human-readable text.
 */
export function formatLocationText(loc: LocationData): string {
  const parts: string[] = [];
  if (loc.name) parts.push(loc.name);
  if (loc.address) parts.push(loc.address);
  parts.push(`(${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)})`);
  return parts.join(' — ');
}
