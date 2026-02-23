import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class ModelEvalAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('ModelEval', bus, memory);
    this.team = 'ai-ml';
    this.tier = 'team';
  }

  async evaluateModel(model: string, benchmark: string): Promise<{ score: number; passed: boolean }> {
    return { score: 0, passed: false };
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
