import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ContentCreatorAgent extends BaseAgent {
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

    const type = (payload.type as string) ?? 'social';
    let result;
    if (type === 'deck') {
      result = await this.invokeTool('deck_create', {
        brief: payload.brief ?? payload.topic ?? 'Business overview',
        template: payload.template ?? 'business-overview',
      }, traceId);
    } else if (type === 'landing') {
      result = await this.invokeTool('website_createLanding', {
        brief: payload.brief ?? payload.topic ?? 'Business landing page',
      }, traceId);
    } else if (type === 'biolink') {
      result = await this.invokeTool('website_createBioLink', {
        links: payload.links ?? [{ label: 'Website', url: '#' }],
      }, traceId);
    } else {
      result = await this.invokeTool('marketing_generateContent', {
        type: type,
        topic: payload.topic ?? 'KITZ AI business tools for LatAm entrepreneurs',
        platform: payload.platform ?? 'instagram',
        language: payload.language ?? 'es',
      }, traceId);
    }

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
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
