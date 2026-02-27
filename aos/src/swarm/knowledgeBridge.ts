/**
 * KnowledgeBridge — All swarm findings flow to the brain.
 *
 * Subscribes to EventBus. When any agent produces findings:
 * 1. Persist to AOS MemoryStore (local NDJSON)
 * 2. Forward to kitz_os memory manager (the brain) via fetch
 * 3. Broadcast KNOWLEDGE_SHARED event so other agents can react
 */

import type { EventBus } from '../eventBus.js'
import type { MemoryStore } from '../memory/memoryStore.js'
import type { AOSEvent } from '../types.js'

const BRAIN_URL = process.env['KITZ_OS_URL'] ?? 'http://localhost:3012'

export interface KnowledgeEntry {
  agent: string
  team: string
  category: string
  content: string
  traceId: string
  timestamp: string
}

export class KnowledgeBridge {
  private entries: KnowledgeEntry[] = []

  constructor(
    private readonly bus: EventBus,
    private readonly memory: MemoryStore,
  ) {}

  /** Wire into EventBus — listens for SWARM_TASK_COMPLETE events */
  wire(): void {
    this.bus.subscribe('SWARM_TASK_COMPLETE', async (event: AOSEvent) => {
      const payload = event.payload as Record<string, unknown>
      const entry: KnowledgeEntry = {
        agent: (payload.agent as string) ?? event.source,
        team: (payload.team as string) ?? 'unknown',
        category: 'swarm-findings',
        content: JSON.stringify(payload.findings ?? payload),
        traceId: (payload.traceId as string) ?? event.id,
        timestamp: new Date().toISOString(),
      }

      // 1. Persist locally
      this.entries.push(entry)
      this.memory.logProposal({
        owner: entry.agent,
        issueId: `swarm-${entry.traceId}`,
        proposal: { type: 'knowledge', ...entry },
        timestamp: entry.timestamp,
      })

      // 2. Forward to brain (best-effort — don't block on failure)
      void this.forwardToBrain(entry)

      // 3. Broadcast knowledge shared
      await this.bus.publish({
        type: 'KNOWLEDGE_SHARED',
        source: 'KnowledgeBridge',
        severity: 'low',
        payload: { entry },
      })
    })
  }

  /** Forward a knowledge entry to kitz_os memory manager */
  private async forwardToBrain(entry: KnowledgeEntry): Promise<void> {
    try {
      await fetch(`${BRAIN_URL}/api/kitz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-service-secret': process.env['SERVICE_SECRET'] ?? '',
        },
        body: JSON.stringify({
          message: `[SWARM:${entry.team}:${entry.agent}] ${entry.content}`,
          channel: 'system',
          userId: 'swarm-bridge',
        }),
      })
    } catch {
      // Best-effort — brain may be offline during simulation
    }
  }

  /** Get all accumulated knowledge entries */
  getEntries(): KnowledgeEntry[] {
    return [...this.entries]
  }

  /** Get entries filtered by team */
  getByTeam(team: string): KnowledgeEntry[] {
    return this.entries.filter((e) => e.team === team)
  }

  /** Clear entries (after report generation) */
  clear(): void {
    this.entries = []
  }
}
