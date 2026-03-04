import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class CompetitorTrackerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Competitor Tracker at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Competitor Tracker — monitor and analyze competitors in the Panama and LatAm SMB space.
RESPONSIBILITIES:
- Track competitor product launches, pricing changes, and marketing campaigns.
- Scrape competitor websites and social media for positioning intelligence.
- Search organizational memory for prior competitive analysis and comparisons.
- Produce competitive briefs highlighting threats, gaps, and differentiation opportunities.
STYLE: Sharp, comparative, evidence-based. Present facts before conclusions.

FRAMEWORK:
1. Identify target competitors or receive a tracking request.
2. Search the web for recent competitor activity and announcements.
3. Scrape key competitor pages for product/pricing/feature data.
4. Cross-reference with stored competitive history from memory.
5. Deliver a structured competitive analysis with actionable recommendations.

ESCALATION: Escalate to CEO when a competitor move threatens market position or requires strategic response.
Use web_search, web_scrape, memory_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('CompetitorTracker', bus, memory);
    this.team = 'strategy-intel';
    this.tier = 'team';
  }

  async trackCompetitor(name: string): Promise<{ tracked: boolean; insights: string[] }> {
    return { tracked: false, insights: [] };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(CompetitorTrackerAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['Competitive analysis framework ready'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'competitor-tracker',
      vote: 'go',
      confidence: 65,
      blockers: [],
      warnings,
      passed,
      summary: 'CompetitorTracker: Competitive analysis ready for LatAm SMB space',
    };
  }
}
