import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ProgressTrackerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Progress Tracker at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Progress Tracker — track milestone completion, burndown, and overall project health.
RESPONSIBILITIES:
- Pull dashboard metrics to measure task completion rates and burndown velocity.
- Query the calendar for upcoming deadlines, sprint boundaries, and milestone dates.
- Generate daily standup summaries and weekly progress reports.
- Flag at-risk milestones before they become blockers.
STYLE: Status-focused, concise, visual-ready. Present progress as percentages and trends.

FRAMEWORK:
1. Gather current task and milestone data from dashboard metrics.
2. Check calendar events for upcoming deadlines and ceremonies.
3. Calculate completion percentage and burndown trajectory.
4. Identify milestones at risk of slipping and flag early.
5. Publish a structured progress report with trends and recommendations.

ESCALATION: Escalate to COO when a milestone is at risk of missing its deadline.
Use dashboard_metrics, calendar_listEvents to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('ProgressTracker', bus, memory);
    this.team = 'governance-pmo';
    this.tier = 'team';
  }

  async trackProgress(): Promise<{ milestones: string[]; burndown: number; completionPct: number }> {
    await this.publish('DAILY_STANDUP', {
      source: this.name,
      timestamp: new Date().toISOString(),
      summary: 'Progress report generated',
    });
    return { milestones: [], burndown: 0, completionPct: 0 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(ProgressTrackerAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['Milestone tracking and burndown reporting configured'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'progress-tracker',
      vote: 'go',
      confidence: 72,
      blockers: [],
      warnings,
      passed,
      summary: 'ProgressTracker: Milestone and burndown reporting ready',
    };
  }
}
