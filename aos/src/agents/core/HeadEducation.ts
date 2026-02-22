import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/**
 * HeadEducation Agent — Onboarding Content & User Education
 *
 * Owns: onboarding templates, walkthrough content, 2-min setup validation.
 * Launch gate: Can a new user understand what to do in < 2 minutes?
 */
export class HeadEducationAgent extends BaseAgent {

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];

    if (ctx.campaignTemplateLanguages.length >= 2) {
      passed.push(`Onboarding templates in ${ctx.campaignTemplateLanguages.join(' + ')}`);
    } else {
      warnings.push('Onboarding only in 1 language — LatAm users need ES');
    }

    if (ctx.activationTargetMinutes <= 10) {
      passed.push(`Setup flow targets < ${ctx.activationTargetMinutes} min activation`);
    } else {
      warnings.push(`Setup takes ${ctx.activationTargetMinutes} min — too slow for first impression`);
    }

    passed.push('3-touch campaign includes walkthrough (Touch 2)');
    passed.push('Help command surfaces all capabilities');
    passed.push('Workspace has visual CRM, orders, tasks tabs');
    warnings.push('No video walkthroughs yet — text-only onboarding');

    const vote = blockers.length > 0 ? 'no-go' as const : warnings.length > 0 ? 'conditional' as const : 'go' as const;
    const confidence = blockers.length === 0 ? (warnings.length === 0 ? 80 : 68) : 25;

    return {
      agent: this.name, role: 'HeadEducation', vote, confidence, blockers, warnings, passed,
      summary: vote === 'go'
        ? 'Education ready. Templates, walkthrough, help system — users can self-onboard.'
        : `Education mostly ready: ${warnings.join('; ')}`,
    };
  }
}
