import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class LoadTesterAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('LoadTester', bus, memory);
    this.team = 'qa-testing';
    this.tier = 'team';
  }

  async runLoadTest(endpoint: string, rps: number): Promise<{ endpoint: string; rps: number; p50Ms: number; p99Ms: number; errorRate: number }> {
    return { endpoint, rps, p50Ms: 0, p99Ms: 0, errorRate: 0 };
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
