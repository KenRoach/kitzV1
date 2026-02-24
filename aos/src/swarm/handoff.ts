/**
 * Swarm Handoff Protocol
 *
 * Core primitive: agent A finishes → passes accumulated context to agent B.
 * No rigid hierarchy — emergent intelligence from specialization + shared context.
 */

import type { TeamName } from '../types.js'

export interface SwarmHandoff {
  /** Agent handing off */
  from: string
  /** Target agent(s) — single or fan-out */
  to: string | string[]
  /** Accumulated findings chain — grows as handoffs cascade */
  context: Record<string, unknown>
  /** Why this handoff is happening */
  reason: string
  /** Trace ID for the entire swarm run */
  traceId: string
  /** Source team (for cross-team routing) */
  fromTeam?: TeamName
  /** Target team (for cross-team routing) */
  toTeam?: TeamName
  /** Timestamp of handoff */
  timestamp: string
}

export interface SwarmHandoffResult {
  success: boolean
  handoff: SwarmHandoff
  deliveredTo: string[]
  error?: string
}

/**
 * Create a handoff envelope — used by BaseAgent.handoff()
 */
export function createHandoff(
  from: string,
  to: string | string[],
  context: Record<string, unknown>,
  reason: string,
  traceId: string,
  fromTeam?: TeamName,
  toTeam?: TeamName,
): SwarmHandoff {
  return {
    from,
    to,
    context,
    reason,
    traceId,
    fromTeam,
    toTeam,
    timestamp: new Date().toISOString(),
  }
}
