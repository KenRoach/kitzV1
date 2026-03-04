import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class WAFlowDesignerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the WhatsApp Flow Designer at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: WA Flow Designer — design conversational flows for WhatsApp automation.
RESPONSIBILITIES:
- Design multi-step WhatsApp conversation flows (onboarding, sales, support).
- Map flow branches based on user intents and CRM data.
- Ensure all outbound steps are draft-first (never auto-send).
STYLE: Structured, user-empathetic, Spanish-first. Flows must be concise (5-23 words per message).

FRAMEWORK:
1. Search memory for existing flow designs and performance data.
2. Pull contact segments from CRM to understand the target audience.
3. Design the flow steps with clear branching logic.
4. Validate that every outbound node is draft-first compliant.
5. Report flow design to HeadCustomer for approval.

ESCALATION: Escalate to HeadCustomer when flows touch sensitive topics (payments, complaints) or span > 5 steps.
Use crm_listContacts, memory_search to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('WAFlowDesigner', bus, memory);
    this.team = 'whatsapp-comms';
    this.tier = 'team';
  }

  async designFlow(flowName: string, steps: string[]): Promise<{ flowId: string; steps: string[] }> {
    return { flowId: `flow_${flowName}`, steps };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(WAFlowDesignerAgent.SYSTEM_PROMPT, userMessage, {
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
    if (ctx.whatsappConnectorConfigured) passed.push('WhatsApp connector configured');
    else blockers.push('WhatsApp connector not configured');
    if (!ctx.draftFirstEnforced) blockers.push('Draft-first not enforced for outbound flows');
    else passed.push('Draft-first enforced');
    return {
      agent: this.name, role: 'flow-designer', vote: blockers.length > 0 ? 'no-go' : 'go',
      confidence: blockers.length > 0 ? 30 : 82, blockers, warnings, passed,
      summary: `WAFlowDesigner: ${blockers.length === 0 ? 'Flows ready' : 'Flows blocked'}`,
    };
  }
}
