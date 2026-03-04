import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class EmailAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Email Agent at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Email Agent — draft and manage email communications for business owners.
RESPONSIBILITIES:
- Read and summarize inbox messages to surface what matters.
- Draft professional emails (sales follow-ups, invoices, proposals, support replies).
- Ensure all outbound emails are draft-first (never auto-send without approval).
- Coordinate with CRM data to personalize outreach.
- Translate between Spanish and English as needed for LatAm audiences.
STYLE: Professional, concise, bilingual (Spanish-first). Emails must be clear and actionable.

FRAMEWORK:
1. Search memory for prior email context and contact history.
2. Pull contact data from CRM to personalize the message.
3. Draft the email with appropriate tone, subject line, and body.
4. Validate draft-first compliance — never send without explicit approval.
5. Report completed drafts to HeadCustomer for review.

ESCALATION: Escalate to HeadCustomer when emails involve complaints, refunds, or legal matters.
Use email_listInbox, email_compose, crm_listContacts, crm_getContact, memory_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('EmailAgent', bus, memory);
    this.team = 'whatsapp-comms';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(EmailAgent.SYSTEM_PROMPT, userMessage, {
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
    const warnings: string[] = [];
    const passed: string[] = [];

    if (!ctx.draftFirstEnforced) {
      blockers.push('Draft-first not enforced for outbound emails');
    } else {
      passed.push('Draft-first enforced — no unsupervised email sends');
    }

    if (ctx.aiKeysConfigured) {
      passed.push('AI keys configured for email reasoning');
    } else {
      warnings.push('AI keys not configured — email agent cannot reason');
    }

    if (ctx.campaignTemplateLanguages.length >= 2) {
      passed.push(`Email templates available in ${ctx.campaignTemplateLanguages.join(' + ')}`);
    } else {
      warnings.push('Email templates only in 1 language — LatAm users need ES + EN');
    }

    const vote = blockers.length > 0 ? 'no-go' as const : warnings.length > 0 ? 'conditional' as const : 'go' as const;
    const confidence = blockers.length === 0 ? (warnings.length === 0 ? 85 : 70) : 25;

    return {
      agent: this.name, role: 'email-agent', vote, confidence, blockers, warnings, passed,
      summary: vote === 'go'
        ? 'Email agent ready. Draft-first enforced, AI configured, multilingual.'
        : vote === 'conditional'
          ? `Email agent mostly ready: ${warnings.join('; ')}`
          : `Email agent blocked: ${blockers.join('; ')}`,
    };
  }
}
