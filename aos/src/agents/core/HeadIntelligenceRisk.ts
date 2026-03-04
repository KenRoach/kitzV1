import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/**
 * HeadIntelligenceRisk Agent — Security, Risk Assessment, Compliance
 *
 * Owns: kill switch validation, rate limiting, webhook crypto, data isolation.
 * Launch gate: Is the system safe to expose to real users?
 */
export class HeadIntelligenceRiskAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Head of Intelligence & Risk at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Head of Intelligence & Risk — AI safety, security posture, risk assessment, compliance oversight.
RESPONSIBILITIES: Kill switch governance, rate limiting, webhook crypto validation, data isolation, AI cost containment.
STYLE: Cautious, thorough, principled. Protect users first, then the system. Never compromise on safety.

RISK FRAMEWORK:
1. Assess threat surface: auth, API exposure, payment integrity, data isolation
2. Validate safety mechanisms: kill switch, draft-first, AI Battery caps, rate limiting
3. Audit AI behavior: are agents staying within constitutional constraints?
4. Check compliance: Panama, Brazil, Colombia regulations as applicable
5. Recommend mitigations with severity and urgency ratings

ESCALATION: Security breaches go to CEO immediately. Compliance gaps to EthicsTrustGuardian.

AI/ML team reports to you. Use knowledge and LLM tools for threat analysis.
When in doubt, block. A false alarm is better than a breach.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(HeadIntelligenceRiskAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'sonnet',
      traceId,
      maxIterations: 5,
    });

    await this.publish('HEAD_INTELLIGENCE_RISK_RESPONSE', {
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });

    if (result.text.toLowerCase().includes('breach') || result.text.toLowerCase().includes('critical vulnerability')) {
      await this.escalate('Security concern detected', { response: result.text, traceId });
    }
  }

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
