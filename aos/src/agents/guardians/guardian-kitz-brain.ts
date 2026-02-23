import { GuardianAgent } from './GuardianAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';

export function createGuardianKitzBrain(bus: EventBus, memory: MemoryStore): GuardianAgent {
  return new GuardianAgent('guardian-kitz-brain', bus, memory, {
    serviceDir: 'kitz-brain',
    watchPatterns: ['src/**/*.ts', 'package.json'],
  });
}
