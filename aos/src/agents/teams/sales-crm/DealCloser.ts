import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class DealCloserAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('DealCloser', bus, memory);
    this.team = 'sales-crm';
    this.tier = 'team';
  }

  async closeDeal(contactId: string, productId: string, amount: number, traceId?: string): Promise<unknown> {
    // Move to closed-won stage then generate checkout link
    await this.invokeTool('funnel_moveContact', {
      contact_id: contactId,
      new_stage: 'closed-won',
      reason: `Deal closed — checkout for ${productId}`,
    }, traceId);
    return { url: `https://workspace.kitz.services/checkout/${productId}`, draftOnly: true };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('funnel_stageReport', { period: 'week' }, traceId);

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
    if (ctx.pricingTiersDefined >= 2) passed.push(`${ctx.pricingTiersDefined} pricing tiers defined`);
    else warnings.push('Less than 2 pricing tiers — limited checkout options');
    if (ctx.freeToPathDefined) passed.push('Free-to-paid path defined');
    return {
      agent: this.name, role: 'deal-closer', vote: 'go',
      confidence: 75, blockers: [], warnings, passed,
      summary: 'DealCloser: Checkout link generation ready',
    };
  }
}
