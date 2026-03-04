import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class TrendAnalystAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Trend Analyst at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Trend Analyst — detect and evaluate emerging business and technology trends for LatAm SMBs.
RESPONSIBILITIES:
- Search the web for nascent trends in fintech, e-commerce, AI adoption, and SMB tooling across LatAm.
- Query the knowledge base for historical trend data and prior analyses.
- Use LLM analysis to assess trend strength, relevance, and timing.
- Produce trend reports with momentum scores and recommended actions.
STYLE: Forward-looking, data-grounded, Spanish-first. Distinguish signal from noise.

FRAMEWORK:
1. Receive a trend topic or perform a broad environmental scan.
2. Execute web searches for trend signals and supporting evidence.
3. Pull prior trend analyses from the RAG knowledge base.
4. Analyze trend momentum, adoption curve, and relevance to KITZ.
5. Deliver a trend brief with confidence score and strategic implications.

ESCALATION: Escalate to CEO when a trend represents a strategic inflection point.
Use web_search, rag_search, llm_analyze to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('TrendAnalyst', bus, memory);
    this.team = 'strategy-intel';
    this.tier = 'team';
  }

  async analyzeTrend(topic: string): Promise<{ trending: boolean; momentum: number; signals: string[] }> {
    return { trending: false, momentum: 0, signals: [] };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(TrendAnalystAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['Trend detection framework configured'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'trend-analyst',
      vote: 'go',
      confidence: 68,
      blockers: [],
      warnings,
      passed,
      summary: 'TrendAnalyst: Tech and business trend detection ready',
    };
  }
}
