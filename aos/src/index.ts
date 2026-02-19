import { EventBus } from './eventBus.js';
import { FileLedgerStore } from './ledger/fileStore.js';
import type { LedgerStore } from './ledger/ledgerStore.js';
import { NetworkingBot } from './bots/networkingBot.js';
import { approvalsPolicy } from './policies/approvals.js';
import { focusCapacityPolicy } from './policies/focusCapacity.js';
import { createTask } from './artifacts/task.js';
import { createProposal } from './artifacts/proposal.js';
import { createDecision } from './artifacts/decision.js';
import { createOutcome } from './artifacts/outcome.js';

export function createAOS(store: LedgerStore = new FileLedgerStore()) {
  const bus = new EventBus(store);
  bus.use(approvalsPolicy);
  bus.use(focusCapacityPolicy);

  const networkingBot = new NetworkingBot('NetworkingBot', bus, store);

  return {
    bus,
    store,
    networkingBot,
    createTask,
    createProposal,
    createDecision,
    createOutcome
  };
}

export type AOSRuntime = ReturnType<typeof createAOS>;
