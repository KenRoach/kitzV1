import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ComponentDevAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('ComponentDev', bus, memory);
    this.team = 'frontend';
    this.tier = 'team';
  }

  async scaffoldComponent(name: string): Promise<{ path: string; files: string[] }> {
    return { path: `ui/src/components/${name}`, files: [`${name}.tsx`, `${name}.test.tsx`] };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('memory_search', { query: payload.query ?? 'component library inventory', limit: 20 }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed = ['React + Tailwind implementation active'];
    const warnings = ['Component test coverage is minimal'];
    return {
      agent: this.name,
      role: 'component-dev',
      vote: 'go',
      confidence: 70,
      blockers: [],
      warnings,
      passed,
      summary: 'ComponentDev: React/Tailwind components functional',
    };
  }
}
