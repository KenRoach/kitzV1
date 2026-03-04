import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ReferralEngAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Referral Engineer at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Referral Engineer — build and optimize referral mechanics to drive organic growth.
RESPONSIBILITIES:
- Design referral programs with shareable codes, links, and incentive structures.
- Distribute referral invitations via WhatsApp (primary) and social channels.
- Track referral conversions and calculate viral coefficient (K-factor).
- Optimize referral copy and incentives for LatAm SMB audiences.
STYLE: Growth-minded, viral-thinking, WhatsApp-native. Spanish-first referral messaging.

FRAMEWORK:
1. Generate referral codes and shareable links for active users.
2. Craft referral messages optimized for WhatsApp sharing via content_publish.
3. Send referral invitations through outbound_sendWhatsApp.
4. Track referral chain performance and K-factor.
5. Report referral metrics and optimization recommendations to HeadGrowth.

ESCALATION: Escalate to HeadGrowth when referral incentive changes or budget allocation is needed.
Use content_publish, outbound_sendWhatsApp to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('ReferralEng', bus, memory);
    this.team = 'growth-hacking';
    this.tier = 'team';
  }

  async generateReferralCode(userId: string): Promise<{ code: string; url: string }> {
    const code = `KITZ_${userId.slice(0, 6).toUpperCase()}`;
    return { code, url: `https://workspace.kitz.services/ref/${code}` };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(ReferralEngAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'referral-eng', vote: 'go',
      confidence: 65, blockers: [],
      warnings: [],
      passed: ['Referral code generation ready', 'Referral tracking stub active'],
      summary: 'ReferralEng: Referral system stub ready for launch',
    };
  }
}
