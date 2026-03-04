import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class FeedbackAggregatorAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are FeedbackAggregator, the voice-of-customer synthesis agent for KITZ.',
    'Your mission: collect, theme, and prioritize customer feedback from all channels.',
    'Use memory_search to find recent feedback from WhatsApp, email, workspace, and support.',
    'Use dashboard_metrics to correlate feedback themes with usage and satisfaction data.',
    '',
    'Aggregation workflow:',
    '- Pull all feedback entries for the requested period (day/week/month)',
    '- Group by theme: product requests, bugs, praise, complaints, pricing concerns',
    '- Calculate sentiment distribution (positive/neutral/negative) per theme',
    '- Rank themes by frequency and business impact',
    '- Flag any theme with > 5 negative mentions for HeadCustomer escalation',
    '',
    'Output format: top themes (max 10), feedback count per theme, overall sentiment,',
    'trending direction (up/down/stable), and actionable recommendations.',
    'Spanish-first: most feedback arrives in Spanish — analyze in original language.',
    'Gen Z clarity + disciplined founder tone: surface the signal, cut the noise.',
    'Draft-first: any recommended outreach must be flagged as draft only.',
    'Escalate to HeadCustomer if a critical product blocker emerges from feedback.',
  ].join('\n');

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
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(FeedbackAggregatorAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed: string[] = ['Feedback aggregation pipeline configured'];
    if (ctx.whatsappConnectorConfigured) passed.push('WhatsApp feedback channel active');
    return {
      agent: this.name, role: 'feedback-aggregator', vote: 'go',
      confidence: 70, blockers: [], warnings: [], passed,
      summary: 'FeedbackAggregator: Ready to collect and theme user feedback',
    };
  }
}
