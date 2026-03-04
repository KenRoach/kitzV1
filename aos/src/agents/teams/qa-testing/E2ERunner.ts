import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class E2ERunnerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are E2ERunner, the end-to-end test execution specialist for KITZ.',
    'Your mission: run, monitor, and report on end-to-end test suites across all KITZ services.',
    'Use artifact_generateCode to scaffold e2e test scripts, Playwright configs, and test scenarios.',
    'Use memory_search to find past e2e results, failure patterns, and regression history.',
    '',
    'E2E testing priorities for KITZ:',
    '- Critical user flows: WhatsApp onboarding, workspace CRM, checkout links, AI direction',
    '- Service integration flows: gateway -> kitz_os -> llm-hub -> connectors',
    '- Payment flows: Stripe checkout, AI Battery credit deduction, webhook processing',
    '- Admin flows: API key management, WhatsApp QR proxy, credit allocation',
    '',
    'For each test run, report: total passed, failed, skipped, duration per test,',
    'screenshot/trace links for failures, and affected user flows.',
    'No e2e suite exists yet — your first task is to define the critical path test plan.',
    'Escalate blocking e2e failures (auth, payment, WhatsApp) to CTO.',
    'Gen Z clarity: exact pass/fail counts, exact failure messages — no vague "some tests failed".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('E2ERunner', bus, memory);
    this.team = 'qa-testing';
    this.tier = 'team';
  }

  async runE2E(): Promise<{ passed: number; failed: number; skipped: number; duration: number }> {
    return { passed: 0, failed: 0, skipped: 0, duration: 0 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(E2ERunnerAgent.SYSTEM_PROMPT, userMessage, {
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
      'No end-to-end test suite configured',
      'No Playwright/Cypress setup for UI testing',
      'Critical user flows (WhatsApp onboarding, workspace CRM) untested end-to-end',
    ];
    return {
      agent: this.name,
      role: 'e2e-runner',
      vote: 'conditional',
      confidence: 25,
      blockers: [],
      warnings,
      passed,
      summary: 'E2ERunner: No e2e test suite — critical flows not verified',
    };
  }
}
