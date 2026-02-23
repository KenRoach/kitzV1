import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class RevenueTrackerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('RevenueTracker', bus, memory);
    this.team = 'finance-billing';
    this.tier = 'team';
  }

  async calculateMRR(): Promise<{ mrr: number; arr: number; currency: string }> {
    return { mrr: 0, arr: 0, currency: 'USD' };
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings = ['Payment webhooks are stubs — MRR/ARR tracking not live'];
    return {
      agent: this.name,
      role: 'revenue-tracker',
      vote: 'conditional',
      confidence: 25,
      blockers: [],
      warnings,
      passed,
      summary: 'RevenueTracker: Payment webhooks are stubs — revenue analytics unavailable',
    };
  }
}
