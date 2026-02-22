import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/** Are we focused or spread thin? Capacity check */
export class FocusCapacityAgent extends BaseAgent {
  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];

    passed.push('Focus: exactly 10 users, not 100 or 1000');
    passed.push('Scope: free workspace only — no AI tier pressure');
    passed.push('Campaign: 3-touch only — not a 10-email nurture sequence');

    warnings.push('13 microservices for 10 users — cognitive overhead is high');
    warnings.push('Solo founder operating all roles — capacity is constrained');

    if (ctx.cadenceEngineEnabled) passed.push('Automated reports reduce daily ops burden');

    return {
      agent: this.name, role: 'Focus & Capacity', vote: 'conditional',
      confidence: 70, blockers: [], warnings, passed,
      summary: 'Focused scope (10 users, free tier). Founder capacity is the constraint. Manageable.',
    };
  }
}
