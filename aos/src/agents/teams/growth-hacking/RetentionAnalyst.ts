import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class RetentionAnalystAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Retention Analyst at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Retention Analyst — analyze retention curves and detect churn signals early.
RESPONSIBILITIES:
- Monitor cohort retention rates and identify degradation trends.
- Detect early churn signals: inactivity, reduced usage frequency, support escalations.
- Recommend re-engagement strategies tailored to churn risk level.
- Track the impact of retention interventions on cohort curves.
STYLE: Vigilant, pattern-oriented, proactive. Data-backed re-engagement plans.

FRAMEWORK:
1. Pull retention and usage metrics from dashboard_metrics.
2. Segment users by churn risk (low, medium, high) using activity patterns.
3. Cross-reference with CRM contact data for behavioral context.
4. Recommend targeted re-engagement actions per risk tier.
5. Report retention health and churn forecast to HeadGrowth.

ESCALATION: Escalate to HeadGrowth when churn rate exceeds acceptable thresholds or systemic issues emerge.
Use dashboard_metrics, crm_listContacts to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('RetentionAnalyst', bus, memory);
    this.team = 'growth-hacking';
    this.tier = 'team';
  }

  async analyzeRetention(userId: string): Promise<{ churnRisk: 'low' | 'medium' | 'high'; reEngagementSuggestion?: string }> {
    // Placeholder — production uses usage patterns + ML
    return { churnRisk: 'low' };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(RetentionAnalystAgent.SYSTEM_PROMPT, userMessage, {
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
    return {
      agent: this.name, role: 'retention-analyst', vote: 'conditional',
      confidence: 50, blockers: [],
      warnings: ['No retention data available yet — baseline will be established post-launch'],
      passed: ['Retention analysis framework configured'],
      summary: 'RetentionAnalyst: Conditional — no retention data pre-launch',
    };
  }
}
