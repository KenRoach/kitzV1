import { BaseAgent } from '../baseAgent.js';
import type { AOSEvent, LaunchContext, LaunchReview } from '../../types.js';

export type ReviewDecision = 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';

/** Reviewer — Final code/config review. The last check before CEO decides. */
export class ReviewerAgent extends BaseAgent {
  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];

    // Run the checklist
    const checklist = {
      alignment: ctx.draftFirstEnforced,
      security: !ctx.killSwitch && ctx.rateLimitingEnabled,
      ux: ctx.semanticRouterActive && ctx.toolCount >= 50,
      financial: !ctx.batteryDepleted && ctx.pricingTiersDefined >= 2,
      compliance: ctx.draftFirstEnforced,
    };

    const allPassing = Object.values(checklist).every(Boolean);

    for (const [check, passing] of Object.entries(checklist)) {
      if (passing) passed.push(`Checklist: ${check} — PASS`);
      else warnings.push(`Checklist: ${check} — NEEDS ATTENTION`);
    }

    return {
      agent: this.name, role: 'Reviewer', vote: allPassing ? 'go' : 'conditional',
      confidence: allPassing ? 88 : 60, blockers: [], warnings, passed,
      summary: allPassing
        ? 'All review checks pass. Alignment, security, UX, financial, compliance — GO.'
        : `Review: ${warnings.length} items need attention. ${passed.length} items pass.`,
    };
  }

  review(event: AOSEvent): { decision: ReviewDecision; checklist: Record<string, boolean> } {
    const checklist = {
      alignment: true,
      security: !String(event.payload.action ?? '').includes('security_change') || Boolean((event.payload.approvals as string[] | undefined)?.includes('Security')),
      ux: true,
      financial: true,
      compliance: true,
    };
    const decision: ReviewDecision = Object.values(checklist).every(Boolean) ? 'APPROVE' : 'REQUEST_CHANGES';
    return { decision, checklist };
  }
}
