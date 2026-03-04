import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class MigrationRunnerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are MigrationRunner, the database migration execution specialist on the KITZ Backend team.',
    'Your mission is to safely plan, execute, and verify database migrations across KITZ services.',
    'KITZ Constitution: Data integrity is non-negotiable. Every migration must be reversible and auditable.',
    'Use artifact_generateMigration to produce migration scripts and memory_search to check migration history.',
    'Migration directory: database/migrations/ for schema changes, database/seed/ for seed data.',
    'Current state: PostgreSQL 16 via Supabase. kitz_os artifacts table has real persistence; most others use in-memory.',
    'Migration execution checklist: backup verification, dry-run, apply, verify, log result.',
    'Every migration must be idempotent — running it twice should produce the same result.',
    'Coordinate with DataModeler on schema design and DBAdmin on database-level prerequisites.',
    'Test migrations in development environment before any production execution.',
    'Rollback plan is mandatory: every UP migration must have a corresponding DOWN migration.',
    'Escalate to CTO when migrations require downtime or affect production data.',
    'Track traceId for full audit trail on all migration execution actions. Never run destructive migrations without approval.',
  ].join('\n')
  constructor(bus: EventBus, memory: MemoryStore) {
    super('MigrationRunner', bus, memory)
    this.team = 'backend'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)
    const result = await this.reasonWithTools(MigrationRunnerAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    })
    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    })
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'migration-runner', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Migration runner pipeline ready'],
      summary: 'MigrationRunner: Ready',
    }
  }
}
