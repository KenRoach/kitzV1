import type { AOSEvent, AgentMessage } from '../types.js';

const pendingAcks = new Map<string, { messageId: string; source: string; timestamp: number }>();
const ACK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Tracks messages that require acknowledgment.
 * In production, a background timer would check for timeouts.
 */
export function ackTrackerMiddleware(event: AOSEvent): void {
  const msg = event as Partial<AgentMessage>;
  if (!msg.requiresAck) return;

  pendingAcks.set(event.id, {
    messageId: event.id,
    source: event.source,
    timestamp: Date.now(),
  });
}

export function acknowledgeMessage(messageId: string): boolean {
  return pendingAcks.delete(messageId);
}

export function getPendingAcks(): Map<string, { messageId: string; source: string; timestamp: number }> {
  return pendingAcks;
}

export function getTimedOutAcks(): string[] {
  const now = Date.now();
  const timedOut: string[] = [];
  for (const [id, entry] of pendingAcks) {
    if (now - entry.timestamp > ACK_TIMEOUT_MS) {
      timedOut.push(id);
    }
  }
  return timedOut;
}
