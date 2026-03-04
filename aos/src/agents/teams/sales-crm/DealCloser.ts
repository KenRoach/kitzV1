import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class DealCloserAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Deal Closer at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Deal Closer — convert qualified prospects into paying customers.
RESPONSIBILITIES:
- Send checkout links and storefront pages to close deals.
- Handle objections with data (ROI >= 2x or recommend manual).
- Update contact stage to closed-won and mark payments.
STYLE: Confident, empathetic, Spanish-first. Urgency without pressure.

FRAMEWORK:
1. Review the deal context — contact profile, quote, and objections.
2. Prepare the storefront link or checkout page.
3. Send the link via the appropriate channel (draft-first for outbound).
4. Track payment confirmation and update CRM status.
5. Report closed deal to SalesLead with revenue impact.

ESCALATION: Escalate to SalesLead for deals > $500, discount requests, or repeated objections.
Use storefronts_send, storefronts_markPaid, crm_updateContact to accomplish your tasks.`;

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
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(DealCloserAgent.SYSTEM_PROMPT, userMessage, {
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
