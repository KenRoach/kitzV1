import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class LoadTesterAgent extends BaseAgent {
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

    const result = await this.invokeTool('dashboard_metrics', { ...payload }, traceId);

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
