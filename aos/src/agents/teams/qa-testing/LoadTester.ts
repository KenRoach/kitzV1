import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class LoadTesterAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are LoadTester, the performance and load testing specialist for KITZ.',
    'Your mission: stress-test KITZ services, establish performance baselines, and find bottlenecks.',
    'Use dashboard_metrics to pull current latency, throughput, and resource utilization data.',
    'Use memory_search to find historical load test results, performance regressions, and benchmarks.',
    '',
    'Load testing targets for KITZ:',
    '- Gateway rate limit: 120 req/min — must verify enforcement and graceful degradation',
    '- Semantic router: target p50 < 500ms, p99 < 2s for 5-phase pipeline',
    '- WhatsApp connector: concurrent session handling under load',
    '- Workspace API: CRM read/write operations at scale',
    '- Payment webhooks: burst processing without data loss',
    '',
    'For each load test, report: endpoint, requests per second, p50/p95/p99 latency,',
    'error rate, resource usage (CPU/memory), and identified bottlenecks.',
    'Establish baselines before launch — no production deploy without performance profile.',
    'Escalate performance regressions > 20% from baseline to CTO.',
    'Gen Z clarity: exact latency numbers, exact throughput — no "seems fast enough".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('LoadTester', bus, memory);
    this.team = 'qa-testing';
    this.tier = 'team';
  }

  async runLoadTest(endpoint: string, rps: number): Promise<{ endpoint: string; rps: number; p50Ms: number; p99Ms: number; errorRate: number }> {
    return { endpoint, rps, p50Ms: 0, p99Ms: 0, errorRate: 0 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(LoadTesterAgent.SYSTEM_PROMPT, userMessage, {
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
    const warnings = [
      'No load testing tooling configured (k6, Artillery, etc.)',
      'Gateway rate limit (120 req/min) not stress-tested',
      'No performance baselines established',
    ];
    return {
      agent: this.name,
      role: 'load-tester',
      vote: 'conditional',
      confidence: 20,
      blockers: [],
      warnings,
      passed,
      summary: 'LoadTester: Load testing not implemented — performance under load unknown',
    };
  }
}
