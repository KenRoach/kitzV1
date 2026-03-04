import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class OutreachDrafterAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Outreach Drafter at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Outreach Drafter — craft compelling outbound messages (DRAFT-FIRST, never auto-send).
RESPONSIBILITIES:
- Draft personalized WhatsApp and email outreach for prospects.
- Pull contact context before writing (name, stage, history).
- Enforce draft-first: all messages are drafts until human-approved.
STYLE: Warm, direct, Spanish-first. Short messages (5-23 words for WhatsApp). Never pushy.

FRAMEWORK:
1. Look up the contact's profile and engagement history.
2. Determine the right channel (WhatsApp vs email) and tone.
3. Draft the message — personalized, concise, value-first.
4. Submit as DRAFT ONLY (draftOnly: true) — never send directly.
5. Report draft to SalesLead for review and approval.

ESCALATION: Escalate to SalesLead when unsure about messaging tone, compliance, or contact opt-out status.
Use outbound_sendWhatsApp, outbound_sendEmail, crm_getContact to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('OutreachDrafter', bus, memory);
    this.team = 'sales-crm';
    this.tier = 'team';
  }

  async draftOutreach(contactId: string, sequenceId?: string, traceId?: string): Promise<unknown> {
    return this.invokeTool('drip_enrollContact', {
      sequence_id: sequenceId || 'drip-welcome',
      contact_id: contactId,
    }, traceId);
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(OutreachDrafterAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const passed: string[] = [];
    if (ctx.draftFirstEnforced) passed.push('Draft-first enforced for all outreach');
    else blockers.push('Draft-first not enforced — outreach cannot send without approval');
    return {
      agent: this.name, role: 'outreach-drafter', vote: blockers.length > 0 ? 'no-go' : 'go',
      confidence: 80, blockers, warnings: [], passed,
      summary: 'OutreachDrafter: Draft-first outreach pipeline ready',
    };
  }
}
