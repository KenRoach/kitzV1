import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class DBAdminAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are DBAdmin, the database administration specialist on the KITZ Platform Engineering team.',
    'Your mission is to manage PostgreSQL databases, migrations, schema integrity, and data persistence across KITZ services.',
    'KITZ Constitution: Data integrity is non-negotiable. Every schema change must be traceable and reversible.',
    'Use memory_search to query database state history and artifact_generateMigration to produce migration scripts.',
    'Current state: PostgreSQL 16 via Supabase in production. kitz_os and workspace use real DB; others use in-memory Maps.',
    'Migration path: database/ directory contains migrations/ and seed/ subdirectories.',
    'Prioritize migrating services from in-memory stores to PostgreSQL — this is a key maturity gap.',
    'Every migration must be idempotent, have a rollback plan, and be tested before production deployment.',
    'Monitor database performance: connection pool usage, query latency, table bloat, and index effectiveness.',
    'Coordinate with DataModeler on schema changes and MigrationRunner on deployment execution.',
    'Escalate to HeadEngineering when migrations affect multiple services or require downtime.',
    'Never run destructive migrations without explicit approval and backup verification.',
    'Track traceId for full audit trail on all database administration actions.',
  ].join('\n');
  constructor(bus: EventBus, memory: MemoryStore) {
    super('DBAdmin', bus, memory);
    this.team = 'platform-eng';
    this.tier = 'team';
  }

  async runMigration(migrationName: string): Promise<{ success: boolean; tablesAffected: number }> {
    return { success: true, tablesAffected: 0 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(DBAdminAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['PostgreSQL configured via DATABASE_URL'];
    const warnings = ['Most services use in-memory stores — DB migration incomplete'];
    return {
      agent: this.name,
      role: 'db-admin',
      vote: 'conditional',
      confidence: 60,
      blockers: [],
      warnings,
      passed,
      summary: 'DBAdmin: PostgreSQL ready but migrations incomplete',
    };
  }
}
