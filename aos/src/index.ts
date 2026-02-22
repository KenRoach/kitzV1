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

export function createAOS(store: LedgerStore = new FileLedgerStore()) {
  const bus = new EventBus(store);
  bus.use(approvalsPolicy);
  bus.use(focusCapacityPolicy);
  bus.use(enforcePermissions);

  const memory = new MemoryStore();
  const networkingBot = new NetworkingBot('NetworkingBot', bus, store);

  return {
    bus,
    store,
    memory,
    networkingBot,
    createTask,
    createProposal,
    createDecision,
    createOutcome,

    /** Run the full 33-agent launch review. CEO decides. */
    async runLaunchReview(ctx: LaunchContext) {
      return runLaunchPipeline(ctx, bus, memory);
    },
  };
}

export type AOSRuntime = ReturnType<typeof createAOS>;

// Re-export types for consumers
export type { LaunchPipelineResult } from './launchPipeline.js';
export type { LaunchContext, LaunchDecision, LaunchReview, LaunchVote } from './types.js';
