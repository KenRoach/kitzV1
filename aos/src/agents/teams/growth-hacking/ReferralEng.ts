import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class ReferralEngAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('ReferralEng', bus, memory);
    this.team = 'growth-hacking';
    this.tier = 'team';
  }

  async generateReferralCode(userId: string): Promise<{ code: string; url: string }> {
    const code = `KITZ_${userId.slice(0, 6).toUpperCase()}`;
    return { code, url: `https://workspace.kitz.services/ref/${code}` };
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'referral-eng', vote: 'go',
      confidence: 65, blockers: [],
      warnings: [],
      passed: ['Referral code generation ready', 'Referral tracking stub active'],
      summary: 'ReferralEng: Referral system stub ready for launch',
    };
  }
}
