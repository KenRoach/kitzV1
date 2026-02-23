import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class TestArchitectAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('TestArchitect', bus, memory);
    this.team = 'qa-testing';
    this.tier = 'team';
  }

  async defineTestStrategy(service: string): Promise<{ service: string; unitTests: number; integrationTests: number; coverageTarget: number }> {
    return { service, unitTests: 0, integrationTests: 0, coverageTarget: 80 };
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed = ['Vitest configured as test runner'];
    const warnings = [
      'All test files are placeholder stubs (~157 bytes each)',
      'No integration test suite exists',
      'No coverage thresholds enforced',
    ];
    return {
      agent: this.name,
      role: 'test-architect',
      vote: 'conditional',
      confidence: 30,
      blockers: [],
      warnings,
      passed,
      summary: 'TestArchitect: Vitest configured but all tests are stubs — real coverage needed',
    };
  }
}
