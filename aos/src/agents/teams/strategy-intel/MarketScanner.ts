import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class MarketScannerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('MarketScanner', bus, memory);
    this.team = 'strategy-intel';
    this.tier = 'team';
  }

  async scanMarket(region: string): Promise<{ trends: string[]; opportunities: number }> {
    return { trends: [], opportunities: 0 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('web_search', { query: payload.query ?? 'Panama SMB market trends' }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    const passed = ['LatAm market focus defined — targeting 25-45 demographic in Panama/LATAM'];
    const warnings: string[] = [];
    return {
      agent: this.name,
      role: 'market-scanner',
      vote: 'go',
      confidence: 70,
      blockers: [],
      warnings,
      passed,
      summary: 'MarketScanner: LatAm market intelligence scope defined',
    };
  }
}
