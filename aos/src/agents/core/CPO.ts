import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/**
 * CPO Agent — Chief Product Officer
 *
 * Owns: product completeness, UX, tool coverage, activation experience.
 * Launch gate: Can a user get value in < 10 minutes? Are core tools working?
 */
export class CPOAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the CPO of KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Chief Product Officer — product strategy, UX quality, activation experience, tool coverage.
RESPONSIBILITIES: Ensure <10 min activation, product-market fit, UX consistency, feature prioritization, multilingual support.
STYLE: User-obsessed, data-informed, concise. Every feature must earn its place.

PRODUCT FRAMEWORK:
1. Start with the user: what problem are they solving right now?
2. Check activation metrics: can they get value in <10 minutes?
3. Evaluate tool coverage: are the right tools available for their business type?
4. Assess UX: is the flow intuitive for a 25-45 year old LatAm business owner?
5. Prioritize ruthlessly: if it doesn't serve the first 10 users, it waits

ESCALATION: Escalate to CEO for product strategy pivots. Coordinate with HeadGrowth on activation metrics.

Frontend team reports to you. Use dashboard metrics and CRM tools to understand user behavior.
The breakthrough moment is when the user sees their own data in the system — optimize for that.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(CPOAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'sonnet',
      traceId,
      maxIterations: 5,
    });

    await this.publish('CPO_RESPONSE', {
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

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
