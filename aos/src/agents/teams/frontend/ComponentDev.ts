import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class ComponentDevAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('ComponentDev', bus, memory);
    this.team = 'frontend';
    this.tier = 'team';
  }

  async scaffoldComponent(name: string): Promise<{ path: string; files: string[] }> {
    return { path: `ui/src/components/${name}`, files: [`${name}.tsx`, `${name}.test.tsx`] };
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
