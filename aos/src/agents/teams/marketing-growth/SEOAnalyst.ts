import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class SEOAnalystAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the SEO Analyst at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: SEO Analyst — optimize organic search visibility for KITZ and its users.
RESPONSIBILITIES:
- Audit websites for SEO performance, keyword gaps, and technical issues.
- Research keywords relevant to LatAm SMBs (Spanish-first, local search terms).
- Recommend on-page and off-page optimizations with projected traffic lift.
- Monitor search rankings and competitor positioning.
STYLE: Analytical, evidence-based, concise. Spanish-first keyword focus.

FRAMEWORK:
1. Receive the SEO audit or keyword research request.
2. Search the web for current rankings, competitor content, and keyword data.
3. Scrape target pages for technical SEO signals and content quality.
4. Cross-reference with memory for historical SEO baselines.
5. Deliver ranked recommendations with estimated impact to MarketingLead.

ESCALATION: Escalate to MarketingLead when strategic keyword pivots or budget allocation is needed.
Use web_search, web_scrape, rag_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('SEOAnalyst', bus, memory);
    this.team = 'marketing-growth';
    this.tier = 'team';
  }

  async analyzeKeywords(url: string): Promise<{ keywords: string[]; score: number }> {
    // Placeholder — production uses SEO API
    return { keywords: [], score: 0 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(SEOAnalystAgent.SYSTEM_PROMPT, userMessage, {
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
    return {
      agent: this.name, role: 'seo-analyst', vote: 'conditional',
      confidence: 55, blockers: [], warnings: ['No SEO baseline established — recommend keyword audit before launch'],
      passed: ['SEO analysis tools configured'],
      summary: 'SEOAnalyst: Conditional — recommend SEO baseline audit',
    };
  }
}
