import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/**
 * CPO Agent — Chief Product Officer
 *
 * Owns: product completeness, UX, tool coverage, activation experience.
 * Launch gate: Can a user get value in < 10 minutes? Are core tools working?
 */
export class CPOAgent extends BaseAgent {

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];

    if (ctx.toolCount < 50) {
      blockers.push(`Only ${ctx.toolCount} tools — users won't get full experience`);
    } else {
      passed.push(`${ctx.toolCount} tools loaded — full product capability`);
    }

    if (ctx.activationTargetMinutes > 10) {
      warnings.push(`Activation target: ${ctx.activationTargetMinutes} min (should be < 10)`);
    } else {
      passed.push(`Activation target: < ${ctx.activationTargetMinutes} min`);
    }

    if (ctx.funnelStagesDefined < 5) {
      warnings.push(`Only ${ctx.funnelStagesDefined} funnel stages — need full journey tracking`);
    } else {
      passed.push(`${ctx.funnelStagesDefined} funnel stages defined`);
    }

    if (!ctx.semanticRouterActive) {
      blockers.push('Semantic router inactive — no AI interactions');
    } else {
      passed.push('5-phase semantic router active');
    }

    if (ctx.campaignTemplateLanguages.length < 2) {
      warnings.push('Campaign templates only in 1 language — need EN + ES');
    } else {
      passed.push(`Templates in ${ctx.campaignTemplateLanguages.join(' + ')}`);
    }

    const vote = blockers.length > 0 ? 'no-go' as const : warnings.length > 0 ? 'conditional' as const : 'go' as const;
    const confidence = blockers.length === 0 ? (warnings.length === 0 ? 88 : 72) : 30;

    return {
      agent: this.name, role: 'CPO', vote, confidence, blockers, warnings, passed,
      summary: vote === 'go'
        ? `Product ready. ${ctx.toolCount} tools, < ${ctx.activationTargetMinutes} min activation, multilingual.`
        : vote === 'conditional'
          ? `Product mostly ready: ${warnings.join('; ')}`
          : `Product blockers: ${blockers.join('; ')}`,
    };
  }
}
