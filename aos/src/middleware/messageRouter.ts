import type { AOSEvent, AgentMessage } from '../types.js';
import type { TeamRegistry } from '../teamRegistry.js';
import type { SwarmHandoff } from '../swarm/handoff.js';

/**
 * Swarm-aware message routing middleware (factory pattern).
 *
 * Handles:
 * - SWARM_HANDOFF: delivers handoff context to target agent(s)
 * - cross-team: routes through team leads
 * - intra-team: direct delivery
 * - Cycle prevention via hops[]
 */
export function createSwarmRouter(teamRegistry: TeamRegistry) {
  return function swarmRouterMiddleware(event: AOSEvent): void {
    const msg = event as Partial<AgentMessage>;

    // ── Swarm handoff routing ──
    if (event.type === 'SWARM_HANDOFF') {
      const handoff = event.payload as unknown as SwarmHandoff;
      const targets = Array.isArray(handoff.to) ? handoff.to : [handoff.to];

      // Cycle prevention — don't deliver back to sender
      const hops = (event.payload as Record<string, unknown>)._hops as string[] | undefined;
      const visited = new Set(hops ?? [handoff.from]);

      const deliverable = targets.filter((t) => !visited.has(t));
      if (deliverable.length === 0) return;

      // Track routing metadata
      const routePayload = event.payload as Record<string, unknown>;
      routePayload._hops = [...visited, ...deliverable];
      routePayload._routedVia = 'swarmRouter';
      routePayload._deliveredTo = deliverable;

      // Cross-team handoffs: tag with team lead info
      if (handoff.fromTeam && handoff.toTeam && handoff.fromTeam !== handoff.toTeam) {
        routePayload._crossTeam = true;
        routePayload._fromLead = teamRegistry.getLead(handoff.fromTeam);
        routePayload._toLead = teamRegistry.getLead(handoff.toTeam);
      }

      return;
    }

    // ── Legacy message routing ──
    if (!msg.channel) return;

    if (msg.channel === 'cross-team' && msg.hops) {
      (event.payload as Record<string, unknown>)._routedVia = 'messageRouter';
    }
  };
}

/**
 * Legacy non-factory middleware (kept for backward compatibility).
 * Used when no TeamRegistry is available.
 */
export function messageRouterMiddleware(event: AOSEvent): void {
  const msg = event as Partial<AgentMessage>;
  if (!msg.channel) return;

  if (msg.channel === 'cross-team' && msg.hops) {
    (event.payload as Record<string, unknown>)._routedVia = 'messageRouter';
  }
}
