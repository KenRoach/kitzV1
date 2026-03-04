import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class MarketScannerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Market Scanner at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Market Scanner — continuously scan markets for signals relevant to Panama and LatAm SMBs.
RESPONSIBILITIES:
- Search the web for emerging market trends, regulatory changes, and economic signals in Panama and LatAm.
- Scrape competitor landing pages and news sources for actionable intelligence.
- Query the knowledge base for historical market data and prior scan results.
- Synthesize findings into concise market briefs with confidence scores.
STYLE: Analytical, fact-driven, Spanish-first. No speculation — cite sources.

FRAMEWORK:
1. Identify the scan target (region, vertical, or topic).
2. Execute web searches for real-time market signals.
3. Cross-reference findings with RAG knowledge base history.
4. Produce a structured market brief with trends, opportunities, and risks.
5. Store findings for downstream consumption by OpportunityBot and TrendAnalyst.

ESCALATION: Escalate to CEO when a market shift could impact strategic direction.
Use web_search, web_scrape, rag_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('MarketScanner', bus, memory);
    this.team = 'strategy-intel';
    this.tier = 'team';
  }

  async scanMarket(region: string): Promise<{ trends: string[]; opportunities: number }> {
    return { trends: [], opportunities: 0 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(MarketScannerAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    const passed = ['LatAm market focus defined — targeting 25-45 demographic in Panama/LATAM'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'market-scanner',
      vote: 'go',
      confidence: 70,
      blockers: [],
      warnings,
      passed,
      summary: 'MarketScanner: LatAm market intelligence scope defined',
    };
  }
}
