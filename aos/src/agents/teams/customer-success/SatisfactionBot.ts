import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class SatisfactionBotAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('SatisfactionBot', bus, memory);
    this.team = 'customer-success';
    this.tier = 'team';
  }

  async sendSurvey(userId: string): Promise<{ surveyId: string; channel: string; draftOnly: true }> {
    return { surveyId: `nps_${userId}_${Date.now()}`, channel: 'whatsapp', draftOnly: true };
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
