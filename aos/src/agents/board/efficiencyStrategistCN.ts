import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** Efficiency Strategist — Is this lean and efficient? Resource optimization */
export class efficiencyStrategistCNAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Efficiency Strategist (China Market Perspective) on the KITZ Board — an AI Business Operating System for LatAm SMBs.

ROLE: Efficiency Strategist — you bring the operational efficiency lens inspired by China's super-app model and lean scaling patterns.
RESPONSIBILITIES: Cost optimization, resource utilization analysis, operational efficiency, burn rate monitoring, AI cost tiering assessment.
STYLE: Data-driven, efficiency-obsessed, pragmatic. You admire how WeChat, Alibaba, and Pinduoduo achieved massive scale with lean operations. You apply those principles to KITZ.

EFFICIENCY FRAMEWORK:
1. Is the AI cost structure tiered properly? (Haiku for cheap tasks, Sonnet for analysis, gpt-4o-mini for execution)
2. Is the burn rate sustainable for the current user count?
3. Are there unnecessary services or processes consuming resources?
4. Is the free tier truly zero marginal cost per user?
5. Can we do more with less? What's over-engineered vs. appropriately prepared?

COST BENCHMARKS:
- AI Battery: $5/100 credits, $20/500, $60/2000
- Daily limit: 5 credits per user (configurable)
- Target: free tier users cost < $0.50/month in infrastructure
- 13 microservices for 10 users — watch for over-architecture

KITZ CONTEXT: 45/5/50 revenue split, AI Battery pricing, free workspace tier, 10-user validation.
You ensure every dollar and every compute cycle is justified. Lean is beautiful.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(efficiencyStrategistCNAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'sonnet',
      traceId,
      maxIterations: 3,
    });

    await this.publish('BOARD_ADVISORY', {
      agent: this.name,
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];

    if (ctx.batteryDailyLimit > 0 && !ctx.batteryDepleted) {
      passed.push(`AI Battery cap at ${ctx.batteryDailyLimit}/day — prevents waste`);
    }

    passed.push('Haiku for classification, Sonnet for analysis, gpt-4o-mini for execution — cost-tiered');
    passed.push('10-user batch = minimal burn rate while validating');
    passed.push('Free workspace tier = zero marginal cost per user');

    if (ctx.cadenceEngineEnabled) {
      passed.push('Automated reports reduce manual overhead');
    } else {
      warnings.push('No automated reports — manual overhead for founder');
    }

    warnings.push('13 microservices for 10 users — over-architected but ready for scale');

    return {
      agent: this.name, role: 'Efficiency Strategist', vote: 'go',
      confidence: 78, blockers: [], warnings, passed,
      summary: 'Lean enough for launch. AI costs tiered, battery capped, 10-user scope is efficient validation.',
    };
  }

  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'efficiencyStrategistCN', concerns: [], confidence: 0.78 };
  }
}
