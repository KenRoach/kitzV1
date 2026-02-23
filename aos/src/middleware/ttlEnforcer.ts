import type { AOSEvent, AgentMessage } from '../types.js';

/**
 * Kills messages that have exceeded their TTL (max hops).
 * Sets payload._ttlExceeded = true so handlers can skip processing.
 */
export function ttlEnforcerMiddleware(event: AOSEvent): void {
  const msg = event as Partial<AgentMessage>;
  if (msg.ttl === undefined || !msg.hops) return;

  if (msg.hops.length >= msg.ttl) {
    (event.payload as Record<string, unknown>)._ttlExceeded = true;
  }
}
