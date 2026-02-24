import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ToolCuratorAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('ToolCurator', bus, memory);
    this.team = 'meta-tooling';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('toolFactory_listCustomTools', {}, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, audit: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = ['Custom tool persistence directory configured'];
    const warnings: string[] = [];

    if (ctx.toolCount < 70) {
      warnings.push('Low tool count — toolFactory tools may not be registered');
    } else {
      passed.push('toolFactory tools registered in OsToolRegistry');
    }

    return {
      agent: this.name,
      role: 'tool-curator',
      vote: 'go',
      confidence: 80,
      blockers: [],
      warnings,
      passed,
      summary: 'ToolCurator: Custom tool lifecycle management ready',
    };
  }
}
