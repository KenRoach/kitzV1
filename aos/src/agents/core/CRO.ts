import { BaseAgent } from '../baseAgent.js';

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
