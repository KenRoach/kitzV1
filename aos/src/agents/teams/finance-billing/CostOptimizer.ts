import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class CostOptimizerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are CostOptimizer, the financial cost optimization and spend analysis specialist for KITZ.',
    'Your mission: minimize operational costs while maintaining service quality, enforce ROI >= 2x rule.',
    'Use dashboard_metrics to pull spend breakdowns, cost trends, and budget utilization.',
    'Use advisor_breakeven to calculate breakeven points for features and AI credit consumption.',
    '',
    'KITZ cost optimization priorities:',
    '- AI Battery: daily limit 5 credits (configurable) — enforce strictly',
    '- ROI >= 2x rule: if projected return < 2x cost, recommend manual mode',
    '- LLM tier routing: use cheapest tier that meets quality requirements',
    '- Infrastructure: Railway hosting costs, Supabase usage, third-party API costs',
    '- Subscribe to BATTERY_BURN_ANOMALY events for real-time spend alerts',
    '',
    'Cost reduction levers:',
    '- Downgrade LLM tier where Haiku matches Sonnet quality',
    '- Cache frequent queries to reduce redundant API calls',
    '- Batch operations where possible (bulk CRM updates, batch email)',
    '- Identify idle resources and unused service instances',
    '- Track cost-per-customer and cost-per-successful-task',
    'Report weekly cost optimization opportunities to CFO.',
    'Escalate budget overruns or anomalous spend (> 200% daily average) to CFO immediately.',
    'Gen Z clarity: exact dollar savings, exact ROI ratios — no vague "costs are manageable".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('CostOptimizer', bus, memory);
    this.team = 'finance-billing';
    this.tier = 'team';

    this.eventBus.subscribe('BATTERY_BURN_ANOMALY', async (event) => {
      await this.publish('KPI_CHANGED', {
        source: this.name,
        metric: 'ai_spend_anomaly',
        detail: event.payload,
      });
    });
  }

  async analyzeSpend(period: string): Promise<{ totalCredits: number; breakdown: Record<string, number> }> {
    return { totalCredits: 0, breakdown: {} };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(CostOptimizerAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed: string[] = [];
    const warnings: string[] = [];
    if (ctx.batteryDailyLimit > 0) passed.push(`AI Battery daily limit set to ${ctx.batteryDailyLimit}`);
    else warnings.push('AI Battery daily limit not configured');
    warnings.push('No cost tracking dashboard — spend visibility limited to ledger file');
    return {
      agent: this.name,
      role: 'cost-optimizer',
      vote: 'go',
      confidence: 60,
      blockers: [],
      warnings,
      passed,
      summary: `CostOptimizer: Battery limit ${ctx.batteryDailyLimit > 0 ? 'configured' : 'missing'}, no cost dashboard`,
    };
  }
}
