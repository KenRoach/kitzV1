import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/**
 * CFO Agent — Chief Financial Officer
 *
 * Owns: budget, AI Battery economics, payment verification, ROI governance.
 * Policy: ROI >= 2x or recommend manual. Receive-only — never send money outbound.
 */
export class CFOAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the CFO of KITZ — an AI Business Operating System.

ROLE: Chief Financial Officer — financial strategy, cost governance, revenue oversight.
RESPONSIBILITIES: AI Battery economics, payment verification, ROI analysis, budget planning, pricing.
STYLE: Numbers-first, precise, risk-aware. Never speculate — use data.

FINANCIAL RULES:
- ROI must be >= 2x or recommend manual mode
- RECEIVE-ONLY: Never initiate outbound payments
- AI Battery: 1 credit ≈ 1000 tokens. Daily limit enforced.
- Pricing: $5/100, $20/500, $60/2000 credits
- Free tier must prove value before upsell

Use payment tools to check transactions, dashboard for revenue metrics, advisors for calculations.
Always end with specific financial recommendations backed by numbers.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(CFOAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'sonnet',
      traceId,
    });

    await this.publish('CFO_RESPONSE', {
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];

    if (ctx.batteryDepleted) {
      blockers.push('AI Battery depleted — cannot serve users without credits');
    } else if (ctx.batteryRemaining < 3) {
      warnings.push(`Battery low: ${ctx.batteryRemaining}/${ctx.batteryDailyLimit} credits`);
    } else {
      passed.push(`AI Battery healthy: ${ctx.batteryRemaining}/${ctx.batteryDailyLimit} credits`);
    }

    if (!ctx.webhookCryptoEnabled) {
      warnings.push('Payment webhook crypto not configured — acceptable for private beta');
    } else {
      passed.push('Payment webhook signatures verified');
    }

    if (ctx.pricingTiersDefined < 2) {
      blockers.push('Need at least 2 pricing tiers for free-to-paid path');
    } else {
      passed.push(`${ctx.pricingTiersDefined} pricing tiers defined`);
    }

    if (!ctx.freeToPathDefined) {
      warnings.push('Free-to-paid conversion path not fully wired');
    } else {
      passed.push('Free-to-paid conversion path defined');
    }

    const vote = blockers.length > 0 ? 'no-go' as const : warnings.length > 0 ? 'conditional' as const : 'go' as const;
    const confidence = blockers.length === 0 ? (warnings.length === 0 ? 95 : 75) : 30;

    return {
      agent: this.name, role: 'CFO', vote, confidence, blockers, warnings, passed,
      summary: vote === 'go'
        ? 'Financials clear. Battery funded, payments wired, pricing set.'
        : vote === 'conditional'
          ? `Budget acceptable with caveats: ${warnings.join('; ')}`
          : `Financial blockers: ${blockers.join('; ')}`,
    };
  }

  checkROI(creditCost: number, estimatedRevenue: number): { approved: boolean; ratio: number; recommendation: string } {
    const ratio = estimatedRevenue / Math.max(creditCost, 0.01);
    return ratio >= 2
      ? { approved: true, ratio, recommendation: 'ROI positive — proceed' }
      : { approved: false, ratio, recommendation: 'ROI < 2x — recommend manual mode' };
  }
}
