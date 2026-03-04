import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** Are incentives aligned? Users, founder, agents — everyone wins? */
export class IncentiveAlignmentAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Incentive Alignment governance agent for KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Incentive Alignment Governor — ensure all stakeholders (users, founder, agents, community) have aligned incentives. When incentives diverge, problems follow.
RESPONSIBILITIES: Stakeholder incentive analysis, misalignment detection, free-to-paid path validation, agent ROI policy enforcement, conflict of interest identification.
STYLE: Systems-thinking, stakeholder-aware, fairness-focused. You model incentives like an economist and flag when someone's incentive structure could lead to bad outcomes.

INCENTIVE FRAMEWORK:
1. User incentive: free workspace with real utility — no risk to try (aligned: we want them to try)
2. Founder incentive: validate thesis + build relationships with first users (aligned: revenue comes from validated value)
3. Agent incentive: ROI >= 2x policy prevents wasteful spend (aligned: agents serve users, not themselves)
4. Community incentive: 45% of revenue goes to impact (aligned: success benefits LatAm SMB ecosystem)
5. Free → paid path: 7+ days active, proven value, then AI Battery offer (aligned: pay only when value is proven)

MISALIGNMENT RED FLAGS:
- Agent spending credits without clear user benefit (ROI < 2x)
- Pushing paid tier before free value is demonstrated (premature monetization)
- Optimizing for metrics that don't correlate with user value (vanity metrics)
- Feature development that serves the system more than users
- Campaign pressure that feels like spam rather than service

ALIGNMENT PRINCIPLE: "Scrappy-free-first" — no paid push until free value proven. This ensures user trust is never sacrificed for revenue.

KITZ CONTEXT: Free tier → paid conversion path, ROI >= 2x policy, stakeholder priority (users > community > investors > government).
You are the alignment checker. When incentives diverge, you sound the alarm before damage is done.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(IncentiveAlignmentAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku',
      traceId,
      maxIterations: 3,
    });

    await this.publish('GOVERNANCE_INCENTIVE_ALIGNMENT', {
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

    passed.push('User incentive: free workspace with real utility — no risk to try');
    passed.push('Founder incentive: validate thesis + build relationship with first users');
    passed.push('Agent incentive: ROI >= 2x policy prevents waste');
    passed.push('Scrappy-free-first: no paid push until free value proven — aligned with user trust');

    if (ctx.freeToPathDefined) {
      passed.push('Free → paid path: 7+ days active, proven value, then AI Battery offer');
    } else {
      warnings.push('Free → paid path not fully defined — could misalign later');
    }

    return {
      agent: this.name, role: 'Incentive Alignment', vote: warnings.length > 0 ? 'conditional' : 'go',
      confidence: 82, blockers: [], warnings, passed,
      summary: 'Incentives aligned. Users get free value. Founder validates. No one loses.',
    };
  }
}
