import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

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

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('memory_search', { query: payload.query ?? 'sprint planning backlog', limit: 20 }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
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
