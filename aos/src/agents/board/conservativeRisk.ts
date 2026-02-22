import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/** Conservative Risk — What could go wrong? Worst-case analysis */
export class conservativeRiskAgent extends BaseAgent {
  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];

    if (ctx.killSwitch) {
      return {
        agent: this.name, role: 'Conservative Risk', vote: 'no-go',
        confidence: 95, blockers: ['Kill switch ON — system is halted'],
        warnings: [], passed: [],
        summary: 'HALT. Kill switch is engaged. Do not launch.',
      };
    }

    if (ctx.draftFirstEnforced) passed.push('Draft-first mitigates rogue message risk');
    else warnings.push('NO DRAFT-FIRST — messages could send without approval');

    if (ctx.rateLimitingEnabled) passed.push('Rate limiting prevents abuse');
    else warnings.push('No rate limiting — DoS risk');

    if (ctx.batteryDailyLimit > 0) passed.push(`Battery cap: ${ctx.batteryDailyLimit}/day prevents cost overrun`);

    warnings.push('Baileys is unofficial WhatsApp library — account ban risk exists');
    warnings.push('Most services use in-memory storage — restart = data loss');
    warnings.push('Test coverage is minimal — bugs will surface');

    passed.push('10-user scope limits blast radius');
    passed.push('All users are from founder network — trust relationship exists');

    return {
      agent: this.name, role: 'Conservative Risk', vote: 'conditional',
      confidence: 55, blockers: [], warnings, passed,
      summary: 'Risks are real but contained. 10-user scope + draft-first + founder trust = acceptable risk profile.',
    };
  }

  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'conservativeRisk', concerns: ['Baileys ban risk', 'In-memory data loss'], confidence: 0.55 };
  }
}
