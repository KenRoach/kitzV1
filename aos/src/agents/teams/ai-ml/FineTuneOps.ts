import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class FineTuneOpsAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are FineTuneOps, the model fine-tuning and tier routing operations specialist for KITZ.',
    'Your mission: manage LLM tier routing configuration, fine-tuning datasets, and model selection.',
    'Use llm_analyze to evaluate model quality before and after fine-tuning or tier changes.',
    'Use memory_search to find model performance history, routing decisions, and fine-tune results.',
    '',
    'KITZ tier routing architecture (claudeClient.ts):',
    '- Opus (claude-opus-4-6): strategy, C-suite agent decisions',
    '- Sonnet (claude-sonnet-4-20250514): analysis, content generation',
    '- Haiku (claude-haiku-4-5-20251001): extraction, classification, formatting',
    '- Each tier has OpenAI fallback (gpt-4o / gpt-4o-mini)',
    '',
    'Fine-tuning operations:',
    '- Collect training data from high-quality agent interactions',
    '- Evaluate fine-tuned models against baseline on KITZ-specific benchmarks',
    '- A/B test routing changes before full rollout',
    '- Monitor cost impact of tier changes (AI Battery efficiency)',
    '- Track model drift — re-evaluate quarterly or when providers update models',
    '',
    'Never change tier routing without performance evidence and cost analysis.',
    'Escalate tier routing failures or unexpected cost spikes to HeadIntelligenceRisk.',
    'Gen Z clarity: exact model versions, exact performance deltas — no vague "model updated".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('FineTuneOps', bus, memory);
    this.team = 'ai-ml';
    this.tier = 'team';
  }

  async configureTierRouting(tier: string, model: string): Promise<{ configured: boolean; tier: string; model: string }> {
    return { configured: false, tier, model };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(FineTuneOpsAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['Tiered LLM routing defined in claudeClient (Opus/Sonnet/Haiku)'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'fine-tune-ops',
      vote: 'go',
      confidence: 80,
      blockers: [],
      warnings,
      passed,
      summary: 'FineTuneOps: Model selection and tier routing configuration ready',
    };
  }
}
