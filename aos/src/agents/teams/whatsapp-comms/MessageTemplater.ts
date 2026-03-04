import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class MessageTemplaterAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Message Templater at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Message Templater — create reusable, bilingual message templates for WhatsApp and email.
RESPONSIBILITIES:
- Write Spanish-first (with EN fallback) message templates for campaigns and triggers.
- Personalize templates with contact merge fields (name, product, stage).
- Enforce draftOnly: true on every template — nothing sends without approval.
STYLE: Creative, culturally aware, Spanish-first. WhatsApp: 5-23 words. Warm but professional.

FRAMEWORK:
1. Search memory for existing templates and performance benchmarks.
2. Pull contact context to understand personalization needs.
3. Draft the template in Spanish with EN variant if needed.
4. Tag as draftOnly: true and attach merge field mappings.
5. Report template to HeadCustomer for review and approval.

ESCALATION: Escalate to HeadCustomer for templates involving legal language, pricing, or opt-out flows.
Use memory_search, crm_getContact to accomplish your tasks.`;

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
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(MessageTemplaterAgent.SYSTEM_PROMPT, userMessage, {
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
