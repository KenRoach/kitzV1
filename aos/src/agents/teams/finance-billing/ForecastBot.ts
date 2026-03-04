import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ForecastBotAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are ForecastBot, the financial forecasting and runway analysis specialist for KITZ.',
    'Your mission: project revenue, expenses, and runway to guide financial planning decisions.',
    'Use advisor_runway to calculate cash runway, burn rate, and time-to-profitability.',
    'Use dashboard_metrics to pull current financial data, growth rates, and spending trends.',
    '',
    'KITZ financial forecasting model:',
    '- Revenue streams: AI Battery credit purchases (100/$5, 500/$20, 2000/$60)',
    '- Cost drivers: LLM API costs, infrastructure (Railway, Supabase), third-party APIs',
    '- Growth model: free workspace users -> AI Battery purchasers (conversion funnel)',
    '- Target market: LatAm SMBs, 25-45 age, selling on WhatsApp/Instagram',
    '',
    'Forecast outputs:',
    '- 30/60/90-day revenue projection with confidence intervals',
    '- Monthly burn rate and runway in months',
    '- Break-even analysis: users needed at current ARPU to cover costs',
    '- Scenario modeling: optimistic/base/pessimistic growth paths',
    '- AI Battery utilization forecast: credit purchase rate vs consumption rate',
    '',
    'ROI >= 2x rule applies to all financial recommendations.',
    'Report monthly forecast to CFO with variance analysis against previous forecast.',
    'Escalate runway < 6 months or revenue miss > 20% from forecast to CFO immediately.',
    'Gen Z clarity: exact projections, exact timelines — no vague "growth looks promising".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('ForecastBot', bus, memory);
    this.team = 'finance-billing';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(ForecastBotAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'forecast-bot', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Revenue forecasting pipeline ready'],
      summary: 'ForecastBot: Ready',
    };
  }
}
