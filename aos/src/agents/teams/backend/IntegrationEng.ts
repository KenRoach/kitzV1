import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class IntegrationEngAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('IntegrationEng', bus, memory);
    this.team = 'backend';
    this.tier = 'team';
  }

  async testIntegration(provider: string): Promise<{ provider: string; reachable: boolean; latencyMs: number }> {
    return { provider, reachable: false, latencyMs: 0 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('web_scrape', { url: payload.url ?? 'https://kitz.services' }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];
    const blockers: string[] = [];
    if (ctx.aiKeysConfigured) {
      passed.push('AI provider API keys configured');
    } else {
      blockers.push('AI provider API keys not configured — integrations will fail');
    }
    if (ctx.whatsappConnectorConfigured) passed.push('WhatsApp connector integration active');
    else warnings.push('WhatsApp connector not configured');
    if (ctx.workspaceMcpConfigured) passed.push('Workspace MCP integration active');
    else warnings.push('Workspace MCP not configured');
    return {
      agent: this.name,
      role: 'integration-eng',
      vote: blockers.length > 0 ? 'no-go' : 'go',
      confidence: blockers.length > 0 ? 30 : 76,
      blockers,
      warnings,
      passed,
      summary: `IntegrationEng: ${passed.length} integrations active, ${blockers.length} blockers`,
    };
  }
}
