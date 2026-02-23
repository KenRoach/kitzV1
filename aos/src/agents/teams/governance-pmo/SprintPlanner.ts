import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class SprintPlannerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('SprintPlanner', bus, memory);
    this.team = 'governance-pmo';
    this.tier = 'team';
  }

  async planSprint(backlog: string[]): Promise<{ sprintId: string; tasks: string[]; capacityUsed: number }> {
    const sprintId = `sprint_${Date.now()}`;
    await this.publish('SPRINT_STARTED', { sprintId, taskCount: backlog.length });
    return { sprintId, tasks: backlog, capacityUsed: 0 };
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    const passed = ['Sprint planning framework configured'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'sprint-planner',
      vote: 'go',
      confidence: 70,
      blockers: [],
      warnings,
      passed,
      summary: 'SprintPlanner: Sprint cycle management ready',
    };
  }
}
