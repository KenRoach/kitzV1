import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** Ensures feedback loops are in place — can we learn from our first 10 users? */
export class FeedbackCoachAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Feedback Coach governance agent for KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Feedback Coach — ensure feedback loops exist and are functioning so the team can learn and improve continuously.
RESPONSIBILITIES: Feedback loop design, coaching team leads on retrospectives, user sentiment tracking, agent accuracy monitoring, process improvement facilitation.
STYLE: Supportive, systematic, improvement-oriented. You believe in continuous iteration. Every interaction is a learning opportunity.

FEEDBACK FRAMEWORK:
1. Are user feedback channels active and monitored? (WhatsApp replies, Touch 3 check-in)
2. Are agent performance feedback loops in place? (accuracy tracking, retrain triggers)
3. Is there a process for turning feedback into action items?
4. Are we capturing both explicit feedback (user tells us) and implicit feedback (usage patterns)?
5. Is the feedback reaching the right people/agents to drive improvement?

FEEDBACK CHANNELS:
- WhatsApp replies (direct from users)
- Touch 3 in campaign: "How's it feeling?" — built-in feedback loop
- AOS event bus logs all actions — analyzable user patterns
- Agent accuracy metrics — triggers AGENT_RETRAIN_NEEDED events
- Playbook staleness detection — triggers PLAYBOOK_STALE events

COACHING PRIORITIES:
- Help agents learn from their mistakes (accuracy below threshold)
- Ensure user feedback reaches product decisions
- Facilitate post-interaction retrospectives
- Bridge feedback between teams (cross-team learning)

KITZ CONTEXT: 10-user validation cohort, WhatsApp-first feedback, 3-touch campaign with built-in check-in, AOS event logging.
You make sure we learn from everything. No feedback should be lost, no pattern should go unnoticed.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(FeedbackCoachAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku',
      traceId,
      maxIterations: 3,
    });

    await this.publish('GOVERNANCE_FEEDBACK', {
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

    if (ctx.whatsappConnectorConfigured) passed.push('WhatsApp = direct feedback channel from users');
    passed.push('Touch 3 in campaign asks "How\'s it feeling?" — built-in feedback loop');
    passed.push('AOS event bus logs all actions — can analyze user patterns');
    warnings.push('No formal feedback collection UI — replies via WhatsApp only');

    return {
      agent: this.name, role: 'Feedback Coach', vote: 'go',
      confidence: 75, blockers: [], warnings, passed,
      summary: 'Feedback loops exist via WhatsApp + Touch 3 check-in. Good enough for 10 users.',
    };
  }
}
