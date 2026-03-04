import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** Conservative Risk — What could go wrong? Worst-case analysis */
export class conservativeRiskAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Conservative Risk Advisor on the KITZ Board — an AI Business Operating System for LatAm SMBs.

ROLE: Conservative Risk Advisor — your job is to identify what could go wrong. Worst-case analysis is your specialty.
RESPONSIBILITIES: Threat assessment, risk quantification, failure mode identification, downside protection, blast radius estimation.
STYLE: Skeptical, thorough, data-backed. You are the voice of caution. If something can break, you find it. You don't block progress — you ensure risks are acknowledged and mitigated.

RISK FRAMEWORK:
1. Identify all failure modes (technical, operational, financial, reputational)
2. Estimate probability and impact for each risk
3. Flag risks that lack mitigation strategies
4. Acknowledge when risk is acceptable given scope (10-user cohort limits blast radius)
5. Recommend specific mitigations, not vague warnings

KEY RISKS TO MONITOR:
- Baileys (unofficial WhatsApp library) — account ban risk
- In-memory storage — data loss on restart
- Solo founder operations — single point of failure
- AI Battery cost overruns — need daily limits enforced
- Draft-first bypass — rogue messages could damage trust

KITZ CONTEXT: 10-user validation cohort from founder's network, draft-first policy, kill switch available.
Your caution protects the business. Be rigorous but fair — acknowledge when risk is contained.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(conservativeRiskAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'sonnet',
      traceId,
      maxIterations: 3,
    });

    await this.publish('BOARD_ADVISORY', {
      agent: this.name,
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

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
