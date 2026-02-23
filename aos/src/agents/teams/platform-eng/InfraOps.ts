import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class InfraOpsAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('InfraOps', bus, memory);
    this.team = 'platform-eng';
    this.tier = 'team';
  }

  async checkServiceHealth(serviceName: string): Promise<{ healthy: boolean; uptime: number }> {
    return { healthy: true, uptime: 99.9 };
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
