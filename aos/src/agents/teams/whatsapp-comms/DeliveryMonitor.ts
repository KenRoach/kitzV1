import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class DeliveryMonitorAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('DeliveryMonitor', bus, memory);
    this.team = 'whatsapp-comms';
    this.tier = 'team';
  }

  async checkDeliveryStatus(messageId: string): Promise<{ delivered: boolean; read: boolean }> {
    return { delivered: false, read: false };
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];
    if (ctx.whatsappConnectorConfigured) passed.push('WhatsApp delivery channel active');
    else warnings.push('WhatsApp connector not ready — delivery monitoring offline');
    return {
      agent: this.name, role: 'delivery-monitor', vote: 'go',
      confidence: 75, blockers: [], warnings, passed,
      summary: 'DeliveryMonitor: Ready to track message delivery',
    };
  }
}
