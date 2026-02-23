import { GuardianAgent } from './GuardianAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';

export function createGuardianWorkspace(bus: EventBus, memory: MemoryStore): GuardianAgent {
  return new GuardianAgent('guardian-workspace', bus, memory, {
    serviceDir: 'workspace',
    watchPatterns: ['src/**/*.ts', 'package.json'],
  });
}
