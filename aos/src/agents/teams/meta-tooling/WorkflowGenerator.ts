import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class WorkflowGeneratorAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('WorkflowGenerator', bus, memory);
    this.team = 'meta-tooling';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('n8n_healthCheck', {}, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, n8nHealth: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const warnings: string[] = [];
    if (!ctx.aiKeysConfigured) {
      warnings.push('No AI keys — LLM-based workflow generation will fail');
    }

    return {
      agent: this.name,
      role: 'workflow-generator',
      vote: ctx.aiKeysConfigured ? 'go' : 'conditional',
      confidence: ctx.aiKeysConfigured ? 80 : 40,
      blockers: [],
      warnings,
      passed: ctx.aiKeysConfigured ? ['AI keys configured for LLM workflow generation'] : [],
      summary: `WorkflowGenerator: ${ctx.aiKeysConfigured ? 'LLM workflow generation ready' : 'Needs AI keys for LLM generation'}`,
    };
  }
}
