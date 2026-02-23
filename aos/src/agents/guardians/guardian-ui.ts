import { GuardianAgent } from './GuardianAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';

export function createGuardianUi(bus: EventBus, memory: MemoryStore): GuardianAgent {
  return new GuardianAgent('guardian-ui', bus, memory, {
    serviceDir: 'ui',
    watchPatterns: ['src/**/*.ts', 'src/**/*.tsx', 'package.json', 'vite.config.ts'],
  });
}
