import { GuardianAgent } from './GuardianAgent.js';
import type { EventBus } from '../../eventBus.js';
import type { MemoryStore } from '../../memory/memoryStore.js';

export function createGuardianWhatsappConnector(bus: EventBus, memory: MemoryStore): GuardianAgent {
  return new GuardianAgent('guardian-whatsapp-connector', bus, memory, {
    serviceDir: 'kitz-whatsapp-connector',
    watchPatterns: ['src/**/*.ts', 'package.json', 'auth_info_baileys/**'],
  });
}
