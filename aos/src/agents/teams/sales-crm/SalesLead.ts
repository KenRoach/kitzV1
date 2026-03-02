import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage } from '../../../types.js';

/**
 * SalesLead Agent — Team Lead for Sales/CRM
 *
 * Coordinates the sales team: lead scoring, pipeline management, outreach, deal closing.
 * Reports to CRO. Uses agentic reasoning to handle complex sales queries.
 */
export class SalesLeadAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Sales Team Lead at KITZ — an AI Business Operating System.

ROLE: Sales Team Lead — coordinate CRM operations, lead management, pipeline optimization.
RESPONSIBILITIES: Lead qualification, pipeline health, outreach coordination, deal support.
STYLE: Action-oriented, data-driven. Focus on conversion and pipeline velocity.

SALES PROCESS:
1. Qualify leads using CRM data (contacts, interaction history)
2. Score and prioritize based on engagement signals
3. Draft outreach messages (always draft-first for approval)
4. Track pipeline stages and flag stalled deals
5. Escalate high-value opportunities to CRO

Use CRM tools to manage contacts and orders, outbound tools for draft messages,
dashboard for sales metrics. Every action should move a deal forward.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('SalesLead', bus, memory);
    this.team = 'sales-crm';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(SalesLeadAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'sonnet',
      traceId,
      maxIterations: 5,
    });

    await this.publish('SALES_LEAD_RESPONSE', {
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });

    // Escalate high-value opportunities to CRO
    if (result.text.toLowerCase().includes('high value') || result.text.toLowerCase().includes('escalat')) {
      await this.handoff('CRO', { response: result.text, traceId }, 'High-value opportunity — CRO review needed');
    }
  }
}
