import { GuardianAgent } from './GuardianAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';

export function createGuardianKitzLlmHub(bus: EventBus, memory: MemoryStore): GuardianAgent {
  return new GuardianAgent('guardian-kitz-llm-hub', bus, memory, {
    serviceDir: 'kitz-llm-hub',
    watchPatterns: ['src/**/*.ts', 'package.json'],
  });
}
