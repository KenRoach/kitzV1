import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class InfraOpsAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('InfraOps', bus, memory);
    this.team = 'platform-eng';
    this.tier = 'team';
  }

  async checkServiceHealth(serviceName: string): Promise<{ healthy: boolean; uptime: number }> {
    return { healthy: true, uptime: 99.9 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('dashboard_metrics', { ...payload }, traceId);

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
    if (ctx.servicesHealthy.length > 0) passed.push(`${ctx.servicesHealthy.length} services healthy`);
    if (ctx.servicesDown.length > 0) warnings.push(`${ctx.servicesDown.length} services down: ${ctx.servicesDown.join(', ')}`);
    return {
      agent: this.name,
      role: 'infra-ops',
      vote: ctx.servicesDown.length > 3 ? 'no-go' : 'go',
      confidence: 80,
      blockers: [],
      warnings,
      passed,
      summary: `InfraOps: ${ctx.servicesHealthy.length}/${ctx.servicesHealthy.length + ctx.servicesDown.length} services healthy`,
    };
  }
}
