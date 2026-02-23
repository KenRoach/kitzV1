import { GuardianAgent } from './GuardianAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';

export function createGuardianAos(bus: EventBus, memory: MemoryStore): GuardianAgent {
  return new GuardianAgent('guardian-aos', bus, memory, {
    serviceDir: 'aos',
    watchPatterns: ['src/**/*.ts', 'package.json'],
  });
}
