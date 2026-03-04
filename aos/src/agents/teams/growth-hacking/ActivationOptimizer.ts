import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ActivationOptimizerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Activation Optimizer at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Activation Optimizer — ensure new users reach first value in under 10 minutes.
RESPONSIBILITIES:
- Analyze activation flows and identify friction points that delay time-to-value.
- Design welcome sequences and quick-start paths (WhatsApp-first).
- Monitor activation metrics: time-to-first-action, completion rates, drop-off points.
- Trigger nurture sequences for users who stall during onboarding.
- Target the breakthrough moment: user sees their own data in the system.
STYLE: Speed-obsessed, empathy-driven, friction-hunter. Spanish-first messaging.

FRAMEWORK:
1. Pull activation funnel metrics from dashboard_metrics.
2. Search memory for prior activation experiments and drop-off patterns.
3. Identify the biggest friction point in the current flow.
4. Recommend a specific fix with projected activation-time improvement.
5. Report activation status and recommendations to HeadGrowth.

ESCALATION: Escalate to HeadGrowth when activation time exceeds 10 minutes or systemic blockers are found.
Use dashboard_metrics, memory_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('ActivationOptimizer', bus, memory);
    this.team = 'growth-hacking';
    this.tier = 'team';
  }

  async optimizeActivation(userId: string, traceId?: string): Promise<unknown> {
    // Target: <10 min to first value — draft welcome + nurture sequence
    const nurture = await this.invokeTool('marketing_draftNurture', {
      lead_name: userId,
      lead_phone: '',
      business_type: 'small business',
    }, traceId);
    return nurture;
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(ActivationOptimizerAgent.SYSTEM_PROMPT, userMessage, {
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
    if (ctx.activationTargetMinutes <= 10) {
      passed.push(`Activation target: ${ctx.activationTargetMinutes} min (within 10-min goal)`);
    } else {
      blockers.push(`Activation target ${ctx.activationTargetMinutes} min exceeds 10-min goal — users will churn`);
    }
    if (ctx.whatsappConnectorConfigured) passed.push('WhatsApp quick-start flow available');
    else warnings.push('WhatsApp connector not configured — limits activation paths');
    return {
      agent: this.name, role: 'activation-optimizer', vote: blockers.length > 0 ? 'no-go' : 'go',
      confidence: blockers.length > 0 ? 35 : 80, blockers, warnings, passed,
      summary: `ActivationOptimizer: ${ctx.activationTargetMinutes}-min activation target`,
    };
  }
}
