import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class SocialManagerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('SocialManager', bus, memory);
    this.team = 'marketing-growth';
    this.tier = 'team';
  }

  async schedulePost(platform: string, content: string, time: string): Promise<{ postId: string; scheduledAt: string; draftOnly: true }> {
    return { postId: `post_${platform}_${Date.now()}`, scheduledAt: time, draftOnly: true };
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = ['Social scheduling pipeline configured'];
    const warnings: string[] = [];
    if (ctx.campaignProfileCount === 0) warnings.push('No social profiles connected — posting will be limited');
    else passed.push(`${ctx.campaignProfileCount} social profile(s) connected`);
    return {
      agent: this.name, role: 'social-manager', vote: 'go',
      confidence: 68, blockers: [], warnings, passed,
      summary: `SocialManager: ${ctx.campaignProfileCount > 0 ? 'Social channels active' : 'Ready but no profiles connected'}`,
    };
  }
}
