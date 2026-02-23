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

// ── New: 106-agent architecture infrastructure ──
import { messageRouterMiddleware } from './middleware/messageRouter.js';
import { ttlEnforcerMiddleware } from './middleware/ttlEnforcer.js';
import { hopTrackerMiddleware } from './middleware/hopTracker.js';
import { warRoomActivatorMiddleware } from './middleware/warRoomActivator.js';
import { ackTrackerMiddleware } from './middleware/ackTracker.js';
import { createTeamRegistry, TeamRegistry } from './teamRegistry.js';
import { WarRoomManager } from './warRoom.js';
import { SelfRepairLoop } from './selfRepair.js';
import { CTODigest } from './ctoDigest.js';

export function createAOS(store: LedgerStore = new FileLedgerStore()) {
  const bus = new EventBus(store);

  // ── Existing middleware ──
  bus.use(approvalsPolicy);
  bus.use(focusCapacityPolicy);
  bus.use(enforcePermissions);

  // ── New: message routing middleware ──
  bus.use(hopTrackerMiddleware);
  bus.use(ttlEnforcerMiddleware);
  bus.use(messageRouterMiddleware);
  bus.use(warRoomActivatorMiddleware);
  bus.use(ackTrackerMiddleware);

  const memory = new MemoryStore();
  const networkingBot = new NetworkingBot('NetworkingBot', bus, store);

  // ── New: team registry (18 teams) ──
  const teamRegistry = createTeamRegistry();

  // ── New: war room manager ──
  const warRoom = new WarRoomManager(bus, store);

  // ── New: self-repair loop ──
  const selfRepair = new SelfRepairLoop(bus, store);
  selfRepair.wire();

  // ── New: CTO digest publisher ──
  const ctoDigest = new CTODigest(bus, { agentsTotal: 106 });
  ctoDigest.wire();

  return {
    bus,
    store,
    memory,
    networkingBot,
    teamRegistry,
    warRoom,
    selfRepair,
    ctoDigest,
    createTask,
    createProposal,
    createDecision,
    createOutcome,

    /** Run the full 106-agent launch review. CEO decides. */
    async runLaunchReview(ctx: LaunchContext) {
      return runLaunchPipeline(ctx, bus, memory);
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
