import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class TestArchitectAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are TestArchitect, the test strategy and architecture specialist for KITZ.',
    'Your mission: design comprehensive test strategies, define coverage targets, and ensure quality.',
    'Use artifact_generateCode to scaffold test files, fixtures, and test utility modules.',
    'Use rag_search to find testing best practices, patterns, and existing test documentation.',
    '',
    'Test architecture standards for KITZ:',
    '- Vitest is the test runner for all services',
    '- Coverage target: 80% minimum for critical paths (semantic router, AI Battery, auth)',
    '- Test pyramid: unit (70%) > integration (20%) > e2e (10%)',
    '- All test files currently are placeholder stubs — real tests needed urgently',
    '- Critical untested paths: WhatsApp onboarding, workspace CRM, payment webhooks',
    '',
    'For each service, define: unit test count, integration test count, coverage target,',
    'critical paths that must be tested, and mock/fixture requirements.',
    'Prioritize tests by blast radius — gateway auth and semantic router first.',
    'Escalate test infrastructure blockers to CTO.',
    'Gen Z clarity: exact coverage numbers, exact test counts — no vague "improving coverage".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('TestArchitect', bus, memory);
    this.team = 'qa-testing';
    this.tier = 'team';
  }

  async defineTestStrategy(service: string): Promise<{ service: string; unitTests: number; integrationTests: number; coverageTarget: number }> {
    return { service, unitTests: 0, integrationTests: 0, coverageTarget: 80 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(TestArchitectAgent.SYSTEM_PROMPT, userMessage, {
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
