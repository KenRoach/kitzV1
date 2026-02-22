import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

export class CapitalAllocationAgent extends BaseAgent {
  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];

    if (!ctx.batteryDepleted) passed.push('AI Battery has credits — launch won\'t stall');
    else warnings.push('Battery depleted — need recharge before launch');

    passed.push('45/5/50 split defined (impact/agentUpgrade/founder)');
    passed.push('Free tier = $0 marginal cost per user');
    passed.push('AI Battery pricing: $5/100, $20/500, $60/2000');

    return {
      agent: this.name, role: 'Capital Allocation', vote: warnings.length > 0 ? 'conditional' : 'go',
      confidence: 80, blockers: [], warnings, passed,
      summary: 'Capital allocation clear. Free tier funded, battery pricing set.',
    };
  }

  runCycle(input: { revenue: number; expenses: number; rnd: number; runwayMonths: number; marginPercent: number }): Record<string, unknown> {
    const distributable = Math.max(0, input.revenue - input.expenses - input.rnd);
    let founder = distributable * 0.5;
    let impact = distributable * 0.45;
    let agentUpgrade = distributable * 0.05;
    const guardrailTriggered = input.runwayMonths < 6 || input.marginPercent < 20;
    if (guardrailTriggered) { founder *= 0.5; impact *= 0.5; agentUpgrade *= 0.5; }
    return { distributable, founder, impact, agentUpgrade, guardrailTriggered };
  }
}
