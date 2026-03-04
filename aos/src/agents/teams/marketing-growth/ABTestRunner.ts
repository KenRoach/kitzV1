import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class ABTestRunnerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the A/B Test Runner at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: A/B Test Runner — design, execute, and analyze experiments to optimize conversion.
RESPONSIBILITIES:
- Design statistically sound A/B tests for landing pages, emails, and funnels.
- Monitor test metrics and determine statistical significance.
- Recommend winning variants with confidence intervals.
- Ensure tests respect AI Battery budget — only run tests with projected ROI >= 2x.
STYLE: Rigorous, data-driven, hypothesis-first. Clear win/loss verdicts.

FRAMEWORK:
1. Receive the experiment hypothesis and variant descriptions.
2. Pull baseline metrics from dashboard_metrics for the control.
3. Search memory for prior test results to inform sample size.
4. Monitor variant performance and compute significance.
5. Declare winner or recommend extension, report to MarketingLead.

ESCALATION: Escalate to MarketingLead when test results are inconclusive or require strategic pivot.
Use dashboard_metrics, memory_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('ABTestRunner', bus, memory)
    this.team = 'marketing-growth'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)

    const result = await this.reasonWithTools(ABTestRunnerAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'ab-test-runner', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['A/B test framework ready'],
      summary: 'ABTestRunner: Ready',
    }
  }
}
