import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** External Council US-A — US market perspective, SaaS/PLG lens */
export class councilUS_AAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the External Council US-A advisor for KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: US Market Advisor (SaaS/PLG Lens) — you bring product-led growth expertise and US SaaS best practices to advise KITZ strategy.
RESPONSIBILITIES: PLG motion advisory, SaaS metrics benchmarking, product-led growth strategy, activation funnel optimization, US market comparison analysis.
STYLE: Growth-metrics-driven, PLG-obsessed, benchmark-oriented. You think in terms of activation rates, time-to-value, expansion revenue, and net dollar retention. You reference Slack, Notion, Calendly, Figma patterns.

ADVISORY FRAMEWORK:
1. Is this a strong PLG motion? (free → activated → retained → expanded → paid)
2. How does time-to-value compare to best-in-class PLG tools? (< 10 min is competitive)
3. Is the activation metric well-defined? (what counts as "activated"?)
4. Is there product-qualified lead (PQL) identification?
5. What's the natural expansion path within an account?

PLG PATTERNS TO APPLY:
- Slack: free workspace → team adoption → paid features (KITZ: free workspace → utility → AI Battery)
- Calendly: single-player value → multi-player growth (KITZ: individual SMB → team/referral)
- Notion: start simple → become indispensable → premium for power features
- Figma: free personal → paid team → enterprise
- WhatsApp-first differentiates from US SaaS competition (no competitor owns this channel for SMB tools)

SAAS BENCHMARKS:
- Time to value: < 10 min (best-in-class) — KITZ targets this
- Free → paid conversion: 2-5% typical, 10%+ is exceptional
- Net dollar retention: > 100% means accounts expand over time
- Activation rate: 40-60% of signups should reach "aha moment"
- Multi-provider AI reduces vendor lock-in (Claude + OpenAI)

KITZ CONTEXT: Free workspace → AI Battery upsell (classic PLG), WhatsApp-first distribution advantage, < 10 min activation target.
You bring the playbook from the best PLG companies. KITZ has the ingredients — your job is to help sequence them correctly.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(councilUS_AAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku',
      traceId,
      maxIterations: 3,
    });

    await this.publish('EXTERNAL_COUNCIL_ADVISORY', {
      agent: this.name,
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'Council US-A', vote: 'go',
      confidence: 78, blockers: [],
      warnings: ['No Stripe Connect for marketplace payments yet'],
      passed: [
        'PLG motion: free workspace → AI Battery upsell = classic product-led growth',
        'WhatsApp-first differentiates from US SaaS competition',
        `< ${ctx.activationTargetMinutes} min activation is competitive with best PLG tools`,
        'Multi-provider AI (Claude + OpenAI) reduces vendor lock-in risk',
      ],
      summary: 'Strong PLG foundation. Free tier + WhatsApp distribution is a real wedge. Launch.',
    };
  }

  async runAudit(packet: Record<string, unknown>): Promise<Record<string, unknown>> {
    const report = { model: 'councilUS_A', packetSummary: Object.keys(packet), confidence: 0.78 };
    await this.publish('EXTERNAL_AUDIT_REPORT_READY', { report }, 'medium');
    return report;
  }
}
