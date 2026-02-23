import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

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
