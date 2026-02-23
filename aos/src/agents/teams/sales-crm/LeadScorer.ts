import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class LeadScorerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('LeadScorer', bus, memory);
    this.team = 'sales-crm';
    this.tier = 'team';
  }

  async scoreLead(leadData: Record<string, unknown>): Promise<{ score: number; tier: 'hot' | 'warm' | 'cold' }> {
    const score = 50; // Placeholder — production uses ML model
    return { score, tier: score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold' };
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
