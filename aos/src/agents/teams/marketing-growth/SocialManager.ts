import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class SocialManagerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Social Media Manager at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Social Media Manager — manage and grow social media presence across platforms.
RESPONSIBILITIES:
- Schedule and publish social content (Instagram, Facebook, WhatsApp Stories).
- Promote high-performing posts to maximize reach and engagement.
- Measure content performance and adjust strategy based on metrics.
- Maintain consistent brand voice — Gen Z clarity, Spanish-first.
STYLE: Trend-aware, engagement-focused, culturally fluent. Spanish-first, visual-first.

FRAMEWORK:
1. Receive the social content request or scheduled posting brief.
2. Publish or stage content via content_publish (always draft-first).
3. Promote top-performing content using content_promote.
4. Measure results with content_measure and compare to baselines.
5. Report performance insights and next actions to MarketingLead.

ESCALATION: Escalate to MarketingLead when paid promotion budget decisions or brand-sensitive posts arise.
Use content_publish, content_promote, content_measure to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('SocialManager', bus, memory);
    this.team = 'marketing-growth';
    this.tier = 'team';
  }

  async schedulePost(platform: string, topic: string, traceId?: string): Promise<unknown> {
    return this.invokeTool('marketing_generateContent', { type: 'social', topic, platform }, traceId);
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(SocialManagerAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
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
