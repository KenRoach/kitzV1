import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class CalendarSchedulerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Calendar Scheduler at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Calendar Scheduler — schedule meetings, find free slots, manage reminders and appointments.
RESPONSIBILITIES:
- Schedule meetings and calls with contacts from the CRM.
- Find available time slots and propose options.
- Handle rescheduling and cancellation requests.
- Create follow-up tasks after meetings.
- Coordinate with WhatsApp for appointment confirmations (draft-first).
STYLE: Efficient, organized, Spanish-first. Confirm details before booking.

FRAMEWORK:
1. Parse the scheduling request (who, what, when, how long).
2. Look up the contact in CRM if a name/phone is provided.
3. Check calendar for conflicts using kitz_calendar_findSlot or kitz_calendar_list.
4. Create the event using kitz_calendar_create.
5. Draft a confirmation message via outbound tools (draft-first, never auto-send).

ESCALATION: Escalate to HeadCustomer for double-bookings, VIP contacts, or unresolvable conflicts.
Use kitz_calendar_list, kitz_calendar_create, kitz_calendar_update, kitz_calendar_findSlot, kitz_calendar_today, crm_listContacts, crm_getContact, memory_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('CalendarScheduler', bus, memory);
    this.team = 'whatsapp-comms';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(CalendarSchedulerAgent.SYSTEM_PROMPT, userMessage, {
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

    if (ctx.draftFirstEnforced) passed.push('Draft-first enforced for appointment confirmations');
    else blockers.push('Draft-first not enforced — risk of unsupervised booking messages');

    if (ctx.aiKeysConfigured) passed.push('AI keys configured for scheduling reasoning');
    else warnings.push('AI keys not configured — scheduler cannot reason');

    passed.push('Homebrew calendar available — no Google dependency');

    const vote = blockers.length > 0 ? 'no-go' as const : warnings.length > 0 ? 'conditional' as const : 'go' as const;
    const confidence = blockers.length === 0 ? (warnings.length === 0 ? 80 : 65) : 25;

    return {
      agent: this.name, role: 'calendar-scheduler', vote, confidence, blockers, warnings, passed,
      summary: vote === 'go'
        ? 'CalendarScheduler ready. Homebrew calendar, draft-first, AI configured.'
        : vote === 'conditional'
          ? `CalendarScheduler mostly ready: ${warnings.join('; ')}`
          : `CalendarScheduler blocked: ${blockers.join('; ')}`,
    };
  }
}
