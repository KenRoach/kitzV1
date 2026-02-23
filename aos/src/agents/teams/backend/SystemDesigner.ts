import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class SystemDesignerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('SystemDesigner', bus, memory);
    this.team = 'backend';
    this.tier = 'team';
  }

  async proposeArchitecture(feature: string): Promise<{ proposal: string; services: string[]; risk: string }> {
    return {
      proposal: `Architecture proposal for ${feature}`,
      services: [],
      risk: 'low',
    };
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed = ['13+ microservices defined with clear boundaries', 'Fastify 4.x framework standardized'];
    const warnings = ['Some services still stub maturity'];
    return {
      agent: this.name,
      role: 'system-designer',
      vote: 'go',
      confidence: 74,
      blockers: [],
      warnings,
      passed,
      summary: 'SystemDesigner: Architecture defined, service boundaries clear',
    };
  }
}
