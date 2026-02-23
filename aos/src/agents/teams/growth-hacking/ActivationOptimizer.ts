import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class ActivationOptimizerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('ActivationOptimizer', bus, memory);
    this.team = 'growth-hacking';
    this.tier = 'team';
  }

  async optimizeActivation(userId: string): Promise<{ suggestedFlow: string; estimatedMinutes: number }> {
    // Target: <10 min to first value
    return { suggestedFlow: 'quick-start-whatsapp', estimatedMinutes: 8 };
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const passed: string[] = [];
    const warnings: string[] = [];
    if (ctx.activationTargetMinutes <= 10) {
      passed.push(`Activation target: ${ctx.activationTargetMinutes} min (within 10-min goal)`);
    } else {
      blockers.push(`Activation target ${ctx.activationTargetMinutes} min exceeds 10-min goal — users will churn`);
    }
    if (ctx.whatsappConnectorConfigured) passed.push('WhatsApp quick-start flow available');
    else warnings.push('WhatsApp connector not configured — limits activation paths');
    return {
      agent: this.name, role: 'activation-optimizer', vote: blockers.length > 0 ? 'no-go' : 'go',
      confidence: blockers.length > 0 ? 35 : 80, blockers, warnings, passed,
      summary: `ActivationOptimizer: ${ctx.activationTargetMinutes}-min activation target`,
    };
  }
}
