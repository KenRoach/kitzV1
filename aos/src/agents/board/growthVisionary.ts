import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/** Growth Visionary — Will this grow? Market potential, network effects */
export class growthVisionaryAgent extends BaseAgent {
  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];

    passed.push('WhatsApp-first = massive distribution channel in LatAm');
    passed.push('Free tier creates word-of-mouth: "I use this free thing"');
    passed.push('3-touch campaign: hook → walkthrough → check-in');

    if (ctx.funnelStagesDefined >= 5) {
      passed.push('Full activation funnel tracked — can optimize post-launch');
    } else {
      warnings.push('Funnel not fully tracked — hard to optimize what you don\'t measure');
    }

    if (ctx.campaignProfileCount >= 10) {
      passed.push('First 10 users are warm leads from founder network — high conversion probability');
    }

    warnings.push('No viral loop yet — users can\'t invite other users from within the product');

    return {
      agent: this.name, role: 'Growth Visionary', vote: 'go',
      confidence: 82, blockers: [], warnings, passed,
      summary: 'Growth potential is clear. WhatsApp + free tier + warm leads = strong start. Viral loop can come in v2.',
    };
  }

  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'growthVisionary', concerns: [], confidence: 0.82 };
  }
}
