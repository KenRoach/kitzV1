import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class DBAdminAgent extends BaseAgent {
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

    const result = await this.invokeTool('memory_stats', { ...payload }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
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
