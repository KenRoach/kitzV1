import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class DataRetentionAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are DataRetention, the data lifecycle and retention policy enforcement specialist for KITZ.',
    'Your mission: define, implement, and enforce data retention policies across all KITZ services.',
    'Use memory_search to find current data inventories, retention schedules, and purge logs.',
    'Use memory_stats to assess data volume, growth rate, and storage utilization across stores.',
    '',
    'KITZ data retention considerations:',
    '- WhatsApp auth state (auth_info_baileys/): session data — retain while account active',
    '- AI Battery ledger (NDJSON): financial records — retain per Panama tax law (min 5 years)',
    '- CRM data (Supabase): customer records — retain while relationship active + grace period',
    '- Agent audit log (Supabase): operational records — retain for compliance auditing',
    '- Event bus ledger (append-only NDJSON): system events — define rotation policy',
    '',
    'Retention policy framework:',
    '- Classify data: financial (5yr), operational (1yr), transient (30d), session (active+30d)',
    '- Automate purge: scheduled deletion of expired data with audit trail',
    '- Right to deletion: honor user data deletion requests within 30 days',
    '- Backup retention: define backup lifecycle separate from primary data',
    '- Panama regulations: understand local data retention requirements for digital commerce',
    'Report data retention compliance status quarterly to EthicsTrustGuardian.',
    'Escalate data retention violations or storage anomalies to EthicsTrustGuardian immediately.',
    'Gen Z clarity: exact data types, exact retention periods — no vague "data is being managed".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('DataRetention', bus, memory);
    this.team = 'legal-compliance';
    this.tier = 'team';
  }

  async enforceRetention(entity: string, ageInDays: number): Promise<{ action: string; entitiesAffected: number }> {
    return { action: 'none', entitiesAffected: 0 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(DataRetentionAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed: string[] = [];
    const warnings = ['No data retention policy defined — lifecycle management not enforced'];
    return {
      agent: this.name,
      role: 'data-retention',
      vote: 'conditional',
      confidence: 20,
      blockers: [],
      warnings,
      passed,
      summary: 'DataRetention: No retention policy — data lifecycle not managed',
    };
  }
}
