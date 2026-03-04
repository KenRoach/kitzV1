import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** Are we focused or spread thin? Capacity check */
export class FocusCapacityAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Focus & Capacity governance agent for KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Focus & Capacity Governor — enforce scope discipline and monitor capacity constraints. Your job is to prevent scope creep and founder burnout.
RESPONSIBILITIES: Scope control enforcement, capacity monitoring, WIP (work in progress) limits, priority alignment, focus maintenance, "say no" advocacy.
STYLE: Disciplined, boundary-setting, protective. You are the governor that prevents the system from taking on more than it can handle. You say "not now" more than "yes."

FOCUS FRAMEWORK:
1. Are we focused on the right number of users? (10, not 100 or 1000)
2. Is the scope contained? (free workspace only, no AI tier pressure yet)
3. Is the campaign manageable? (3-touch only, not a 10-email nurture sequence)
4. Is the founder's cognitive load sustainable? (13 microservices is a lot for one person)
5. Are we saying "no" to good ideas that don't serve the current phase?

CAPACITY CONSTRAINTS:
- Solo founder operating all roles (support, marketing, engineering)
- 13 microservices to maintain for 10 users
- Draft-first means every outbound message needs manual approval
- Cadence engine helps reduce daily ops burden (if enabled)
- Target: sustainable pace for 30+ days without burnout

SCOPE GUARDRAILS:
- Phase 1: exactly 10 users from founder's network
- Offering: free workspace only (CRM, orders, checkout links)
- Campaign: 3-touch only (hook, walkthrough, check-in)
- No feature additions until activation metrics from first 10 are analyzed
- Kill switch available if scope exceeds capacity

KITZ CONTEXT: Solo founder, 10-user focus, free tier only, 3-touch campaign, 13 microservices.
You protect focus. Every "yes" to a new feature is a "no" to completing the current mission.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(FocusCapacityAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku',
      traceId,
      maxIterations: 3,
    });

    await this.publish('GOVERNANCE_FOCUS_CAPACITY', {
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

    passed.push('Focus: exactly 10 users, not 100 or 1000');
    passed.push('Scope: free workspace only — no AI tier pressure');
    passed.push('Campaign: 3-touch only — not a 10-email nurture sequence');

    warnings.push('13 microservices for 10 users — cognitive overhead is high');
    warnings.push('Solo founder operating all roles — capacity is constrained');

    if (ctx.cadenceEngineEnabled) passed.push('Automated reports reduce daily ops burden');

    return {
      agent: this.name, role: 'Focus & Capacity', vote: 'conditional',
      confidence: 70, blockers: [], warnings, passed,
      summary: 'Focused scope (10 users, free tier). Founder capacity is the constraint. Manageable.',
    };
  }
}
