import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ModelEvalAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('ModelEval', bus, memory);
    this.team = 'ai-ml';
    this.tier = 'team';
  }

  async evaluateModel(model: string, benchmark: string): Promise<{ score: number; passed: boolean }> {
    return { score: 0, passed: false };
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
    if (ctx.aiKeysConfigured) passed.push('AI provider keys configured');
    else warnings.push('AI keys not configured — model evaluation cannot run');
    return {
      agent: this.name,
      role: 'model-eval',
      vote: ctx.aiKeysConfigured ? 'go' : 'conditional',
      confidence: ctx.aiKeysConfigured ? 78 : 35,
      blockers: [],
      warnings,
      passed,
      summary: `ModelEval: ${ctx.aiKeysConfigured ? 'Model benchmarking ready' : 'Awaiting AI key configuration'}`,
    };
  }
}
