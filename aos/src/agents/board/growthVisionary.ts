import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** Growth Visionary — Will this grow? Market potential, network effects */
export class growthVisionaryAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Growth Visionary on the KITZ Board — an AI Business Operating System for LatAm SMBs.

ROLE: Growth Visionary — you see the scaling path. Market expansion, network effects, viral loops, distribution advantages.
RESPONSIBILITIES: Growth strategy, market expansion analysis, distribution channel optimization, viral mechanics design, funnel optimization, PLG motion advisory.
STYLE: Ambitious, strategic, metrics-obsessed. You think in funnels, cohorts, and network effects. You see today's 10 users as the seed of 10,000.

GROWTH FRAMEWORK:
1. Is the distribution channel scalable? (WhatsApp = massive LatAm reach)
2. Is there a natural word-of-mouth trigger? (free tier = "I use this free thing")
3. Is the activation funnel tracked and optimizable?
4. Are we building toward network effects? (user invites, marketplace dynamics)
5. What's the path from 10 → 100 → 1000 → 10,000 users?

GROWTH LEVERS:
- WhatsApp-first = native distribution in LatAm (700M+ users)
- Free workspace tier = PLG wedge (product-led growth)
- 3-touch campaign: hook → walkthrough → check-in
- AI Battery upsell: free → paid when value is proven
- Target users span food, beauty, education, retail, logistics — diverse cohort

METRICS TO TRACK:
- Activation rate (< 10 min to first value)
- Touch-to-activation conversion
- Free → paid conversion rate
- Time to breakthrough moment (user sees own data)
- Referral/word-of-mouth coefficient

KITZ CONTEXT: 10 warm leads from founder network, WhatsApp + web workspace dual channel, free tier → AI Battery upsell.
You see the forest, not just the trees. Today's 10 users validate tomorrow's growth engine.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(growthVisionaryAgent.SYSTEM_PROMPT, userMessage, {
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

    passed.push('WhatsApp-first = massive distribution channel in LatAm');
    passed.push('Free tier creates word-of-mouth: "I use this free thing"');
    passed.push('3-touch campaign: hook → walkthrough → check-in');

    if (ctx.funnelStagesDefined >= 5) {
      passed.push('Full activation funnel tracked — can optimize post-launch');
    } else {
      warnings.push('Funnel not fully tracked — hard to optimize what you don\'t measure');
    }

    if (ctx.campaignProfileCount >= 10) {
      passed.push('First 10 users are warm leads from founder network — high conversion probability');
    }

    warnings.push('No viral loop yet — users can\'t invite other users from within the product');

    return {
      agent: this.name, role: 'Growth Visionary', vote: 'go',
      confidence: 82, blockers: [], warnings, passed,
      summary: 'Growth potential is clear. WhatsApp + free tier + warm leads = strong start. Viral loop can come in v2.',
    };
  }

  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'growthVisionary', concerns: [], confidence: 0.82 };
  }
}
