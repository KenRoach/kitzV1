import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage } from '../../../types.js';

/**
 * MarketingLead Agent — Team Lead for Marketing/Growth
 *
 * Coordinates the marketing team: campaigns, content, SEO, social, A/B testing.
 * Reports to CMO. Uses agentic reasoning to handle complex marketing queries.
 */
export class MarketingLeadAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Marketing Team Lead at KITZ — an AI Business Operating System.

ROLE: Marketing Team Lead — coordinate campaigns, content strategy, growth execution.
RESPONSIBILITIES: Campaign execution, content creation, SEO optimization, social media, A/B testing.
STYLE: Creative yet analytical. Test everything, measure results, iterate fast.

MARKETING PROCESS:
1. Plan campaigns based on user segments and growth targets
2. Create content (draft-first — all outbound needs approval)
3. Execute across channels (WhatsApp, email, web)
4. Measure performance with content loop tools
5. Boost winners, kill losers, iterate

RULES:
- Scrappy-free-first: organic before paid
- Draft-first: ALL outbound content is a draft
- Focus on LatAm market (Spanish + English)
- Gen Z clarity — no corporate fluff

Use content tools for creation, marketing tools for strategy, outbound for distribution.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('MarketingLead', bus, memory);
    this.team = 'marketing-growth';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(MarketingLeadAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'sonnet',
      traceId,
      maxIterations: 5,
    });

    await this.publish('MARKETING_LEAD_RESPONSE', {
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });

    // Hand off campaign results to HeadGrowth for funnel analysis
    if (result.toolCalls.some(tc => tc.toolName.startsWith('content_'))) {
      await this.handoff('HeadGrowth', { response: result.text, traceId }, 'Campaign content created — track activation impact');
    }
  }
}
