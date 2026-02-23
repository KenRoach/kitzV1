import { GuardianAgent } from './GuardianAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';

export function createGuardianKitzServices(bus: EventBus, memory: MemoryStore): GuardianAgent {
  return new GuardianAgent('guardian-kitz-services', bus, memory, {
    serviceDir: 'kitz-services',
    watchPatterns: ['src/**/*.ts', 'package.json'],
  });
}
