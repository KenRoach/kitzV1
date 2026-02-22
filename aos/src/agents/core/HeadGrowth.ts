import { BaseAgent } from '../baseAgent.js';

/**
 * HeadGrowth Agent — Activation Funnels & Retention
 *
 * Owns: activation metrics, onboarding flow, retention signals, funnel analysis.
 * Current focus: First-10-users activation tracking.
 *
 * Key metric: Time-to-breakthrough (user sees own data in system) < 10 min.
 */
export class HeadGrowthAgent extends BaseAgent {

  /** Activation funnel stages */
  static readonly FUNNEL_STAGES = [
    'invited',        // WhatsApp invite sent
    'replied',        // User responded positively
    'clicked_link',   // Opened workspace.kitz.services
    'signed_up',      // Created account
    'first_contact',  // Added first CRM contact
    'first_action',   // Created order, checkout link, or task
    'day_3_return',   // Came back on day 3
    'day_7_return',   // Came back on day 7
    'ai_discovery',   // Explored AI Direction page
    'upgraded',       // Purchased AI credits
  ] as const;

  /** Target conversion rates for first-10 cohort */
  static readonly TARGETS = {
    invited_to_replied: 0.70,      // 7/10
    replied_to_signed_up: 0.85,    // 6/7
    signed_up_to_first_action: 0.80, // 5/6
    first_action_to_day7: 0.60,    // 3/5
    day7_to_upgraded: 0.30,        // 1/3 (stretch goal)
  } as const;

  /**
   * Evaluate a user's activation state and recommend next action.
   */
  evaluateActivation(user: {
    name: string;
    invitedAt: string;
    repliedAt?: string;
    signedUpAt?: string;
    firstContactAt?: string;
    firstActionAt?: string;
    lastSeenAt?: string;
  }): {
    stage: string;
    daysElapsed: number;
    nextAction: string;
    urgency: 'low' | 'medium' | 'high';
    breakthroughAchieved: boolean;
  } {
    const now = Date.now();
    const invited = new Date(user.invitedAt).getTime();
    const daysElapsed = Math.floor((now - invited) / 86400000);

    if (!user.repliedAt) {
      return {
        stage: 'invited',
        daysElapsed,
        nextAction: daysElapsed >= 2 ? 'Send gentle follow-up' : 'Wait for reply',
        urgency: daysElapsed >= 3 ? 'high' : 'low',
        breakthroughAchieved: false,
      };
    }

    if (!user.signedUpAt) {
      return {
        stage: 'replied',
        daysElapsed,
        nextAction: 'Send activation walkthrough (Touch 2)',
        urgency: 'high',
        breakthroughAchieved: false,
      };
    }

    if (!user.firstContactAt) {
      return {
        stage: 'signed_up',
        daysElapsed,
        nextAction: 'Guide them to add their first contact (< 2 min)',
        urgency: 'high',
        breakthroughAchieved: false,
      };
    }

    if (!user.firstActionAt) {
      return {
        stage: 'first_contact',
        daysElapsed,
        nextAction: 'Suggest creating a checkout link or order',
        urgency: 'medium',
        breakthroughAchieved: true, // They saw their data!
      };
    }

    const lastSeen = user.lastSeenAt ? new Date(user.lastSeenAt).getTime() : now;
    const daysSinceLastSeen = Math.floor((now - lastSeen) / 86400000);

    if (daysSinceLastSeen > 5) {
      return {
        stage: 'at_risk',
        daysElapsed,
        nextAction: 'Send check-in: what is chaotic in their business?',
        urgency: 'high',
        breakthroughAchieved: true,
      };
    }

    return {
      stage: 'active',
      daysElapsed,
      nextAction: 'Monitor usage. After day 7, introduce AI Battery.',
      urgency: 'low',
      breakthroughAchieved: true,
    };
  }

  /**
   * Calculate cohort health for the first-10 campaign.
   */
  cohortHealth(users: Array<{ stage: string }>): {
    total: number;
    byStage: Record<string, number>;
    activationRate: number;
    atRiskCount: number;
  } {
    const byStage: Record<string, number> = {};
    let activated = 0;
    let atRisk = 0;

    for (const user of users) {
      byStage[user.stage] = (byStage[user.stage] || 0) + 1;
      if (['first_contact', 'first_action', 'active', 'day_3_return', 'day_7_return', 'ai_discovery', 'upgraded'].includes(user.stage)) {
        activated++;
      }
      if (user.stage === 'at_risk') atRisk++;
    }

    return {
      total: users.length,
      byStage,
      activationRate: users.length ? activated / users.length : 0,
      atRiskCount: atRisk,
    };
  }

  /** Emit activation event for audit trail */
  async emitActivationEvent(userId: string, stage: string): Promise<void> {
    await this.publish('USER_ACTIVATION_STAGE', {
      userId,
      stage,
      campaign: 'first-10-users',
      timestamp: new Date().toISOString(),
    }, 'low');
  }
}
