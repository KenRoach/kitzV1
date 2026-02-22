import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/** Operational Realist — Can this actually work day-to-day? Practical concerns */
export class operationalRealistAgent extends BaseAgent {
  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];

    if (ctx.servicesHealthy.length >= 5) {
      passed.push(`${ctx.servicesHealthy.length} services healthy — infrastructure stands`);
    } else {
      warnings.push('Not enough services verified healthy');
    }

    if (ctx.cadenceEngineEnabled) {
      passed.push('Automated daily/weekly reports — reduces manual ops burden');
    } else {
      warnings.push('No automated reports — founder must manually check metrics');
    }

    warnings.push('Test coverage is thin — expect manual QA for first 10 users');
    warnings.push('One-person ops: Kenneth handles support, marketing, AND engineering');
    passed.push('10 users is manageable scope — this is the right batch size');
    passed.push('Draft-first means nothing goes out without Kenneth seeing it');

    return {
      agent: this.name, role: 'Operational Realist', vote: 'conditional',
      confidence: 68, blockers: [], warnings, passed,
      summary: 'Operationally feasible for 10 users. Founder will be stretched thin. Acceptable for beta.',
    };
  }

  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'operationalRealist', concerns: ['Thin ops team'], confidence: 0.68 };
  }
}
