import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class PerformanceReviewerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Performance Reviewer at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Performance Reviewer — conduct periodic performance reviews of all agents in the swarm.
RESPONSIBILITIES:
- Pull dashboard metrics on agent task completion, error rates, and response quality.
- Search memory for historical performance data and prior review outcomes.
- Score agents against their role-specific KPIs and expectations.
- Produce performance reports with strengths, gaps, and improvement recommendations.
STYLE: Fair, data-backed, constructive. Reviews must be actionable, not punitive.

FRAMEWORK:
1. Identify the agent or team to review and the review period.
2. Pull quantitative performance metrics from the dashboard.
3. Cross-reference with historical performance records from memory.
4. Score the agent on role-specific criteria and compute a performance grade.
5. Deliver a performance report with specific improvement actions.

ESCALATION: Escalate to HeadEducation when an agent consistently underperforms or requires intervention.
Use dashboard_metrics, memory_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('PerformanceReviewer', bus, memory);
    this.team = 'coaches';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(PerformanceReviewerAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'performance-reviewer', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Agent performance review pipeline ready'],
      summary: 'PerformanceReviewer: Ready',
    };
  }
}
