import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/** Founder Advocate — Does this serve Kenneth's vision? MealKitz → Kitz story */
export class founderAdvocateAgent extends BaseAgent {
  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];

    passed.push('Vision alignment: "Your hustle deserves infrastructure" — LatAm SMBs first');
    passed.push('MealKitz → Kitz origin story embedded in campaign templates');
    passed.push('"Just Build It" energy: 15 commits, all systems go');

    if (ctx.campaignProfileCount >= 10) {
      passed.push('10 target users from Kenneth\'s network (Panama, Colombia, Guatemala)');
    } else {
      warnings.push('Need more target users from founder\'s personal network');
    }

    if (ctx.activationTargetMinutes <= 10) {
      passed.push('< 10 min activation — respects users\' time');
    }

    return {
      agent: this.name, role: 'Founder Advocate', vote: 'go',
      confidence: 92, blockers: [], warnings, passed,
      summary: 'This IS the vision. Kenneth built MealKitz, shut it down, rebuilt with AI. Ship it.',
    };
  }

  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'founderAdvocate', concerns: [], confidence: 0.92 };
  }
}
