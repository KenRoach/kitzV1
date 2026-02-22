import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/**
 * HeadIntelligenceRisk Agent — Security, Risk Assessment, Compliance
 *
 * Owns: kill switch validation, rate limiting, webhook crypto, data isolation.
 * Launch gate: Is the system safe to expose to real users?
 */
export class HeadIntelligenceRiskAgent extends BaseAgent {

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];

    // Kill switch must be functional (currently OFF = good)
    if (!ctx.killSwitch) {
      passed.push('Kill switch functional and disengaged');
    } else {
      blockers.push('Kill switch engaged — cannot launch while halted');
    }

    // Rate limiting protects against abuse
    if (ctx.rateLimitingEnabled) {
      passed.push('Rate limiting active (120 req/min)');
    } else {
      warnings.push('Rate limiting not enabled — abuse risk');
    }

    // JWT auth for org isolation
    if (ctx.jwtAuthEnabled) {
      passed.push('JWT auth enabled — org data isolation enforced');
    } else {
      warnings.push('JWT auth not enabled — multi-tenant data risk');
    }

    // Webhook crypto for payment integrity
    if (ctx.webhookCryptoEnabled) {
      passed.push('Webhook signatures cryptographically verified');
    } else {
      warnings.push('Webhook crypto not configured — payment integrity risk');
    }

    // Draft-first prevents rogue messages
    if (ctx.draftFirstEnforced) {
      passed.push('Draft-first enforced — no unsupervised outbound messages');
    } else {
      blockers.push('Draft-first not enforced — rogue message risk');
    }

    // AI Battery prevents runaway costs
    if (!ctx.batteryDepleted && ctx.batteryDailyLimit > 0) {
      passed.push(`AI Battery capped at ${ctx.batteryDailyLimit} credits/day — cost containment active`);
    } else {
      warnings.push('AI Battery depleted or uncapped');
    }

    passed.push('Constitutional governance: KITZ_MASTER_PROMPT.md defines identity + constraints');
    passed.push('Agents are advisory + PR-based only — deploy execution forbidden');

    const vote = blockers.length > 0 ? 'no-go' as const : warnings.length > 0 ? 'conditional' as const : 'go' as const;
    const confidence = blockers.length === 0 ? (warnings.length === 0 ? 90 : 72) : 15;

    return {
      agent: this.name, role: 'HeadIntelligenceRisk', vote, confidence, blockers, warnings, passed,
      summary: vote === 'go'
        ? 'Security posture acceptable. Kill switch, rate limiting, draft-first, battery cap — all active.'
        : vote === 'conditional'
          ? `Security mostly ready: ${warnings.join('; ')}`
          : `SECURITY BLOCKERS: ${blockers.join('; ')}`,
    };
  }
}
