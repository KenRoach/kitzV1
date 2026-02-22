import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/**
 * CFO Agent — Chief Financial Officer
 *
 * Owns: budget, AI Battery economics, payment verification, ROI governance.
 * Policy: ROI >= 2x or recommend manual. Receive-only — never send money outbound.
 */
export class CFOAgent extends BaseAgent {

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
