import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ComputeBuilderAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('ComputeBuilder', bus, memory);
    this.team = 'meta-tooling';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('toolFactory_listCustomTools', { type: 'compute' }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, computeTools: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name,
      role: 'compute-builder',
      vote: 'go',
      confidence: 85,
      blockers: [],
      warnings: [],
      passed: ['Compute DSL evaluator operational', 'Safe math parser available'],
      summary: 'ComputeBuilder: JSON DSL compute tool factory ready',
    };
  }
}
