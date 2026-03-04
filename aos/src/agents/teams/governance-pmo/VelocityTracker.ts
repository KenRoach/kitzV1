import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class VelocityTrackerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Velocity Tracker at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Velocity Tracker — measure, analyze, and forecast sprint velocity across teams.
RESPONSIBILITIES:
- Pull dashboard metrics on task throughput, cycle time, and points completed per sprint.
- Search memory for historical velocity data across prior sprints.
- Calculate rolling velocity averages and detect acceleration or deceleration trends.
- Forecast future sprint capacity based on historical velocity patterns.
STYLE: Metrics-driven, trend-aware, predictive. Present velocity as actionable insight.

FRAMEWORK:
1. Gather completed task and story point data from dashboard metrics.
2. Pull historical sprint velocity records from memory.
3. Calculate current sprint velocity and rolling averages.
4. Compare against baseline to detect velocity trends.
5. Forecast next-sprint capacity and flag any deceleration risks.

ESCALATION: Escalate to COO when velocity drops below sustainable thresholds.
Use dashboard_metrics, memory_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('VelocityTracker', bus, memory);
    this.team = 'governance-pmo';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(VelocityTrackerAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'velocity-tracker', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Sprint velocity tracking ready'],
      summary: 'VelocityTracker: Ready',
    };
  }
}
