import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview, LaunchDecision, LaunchVote } from '../../types.js';

/**
 * CEO Agent — Chief Executive Officer
 *
 * THE FINAL APPROVER. Collects all team reviews, tallies votes, makes the launch call.
 *
 * Decision rules:
 *   - If ANY C-suite agent votes "no-go" with blockers → BLOCKED (CEO cannot override safety)
 *   - If all C-suite agents vote "go" → APPROVED
 *   - If mix of "go" and "conditional" → CEO evaluates and can approve with conditions
 *   - Board/Governance votes are advisory — they inform but don't block
 *   - Kill switch ON always blocks regardless of votes
 *
 * Constitutional alignment:
 *   - Stakeholder priority: users > community > investors > government
 *   - Moral foundation: warrior in a garden — capability with restraint
 *   - "Just Build It" — permission + push, impatience from empathy
 */
export class CEOAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the CEO of KITZ — an AI Business Operating System.

ROLE: Chief Executive Officer — final decision maker, strategic orchestrator.
RESPONSIBILITIES: Business strategy, launch decisions, cross-functional coordination, escalation handler.
STYLE: Direct, concise, data-driven. Think in systems, not tasks. Prioritize revenue-generating actions.

DECISION FRAMEWORK:
1. Diagnose the situation with data
2. Identify the bottleneck blocking progress
3. Find the highest-leverage action
4. Recommend 1-3 specific moves
5. End with ONE concrete next step

ESCALATION: You are the top — escalate to the human founder only for:
- Financial decisions over $100
- Legal/compliance unknowns
- Product direction changes

Use tools to gather data, analyze, and make recommendations. Be the calm, capable leader.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(CEOAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'opus',
      traceId,
      maxIterations: 5,
    });

    // Publish response
    await this.publish('CEO_RESPONSE', {
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });

    // If result suggests escalation to founder, send it
    if (result.text.toLowerCase().includes('founder') || result.text.toLowerCase().includes('escalat')) {
      await this.sendMessage(msg.source, 'escalation', {
        from: this.name,
        response: result.text,
        traceId,
      });
    }
  }

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];

    // CEO checks the meta-level: is the organization ready to serve users?
    if (ctx.killSwitch) {
      blockers.push('Kill switch is ON — halts everything');
    } else {
      passed.push('Kill switch disengaged');
    }

    if (ctx.systemStatus === 'online') {
      passed.push('System online');
    } else {
      warnings.push(`System status: ${ctx.systemStatus}`);
    }

    if (ctx.toolCount >= 50 && ctx.aiKeysConfigured && ctx.semanticRouterActive) {
      passed.push('Core AI engine operational');
    } else {
      blockers.push('Core AI engine not fully operational');
    }

    if (ctx.whatsappConnectorConfigured && ctx.workspaceMcpConfigured) {
      passed.push('User-facing channels (WhatsApp + Workspace) ready');
    } else {
      blockers.push('User-facing channels not ready');
    }

    if (ctx.draftFirstEnforced) {
      passed.push('Safety: draft-first enforced');
    } else {
      blockers.push('Draft-first not enforced — safety risk');
    }

    if (ctx.campaignProfileCount >= 10) {
      passed.push('Campaign: 10 target users identified');
    } else {
      warnings.push(`Campaign: only ${ctx.campaignProfileCount} profiles`);
    }

    const vote = blockers.length > 0 ? 'no-go' as const : warnings.length > 0 ? 'conditional' as const : 'go' as const;
    const confidence = blockers.length === 0 ? (warnings.length === 0 ? 95 : 82) : 15;

    return {
      agent: this.name,
      role: 'CEO',
      vote,
      confidence,
      blockers,
      warnings,
      passed,
      summary: vote === 'go'
        ? 'CEO assessment: All systems go. Team ready, product solid, users identified. LAUNCH.'
        : vote === 'conditional'
          ? `CEO assessment: Conditionally ready. ${warnings.join('; ')}. Can proceed with awareness.`
          : `CEO assessment: NOT READY. ${blockers.join('; ')}. Fix blockers first.`,
    };
  }

  /**
   * THE FINAL CALL — CEO collects all reviews and makes the launch decision.
   *
   * This is the only method that produces a LaunchDecision.
   * Every other agent produces LaunchReview. Only CEO decides.
   */
  makeLaunchDecision(ctx: LaunchContext, reviews: LaunchReview[]): LaunchDecision {
    const now = new Date().toISOString();

    // Add CEO's own review
    const ceoReview = this.reviewLaunchReadiness(ctx);
    const allReviews = [...reviews, ceoReview];

    // Tally votes
    const tally = (vote: LaunchVote) => allReviews.filter(r => r.vote === vote).length;
    const totalGo = tally('go');
    const totalNoGo = tally('no-go');
    const totalConditional = tally('conditional');

    // Collect all blockers across all reviews
    const allBlockers = allReviews.flatMap(r => r.blockers.map(b => `[${r.role}] ${b}`));

    // Decision logic
    let approved: boolean;
    let summary: string;

    if (ctx.killSwitch) {
      approved = false;
      summary = 'BLOCKED: Kill switch is ON. Disengage before launch.';
    } else if (totalNoGo > 0) {
      approved = false;
      const noGoAgents = allReviews.filter(r => r.vote === 'no-go').map(r => r.role);
      summary = `BLOCKED by ${noGoAgents.join(', ')}. ${allBlockers.length} blocker(s) must be resolved.\n\nBlockers:\n${allBlockers.map(b => `  • ${b}`).join('\n')}`;
    } else if (totalGo >= 6) {
      // Strong consensus — launch
      approved = true;
      summary = `APPROVED. ${totalGo} GO votes, ${totalConditional} conditional. Team consensus: ship it.\n\nAvg confidence: ${Math.round(allReviews.reduce((s, r) => s + r.confidence, 0) / allReviews.length)}%`;
    } else if (totalGo + totalConditional >= 8 && totalConditional <= 4) {
      // Majority positive — CEO approves with conditions
      approved = true;
      const conditions = allReviews
        .filter(r => r.vote === 'conditional')
        .flatMap(r => r.warnings.map(w => `[${r.role}] ${w}`));
      summary = `APPROVED WITH CONDITIONS. ${totalGo} GO, ${totalConditional} conditional.\n\nConditions to address post-launch:\n${conditions.map(c => `  • ${c}`).join('\n')}`;
    } else {
      // Not enough confidence
      approved = false;
      summary = `NOT APPROVED. Only ${totalGo} GO votes out of ${allReviews.length}. Need stronger consensus.`;
    }

    // Log the decision
    this.memory.logDecision(
      'launch-first-10-users',
      ['approve', 'block', 'conditional'],
      approved ? 'approve' : 'block',
      summary,
    );

    return {
      approved,
      decidedBy: this.name,
      timestamp: now,
      reviews: allReviews,
      totalGo,
      totalNoGo,
      totalConditional,
      blockers: allBlockers,
      summary,
    };
  }
}
