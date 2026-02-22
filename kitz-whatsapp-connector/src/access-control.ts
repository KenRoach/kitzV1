/**
 * Access Control — ported from OpenClaw inbound/access-control.ts
 *
 * Controls which senders can interact with the bot.
 * Modes: open (all allowed), allowlist (whitelist only), pairing (auto-pair new senders).
 * Includes timestamp gating to suppress replies for pre-connection messages.
 */

export type AccessMode = 'open' | 'allowlist' | 'pairing';

const GRACE_PERIOD_MS = 5_000; // 5 seconds after connection

export interface AccessCheckInput {
  senderJid: string;
  mode: AccessMode;
  allowlist?: Set<string>;
  messageTimestampMs?: number;
  connectedAtMs: number;
  isFromMe: boolean;
  isGroup: boolean;
}

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if an inbound message should be processed.
 * Note: fromMe filtering is now handled upstream in handleMessage().
 * This function only does timestamp gating and mode-based access control.
 */
export function checkAccess(input: AccessCheckInput): AccessCheckResult {
  // Timestamp gating: suppress replies for messages received before connection + grace
  if (input.messageTimestampMs && input.messageTimestampMs < input.connectedAtMs + GRACE_PERIOD_MS) {
    return { allowed: false, reason: 'pre_connection_message' };
  }

  switch (input.mode) {
    case 'open':
      return { allowed: true };

    case 'allowlist':
      if (!input.allowlist) return { allowed: true };
      if (input.allowlist.has(input.senderJid)) return { allowed: true };
      // Strip @s.whatsapp.net and check number only
      const number = input.senderJid.split('@')[0];
      if (input.allowlist.has(number)) return { allowed: true };
      return { allowed: false, reason: 'not_in_allowlist' };

    case 'pairing':
      // Pairing mode: for now, treat as open (pairing protocol is a future addition)
      return { allowed: true };

    default:
      return { allowed: true };
  }
}
