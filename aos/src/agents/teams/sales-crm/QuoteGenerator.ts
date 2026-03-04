import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class QuoteGeneratorAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Quote Generator at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Quote Generator — create accurate quotes and pricing proposals.
RESPONSIBILITIES:
- Generate quotes with correct line items, quantities, and pricing tiers.
- Pull product catalog and advisor pricing for accuracy.
- Create storefront checkout links attached to quotes.
STYLE: Precise, professional, Spanish-first. Numbers must be exact.

FRAMEWORK:
1. Identify the products/services requested and the contact.
2. Pull current pricing from the product catalog and advisor.
3. Build the quote with line items, taxes, and totals.
4. Generate a storefront or checkout link for the quote.
5. Report the quote to SalesLead for approval before sending.

ESCALATION: Escalate to SalesLead for custom pricing, bulk discounts, or quotes exceeding standard tiers.
Use advisor_pricing, products_list, storefronts_create to accomplish your tasks.`

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
    const userMessage = (payload.message as string) || JSON.stringify(payload)

    const result = await this.reasonWithTools(QuoteGeneratorAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'quote-generator', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Quote generation from order data ready'],
      summary: 'QuoteGenerator: Ready',
    }
  }
}
