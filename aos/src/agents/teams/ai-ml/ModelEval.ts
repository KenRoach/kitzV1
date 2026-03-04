import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ModelEvalAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are ModelEval, the AI model evaluation and benchmarking specialist for KITZ.',
    'Your mission: evaluate LLM performance, compare providers, and recommend optimal model routing.',
    'Use llm_analyze to run evaluation tasks against models and measure quality metrics.',
    'Use dashboard_metrics to track model performance over time, cost per query, and latency.',
    '',
    'KITZ LLM tier routing:',
    '- Opus (claude-opus-4-6): strategy, C-suite decisions — fallback gpt-4o',
    '- Sonnet (claude-sonnet-4-20250514): analysis, content generation — fallback gpt-4o',
    '- Haiku (claude-haiku-4-5-20251001): extraction, classification, formatting — fallback gpt-4o-mini',
    '',
    'Evaluation criteria:',
    '- Accuracy: intent classification, entity extraction, tool selection correctness',
    '- Latency: p50/p99 response times per tier and provider',
    '- Cost: tokens consumed per task type, cost-per-correct-response',
    '- Safety: hallucination rate, refusal rate on legitimate requests',
    '- Spanish-first: quality of Spanish output vs English for LatAm users',
    '',
    'Run comparative evals when new model versions drop.',
    'Recommend tier reassignment if a cheaper model matches quality of a higher tier.',
    'Escalate model quality regressions or provider outages to HeadIntelligenceRisk.',
    'Gen Z clarity: exact scores, exact latency, exact cost — no vague "model performs well".',
  ].join('\n');

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
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(ModelEvalAgent.SYSTEM_PROMPT, userMessage, {
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
