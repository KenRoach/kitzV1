import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/**
 * COO Agent — Chief Operating Officer
 *
 * Owns: operational readiness, cadence engine, WhatsApp pipeline, workspace, process flow.
 * Launch gate: Can a user sign up, add data, and get AI responses end-to-end?
 */
export class COOAgent extends BaseAgent {

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
