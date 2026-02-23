import { GuardianAgent } from './GuardianAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';

export function createGuardianKitzGateway(bus: EventBus, memory: MemoryStore): GuardianAgent {
  return new GuardianAgent('guardian-kitz-gateway', bus, memory, {
    serviceDir: 'kitz-gateway',
    watchPatterns: ['src/**/*.ts', 'package.json'],
  });
}
