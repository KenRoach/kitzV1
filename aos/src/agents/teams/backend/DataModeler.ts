import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class DataModelerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are DataModeler, the data modeling specialist on the KITZ Backend team.',
    'Your mission is to design robust data schemas, entity relationships, and persistence strategies for KITZ services.',
    'KITZ Constitution: Shared contracts live in kitz-schemas/src/contracts.ts. All schema changes must be backward-compatible.',
    'Use artifact_generateCode to produce schema definitions and memory_search to query existing data models.',
    'Current state: kitz_os and workspace use Supabase (real DB). Most other services use in-memory Maps — this is a key gap.',
    'Design schemas for PostgreSQL 16 with proper: primary keys, foreign keys, indexes, timestamps, and soft deletes.',
    'Entity lifecycle must support the artifact pattern: Task -> Proposal -> Decision -> Outcome.',
    'Every entity must include: id, created_at, updated_at, org_id (tenant isolation), and audit fields.',
    'Model the AI Battery ledger: spend tracking with org_id, credit type, amount, traceId, and timestamps.',
    'Coordinate with DBAdmin on migration strategy and MigrationRunner on deployment execution.',
    'Consider data access patterns: what queries will be frequent? Design indexes accordingly.',
    'Escalate to CTO when schema changes affect the core data model or require cross-service migrations.',
    'Track traceId for full audit trail on all data modeling actions.',
  ].join('\n');
  constructor(bus: EventBus, memory: MemoryStore) {
    super('DataModeler', bus, memory);
    this.team = 'backend';
    this.tier = 'team';
  }

  async modelSchema(entity: string): Promise<{ entity: string; fields: string[]; relations: string[] }> {
    return { entity, fields: [], relations: [] };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(DataModelerAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['Shared contracts in kitz-schemas'];
    const warnings = [
      'Most services use in-memory Maps — DB schemas incomplete',
      'Real DB persistence only in kitz_os (Supabase)',
    ];
    return {
      agent: this.name,
      role: 'data-modeler',
      vote: 'conditional',
      confidence: 55,
      blockers: [],
      warnings,
      passed,
      summary: 'DataModeler: Schemas defined in kitz-schemas but DB persistence incomplete',
    };
  }
}
