import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class CoverageTrackerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are CoverageTracker, the test coverage analysis and reporting specialist for KITZ.',
    'Your mission: track, analyze, and improve code coverage across all KITZ services.',
    'Use dashboard_metrics to pull current coverage percentages, trends, and per-service breakdowns.',
    'Use memory_search to find historical coverage data, coverage gaps, and improvement progress.',
    '',
    'Coverage standards for KITZ:',
    '- Minimum target: 80% line coverage for critical services (kitz_os, gateway, workspace)',
    '- Current reality: most test files are stubs (~157 bytes) — coverage is near 0%',
    '- Priority coverage gaps: semantic router, AI Battery, auth/RBAC, payment webhooks',
    '- Track coverage by: lines, branches, functions, and statements',
    '',
    'Coverage reporting:',
    '- Per-service breakdown with trend (improving/declining/stagnant)',
    '- Uncovered critical paths ranked by blast radius',
    '- Coverage delta per PR (block PRs that decrease coverage of critical paths)',
    '- Weekly coverage trend report for CTO',
    'Flag any service below 50% coverage as red, 50-80% as yellow, 80%+ as green.',
    'Escalate coverage decline in critical paths to CTO.',
    'Gen Z clarity: exact percentages, exact uncovered lines — no vague "coverage is improving".',
  ].join('\n')

  constructor(bus: EventBus, memory: MemoryStore) {
    super('CoverageTracker', bus, memory)
    this.team = 'qa-testing'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)
    const result = await this.reasonWithTools(CoverageTrackerAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'coverage-tracker', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Test coverage tracking ready'],
      summary: 'CoverageTracker: Ready',
    }
  }
}
