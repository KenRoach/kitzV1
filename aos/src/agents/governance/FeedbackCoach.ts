import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/** Ensures feedback loops are in place — can we learn from our first 10 users? */
export class FeedbackCoachAgent extends BaseAgent {
  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];

    if (ctx.whatsappConnectorConfigured) passed.push('WhatsApp = direct feedback channel from users');
    passed.push('Touch 3 in campaign asks "How\'s it feeling?" — built-in feedback loop');
    passed.push('AOS event bus logs all actions — can analyze user patterns');
    warnings.push('No formal feedback collection UI — replies via WhatsApp only');

    return {
      agent: this.name, role: 'Feedback Coach', vote: 'go',
      confidence: 75, blockers: [], warnings, passed,
      summary: 'Feedback loops exist via WhatsApp + Touch 3 check-in. Good enough for 10 users.',
    };
  }
}
