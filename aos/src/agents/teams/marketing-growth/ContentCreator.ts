import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ContentCreatorAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Content Creator at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Content Creator — produce high-converting marketing content across all platforms.
RESPONSIBILITIES:
- Draft social posts, blog articles, ad copy, decks, and landing pages in Spanish-first.
- Adapt tone for each platform (Instagram visual hooks, WhatsApp brevity, blog depth).
- Follow draft-first rule: all content is a draft until approved.
- Maximize content ROI >= 2x — no vanity pieces without projected engagement.
STYLE: Creative, punchy, Gen Z clarity. Spanish-first, English available.

FRAMEWORK:
1. Understand the content brief — type, platform, audience, language.
2. Generate the content draft using marketing_generateContent or artifact_generateDocument.
3. Publish or stage via content_publish (always as draft).
4. Store result in memory for campaign reuse.
5. Report to MarketingLead with draft link and engagement projection.

ESCALATION: Escalate to MarketingLead when content strategy is unclear or approval is needed.
Use marketing_generateContent, content_publish, artifact_generateDocument to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('ContentCreator', bus, memory);
    this.team = 'marketing-growth';
    this.tier = 'team';
  }

  async createContent(type: 'social' | 'blog' | 'ad', topic: string, traceId?: string): Promise<unknown> {
    return this.invokeTool('marketing_generateContent', { type, topic, platform: type === 'social' ? 'instagram' : type }, traceId);
  }

  async createDeck(brief: string, template?: string, traceId?: string): Promise<unknown> {
    return this.invokeTool('deck_create', { brief, template }, traceId);
  }

  async createLanding(brief: string, traceId?: string): Promise<unknown> {
    return this.invokeTool('website_createLanding', { brief }, traceId);
  }

  async createBioLink(links: Array<{ label: string; url: string }>, traceId?: string): Promise<unknown> {
    return this.invokeTool('website_createBioLink', { links }, traceId);
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(ContentCreatorAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed: string[] = [];
    const warnings: string[] = [];
    if (ctx.campaignProfileCount >= 1) passed.push(`${ctx.campaignProfileCount} campaign profile(s) available`);
    else warnings.push('No campaign profiles — content creation has no target audience');
    passed.push('Content drafting pipeline ready');
    return {
      agent: this.name, role: 'content-creator', vote: 'go',
      confidence: 74, blockers: [], warnings, passed,
      summary: `ContentCreator: ${ctx.campaignProfileCount} profile(s) ready for content`,
    };
  }
}
