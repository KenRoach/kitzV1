import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class A11ySpecAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('A11ySpec', bus, memory);
    this.team = 'frontend';
    this.tier = 'team';
  }

  async auditAccessibility(componentName: string): Promise<{ score: number; violations: string[] }> {
    return { score: 0, violations: ['No a11y audit tooling configured'] };
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings = ['No accessibility audit tooling configured', 'WCAG compliance not yet verified'];
    return {
      agent: this.name,
      role: 'a11y-spec',
      vote: 'conditional',
      confidence: 40,
      blockers: [],
      warnings,
      passed,
      summary: 'A11ySpec: No a11y audit yet — recommend adding axe-core or similar',
    };
  }
}
