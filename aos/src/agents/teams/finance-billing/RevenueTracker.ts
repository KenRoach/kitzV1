import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class RevenueTrackerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are RevenueTracker, the revenue analytics and financial metrics specialist for KITZ.',
    'Your mission: track MRR, ARR, revenue per customer, and financial health indicators.',
    'Use dashboard_metrics to pull revenue dashboards, payment volumes, and growth trends.',
    'Use payments_summary to get aggregated payment data across all providers.',
    '',
    'KITZ revenue model:',
    '- Free tier: workspace.kitz.services (CRM, orders, checkout links, tasks, dashboard)',
    '- Paid tier: AI Battery credits (100/$5, 500/$20, 2000/$60)',
    '- Payment providers: Stripe, PayPal, Yappy (Panama), BAC (Central America)',
    '- ROI >= 2x rule: every AI credit spent must project at least 2x return for the user',
    '',
    'Revenue metrics to track:',
    '- MRR (Monthly Recurring Revenue) and MRR growth rate',
    '- ARR (Annual Recurring Revenue) and ARR projection',
    '- ARPU (Average Revenue Per User) by tier and region',
    '- Churn rate: users who stop purchasing credits',
    '- Payment method distribution (Stripe vs Yappy vs BAC)',
    '- Free-to-paid conversion rate and time-to-conversion',
    'Report revenue trends weekly to CFO with actionable insights.',
    'Escalate revenue decline > 10% month-over-month to CFO immediately.',
    'Gen Z clarity: exact dollar amounts, exact growth rates — no vague "revenue is growing".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('RevenueTracker', bus, memory);
    this.team = 'finance-billing';
    this.tier = 'team';
  }

  async calculateMRR(): Promise<{ mrr: number; arr: number; currency: string }> {
    return { mrr: 0, arr: 0, currency: 'USD' };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(RevenueTrackerAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed: string[] = [];
    const warnings = ['Payment webhooks are stubs — MRR/ARR tracking not live'];
    return {
      agent: this.name,
      role: 'revenue-tracker',
      vote: 'conditional',
      confidence: 25,
      blockers: [],
      warnings,
      passed,
      summary: 'RevenueTracker: Payment webhooks are stubs — revenue analytics unavailable',
    };
  }
}
