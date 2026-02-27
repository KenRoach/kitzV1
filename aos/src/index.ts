import { EventBus } from './eventBus.js';
import { FileLedgerStore } from './ledger/fileStore.js';
import type { LedgerStore } from './ledger/ledgerStore.js';
import { MemoryStore } from './memory/memoryStore.js';
import { NetworkingBot } from './bots/networkingBot.js';
import { approvalsPolicy } from './policies/approvals.js';
import { focusCapacityPolicy } from './policies/focusCapacity.js';
import { enforcePermissions } from './policies/permissions.js';
import { createTask } from './artifacts/task.js';
import { createProposal } from './artifacts/proposal.js';
import { createDecision } from './artifacts/decision.js';
import { createOutcome } from './artifacts/outcome.js';
import { runLaunchPipeline } from './launchPipeline.js';
import type { LaunchContext } from './types.js';

// ── New: 102-agent architecture infrastructure ──
import { createSwarmRouter } from './middleware/messageRouter.js';
import { ttlEnforcerMiddleware } from './middleware/ttlEnforcer.js';
import { hopTrackerMiddleware } from './middleware/hopTracker.js';
import { warRoomActivatorMiddleware } from './middleware/warRoomActivator.js';
import { ackTrackerMiddleware } from './middleware/ackTracker.js';
import { createTeamRegistry, TeamRegistry } from './teamRegistry.js';
import { WarRoomManager } from './warRoom.js';
import { SelfRepairLoop } from './selfRepair.js';
import { CTODigest } from './ctoDigest.js';
import { AgentToolBridge } from './toolBridge.js';
import { KnowledgeBridge } from './swarm/knowledgeBridge.js';
// Local type definition to avoid cross-service import (audit finding 6c)
interface OsToolRegistry {
  has(name: string): boolean;
  invoke(name: string, args: Record<string, unknown>, traceId?: string): Promise<unknown>;
}

export function createAOS(store: LedgerStore = new FileLedgerStore(), toolRegistry?: OsToolRegistry) {
  const bus = new EventBus(store);

  // ── Existing middleware ──
  bus.use(approvalsPolicy);
  bus.use(focusCapacityPolicy);
  bus.use(enforcePermissions);

  // ── New: team registry (18 teams) ──
  const teamRegistry = createTeamRegistry();

  // ── New: message routing middleware (swarm-aware) ──
  bus.use(hopTrackerMiddleware);
  bus.use(ttlEnforcerMiddleware);
  bus.use(createSwarmRouter(teamRegistry));
  bus.use(warRoomActivatorMiddleware);
  bus.use(ackTrackerMiddleware);

  const memory = new MemoryStore();
  const networkingBot = new NetworkingBot('NetworkingBot', bus, store);

  // ── New: war room manager ──
  const warRoom = new WarRoomManager(bus, store);

  // ── New: self-repair loop ──
  const selfRepair = new SelfRepairLoop(bus, store);
  selfRepair.wire();

  // ── New: CTO digest publisher ──
  const ctoDigest = new CTODigest(bus, { agentsTotal: 102 });
  ctoDigest.wire();

  // ── Tool bridge (connects AOS agents to kitz_os tools) ──
  const toolBridge = toolRegistry ? new AgentToolBridge(toolRegistry) : undefined;

  // ── Swarm: KnowledgeBridge — all findings to brain ──
  const knowledgeBridge = new KnowledgeBridge(bus, memory);
  knowledgeBridge.wire();

  return {
    bus,
    store,
    memory,
    networkingBot,
    teamRegistry,
    warRoom,
    selfRepair,
    ctoDigest,
    toolBridge,
    knowledgeBridge,
    createTask,
    createProposal,
    createDecision,
    createOutcome,

    /** Run the full 102-agent launch review. CEO decides. */
    async runLaunchReview(ctx: LaunchContext) {
      return runLaunchPipeline(ctx, bus, memory, toolBridge);
    },

    /** Start periodic CTO digest publishing */
    startDigest() {
      ctoDigest.startPeriodicDigest();
    },

    /** Stop periodic CTO digest publishing */
    stopDigest() {
      ctoDigest.stopPeriodicDigest();
    },
  };
}

export type AOSRuntime = ReturnType<typeof createAOS>;

// Re-export types for consumers
export type { LaunchPipelineResult } from './launchPipeline.js';
export type { LaunchContext, LaunchDecision, LaunchReview, LaunchVote } from './types.js';

// Re-export new infrastructure
export { TeamRegistry } from './teamRegistry.js';
export { WarRoomManager } from './warRoom.js';
export { SelfRepairLoop } from './selfRepair.js';
export { CTODigest } from './ctoDigest.js';
export { AgentToolBridge } from './toolBridge.js';
export { KnowledgeBridge } from './swarm/knowledgeBridge.js';
export { SwarmRunner, runSwarm } from './swarm/swarmRunner.js';
export { FeedbackAggregator } from './swarm/feedbackAggregator.js';
export { LinkRegistry } from './swarm/linkRegistry.js';
export { createAllAgents, createAgent, createTeamAgents, createCoreAgents, getAgentCount } from './swarm/agentFactory.js';
export { registerAgent, dispatchToAgent, listAgents, routeQuestion } from './runtime/taskDispatcher.js';
export type { ExecutionResult } from './runtime/AgentExecutor.js';
export { ReviewerAgent, type ResponseReviewResult } from './agents/governance/Reviewer.js';
export { TEAM_TASK_SEEDS, getTeamSeed } from './swarm/teamTasks.js';
export type { SwarmHandoff } from './swarm/handoff.js';
export type { SwarmResult, SwarmConfig, SwarmProgress, TeamResult, AgentResult } from './swarm/swarmRunner.js';
export type { SwarmReport, TeamReport, ActionItem } from './swarm/feedbackAggregator.js';
export type { TrackedLink } from './swarm/linkRegistry.js';
export type { KnowledgeEntry } from './swarm/knowledgeBridge.js';
export type { TeamTaskSeed } from './swarm/teamTasks.js';
export type {
  AgentMessage,
  AgentStatus,
  AgentTier,
  CTODigestEntry,
  CTODigestPayload,
  GuardianScope,
  MessageChannel,
  MessagePriority,
  TeamConfig,
  TeamName,
  WarRoomConfig,
} from './types.js';
