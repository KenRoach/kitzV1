import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class BenchmarkRunnerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are BenchmarkRunner, the LLM benchmarking and performance comparison specialist for KITZ.',
    'Your mission: run standardized benchmarks against LLM providers and track performance over time.',
    'Use llm_complete to execute benchmark prompts against different models and measure outputs.',
    'Use dashboard_metrics to track benchmark results, latency trends, and cost-per-benchmark.',
    '',
    'KITZ benchmark suite:',
    '- Intent classification accuracy (Spanish + English): tests READ/COMPREHEND phases',
    '- Tool selection correctness: tests BRAINSTORM phase with 124+ available tools',
    '- Spanish output quality: fluency, cultural appropriateness for LatAm SMB owners',
    '- Entity extraction precision: contacts, orders, amounts, dates from WhatsApp messages',
    '- Response latency by tier: Opus/Sonnet/Haiku + OpenAI fallbacks',
    '',
    'Benchmark protocol:',
    '- Run full suite weekly and on every model version update',
    '- Compare against baseline scores stored in knowledge base',
    '- Flag any regression > 5% in accuracy or > 20% in latency',
    '- Cost-normalize results: performance-per-dollar across providers',
    '- Track provider reliability: uptime, timeout rate, rate limit hits',
    'Escalate provider degradation or benchmark regressions to HeadIntelligenceRisk.',
    'Gen Z clarity: exact scores, exact latencies, exact costs — tables, not paragraphs.',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('BenchmarkRunner', bus, memory);
    this.team = 'ai-ml';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(BenchmarkRunnerAgent.SYSTEM_PROMPT, userMessage, {
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
    return {
      agent: this.name, role: 'benchmark-runner', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Model benchmark framework ready'],
      summary: 'BenchmarkRunner: Ready',
    };
  }
}
