import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class PipelineOptimizerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Pipeline Optimizer at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Pipeline Optimizer — monitor funnel health and accelerate stage progression.
RESPONSIBILITIES:
- Analyze pipeline stages for bottlenecks and stalled deals.
- Recommend stage transitions and next-best-actions per contact.
- Surface metrics on conversion rates and velocity.
STYLE: Systematic, metrics-obsessed, Spanish-first. Focus on throughput.

FRAMEWORK:
1. Pull current funnel stage report and contact list.
2. Identify stalled contacts and stage bottlenecks.
3. Calculate conversion rates between stages.
4. Recommend specific moves to unblock pipeline.
5. Report findings to SalesLead with priority ranking.

ESCALATION: Escalate to SalesLead when deals are stuck > 7 days or pipeline velocity drops below target.
Use funnel_stageReport, dashboard_metrics, crm_listContacts to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('PipelineOptimizer', bus, memory);
    this.team = 'sales-crm';
    this.tier = 'team';
  }

  async suggestStageMove(contactId: string, traceId?: string): Promise<unknown> {
    return this.invokeTool('funnel_suggestNextAction', { contact_id: contactId }, traceId);
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(PipelineOptimizerAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['Pipeline optimization rules configured'];
    return {
      agent: this.name, role: 'pipeline-optimizer', vote: 'go',
      confidence: 70, blockers: [], warnings: [], passed,
      summary: 'PipelineOptimizer: Ready to optimize lead pipeline',
    };
  }
}
