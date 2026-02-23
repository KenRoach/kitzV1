import { GuardianAgent } from './GuardianAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';

export function createGuardianNotificationsQueue(bus: EventBus, memory: MemoryStore): GuardianAgent {
  return new GuardianAgent('guardian-notifications-queue', bus, memory, {
    serviceDir: 'kitz-notifications-queue',
    watchPatterns: ['src/**/*.ts', 'package.json'],
  });
}
