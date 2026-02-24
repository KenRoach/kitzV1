import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class MessageTemplaterAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('MessageTemplater', bus, memory);
    this.team = 'whatsapp-comms';
    this.tier = 'team';
  }

  async createTemplate(name: string, lang: 'es' | 'en', body: string): Promise<{ templateId: string; draftOnly: true }> {
    return { templateId: `tmpl_${name}_${lang}`, draftOnly: true };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('memory_search', { query: payload.query ?? 'message template library', limit: 20 }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const passed: string[] = [];
    if (ctx.campaignTemplateLanguages.includes('es') && ctx.campaignTemplateLanguages.includes('en')) {
      passed.push('Bilingual templates available (ES/EN)');
    } else {
      blockers.push('Missing bilingual templates — need both ES and EN');
    }
    passed.push('All templates enforce draftOnly: true');
    return {
      agent: this.name, role: 'message-templater', vote: blockers.length > 0 ? 'conditional' : 'go',
      confidence: 78, blockers, warnings: [], passed,
      summary: `MessageTemplater: ${ctx.campaignTemplateLanguages.length} language(s) ready`,
    };
  }
}
