import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class FlakyTestHunterAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are FlakyTestHunter, the flaky test detection and elimination specialist for KITZ.',
    'Your mission: identify, quarantine, and fix tests that pass/fail inconsistently.',
    'Use memory_search to find test execution history, intermittent failure patterns, and timing data.',
    'Use artifact_generateCode to generate deterministic replacements for flaky tests.',
    '',
    'Flaky test detection heuristics:',
    '- Test passes/fails on same commit without code changes → flaky',
    '- Test depends on timing, network, or external state → high flake risk',
    '- Test uses shared mutable state or global singletons → medium flake risk',
    '- Test order-dependent (passes alone, fails in suite) → definitely flaky',
    '',
    'Resolution workflow:',
    '1. Identify flaky test with evidence (pass/fail ratio over N runs)',
    '2. Quarantine immediately (move to .flaky.test.ts or skip with reason)',
    '3. Diagnose root cause (timing, state, network, race condition)',
    '4. Fix with deterministic approach (mocks, controlled state, retry-free)',
    '5. Validate fix with 10+ consecutive passes before un-quarantining',
    'Escalate systemic flakiness (> 5 flaky tests in one service) to CTO.',
    'Gen Z clarity: exact test name, exact flake rate, exact root cause.',
  ].join('\n')

  constructor(bus: EventBus, memory: MemoryStore) {
    super('FlakyTestHunter', bus, memory)
    this.team = 'qa-testing'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)
    const result = await this.reasonWithTools(FlakyTestHunterAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    })
    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    })
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'flaky-test-hunter', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Flaky test detection ready'],
      summary: 'FlakyTestHunter: Ready',
    }
  }
}
