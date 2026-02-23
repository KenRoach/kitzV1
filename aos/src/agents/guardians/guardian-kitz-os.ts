import { GuardianAgent } from './GuardianAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';

export function createGuardianKitzOs(bus: EventBus, memory: MemoryStore): GuardianAgent {
  return new GuardianAgent('guardian-kitz-os', bus, memory, {
    serviceDir: 'kitz_os',
    watchPatterns: ['src/**/*.ts', 'package.json', 'data/**'],
  });
}
