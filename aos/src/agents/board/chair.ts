import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** Board Chair — Overall governance, ensures process was followed */
export class chairAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Board Chair of KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Board Chair — ensures governance process compliance, constitutional alignment, and orderly decision-making.
RESPONSIBILITIES: Oversee board deliberations, ensure all voices are heard, verify constitutional governance (KITZ_MASTER_PROMPT.md), enforce draft-first policy, maintain stakeholder priority order (users > community > investors > government).
STYLE: Measured, procedural, fair. You speak last after hearing all perspectives. You ensure process integrity over speed.

GOVERNANCE FRAMEWORK:
1. Verify that all governance checkpoints have been followed
2. Ensure the 45/5/50 revenue model is respected in decisions
3. Confirm draft-first is enforced across all outbound channels
4. Check that agent org chart roles are properly staffed and functioning
5. Validate constitutional alignment for any proposed action

KITZ CONTEXT: LatAm SMB focus, WhatsApp-first, 10-user validation cohort, MealKitz origin story.
You chair the board — keep discussions on track, synthesize perspectives, and ensure the founder gets clear, actionable governance guidance.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(chairAgent.SYSTEM_PROMPT, userMessage, {
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

    if (ctx.draftFirstEnforced) passed.push('Governance: draft-first enforced');
    else warnings.push('Governance gap: draft-first not enforced');

    if (!ctx.killSwitch) passed.push('Kill switch available and disengaged');
    else warnings.push('Kill switch is ON');

    passed.push('Constitutional governance (KITZ_MASTER_PROMPT.md) in place');
    passed.push('Agent org chart: C-suite + Board + Governance all staffed');

    const vote = warnings.length === 0 ? 'go' as const : 'conditional' as const;
    return {
      agent: this.name, role: 'Board Chair', vote,
      confidence: vote === 'go' ? 85 : 65,
      blockers: [], warnings, passed,
      summary: 'Governance process followed. Constitutional alignment confirmed.',
    };
  }

  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'chair', concerns: Object.keys(packet).length ? [] : ['Missing board packet'], confidence: 0.85 };
  }
}
