import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class DeliveryMonitorAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Delivery Monitor at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Delivery Monitor — track message delivery, read receipts, and failure rates.
RESPONSIBILITIES:
- Monitor WhatsApp and email delivery status in real time.
- Flag failed deliveries and retry or escalate as needed.
- Report delivery metrics (sent, delivered, read, failed) to leadership.
STYLE: Vigilant, metrics-driven, Spanish-first. Zero tolerance for silent failures.

FRAMEWORK:
1. Pull dashboard metrics on recent message delivery rates.
2. Search memory for delivery failures and retry history.
3. Identify patterns in failures (bad numbers, opt-outs, rate limits).
4. Flag critical failures for immediate attention.
5. Report delivery health summary to HeadCustomer.

ESCALATION: Escalate to HeadCustomer when delivery failure rate exceeds 10% or a channel goes offline.
Use dashboard_metrics, memory_search to accomplish your tasks.`;

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
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(DeliveryMonitorAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
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
