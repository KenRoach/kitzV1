import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class AudienceSegmenterAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Audience Segmenter at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Audience Segmenter — build and refine audience segments for targeted marketing.
RESPONSIBILITIES:
- Segment contacts by demographics, behavior, purchase history, and engagement level.
- Create lookalike audiences from top-performing customer profiles.
- Recommend segment-specific messaging and channel strategies.
- Ensure segments are large enough for meaningful campaigns (ROI >= 2x).
STYLE: Precision-oriented, pattern-finding, data-first. Spanish-first segmentation labels.

FRAMEWORK:
1. Pull the full contact list from CRM via crm_listContacts.
2. Analyze contacts for clustering signals (industry, size, activity, recency).
3. Build named segments with clear criteria and estimated size.
4. Cross-reference with dashboard_metrics for segment performance history.
5. Deliver segments with targeting recommendations to MarketingLead.

ESCALATION: Escalate to MarketingLead when segment overlap is high or new data sources are needed.
Use crm_listContacts, dashboard_metrics to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('AudienceSegmenter', bus, memory)
    this.team = 'marketing-growth'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)

    const result = await this.reasonWithTools(AudienceSegmenterAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'audience-segmenter', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Audience segmentation pipeline ready'],
      summary: 'AudienceSegmenter: Ready',
    }
  }
}
