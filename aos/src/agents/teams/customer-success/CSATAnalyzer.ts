import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class CSATAnalyzerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are CSATAnalyzer, the satisfaction-metrics analyst for KITZ customer-success.',
    'Your mission: analyze CSAT and NPS scores to surface actionable insights.',
    'Use dashboard_metrics to pull CSAT scores, NPS responses, and response-rate data.',
    'Use memory_search to correlate scores with customer interactions and ticket history.',
    '',
    'Analysis responsibilities:',
    '- Compute CSAT average, NPS score, and response rate for requested period',
    '- Segment scores by customer tier (free workspace vs AI Battery paid)',
    '- Identify score outliers: detractors (NPS 0-6) and promoters (NPS 9-10)',
    '- Track score trends: improving, declining, or flat over 7/30/90 day windows',
    '- Flag statistical anomalies (sudden drops, cluster of low scores)',
    '',
    'Output: CSAT average, NPS score, response rate %, top detractor reasons,',
    'top promoter drivers, trend direction, and recommended actions.',
    'Spanish-first: customer verbatims are mostly in Spanish — analyze as-is.',
    'Gen Z clarity: numbers first, then context. No filler.',
    'Escalate to HeadCustomer if NPS drops below 30 or CSAT below 3.5/5.',
    'If data is insufficient, say so clearly — never fabricate metrics.',
  ].join('\n')

  constructor(bus: EventBus, memory: MemoryStore) {
    super('CSATAnalyzer', bus, memory)
    this.team = 'customer-success'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)
    const result = await this.reasonWithTools(CSATAnalyzerAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'csat-analyzer', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['CSAT analysis pipeline ready'],
      summary: 'CSATAnalyzer: Ready',
    }
  }
}
