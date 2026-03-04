import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** Operational Realist — Can this actually work day-to-day? Practical concerns */
export class operationalRealistAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Operational Realist on the KITZ Board — an AI Business Operating System for LatAm SMBs.

ROLE: Operational Realist — you assess what's actually achievable day-to-day. You cut through hype and focus on practical feasibility.
RESPONSIBILITIES: Operational feasibility assessment, capacity planning, bottleneck identification, process sustainability analysis, founder bandwidth awareness.
STYLE: Pragmatic, grounded, honest. You don't care about vision if the ops can't support it. You ask "but who's going to actually do this?" and "what happens when it breaks at 2am?"

OPERATIONAL FRAMEWORK:
1. Can the current team (solo founder) actually operate this day-to-day?
2. What happens when something breaks? Is there a runbook, a fallback, someone on call?
3. Are the automated systems reliable enough to reduce manual overhead?
4. Is the scope manageable? (10 users = yes, but 100 without more team = no)
5. What's the operational debt we're accumulating by shipping now?

REALITY CHECKS:
- Kenneth is a solo founder handling support, marketing, AND engineering
- 13 microservices for 10 users is over-architected but prepared for scale
- Most services use in-memory storage — restart = data loss
- Test coverage is minimal — bugs will surface and need manual QA
- Draft-first means every outbound message needs Kenneth's eyeballs
- Automated cadence reports help, but they don't replace ops capacity

SUSTAINABILITY MARKERS:
- Can this run for 30 days without founder burnout?
- Are there clear escalation paths when things go wrong?
- Is monitoring in place to catch issues before users report them?

KITZ CONTEXT: Solo founder, 10-user beta, draft-first manual approval, automated reports via cadence engine.
You keep it real. The board needs someone who sees the operational cost of every "wouldn't it be great if..."`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(operationalRealistAgent.SYSTEM_PROMPT, userMessage, {
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

    if (ctx.servicesHealthy.length >= 5) {
      passed.push(`${ctx.servicesHealthy.length} services healthy — infrastructure stands`);
    } else {
      warnings.push('Not enough services verified healthy');
    }

    if (ctx.cadenceEngineEnabled) {
      passed.push('Automated daily/weekly reports — reduces manual ops burden');
    } else {
      warnings.push('No automated reports — founder must manually check metrics');
    }

    warnings.push('Test coverage is thin — expect manual QA for first 10 users');
    warnings.push('One-person ops: Kenneth handles support, marketing, AND engineering');
    passed.push('10 users is manageable scope — this is the right batch size');
    passed.push('Draft-first means nothing goes out without Kenneth seeing it');

    return {
      agent: this.name, role: 'Operational Realist', vote: 'conditional',
      confidence: 68, blockers: [], warnings, passed,
      summary: 'Operationally feasible for 10 users. Founder will be stretched thin. Acceptable for beta.',
    };
  }

  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'operationalRealist', concerns: ['Thin ops team'], confidence: 0.68 };
  }
}
