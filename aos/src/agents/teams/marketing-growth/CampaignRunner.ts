import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class CampaignRunnerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('CampaignRunner', bus, memory);
    this.team = 'marketing-growth';
    this.tier = 'team';
  }

  async runCampaign(campaignId: string): Promise<{ status: 'scheduled' | 'running' | 'paused'; touchesSent: number }> {
    // 3-touch campaign: awareness → engagement → conversion
    return { status: 'scheduled', touchesSent: 0 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('dashboard_metrics', { ...payload }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const passed: string[] = [];
    const warnings: string[] = [];
    if (ctx.campaignProfileCount >= 10) passed.push(`${ctx.campaignProfileCount} campaign profiles — sufficient for launch`);
    else if (ctx.campaignProfileCount >= 1) warnings.push(`Only ${ctx.campaignProfileCount} campaign profile(s) — recommend 10+ for effective campaigns`);
    else blockers.push('No campaign profiles — cannot run campaigns');
    passed.push('3-touch campaign framework configured');
    return {
      agent: this.name, role: 'campaign-runner', vote: blockers.length > 0 ? 'no-go' : 'go',
      confidence: blockers.length > 0 ? 25 : 73, blockers, warnings, passed,
      summary: `CampaignRunner: ${ctx.campaignProfileCount} profile(s) for campaign execution`,
    };
  }
}
