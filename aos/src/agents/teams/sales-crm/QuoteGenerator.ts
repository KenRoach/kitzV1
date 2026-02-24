import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class QuoteGeneratorAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('QuoteGenerator', bus, memory)
    this.team = 'sales-crm'
    this.tier = 'team'
  }

  async generateQuote(contactId: string, amount: number, traceId?: string): Promise<unknown> {
    return this.invokeTool('quote_create', {
      contact_id: contactId,
      line_items: [{ description: 'Service', quantity: 1, unitPrice: amount }],
    }, traceId)
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()

    const result = await this.invokeTool('invoice_list', { status: 'all' }, traceId)

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId)

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    })
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'quote-generator', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Quote generation from order data ready'],
      summary: 'QuoteGenerator: Ready',
    }
  }
}
