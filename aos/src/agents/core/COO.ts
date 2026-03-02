import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/**
 * COO Agent — Chief Operating Officer
 *
 * Owns: operational readiness, cadence engine, WhatsApp pipeline, workspace, process flow.
 * Launch gate: Can a user sign up, add data, and get AI responses end-to-end?
 */
export class COOAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the COO of KITZ — an AI Business Operating System.

ROLE: Chief Operating Officer — operational execution, process optimization, infrastructure health.
RESPONSIBILITIES: Pipeline health, cadence engine, WhatsApp flow, workspace reliability, SOP enforcement.
STYLE: Process-oriented, practical, reliability-focused. Zero tolerance for broken workflows.

OPERATIONAL PRIORITIES:
1. Can users sign up → add data → get AI responses end-to-end?
2. Are all channels (WhatsApp, Web, Email) operational?
3. Is the cadence engine running (daily 7am, weekly Mon 8am)?
4. Is draft-first enforced on all outbound?

Use dashboard tools for system health, calendar for scheduling, SOP tools for process docs.
When something is broken, diagnose root cause before recommending fixes.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(COOAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'sonnet',
      traceId,
    });

    await this.publish('COO_RESPONSE', {
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });

    // If operational issue detected, escalate to CEO
    if (result.text.toLowerCase().includes('critical') || result.text.toLowerCase().includes('outage')) {
      await this.escalate('Operational issue detected', { response: result.text, traceId });
    }
  }

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];

    if (!ctx.workspaceMcpConfigured) {
      blockers.push('Workspace MCP not configured — CRUD will fail');
    } else {
      passed.push('Workspace MCP configured for Supabase persistence');
    }

    if (!ctx.whatsappConnectorConfigured) {
      blockers.push('WhatsApp connector offline');
    } else {
      passed.push('WhatsApp connector online');
    }

    if (!ctx.cadenceEngineEnabled) {
      warnings.push('Cadence engine disabled — automated reports will not send');
    } else {
      passed.push('Cadence engine enabled (daily 7am, weekly Mon 8am)');
    }

    if (!ctx.draftFirstEnforced) {
      blockers.push('Draft-first not enforced — messages could send without approval');
    } else {
      passed.push('Draft-first enforced on all outbound channels');
    }

    const vote = blockers.length > 0 ? 'no-go' as const : warnings.length > 0 ? 'conditional' as const : 'go' as const;
    const confidence = blockers.length === 0 ? (warnings.length === 0 ? 90 : 80) : 25;

    return {
      agent: this.name, role: 'COO', vote, confidence, blockers, warnings, passed,
      summary: vote === 'go'
        ? 'Operations ready. Workspace, WhatsApp, cadence — all go.'
        : vote === 'conditional'
          ? `Ops mostly ready: ${warnings.join('; ')}`
          : `Operational blockers: ${blockers.join('; ')}`,
    };
  }
}
