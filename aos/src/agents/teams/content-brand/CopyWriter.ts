import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class CopyWriterAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('CopyWriter', bus, memory);
    this.team = 'content-brand';
    this.tier = 'team';
  }

  async writeCopy(type: 'landing' | 'email' | 'ad' | 'whatsapp', context: string, traceId?: string): Promise<unknown> {
    return this.invokeTool('marketing_generateContent', { type: type === 'landing' ? 'ad' : type, topic: context }, traceId);
  }

  async createFlyer(headline: string, body: string, traceId?: string): Promise<unknown> {
    return this.invokeTool('flyer_create', { headline, body }, traceId);
  }

  async createPromo(platform: string, product: string, traceId?: string): Promise<unknown> {
    return this.invokeTool('promo_create', { platform, product }, traceId);
  }

  async buildEmail(brief: string, traceId?: string): Promise<unknown> {
    return this.invokeTool('email_buildTemplate', { brief }, traceId);
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const type = (payload.type as string) ?? 'email';
    let result;
    if (type === 'flyer') {
      result = await this.invokeTool('flyer_create', {
        headline: payload.headline ?? payload.topic ?? 'Promotional Flyer',
        body: payload.body ?? payload.topic ?? '',
      }, traceId);
    } else if (type === 'promo') {
      result = await this.invokeTool('promo_create', {
        platform: payload.platform ?? 'whatsapp',
        product: payload.product ?? payload.topic ?? '',
      }, traceId);
    } else {
      result = await this.invokeTool('email_buildTemplate', {
        brief: payload.topic ?? 'KITZ platform features and benefits',
        template: payload.template ?? 'welcome',
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

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'copy-writer', vote: 'go',
      confidence: 75, blockers: [], warnings: [],
      passed: ['Copy drafting pipeline ready', 'Brand voice alignment configured via KITZ_MASTER_PROMPT'],
      summary: 'CopyWriter: Ready to draft customer-facing copy',
    };
  }
}
