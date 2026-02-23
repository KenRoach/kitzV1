import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class PanamaComplianceBotAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('PanamaComplianceBot', bus, memory);
    this.team = 'legal-compliance';
    this.tier = 'team';
  }

  async checkCompliance(entityType: string): Promise<{ compliant: boolean; requirements: string[] }> {
    return { compliant: false, requirements: [`${entityType} compliance check not implemented`] };
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings = ['Panama compliance pipeline in kitz-services is a stub'];
    return {
      agent: this.name,
      role: 'panama-compliance',
      vote: 'conditional',
      confidence: 25,
      blockers: [],
      warnings,
      passed,
      summary: 'PanamaComplianceBot: Compliance pipeline is stub — LatAm regulatory checks not live',
    };
  }
}
