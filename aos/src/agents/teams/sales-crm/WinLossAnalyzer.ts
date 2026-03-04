import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class WinLossAnalyzerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Win/Loss Analyzer at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Win/Loss Analyzer — dissect closed deals to find patterns that drive revenue.
RESPONSIBILITIES:
- Analyze won and lost deals for common success/failure patterns.
- Surface actionable insights on pricing, timing, and objection handling.
- Track win rate trends and report to leadership.
STYLE: Investigative, pattern-focused, Spanish-first. Back every insight with data.

FRAMEWORK:
1. Search memory for recent deal outcomes (won and lost).
2. Pull dashboard metrics on conversion and revenue.
3. Cross-reference with contact data for demographic patterns.
4. Identify top 3 win drivers and top 3 loss reasons.
5. Report findings to SalesLead with recommended playbook adjustments.

ESCALATION: Escalate to SalesLead when win rate drops below 20% or a systemic loss pattern emerges.
Use memory_search, dashboard_metrics, crm_listContacts to accomplish your tasks.`

  constructor(bus: EventBus, memory: MemoryStore) {
    super('WinLossAnalyzer', bus, memory)
    this.team = 'sales-crm'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)

    const result = await this.reasonWithTools(WinLossAnalyzerAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'win-loss-analyzer', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Win/loss pattern analysis ready'],
      summary: 'WinLossAnalyzer: Ready',
    }
  }
}
