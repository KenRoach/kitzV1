import { GuardianAgent } from './GuardianAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';

export function createGuardianEmailConnector(bus: EventBus, memory: MemoryStore): GuardianAgent {
  return new GuardianAgent('guardian-email-connector', bus, memory, {
    serviceDir: 'kitz-email-connector',
    watchPatterns: ['src/**/*.ts', 'package.json'],
  });
}
