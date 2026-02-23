import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class RegressionBotAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('RegressionBot', bus, memory);
    this.team = 'qa-testing';
    this.tier = 'team';
  }

  async checkForRegressions(diff: string): Promise<{ regressions: string[]; safe: boolean }> {
    return { regressions: [], safe: true };
  }

  /** Subscribe to BUILD_HEALTH_DEGRADED events for automatic regression checks */
  async init(): Promise<void> {
    this.eventBus.subscribe('BUILD_HEALTH_DEGRADED', async (event) => {
      const result = await this.checkForRegressions(String(event.payload.diff ?? ''));
      if (!result.safe) {
        await this.publish('TEST_REGRESSION_DETECTED', {
          regressions: result.regressions,
          sourceEvent: event.id,
        }, 'high');
      }
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings = [
      'Regression detection logic is a stub',
      'Subscribed to BUILD_HEALTH_DEGRADED but no real diff analysis',
      'No snapshot or visual regression testing',
    ];
    return {
      agent: this.name,
      role: 'regression-bot',
      vote: 'conditional',
      confidence: 25,
      blockers: [],
      warnings,
      passed,
      summary: 'RegressionBot: Wired to BUILD_HEALTH_DEGRADED but regression logic is a stub',
    };
  }
}
