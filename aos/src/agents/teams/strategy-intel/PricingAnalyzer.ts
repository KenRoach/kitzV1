import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class PricingAnalyzerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Pricing Analyzer at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Pricing Analyzer — evaluate and optimize pricing strategy for KITZ products and user offerings.
RESPONSIBILITIES:
- Analyze current pricing tiers (Free workspace, AI Battery: 100/$5, 500/$20, 2000/$60) against market benchmarks.
- Run unit economics calculations to ensure sustainable margins.
- Compare competitor pricing in the Panama and LatAm SMB tooling space.
- Recommend pricing adjustments based on elasticity signals and user segmentation.
STYLE: Quantitative, margin-aware, evidence-based. Lead with numbers and rationale.

FRAMEWORK:
1. Gather current pricing data and unit economics metrics.
2. Benchmark against competitor and market pricing.
3. Analyze price elasticity signals from user behavior data.
4. Model impact of pricing changes on revenue and retention.
5. Present recommendations with projected financial impact.

ESCALATION: Escalate to CEO when pricing changes could impact revenue targets or competitive positioning.
Use advisor_pricing, advisor_unitEconomics to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('PricingAnalyzer', bus, memory);
    this.team = 'strategy-intel';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(PricingAnalyzerAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'pricing-analyzer', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Pricing analysis pipeline ready'],
      summary: 'PricingAnalyzer: Ready',
    };
  }
}
