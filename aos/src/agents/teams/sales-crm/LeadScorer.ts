import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class LeadScorerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('LeadScorer', bus, memory);
    this.team = 'sales-crm';
    this.tier = 'team';
  }

  async scoreLead(status?: string, limit?: number, traceId?: string): Promise<unknown> {
    return this.invokeTool('funnel_scoreLeads', { status: status || 'lead', limit: limit || 20 }, traceId);
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('funnel_scoreLeads', {
      status: payload.status ?? 'lead',
      limit: payload.limit ?? 20,
    }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed = ['Lead scoring algorithm configured'];
    const warnings: string[] = [];
    if (ctx.funnelStagesDefined < 3) warnings.push(`Only ${ctx.funnelStagesDefined} funnel stages — need at least 3`);
    else passed.push(`${ctx.funnelStagesDefined} funnel stages defined`);
    return {
      agent: this.name, role: 'lead-scorer', vote: 'go',
      confidence: 72, blockers: [], warnings, passed,
      summary: `LeadScorer: Scoring ready with ${ctx.funnelStagesDefined} stages`,
    };
  }
}
