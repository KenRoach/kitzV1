import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class SatisfactionBotAgent extends BaseAgent {
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

    const result = await this.invokeTool('crm_listContacts', { ...payload }, traceId);

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
      agent: this.name, role: 'satisfaction-bot', vote: 'conditional',
      confidence: 50, blockers: [],
      warnings: ['No survey UI built yet — NPS collection limited to WhatsApp messages'],
      passed: ['NPS survey framework configured', 'Sentiment tracking logic ready'],
      summary: 'SatisfactionBot: Conditional — no dedicated survey UI',
    };
  }
}
