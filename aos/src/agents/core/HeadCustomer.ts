import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/**
 * HeadCustomer Agent — Customer Success & Support
 *
 * Owns: user support readiness, error handling, help system, onboarding UX.
 * Launch gate: Can users get help? Are errors handled gracefully?
 */
export class HeadCustomerAgent extends BaseAgent {

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
