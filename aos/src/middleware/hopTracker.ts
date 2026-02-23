import type { AOSEvent, AgentMessage } from '../types.js';

/**
 * Initializes hops array on AgentMessages if not present.
 * Actual hop tracking happens in BaseAgent.sendMessage().
 */
export function hopTrackerMiddleware(event: AOSEvent): void {
  const msg = event as Partial<AgentMessage>;
  if (msg.channel && !msg.hops) {
    (msg as AgentMessage).hops = [];
  }
}
