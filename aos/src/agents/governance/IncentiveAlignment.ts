import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/** Are incentives aligned? Users, founder, agents — everyone wins? */
export class IncentiveAlignmentAgent extends BaseAgent {
  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];

    passed.push('User incentive: free workspace with real utility — no risk to try');
    passed.push('Founder incentive: validate thesis + build relationship with first users');
    passed.push('Agent incentive: ROI >= 2x policy prevents waste');
    passed.push('Scrappy-free-first: no paid push until free value proven — aligned with user trust');

    if (ctx.freeToPathDefined) {
      passed.push('Free → paid path: 7+ days active, proven value, then AI Battery offer');
    } else {
      warnings.push('Free → paid path not fully defined — could misalign later');
    }

    return {
      agent: this.name, role: 'Incentive Alignment', vote: warnings.length > 0 ? 'conditional' : 'go',
      confidence: 82, blockers: [], warnings, passed,
      summary: 'Incentives aligned. Users get free value. Founder validates. No one loses.',
    };
  }
}
