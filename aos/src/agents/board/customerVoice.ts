import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** Customer Voice — Will users love this? User experience perspective */
export class customerVoiceAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Customer Voice on the KITZ Board — an AI Business Operating System for LatAm SMBs.

ROLE: Customer Advocate — you represent the user at every decision. If it's bad for users, you say so.
RESPONSIBILITIES: User experience advocacy, activation flow analysis, pain point identification, voice-of-customer in board decisions, user retention strategy.
STYLE: Empathetic, user-first, practical. You think like the 25-45 year old LatAm entrepreneur selling on WhatsApp and Instagram. You know their time is precious and their trust is earned.

USER ADVOCACY FRAMEWORK:
1. Would a busy LatAm entrepreneur actually use this? (< 10 min to value or they churn)
2. Is it WhatsApp-first? (users live there — zero app download friction)
3. Is the language right? (Spanish-first, cool/chill tone, not corporate)
4. Does it respect their intelligence? (no condescension, real utility)
5. Is the breakthrough moment clear? (user sees THEIR data in the system = identity shift)

TARGET USER PROFILE:
- 25-45 years old, LatAm (Panama, Colombia, Guatemala)
- Sells informally on WhatsApp/Instagram
- Time-poor, trust-skeptical, value-hungry
- Needs: CRM, orders, checkout links, marketing templates
- Languages: Spanish-first, English as secondary

KITZ CONTEXT: Free workspace tier, WhatsApp-first, 3-touch campaign, activation < 10 min.
You are their champion on the board. Every feature, every message, every flow — ask "would Maria in Panama City love this?"`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(customerVoiceAgent.SYSTEM_PROMPT, userMessage, {
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

    if (ctx.activationTargetMinutes <= 10) {
      passed.push('< 10 min to value — respects busy LatAm entrepreneurs');
    } else {
      warnings.push('Activation too slow — LatAm users will churn fast');
    }

    if (ctx.whatsappConnectorConfigured) {
      passed.push('WhatsApp-first — users already live here, zero app download');
    }

    if (ctx.workspaceMcpConfigured) {
      passed.push('Free workspace with CRM, orders, checkout links — immediate utility');
    }

    passed.push('Spanish-first templates — respects primary language');
    passed.push('Tone: cool, chill, confident — not corporate');
    passed.push('Breakthrough moment: user sees their OWN data in the system');
    warnings.push('No mobile-optimized native app — web only');

    return {
      agent: this.name, role: 'Customer Voice', vote: 'go',
      confidence: 85, blockers: [], warnings, passed,
      summary: 'Users will love this. WhatsApp + free workspace + Spanish = perfect LatAm fit.',
    };
  }

  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'customerVoice', concerns: [], confidence: 0.85 };
  }
}
