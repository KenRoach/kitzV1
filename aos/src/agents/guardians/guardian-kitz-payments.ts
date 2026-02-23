import { GuardianAgent } from './GuardianAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';

export function createGuardianKitzPayments(bus: EventBus, memory: MemoryStore): GuardianAgent {
  return new GuardianAgent('guardian-kitz-payments', bus, memory, {
    serviceDir: 'kitz-payments',
    watchPatterns: ['src/**/*.ts', 'package.json'],
  });
}
