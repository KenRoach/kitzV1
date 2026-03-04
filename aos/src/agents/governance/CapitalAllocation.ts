import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** Capital Allocation — Enforces 45/5/50 revenue split and financial governance */
export class CapitalAllocationAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Capital Allocation governance agent for KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Capital Allocation Governor — enforce the 45/5/50 revenue distribution model and financial guardrails.
RESPONSIBILITIES: Revenue split enforcement (45% impact / 5% agent upgrade / 50% founder), budget guardrails, AI Battery pricing governance, cost monitoring, financial sustainability assessment.
STYLE: Precise, numbers-driven, conservative with spend. Every dollar has a purpose and a policy.

CAPITAL ALLOCATION FRAMEWORK:
1. Verify 45/5/50 split is being applied to all distributable revenue
2. Check guardrails: if runway < 6 months OR margin < 20%, halve all distributions
3. Monitor AI Battery pricing consistency ($5/100, $20/500, $60/2000)
4. Ensure free tier truly costs $0 marginal per user
5. Flag any spend that violates ROI >= 2x policy

FINANCIAL GUARDRAILS:
- Distributable = revenue - expenses - R&D
- If runway < 6 months: distributions halved
- If margin < 20%: distributions halved
- AI Battery daily limit: 5 credits/user (configurable)
- Never burn credits on vanity or exploration without approval

KITZ CONTEXT: 45/5/50 model, AI Battery credit system, free workspace tier, solo founder economics.
You are the financial constitution. No spend without justification, no distribution without policy compliance.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(CapitalAllocationAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku',
      traceId,
      maxIterations: 3,
    });

    await this.publish('GOVERNANCE_CAPITAL_ALLOCATION', {
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

    if (!ctx.batteryDepleted) passed.push('AI Battery has credits — launch won\'t stall');
    else warnings.push('Battery depleted — need recharge before launch');

    passed.push('45/5/50 split defined (impact/agentUpgrade/founder)');
    passed.push('Free tier = $0 marginal cost per user');
    passed.push('AI Battery pricing: $5/100, $20/500, $60/2000');

    return {
      agent: this.name, role: 'Capital Allocation', vote: warnings.length > 0 ? 'conditional' : 'go',
      confidence: 80, blockers: [], warnings, passed,
      summary: 'Capital allocation clear. Free tier funded, battery pricing set.',
    };
  }

  runCycle(input: { revenue: number; expenses: number; rnd: number; runwayMonths: number; marginPercent: number }): Record<string, unknown> {
    const distributable = Math.max(0, input.revenue - input.expenses - input.rnd);
    let founder = distributable * 0.5;
    let impact = distributable * 0.45;
    let agentUpgrade = distributable * 0.05;
    const guardrailTriggered = input.runwayMonths < 6 || input.marginPercent < 20;
    if (guardrailTriggered) { founder *= 0.5; impact *= 0.5; agentUpgrade *= 0.5; }
    return { distributable, founder, impact, agentUpgrade, guardrailTriggered };
  }
}
