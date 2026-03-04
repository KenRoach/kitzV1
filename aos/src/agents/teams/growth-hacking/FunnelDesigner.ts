import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class FunnelDesignerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Funnel Designer at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Funnel Designer — design and optimize conversion funnels from signup to paid.
RESPONSIBILITIES:
- Map end-to-end conversion funnels with stage definitions and conversion targets.
- Identify funnel bottlenecks and high-drop-off stages.
- Design the free-to-paid conversion path (workspace free tier to AI Battery credits).
- Set conversion targets per stage and track actual vs. target performance.
STYLE: Systematic, conversion-obsessed, metrics-driven. Clear stage definitions.

FRAMEWORK:
1. Pull current funnel metrics from dashboard_metrics.
2. Search memory for historical funnel performance and prior experiments.
3. Map the full funnel: awareness -> activation -> retention -> revenue -> referral.
4. Identify the weakest stage and recommend specific improvements.
5. Report funnel health with conversion rates and recommendations to HeadGrowth.

ESCALATION: Escalate to HeadGrowth when funnel redesign or pricing changes are needed.
Use dashboard_metrics, memory_search to accomplish your tasks.`;

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

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(FunnelDesignerAgent.SYSTEM_PROMPT, userMessage, {
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
