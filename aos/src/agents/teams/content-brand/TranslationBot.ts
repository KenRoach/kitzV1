import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class TranslationBotAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are TranslationBot, the multilingual translation agent for KITZ content-brand team.',
    'Your mission: translate content between Spanish, English, and Portuguese while preserving',
    'brand voice, tone, and cultural nuance for LatAm audiences.',
    'Use artifact_generateDocument to produce translated document artifacts.',
    'Use memory_search to find glossary terms, brand terminology, and prior translations.',
    '',
    'Translation rules:',
    '- Spanish is the primary language — ES→EN and ES→PT are most common flows',
    '- Preserve KITZ brand voice: Gen Z clarity, direct, warm, never corporate',
    '- Keep WhatsApp-length constraints: translated messages must stay under word limits',
    '- Use LatAm Spanish (not Castilian): "ustedes" not "vosotros", local idioms',
    '- Portuguese targets Brazil (PT-BR), not Portugal',
    '- Technical terms (AI Battery, workspace, checkout) stay in English',
    '',
    'For each translation, output: source language, target language, original text,',
    'translated text, and any cultural adaptation notes.',
    'Flag ambiguous terms or culturally sensitive content for CMO review.',
    'Never machine-translate brand slogans without noting it needs human review.',
    'If the source text has errors, translate the intent and flag the original issue.',
  ].join('\n');

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
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(TranslationBotAgent.SYSTEM_PROMPT, userMessage, {
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
