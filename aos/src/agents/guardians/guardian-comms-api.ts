import { GuardianAgent } from './GuardianAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';

export function createGuardianCommsApi(bus: EventBus, memory: MemoryStore): GuardianAgent {
  return new GuardianAgent('guardian-comms-api', bus, memory, {
    serviceDir: 'engine/comms-api',
    watchPatterns: ['src/**/*.ts', 'package.json'],
  });
}
