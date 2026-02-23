import { GuardianAgent } from './GuardianAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';

export function createGuardianKitzSchemas(bus: EventBus, memory: MemoryStore): GuardianAgent {
  return new GuardianAgent('guardian-kitz-schemas', bus, memory, {
    serviceDir: 'kitz-schemas',
    watchPatterns: ['src/**/*.ts', 'package.json'],
  });
}
