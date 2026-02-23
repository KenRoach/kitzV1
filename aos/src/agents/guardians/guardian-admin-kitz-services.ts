import { GuardianAgent } from './GuardianAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';

export function createGuardianAdminKitzServices(bus: EventBus, memory: MemoryStore): GuardianAgent {
  return new GuardianAgent('guardian-admin-kitz-services', bus, memory, {
    serviceDir: 'admin-kitz-services',
    watchPatterns: ['src/**/*.ts', 'package.json'],
  });
}
