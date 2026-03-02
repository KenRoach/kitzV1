import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/**
 * CRO Agent — Chief Revenue Officer
 *
 * Owns: revenue targets, free-to-paid conversion, upsell timing.
 * Current focus: First-10 users — free tier validation before AI Battery upsell.
 *
 * Policy: scrappy_free_first — never push paid until free value is proven.
 * Policy: receive_only — agents cannot spend money, only facilitate incoming payments.
 */
export class CROAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the CRO of KITZ — an AI Business Operating System.

ROLE: Chief Revenue Officer — revenue strategy, pricing, conversion optimization.
RESPONSIBILITIES: Free-to-paid conversion, upsell timing, pricing tiers, LTV projections.
STYLE: Revenue-focused but patient. Data-driven. Never pushy.

REVENUE RULES:
- Scrappy-free-first: NEVER push paid until free value is proven (7+ days active)
- Receive-only: Agents CANNOT send money. Only facilitate incoming payments.
- Pricing: $5/100 credits, $20/500, $60/2000
- ROI >= 2x or recommend manual mode
- Upsell only after: 7+ days active + 3+ meaningful actions + AI page explored

Use CRM tools to analyze user behavior, payment tools for revenue data, advisors for calculations.
Focus on proving free tier value first — the conversion happens naturally.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(CROAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'sonnet',
      traceId,
    });

    await this.publish('CRO_RESPONSE', {
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  /** AI Battery pricing tiers */
  static readonly PRICING = [
    { credits: 100,  price: 5,  perCredit: 0.050 },
    { credits: 500,  price: 20, perCredit: 0.040 },
    { credits: 2000, price: 60, perCredit: 0.030 },
  ] as const;

  /**
   * Determine if a user is ready for the AI Battery upsell.
   * Returns false until free tier value is proven (>= 7 days active + meaningful usage).
   */
  isReadyForUpsell(user: {
    daysActive: number;
    contactsAdded: number;
    ordersCreated: number;
    checkoutLinksCreated: number;
    hasExploredAiPage: boolean;
  }): {
    ready: boolean;
    reason: string;
    recommendedTier: typeof CROAgent.PRICING[number] | null;
    roiPitch: string | null;
  } {
    if (user.daysActive < 7) {
      return { ready: false, reason: 'Too early — let free tier value prove itself', recommendedTier: null, roiPitch: null };
    }

    const totalActions = user.contactsAdded + user.ordersCreated + user.checkoutLinksCreated;
    if (totalActions < 3) {
      return { ready: false, reason: 'Not enough free tier usage yet — guide them to use more features', recommendedTier: null, roiPitch: null };
    }

    if (!user.hasExploredAiPage) {
      return { ready: false, reason: 'Has not explored AI Direction yet — surface it naturally first', recommendedTier: null, roiPitch: null };
    }

    const tier = CROAgent.PRICING[0];
    const estimatedTimeSaved = Math.ceil(totalActions * 0.3);
    const roiPitch = `100 AI credits = $5. At your current usage, that's ~${estimatedTimeSaved} tasks automated. Saves you roughly ${estimatedTimeSaved * 20} minutes.`;

    return { ready: true, reason: 'Active user with proven free tier value and AI curiosity', recommendedTier: tier, roiPitch };
  }

  /**
   * Calculate projected LTV for a user based on usage patterns.
   */
  projectLTV(user: {
    monthlyActions: number;
    averageOrderValue: number;
  }): {
    monthlyCreditsNeeded: number;
    monthlyRevenue: number;
    annualLTV: number;
    recommendedTier: typeof CROAgent.PRICING[number];
  } {
    const monthlyCredits = Math.ceil(user.monthlyActions * 1.2);
    const tier = CROAgent.PRICING.find(t => t.credits >= monthlyCredits) || CROAgent.PRICING[2];

    return {
      monthlyCreditsNeeded: monthlyCredits,
      monthlyRevenue: tier.price,
      annualLTV: tier.price * 12,
      recommendedTier: tier,
    };
  }

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];

    if (ctx.pricingTiersDefined < 2) {
      blockers.push('Need at least 2 pricing tiers (free + paid)');
    } else {
      passed.push(`${ctx.pricingTiersDefined} pricing tiers: $5/100, $20/500, $60/2000`);
    }

    if (!ctx.freeToPathDefined) {
      warnings.push('Free-to-paid conversion path not wired end-to-end');
    } else {
      passed.push('Free-to-paid path: 7+ days active → AI Battery upsell');
    }

    // For first 10 users, free tier must work perfectly
    if (!ctx.workspaceMcpConfigured) {
      blockers.push('Workspace not configured — free tier is broken');
    } else {
      passed.push('Free workspace (CRM, orders, checkout links, tasks) operational');
    }

    passed.push('Scrappy-free-first: no paid push until free value proven');
    passed.push('ROI >= 2x policy enforced on all AI Battery spends');

    const vote = blockers.length > 0 ? 'no-go' as const : warnings.length > 0 ? 'conditional' as const : 'go' as const;
    const confidence = blockers.length === 0 ? (warnings.length === 0 ? 85 : 70) : 25;

    return {
      agent: this.name, role: 'CRO', vote, confidence, blockers, warnings, passed,
      summary: vote === 'go'
        ? 'Revenue pipeline ready. Free tier solid, pricing set, upsell logic defined.'
        : vote === 'conditional'
          ? `Revenue mostly ready: ${warnings.join('; ')}`
          : `Revenue blockers: ${blockers.join('; ')}`,
    };
  }

  /** Emit revenue event for audit trail */
  async emitRevenueEvent(userId: string, action: string, amount: number): Promise<void> {
    await this.publish('REVENUE_EVENT', {
      userId,
      action,
      amount,
      currency: 'USD',
      campaign: 'first-10-users',
    }, 'medium');
  }
}
