/**
 * SwarmRunner — Orchestrates a full swarm simulation.
 *
 * Runs ONLY when invoked (API call or cron). Not a background process.
 *
 * Flow:
 *   1. Instantiate 100 agents via agentFactory
 *   2. Attach ToolBridge for kitz_os tool access
 *   3. Seed team leads with initial tasks (from teamTasks.ts)
 *   4. Leads hand off to members → members execute tools
 *   5. Cross-team handoffs emerge naturally
 *   6. All findings flow to brain via KnowledgeBridge
 *   7. Return structured report
 */

import { EventBus } from '../eventBus.js';
import { MemoryStore } from '../memory/memoryStore.js';
import { FileLedgerStore } from '../ledger/fileStore.js';
import type { AgentToolBridge } from '../toolBridge.js';
import type { TeamName } from '../types.js';
import { createTeamRegistry, type TeamRegistry } from '../teamRegistry.js';
import { createSwarmRouter } from '../middleware/messageRouter.js';
import { KnowledgeBridge } from './knowledgeBridge.js';
import { createAllAgents, createTeamAgents } from './agentFactory.js';
import { TEAM_TASK_SEEDS, getTeamSeed } from './teamTasks.js';
import { BaseAgent } from '../agents/baseAgent.js';

// ── Types ──

export interface SwarmConfig {
  /** Teams to include (default: all 18) */
  teams?: TeamName[];
  /** Max teams running concurrently (default: 6) */
  concurrency?: number;
  /** Per-team timeout in ms (default: 60_000) */
  timeoutMs?: number;
  /** Dry run — don't execute tools, just trace flow (default: false) */
  dryRun?: boolean;
  /** Optional tool bridge for real tool execution */
  toolBridge?: AgentToolBridge;
  /** Callback for live progress updates */
  onProgress?: (update: SwarmProgress) => void;
}

export interface SwarmProgress {
  type: 'team_start' | 'team_complete' | 'team_error' | 'agent_action' | 'handoff' | 'knowledge';
  team?: string;
  agent?: string;
  message: string;
  timestamp: string;
}

export interface AgentResult {
  agent: string;
  team: string;
  tool: string;
  success: boolean;
  durationMs: number;
  error?: string;
}

export interface TeamResult {
  team: TeamName;
  status: 'completed' | 'failed' | 'timeout';
  agentResults: AgentResult[];
  durationMs: number;
  error?: string;
}

export interface SwarmResult {
  id: string;
  status: 'completed' | 'failed' | 'partial';
  startedAt: string;
  completedAt: string;
  teamsCompleted: number;
  teamsTotal: number;
  teamResults: TeamResult[];
  handoffCount: number;
  knowledgeWritten: number;
  agentResults: AgentResult[];
  durationMs: number;
}

// ── Runner ──

export class SwarmRunner {
  private handoffCount = 0;

  constructor(private readonly config: SwarmConfig = {}) {}

