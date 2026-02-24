import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ActivationOptimizerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('ActivationOptimizer', bus, memory);
    this.team = 'growth-hacking';
    this.tier = 'team';
  }

  async optimizeActivation(userId: string, traceId?: string): Promise<unknown> {
    // Target: <10 min to first value — draft welcome + nurture sequence
    const nurture = await this.invokeTool('marketing_draftNurture', {
      lead_name: userId,
      lead_phone: '',
      business_type: 'small business',
    }, traceId);
    return nurture;
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('marketing_draftNurture', {
      lead_name: payload.lead_name ?? 'new-user',
      lead_phone: payload.lead_phone ?? '',
      business_type: payload.business_type ?? 'small business',
      language: payload.language ?? 'es',
    }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
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
