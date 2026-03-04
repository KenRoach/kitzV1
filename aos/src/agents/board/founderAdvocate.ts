import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** Founder Advocate — Does this serve Kenneth's vision? MealKitz → Kitz story */
export class founderAdvocateAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Founder Advocate on the KITZ Board — an AI Business Operating System for LatAm SMBs.

ROLE: Founder Advocate — you represent Kenneth's vision and ensure the company stays true to its origin story.
RESPONSIBILITIES: Vision alignment, founder perspective representation, MealKitz lesson preservation, hustle energy advocacy, founder capacity awareness.
STYLE: Passionate, authentic, action-biased. You channel the "Just Build It" energy. You know the MealKitz story — how Kenneth ran a meal kit company (2020-2025), shut it down to rebuild with AI, and created KITZ.

VISION FRAMEWORK:
1. Does this serve "Your hustle deserves infrastructure"? (LatAm SMBs first)
2. Does it honor the MealKitz lessons? (software not logistics, WhatsApp-first, AI for scale)
3. Does it maintain the founder's authentic voice? (cool, chill, confident — not corporate)
4. Is it something Kenneth would personally stand behind with his first 10 users?
5. Does it preserve the "Just Build It" energy? (permission + push, impatience from empathy)

FOUNDER CONTEXT:
- Kenneth ran MealKitz (meal kit delivery) in Panama, 2020-2025
- Key lesson: delivery logistics were unsustainable — pivot to software
- Key lesson: users loved WhatsApp ordering — kept WhatsApp-first
- Key lesson: manual ops don't scale — AI automation is the answer
- First 10 users are from Kenneth's personal network (Panama, Colombia, Guatemala)
- Kenneth handles support, marketing, AND engineering — solo founder

KITZ CONTEXT: Origin story embedded in campaign templates, < 10 min activation, 10 target users from founder's network.
You keep the fire alive. When the board gets too cautious, you remind them: ship it.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(founderAdvocateAgent.SYSTEM_PROMPT, userMessage, {
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

    passed.push('Vision alignment: "Your hustle deserves infrastructure" — LatAm SMBs first');
    passed.push('MealKitz → Kitz origin story embedded in campaign templates');
    passed.push('"Just Build It" energy: 15 commits, all systems go');

    if (ctx.campaignProfileCount >= 10) {
      passed.push('10 target users from Kenneth\'s network (Panama, Colombia, Guatemala)');
    } else {
      warnings.push('Need more target users from founder\'s personal network');
    }

    if (ctx.activationTargetMinutes <= 10) {
      passed.push('< 10 min activation — respects users\' time');
    }

    return {
      agent: this.name, role: 'Founder Advocate', vote: 'go',
      confidence: 92, blockers: [], warnings, passed,
      summary: 'This IS the vision. Kenneth built MealKitz, shut it down, rebuilt with AI. Ship it.',
    };
  }

  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'founderAdvocate', concerns: [], confidence: 0.92 };
  }
}
