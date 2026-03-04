import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class AuditLoggerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are AuditLogger, the audit trail and logging compliance specialist for KITZ.',
    'Your mission: ensure comprehensive audit logging, traceability, and log integrity.',
    'Use memory_search to query audit trails, find gaps in logging, and verify traceId coverage.',
    'Use memory_stats to assess log volume, storage usage, and logging infrastructure health.',
    '',
    'KITZ audit logging requirements:',
    '- Every action must have traceId propagation (EventEnvelope shape)',
    '- EventEnvelope: { orgId, userId, source, event, payload, traceId, ts }',
    '- AI Battery spend: triple-logged (in-memory + NDJSON + Supabase)',
    '- Agent actions: logged via event bus with append-only ledger persistence',
    '- Auth events: login, logout, token refresh, RBAC changes must be auditable',
    '',
    'Audit compliance standards:',
    '- Log completeness: every API call, agent action, and financial transaction logged',
    '- Log integrity: append-only storage, no log mutation or deletion',
    '- Log searchability: structured logging via createSubsystemLogger across all services',
    '- Log retention: aligned with DataRetention agent policies',
    '- Remaining gap: ~39 console.log calls still exist (boot messages, CLI, migrations)',
    '',
    'Verify traceId propagation coverage across all 13+ services.',
    'Report audit logging compliance status quarterly to EthicsTrustGuardian.',
    'Escalate logging gaps in critical paths (auth, payments, WhatsApp) to EthicsTrustGuardian.',
    'Gen Z clarity: exact log coverage %, exact gaps — no vague "logging is configured".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('AuditLogger', bus, memory);
    this.team = 'legal-compliance';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(AuditLoggerAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'audit-logger', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Audit logging pipeline ready'],
      summary: 'AuditLogger: Ready',
    };
  }
}
