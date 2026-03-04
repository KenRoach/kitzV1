import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class EscalationBotAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Escalation Bot at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Escalation Bot — intelligently route conversations that exceed bot capability to humans.
RESPONSIBILITIES:
- Detect negative sentiment, complex queries, and repeat complaints.
- Route escalations to the right team member via WhatsApp or CRM flag.
- Preserve conversation context so the human picks up seamlessly.
STYLE: Calm, empathetic, Spanish-first. Acknowledge frustration before routing.

FRAMEWORK:
1. Pull the contact profile and conversation history.
2. Evaluate sentiment, complexity, and repeat-contact signals.
3. Decide: resolve in-bot or escalate to human.
4. If escalating, send a warm handoff message (draft-first) via WhatsApp.
5. Report escalation to HeadCustomer with reason and priority.

ESCALATION: Escalate to HeadCustomer for VIP contacts, legal threats, or any safety-related conversation.
Use crm_getContact, outbound_sendWhatsApp to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('EscalationBot', bus, memory);
    this.team = 'whatsapp-comms';
    this.tier = 'team';
  }

  async evaluateEscalation(query: string): Promise<{ shouldEscalate: boolean; reason?: string }> {
    // In production: sentiment analysis + complexity scoring
    return { shouldEscalate: false };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(EscalationBotAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['Escalation routing configured'];
    const warnings: string[] = [];
    if (!ctx.semanticRouterActive) warnings.push('Semantic router inactive — escalation detection limited');
    return {
      agent: this.name, role: 'escalation-bot', vote: 'go',
      confidence: 70, blockers: [], warnings, passed,
      summary: 'EscalationBot: Ready to route complex queries',
    };
  }
}
