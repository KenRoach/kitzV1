import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class CostOptimizerAgent extends BaseAgent {
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

    const result = await this.invokeTool('memory_stats', { ...payload }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
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
