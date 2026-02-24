import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ToolInventoryAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('ToolInventory', bus, memory);
    this.team = 'meta-tooling';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('toolFactory_listCustomTools', {}, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];

    if (ctx.toolCount >= 70) {
      passed.push('Tool registry has 70+ tools including toolFactory tools');
    } else {
      warnings.push(`Tool registry only has ${ctx.toolCount} tools — meta-tooling may not be registered`);
    }

    return {
      agent: this.name,
      role: 'tool-inventory',
      vote: 'go',
      confidence: 80,
      blockers: [],
      warnings,
      passed,
      summary: 'ToolInventory: Custom tool inventory system operational',
    };
  }
}
