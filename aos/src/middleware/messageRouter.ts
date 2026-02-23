import type { AOSEvent, AgentMessage, MessageChannel } from '../types.js';

/**
 * Cross-team routing middleware.
 * If channel='cross-team', logs a routing trace.
 * In a full implementation, this would verify both team leads are in the hops.
 */
export function messageRouterMiddleware(event: AOSEvent): void {
  const msg = event as Partial<AgentMessage>;
  if (!msg.channel) return; // Not a routed message

  if (msg.channel === 'cross-team' && msg.hops) {
    // Track cross-team routing. In production, verify team leads are in hops.
    (event.payload as Record<string, unknown>)._routedVia = 'messageRouter';
  }
}
