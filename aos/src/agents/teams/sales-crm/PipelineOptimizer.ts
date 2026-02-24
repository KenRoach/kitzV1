import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class PipelineOptimizerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('PipelineOptimizer', bus, memory);
    this.team = 'sales-crm';
    this.tier = 'team';
  }

  async suggestStageMove(contactId: string, traceId?: string): Promise<unknown> {
    return this.invokeTool('funnel_suggestNextAction', { contact_id: contactId }, traceId);
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('funnel_getStatus', {
      include_contacts: true,
    }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed = ['Pipeline optimization rules configured'];
    return {
      agent: this.name, role: 'pipeline-optimizer', vote: 'go',
      confidence: 70, blockers: [], warnings: [], passed,
      summary: 'PipelineOptimizer: Ready to optimize lead pipeline',
    };
  }
}
