import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class FunnelDesignerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('FunnelDesigner', bus, memory);
    this.team = 'growth-hacking';
    this.tier = 'team';
  }

  async designFunnel(stages: string[]): Promise<{ funnelId: string; stages: string[]; conversionTargets: Record<string, number> }> {
    const conversionTargets: Record<string, number> = {};
    stages.forEach((stage, i) => {
      conversionTargets[stage] = Math.max(10, 100 - i * 20);
    });
    return { funnelId: `funnel_${Date.now()}`, stages, conversionTargets };
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const passed: string[] = [];
    const warnings: string[] = [];
    if (ctx.funnelStagesDefined >= 5) {
      passed.push(`${ctx.funnelStagesDefined} funnel stages defined — full path coverage`);
    } else if (ctx.funnelStagesDefined >= 3) {
      warnings.push(`Only ${ctx.funnelStagesDefined} funnel stages — recommend 5+ for signup-to-paid path`);
      passed.push('Minimum funnel stages present');
    } else {
      blockers.push(`Only ${ctx.funnelStagesDefined} funnel stage(s) — need at least 3 for viable funnel`);
    }
    if (ctx.freeToPathDefined) passed.push('Free-to-paid conversion path defined');
    else warnings.push('Free-to-paid path not defined');
    return {
      agent: this.name, role: 'funnel-designer', vote: blockers.length > 0 ? 'no-go' : 'go',
      confidence: blockers.length > 0 ? 30 : 76, blockers, warnings, passed,
      summary: `FunnelDesigner: ${ctx.funnelStagesDefined} stages in conversion funnel`,
    };
  }
}
