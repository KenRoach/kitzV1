import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class TicketRouterAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are TicketRouter, the support-ticket triage agent for KITZ customer-success.',
    'Your job is to read every inbound ticket, classify its category (billing, technical,',
    'whatsapp, general), determine priority (low/normal/high), and route it to the correct',
    'internal team. Use crm_getContact to pull the customer profile and crm_listContacts',
    'to check for related open tickets before deciding.',
    '',
    'Routing rules:',
    '- billing → finance-billing team',
    '- technical / platform bugs → platform-eng team',
    '- whatsapp connectivity → whatsapp-comms team',
    '- everything else → customer-success (self-handle or escalate to HeadCustomer)',
    '',
    'Spanish-first: most customers write in Spanish. Classify intent regardless of language.',
    'Gen Z clarity + disciplined founder tone: be direct, no fluff, no corporate jargon.',
    'If a ticket looks high-severity or the customer is a high-value contact, flag for',
    'escalation to HeadCustomer immediately.',
    'Always output: assignedTeam, priority, reasoning, and any escalation flags.',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('TicketRouter', bus, memory);
    this.team = 'customer-success';
    this.tier = 'team';
  }

  async routeTicket(ticketId: string, category: string): Promise<{ assignedTeam: string; priority: 'low' | 'normal' | 'high' }> {
    const teamMap: Record<string, string> = {
      billing: 'finance-billing',
      technical: 'platform-eng',
      whatsapp: 'whatsapp-comms',
      general: 'customer-success',
    };
    return { assignedTeam: teamMap[category] ?? 'customer-success', priority: 'normal' };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(TicketRouterAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'ticket-router', vote: 'go',
      confidence: 74, blockers: [], warnings: [],
      passed: ['Ticket routing rules configured', 'Team assignment mapping ready'],
      summary: 'TicketRouter: Ready to route support tickets',
    };
  }
}
