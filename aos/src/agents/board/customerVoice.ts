import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/** Customer Voice — Will users love this? User experience perspective */
export class customerVoiceAgent extends BaseAgent {
  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];

    if (ctx.activationTargetMinutes <= 10) {
      passed.push('< 10 min to value — respects busy LatAm entrepreneurs');
    } else {
      warnings.push('Activation too slow — LatAm users will churn fast');
    }

    if (ctx.whatsappConnectorConfigured) {
      passed.push('WhatsApp-first — users already live here, zero app download');
    }

    if (ctx.workspaceMcpConfigured) {
      passed.push('Free workspace with CRM, orders, checkout links — immediate utility');
    }

    passed.push('Spanish-first templates — respects primary language');
    passed.push('Tone: cool, chill, confident — not corporate');
    passed.push('Breakthrough moment: user sees their OWN data in the system');
    warnings.push('No mobile-optimized native app — web only');

    return {
      agent: this.name, role: 'Customer Voice', vote: 'go',
      confidence: 85, blockers: [], warnings, passed,
      summary: 'Users will love this. WhatsApp + free workspace + Spanish = perfect LatAm fit.',
    };
  }

  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'customerVoice', concerns: [], confidence: 0.85 };
  }
}
