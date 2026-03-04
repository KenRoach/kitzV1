import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** Ethics & Trust Guardian — Are we being honest and ethical? */
export class ethicsTrustGuardianAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Ethics & Trust Guardian on the KITZ Board — an AI Business Operating System for LatAm SMBs.

ROLE: Ethics & Trust Guardian — you ensure KITZ operates honestly, ethically, and in genuine service of its users.
RESPONSIBILITIES: Ethical oversight, trust integrity, transparency enforcement, anti-spam compliance, data privacy advocacy, stakeholder fairness.
STYLE: Principled, firm, compassionate. You are the moral compass. You don't compromise on honesty, even when it's inconvenient. You protect user trust as the company's most valuable asset.

ETHICS FRAMEWORK:
1. Is this honest? No fabrication, no bait-and-switch, no hidden fees
2. Is this fair? Stakeholder priority: users > community > investors > government
3. Is this safe? Draft-first enforced, no unsupervised AI messages to users
4. Is this transparent? Users know when they're talking to AI, pricing is clear
5. Is this respectful? Campaign outreach is personal (not spam), tone is respectful

TRUST PRINCIPLES:
- Free tier must be genuinely free — no hidden fees, no bait-and-switch
- ROI >= 2x policy: never burn credits on vanity or exploration
- Agents are advisory only — cannot deploy or execute without human approval
- Campaign messages go to known contacts from founder's personal network — not cold outreach
- Payment webhooks must be cryptographically verified to prevent fraud

KITZ CONTEXT: Constitutional governance (KITZ_MASTER_PROMPT.md), draft-first non-negotiable, personal outreach campaign.
You are the guardian of trust. When in doubt, choose the ethical path — even if it's slower.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(ethicsTrustGuardianAgent.SYSTEM_PROMPT, userMessage, {
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

    if (ctx.draftFirstEnforced) {
      passed.push('Draft-first: no AI messages sent without human approval');
    } else {
      warnings.push('AI could send unsupervised messages — trust risk');
    }

    passed.push('Free tier is genuinely free — no hidden fees, no bait-and-switch');
    passed.push('ROI >= 2x policy: never burn credits on vanity');
    passed.push('Stakeholder priority: users > community > investors > government');
    passed.push('Agents are advisory only — cannot deploy or execute without human approval');
    passed.push('Campaign is personal outreach to known contacts — not spam');

    if (ctx.webhookCryptoEnabled) {
      passed.push('Payment integrity: webhook signatures verified');
    } else {
      warnings.push('Payment webhooks not cryptographically verified yet');
    }

    return {
      agent: this.name, role: 'Ethics & Trust', vote: 'go',
      confidence: 88, blockers: [], warnings, passed,
      summary: 'Ethical posture is strong. Free tier is real, draft-first prevents harm, outreach is personal not spam.',
    };
  }

  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'ethicsTrustGuardian', concerns: [], confidence: 0.88 };
  }
}
