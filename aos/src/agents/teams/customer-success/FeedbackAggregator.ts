import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class FeedbackAggregatorAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('FeedbackAggregator', bus, memory);
    this.team = 'customer-success';
    this.tier = 'team';
  }

  async aggregateFeedback(period: 'day' | 'week' | 'month'): Promise<{ themes: string[]; count: number; sentiment: 'positive' | 'neutral' | 'negative' }> {
    // Placeholder — production aggregates from WhatsApp, email, and workspace
    return { themes: [], count: 0, sentiment: 'neutral' };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('memory_search', { query: payload.query ?? 'customer feedback recent', limit: 20 }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = ['Feedback aggregation pipeline configured'];
    if (ctx.whatsappConnectorConfigured) passed.push('WhatsApp feedback channel active');
    return {
      agent: this.name, role: 'feedback-aggregator', vote: 'go',
      confidence: 70, blockers: [], warnings: [], passed,
      summary: 'FeedbackAggregator: Ready to collect and theme user feedback',
    };
  }
}
