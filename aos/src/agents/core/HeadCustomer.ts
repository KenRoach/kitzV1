import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/**
 * HeadCustomer Agent — Customer Success & Support
 *
 * Owns: user support readiness, error handling, help system, onboarding UX.
 * Launch gate: Can users get help? Are errors handled gracefully?
 */
export class HeadCustomerAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Head of Customer Success at KITZ — an AI Business Operating System.

ROLE: Head of Customer Success — support, onboarding UX, user satisfaction.
RESPONSIBILITIES: Help system, error handling, user onboarding, satisfaction tracking, escalation routing.
STYLE: Empathetic, solution-oriented. Every user problem is a product improvement opportunity.

SUPPORT PRIORITIES:
1. Can users get help in natural language?
2. Are errors handled with friendly messages?
3. Is onboarding smooth (< 10 min to value)?
4. Are escalation paths clear?

Use CRM tools to check user history, SOP tools for support procedures, web tools for knowledge base.
When a user is stuck, provide a concrete next step — never leave them hanging.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(HeadCustomerAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku',
      traceId,
    });

    await this.publish('HEAD_CUSTOMER_RESPONSE', {
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });

    // Escalate unresolved issues to COO
    if (result.text.toLowerCase().includes('cannot resolve') || result.text.toLowerCase().includes('system issue')) {
      await this.escalate('Unresolved customer issue', { response: result.text, traceId });
    }
  }

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];

    // Help system must be accessible
    if (ctx.semanticRouterActive) {
      passed.push('AI help via natural language active');
    } else {
      blockers.push('No AI — users cannot ask questions in natural language');
    }

    // WhatsApp is the support channel
    if (ctx.whatsappConnectorConfigured) {
      passed.push('WhatsApp support channel configured');
    } else {
      blockers.push('WhatsApp support channel offline');
    }

    // Workspace must work for basic CRM/order tasks
    if (ctx.workspaceMcpConfigured) {
      passed.push('Workspace operational — users can self-serve CRM, orders, tasks');
    } else {
      blockers.push('Workspace offline — no self-service capability');
    }

    passed.push('Help command returns full menu of capabilities');
    passed.push('Error fallback: "Something went wrong. Try again or type help."');
    warnings.push('No dedicated support queue yet — founder handles all escalations');

    const vote = blockers.length > 0 ? 'no-go' as const : warnings.length > 0 ? 'conditional' as const : 'go' as const;
    const confidence = blockers.length === 0 ? (warnings.length === 0 ? 82 : 70) : 20;

    return {
      agent: this.name, role: 'HeadCustomer', vote, confidence, blockers, warnings, passed,
      summary: vote === 'go'
        ? 'Customer support ready. Help system active, WhatsApp channel live.'
        : vote === 'conditional'
          ? `Support mostly ready: ${warnings.join('; ')}`
          : `Support blockers: ${blockers.join('; ')}`,
    };
  }
}
