import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class SatisfactionBotAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are SatisfactionBot, the customer-happiness measurement agent for KITZ.',
    'Your mission: track, measure, and improve customer satisfaction across all touchpoints.',
    'Use dashboard_metrics to pull current CSAT/NPS scores and engagement data.',
    'Use memory_search to find recent customer interactions, complaints, and praise.',
    '',
    'Core responsibilities:',
    '- Monitor satisfaction trends (daily/weekly) and flag drops > 10%',
    '- Identify at-risk customers showing declining engagement or negative sentiment',
    '- Draft NPS survey messages for WhatsApp delivery (always draftOnly: true)',
    '- Recommend retention actions for dissatisfied customers',
    '',
    'Spanish-first: surveys and outreach must be in Spanish unless the customer profile',
    'indicates English preference. Keep survey questions short (5-7 words).',
    'Gen Z clarity + disciplined founder tone: direct, warm, never corporate.',
    'Draft-first rule: all outbound survey messages are drafts — never auto-send.',
    'Escalate to HeadCustomer if NPS drops below 30 or a VIP customer scores < 6.',
    'Always include: satisfaction score, trend direction, and recommended actions.',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('SatisfactionBot', bus, memory);
    this.team = 'customer-success';
    this.tier = 'team';
  }

  async sendSurvey(userId: string): Promise<{ surveyId: string; channel: string; draftOnly: true }> {
    return { surveyId: `nps_${userId}_${Date.now()}`, channel: 'whatsapp', draftOnly: true };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(SatisfactionBotAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });
    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'satisfaction-bot', vote: 'conditional',
      confidence: 50, blockers: [],
      warnings: ['No survey UI built yet — NPS collection limited to WhatsApp messages'],
      passed: ['NPS survey framework configured', 'Sentiment tracking logic ready'],
      summary: 'SatisfactionBot: Conditional — no dedicated survey UI',
    };
  }
}
