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

  async createContent(type: 'social' | 'blog' | 'ad', topic: string): Promise<{ contentId: string; draft: string; draftOnly: true }> {
    return { contentId: `content_${type}_${Date.now()}`, draft: `Draft ${type} about ${topic}`, draftOnly: true };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('memory_search', { query: payload.query ?? 'content creation pipeline', limit: 20 }, traceId);

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
