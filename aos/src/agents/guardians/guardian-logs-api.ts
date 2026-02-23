import { GuardianAgent } from './GuardianAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';

export function createGuardianLogsApi(bus: EventBus, memory: MemoryStore): GuardianAgent {
  return new GuardianAgent('guardian-logs-api', bus, memory, {
    serviceDir: 'engine/logs-api',
    watchPatterns: ['src/**/*.ts', 'package.json'],
  });
}
