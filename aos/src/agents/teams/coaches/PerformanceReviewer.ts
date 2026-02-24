import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class PerformanceReviewerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('PerformanceReviewer', bus, memory);
    this.team = 'coaches';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('memory_search', { query: 'agent performance metrics', limit: 20 }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name,
      team: this.team,
      traceId,
      findings: result.data,
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
