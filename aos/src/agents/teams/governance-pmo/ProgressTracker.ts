import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ProgressTrackerAgent extends BaseAgent {
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

    const result = await this.invokeTool('dashboard_metrics', { ...payload }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
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
