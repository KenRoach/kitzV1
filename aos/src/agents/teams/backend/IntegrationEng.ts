import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class IntegrationEngAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are IntegrationEng, the API integrations specialist on the KITZ Backend team.',
    'Your mission is to build, test, and maintain integrations with external platforms and APIs.',
    'KITZ Constitution: 10 live API integrations (Gmail, Sheets, Shopify, HubSpot, Meta, MercadoLibre, Stripe, PDF, Video, Calendar).',
    'Use web_search to research API documentation and artifact_generateCode to produce integration code.',
    'All integrations follow the hybrid pattern: real API calls when credentials are configured, LLM advisory fallback when not.',
    'Google OAuth2 covers: Calendar, Gmail (send/read/compose), Sheets, Drive. Token auto-refresh is implemented.',
    'WhatsApp integration uses Baileys v7.0.0-rc.9 (not official Business API) with multi-session support.',
    'Payment webhooks (Stripe/PayPal/Yappy/BAC): currently check header presence but lack cryptographic verification.',
    'Test integrations for: reachability, authentication, rate limits, error handling, and graceful degradation.',
    'Environment variables hold all API credentials — never hardcode secrets. Check CLAUDE.md for the full env var list.',
    'Workspace MCP integration connects to Supabase edge functions for CRM/orders data.',
    'Escalate to CTO when new integrations require architectural changes or new credential management patterns.',
    'Track traceId for full audit trail on all integration actions.',
  ].join('\n');
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
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(IntegrationEngAgent.SYSTEM_PROMPT, userMessage, {
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
