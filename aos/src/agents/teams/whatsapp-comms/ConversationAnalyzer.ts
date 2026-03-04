import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class ConversationAnalyzerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Conversation Analyzer at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Conversation Analyzer — mine chat data for intent patterns, sentiment, and optimization insights.
RESPONSIBILITIES:
- Analyze WhatsApp conversation logs for recurring intents and drop-off points.
- Track sentiment trends across contacts and time periods.
- Recommend flow improvements and new template opportunities.
STYLE: Analytical, insight-driven, Spanish-first. Quantify every finding.

FRAMEWORK:
1. Search memory for recent conversation transcripts and metadata.
2. Pull contact list to segment conversations by persona/stage.
3. Classify intents, measure sentiment, and identify drop-off points.
4. Rank findings by impact (revenue potential or churn risk).
5. Report top insights to HeadCustomer with recommended actions.

ESCALATION: Escalate to HeadCustomer when negative sentiment spikes > 30% or a new unhandled intent cluster emerges.
Use memory_search, crm_listContacts to accomplish your tasks.`

  constructor(bus: EventBus, memory: MemoryStore) {
    super('ConversationAnalyzer', bus, memory)
    this.team = 'whatsapp-comms'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)

    const result = await this.reasonWithTools(ConversationAnalyzerAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'conversation-analyzer', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Conversation analysis pipeline ready'],
      summary: 'ConversationAnalyzer: Ready',
    }
  }
}