  /** Execute the full swarm simulation */
  async run(): Promise<SwarmResult> {
    const id = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const startMs = Date.now();

    // 1. Set up infrastructure
    const store = new FileLedgerStore();
    const bus = new EventBus(store);
    const memory = new MemoryStore();
    const teamRegistry = createTeamRegistry();

    // Wire swarm router
    bus.use(createSwarmRouter(teamRegistry));

    // Wire knowledge bridge
    const knowledgeBridge = new KnowledgeBridge(bus, memory);
    knowledgeBridge.wire();

    // Track handoffs
    bus.subscribe('SWARM_HANDOFF', () => {
      this.handoffCount++;
    });

    // 2. Determine which teams to run
    const teamsToRun = this.config.teams ?? TEAM_TASK_SEEDS.map((s) => s.team);
    const concurrency = this.config.concurrency ?? 6;
    const timeoutMs = this.config.timeoutMs ?? 60_000;

    // 3. Instantiate agents
    const allAgents = createAllAgents(bus, memory, this.config.toolBridge);

    // 4. Run teams in batches
    const teamResults: TeamResult[] = [];
    const allAgentResults: AgentResult[] = [];

    for (let i = 0; i < teamsToRun.length; i += concurrency) {
      const batch = teamsToRun.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map((team) =>
          this.runTeam(team, teamRegistry, allAgents, bus, memory, timeoutMs),
        ),
      );

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const team = batch[j];
        if (result.status === 'fulfilled') {
          teamResults.push(result.value);
          allAgentResults.push(...result.value.agentResults);
        } else {
          teamResults.push({
            team,
            status: 'failed',
            agentResults: [],
            durationMs: 0,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          });
        }
      }
    }

    const completedAt = new Date().toISOString();
    const teamsCompleted = teamResults.filter((t) => t.status === 'completed').length;

    return {
      id,
      status: teamsCompleted === teamsToRun.length ? 'completed' : teamsCompleted > 0 ? 'partial' : 'failed',
      startedAt,
      completedAt,
      teamsCompleted,
      teamsTotal: teamsToRun.length,
      teamResults,
      handoffCount: this.handoffCount,
      knowledgeWritten: knowledgeBridge.getEntries().length,
      agentResults: allAgentResults,
      durationMs: Date.now() - startMs,
    };
  }

  /** Run a single team's swarm tasks */
  private async runTeam(
    team: TeamName,
    registry: TeamRegistry,
    agents: Map<string, BaseAgent>,
    bus: EventBus,
    memory: MemoryStore,
    timeoutMs: number,
  ): Promise<TeamResult> {
    const teamStartMs = Date.now();
    const agentResults: AgentResult[] = [];

    this.emitProgress({ type: 'team_start', team, message: `Starting ${team}`, timestamp: new Date().toISOString() });

    const teamConfig = registry.get(team);
    if (!teamConfig) {
      return { team, status: 'failed', agentResults: [], durationMs: 0, error: `Team ${team} not found` };
    }

    const seed = getTeamSeed(team);
    if (!seed) {
      return { team, status: 'failed', agentResults: [], durationMs: 0, error: `No seed tasks for ${team}` };
    }

    // Run each member agent with timeout
    const members = teamConfig.members;
    for (const memberName of members) {
      const agent = agents.get(memberName);
      if (!agent) continue;

      const agentStartMs = Date.now();
      try {
        // Create a synthetic message for the agent
        const msg = {
          id: crypto.randomUUID(),
          type: 'SWARM_TASK',
          source: `SwarmRunner:${team}`,
          severity: 'low' as const,
          payload: {
            traceId: crypto.randomUUID(),
            team,
            seedDescription: seed.description,
            seedTools: seed.tools,
          },
          target: memberName,
          channel: 'intra-team' as const,
          ttl: 5,
          hops: ['SwarmRunner'],
          priority: 'normal' as const,
          requiresAck: false,
          timestamp: new Date().toISOString(),
        };

        // Execute with timeout — use handleSwarmTask to iterate ALL seedTools
        await Promise.race([
          agent.handleSwarmTask(msg),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Agent ${memberName} timed out`)), timeoutMs),
          ),
        ]);

        const result: AgentResult = {
          agent: memberName,
          team,
          tool: seed.tools[0]?.name ?? 'none',
          success: true,
          durationMs: Date.now() - agentStartMs,
        };
        agentResults.push(result);
        this.emitProgress({
          type: 'agent_action',
          team,
          agent: memberName,
          message: `${memberName} completed`,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        agentResults.push({
          agent: memberName,
          team,
          tool: seed.tools[0]?.name ?? 'none',
          success: false,
          durationMs: Date.now() - agentStartMs,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const teamResult: TeamResult = {
      team,
      status: 'completed',
      agentResults,
      durationMs: Date.now() - teamStartMs,
    };

    this.emitProgress({
      type: 'team_complete',
      team,
      message: `${team}: ${agentResults.filter((r) => r.success).length}/${agentResults.length} agents succeeded`,
      timestamp: new Date().toISOString(),
    });

    return teamResult;
  }

  private emitProgress(update: SwarmProgress): void {
    this.config.onProgress?.(update);
  }
}

/** Convenience: run a full swarm with default config */
export async function runSwarm(config?: SwarmConfig): Promise<SwarmResult> {
  const runner = new SwarmRunner(config);
  return runner.run();
}
