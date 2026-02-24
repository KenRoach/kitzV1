import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class DeliveryMonitorAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('DeliveryMonitor', bus, memory);
    this.team = 'whatsapp-comms';
    this.tier = 'team';
  }

  async checkDeliveryStatus(messageId: string): Promise<{ delivered: boolean; read: boolean }> {
    return { delivered: false, read: false };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('memory_search', { query: payload.query ?? 'message delivery status', limit: 20 }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
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
