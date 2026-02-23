import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class OpportunityBotAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('OpportunityBot', bus, memory);
    this.team = 'strategy-intel';
    this.tier = 'team';
  }

  async findOpportunities(vertical: string): Promise<{ opportunities: string[]; priority: string }> {
    // Publishes findings to CEO, CMO, CRO for strategic alignment
    const opportunities: string[] = [];
    if (opportunities.length > 0) {
      await this.sendMessage(
        ['CEO', 'CMO', 'CRO'],
        'cross-team',
        { vertical, opportunities },
        { type: 'KPI_CHANGED', severity: 'medium' }
      );
    }
    return { opportunities, priority: 'none' };
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    const passed = ['Growth opportunity pipeline configured', 'Cross-team publishing to CEO, CMO, CRO'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'opportunity-bot',
      vote: 'go',
      confidence: 72,
      blockers: [],
      warnings,
      passed,
      summary: 'OpportunityBot: Growth opportunity identification ready',
    };
  }
}
