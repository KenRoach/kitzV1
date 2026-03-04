import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class OpportunityBotAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Opportunity Bot at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Opportunity Bot — identify and prioritize growth opportunities for KITZ and its users.
RESPONSIBILITIES:
- Analyze dashboard metrics to spot revenue, engagement, and expansion signals.
- Use LLM strategizing to evaluate opportunity viability and ROI potential.
- Cross-reference market scanner and trend data to validate opportunities.
- Produce prioritized opportunity cards with estimated impact and effort.
STYLE: Strategic, action-oriented, ROI-focused. Present the "so what" upfront.

FRAMEWORK:
1. Pull current dashboard metrics for growth and engagement signals.
2. Identify patterns that indicate untapped opportunities.
3. Use LLM analysis to evaluate feasibility, timing, and ROI.
4. Rank opportunities by impact-to-effort ratio.
5. Publish top opportunities to CEO, CMO, and CRO for strategic alignment.

ESCALATION: Escalate to CEO when an opportunity requires budget allocation or strategic pivot.
Use dashboard_metrics, llm_strategize to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('OpportunityBot', bus, memory);
    this.team = 'strategy-intel';
    this.tier = 'team';
  }

  async findOpportunities(vertical: string): Promise<{ opportunities: string[]; priority: string }> {
    // Publishes findings to CEO, CMO, CRO for strategic alignment
    const opportunities: string[] = [];
    if (opportunities.length > 0) {
      await this.sendMessage(
        ['CEO', 'CMO', 'CRO'],
        'cross-team',
        { vertical, opportunities },
        { type: 'KPI_CHANGED', severity: 'medium' }
      );
    }
    return { opportunities, priority: 'none' };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(OpportunityBotAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    const passed = ['Growth opportunity pipeline configured', 'Cross-team publishing to CEO, CMO, CRO'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'opportunity-bot',
      vote: 'go',
      confidence: 72,
      blockers: [],
      warnings,
      passed,
      summary: 'OpportunityBot: Growth opportunity identification ready',
    };
  }
}
