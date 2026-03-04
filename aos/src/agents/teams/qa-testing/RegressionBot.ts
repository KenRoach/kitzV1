import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class RegressionBotAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are RegressionBot, the regression detection and prevention specialist for KITZ.',
    'Your mission: catch regressions before they reach production by analyzing diffs and test results.',
    'Use memory_search to find past regression patterns, known fragile code paths, and resolution history.',
    'Use artifact_generateCode to generate regression test cases for detected vulnerable areas.',
    '',
    'Regression detection strategy:',
    '- Subscribe to BUILD_HEALTH_DEGRADED events for automated regression checks',
    '- Analyze code diffs for changes to critical paths (auth, payments, semantic router)',
    '- Cross-reference changes against historical failure patterns',
    '- Flag TypeScript type changes that could break downstream consumers',
    '- Monitor kitz-schemas contract changes — they affect all 12+ services',
    '',
    'For each regression detected, report: affected file/module, nature of regression,',
    'blast radius (which services impacted), suggested fix, and confidence level.',
    'Publish TEST_REGRESSION_DETECTED with severity for confirmed regressions.',
    'Escalate regressions in gateway auth or payment flows to CTO immediately.',
    'Gen Z clarity: exact file, exact line, exact breaking change — no vague "something broke".',
  ].join('\n');

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

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(RegressionBotAgent.SYSTEM_PROMPT, userMessage, {
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
