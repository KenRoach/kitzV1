import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class TranslationBotAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('TranslationBot', bus, memory);
    this.team = 'content-brand';
    this.tier = 'team';
  }

  async translate(text: string, from: 'es' | 'en', to: 'es' | 'en', traceId?: string): Promise<unknown> {
    return this.invokeTool('marketing_translateContent', { text, from, to }, traceId);
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('marketing_translateContent', {
      text: payload.text ?? 'KITZ te ayuda a manejar tu negocio desde WhatsApp',
      from: payload.from ?? 'es',
      to: payload.to ?? 'en',
    }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = ['Translation pipeline configured (ES/EN)'];
    const warnings: string[] = [];
    if (ctx.campaignTemplateLanguages.includes('es') && ctx.campaignTemplateLanguages.includes('en')) {
      passed.push('Both ES and EN templates available for translation');
    } else {
      warnings.push('Limited template languages — translation coverage may be incomplete');
    }
    return {
      agent: this.name, role: 'translation-bot', vote: 'go',
      confidence: 72, blockers: [], warnings, passed,
      summary: 'TranslationBot: ES/EN real-time translation ready',
    };
  }
}
