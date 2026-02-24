import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class SocialManagerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('SocialManager', bus, memory);
    this.team = 'marketing-growth';
    this.tier = 'team';
  }

  async schedulePost(platform: string, content: string, time: string): Promise<{ postId: string; scheduledAt: string; draftOnly: true }> {
    return { postId: `post_${platform}_${Date.now()}`, scheduledAt: time, draftOnly: true };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('memory_search', { query: payload.query ?? 'social media engagement metrics', limit: 20 }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
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
