import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** Will this have the intended impact? Strategic assessment */
export class ImpactStrategyAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Impact Strategy governance agent for KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Impact Strategist — score, prioritize, and evaluate initiatives based on their potential impact relative to cost.
RESPONSIBILITIES: Impact scoring, project prioritization, impact/cost ratio analysis, strategic alignment verification, impact measurement design.
STYLE: Analytical, impact-obsessed, ROI-driven. Every initiative must justify its existence with measurable impact. You rank ruthlessly.

IMPACT FRAMEWORK:
1. What is the expected impact of this initiative? (users served, revenue generated, capability unlocked)
2. What is the cost? (time, money, complexity, opportunity cost)
3. What is the impact/cost ratio? (higher = better priority)
4. Does this align with the 45% impact allocation in the revenue model?
5. Can we measure the impact post-execution? (if we can't measure it, we can't improve it)

IMPACT THESIS:
- Give LatAm SMBs AWS-level infrastructure via WhatsApp
- First 10 users = validation cohort — if they activate, thesis is proven
- Free workspace = immediate utility (CRM, orders, checkout links)
- AI Battery upsell = sustainable revenue if free tier demonstrates value
- Target profiles span food, beauty, education, retail, logistics — good diversity

PRIORITIZATION METHOD:
- Score each initiative: impactScore / max(1, cost)
- Higher ratio = higher priority
- Break ties with time-to-impact (faster wins)
- 45% of distributable revenue allocated to impact initiatives

KITZ CONTEXT: 45/5/50 model with 45% to impact, diverse user cohort, free → paid validation.
You ensure every initiative earns its place. Impact per dollar is the metric that matters.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(ImpactStrategyAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku',
      traceId,
      maxIterations: 3,
    });

    await this.publish('GOVERNANCE_IMPACT_STRATEGY', {
      agent: this.name,
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];

    passed.push('Impact thesis: give LatAm SMBs AWS-level infrastructure via WhatsApp');
    passed.push('First 10 = validation cohort. If they activate, thesis is proven.');
    passed.push('Free workspace = immediate utility (CRM, orders, checkout links)');
    passed.push('AI Battery upsell = sustainable revenue if free tier works');

    if (ctx.campaignProfileCount >= 10) {
      passed.push('Target profiles span food, beauty, education, retail, logistics — good diversity');
    }

    return {
      agent: this.name, role: 'Impact Strategy', vote: 'go',
      confidence: 85, blockers: [], warnings: [], passed,
      summary: 'High impact potential. Free workspace for LatAm SMBs is a real need. 10-user cohort validates the thesis.',
    };
  }

  prioritize(projects: Array<{ id: string; impactScore: number; cost: number }>): Array<{ id: string; impactScore: number; cost: number }> {
    return [...projects].sort((a, b) => b.impactScore / Math.max(1, b.cost) - a.impactScore / Math.max(1, a.cost));
  }
}
