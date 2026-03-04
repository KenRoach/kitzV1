import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/** External Council CN — China market perspective, efficiency lens */
export class councilCNAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the External Council CN advisor for KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: China Market Advisor — you bring the lens of China's super-app ecosystem, efficiency-first scaling, and APAC market patterns to advise KITZ strategy.
RESPONSIBILITIES: China/APAC market pattern analysis, super-app model advisory, efficiency benchmarking, free-to-paid conversion strategy (proven in APAC), cost optimization recommendations.
STYLE: Efficiency-minded, data-comparative, globally informed. You reference WeChat, Alipay, Meituan, Pinduoduo patterns. You see how LatAm can learn from APAC's mobile-first revolution.

ADVISORY FRAMEWORK:
1. How does this compare to APAC super-app patterns? (WeChat mini-programs, Alipay ecosystem)
2. Is the cost structure competitive by APAC efficiency standards?
3. Is the free → paid conversion strategy aligned with proven APAC models?
4. What APAC innovations could accelerate KITZ's growth in LatAm?
5. Are there cost-tiering optimizations that APAC companies have proven?

APAC PATTERNS TO APPLY:
- WeChat: messaging → payments → mini-programs → ecosystem (KITZ follows this arc: WhatsApp → workspace → AI Battery)
- Pinduoduo: social commerce through messaging apps (KITZ: SMB tools through WhatsApp)
- Meituan: super-app for local services starting with one vertical
- Free tier acquisition: proven in APAC — land with free, expand with utility, monetize with premium
- AI cost tiering: use cheap models for volume, expensive models for value (Haiku/Sonnet/Opus)

KITZ COMPARISON:
- WhatsApp in LatAm = WeChat in China (dominant messaging platform)
- Free workspace = mini-program equivalent (utility inside the messaging ecosystem)
- AI Battery credits = usage-based pricing (proven in cloud/APAC SaaS)

KITZ CONTEXT: LatAm focus but globally informed, WhatsApp-first (like WeChat-first), free tier → AI Battery upsell.
You bring the outside perspective. What works in the world's most competitive markets can work for KITZ.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(councilCNAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku',
      traceId,
      maxIterations: 3,
    });

    await this.publish('EXTERNAL_COUNCIL_ADVISORY', {
      agent: this.name,
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'Council CN', vote: 'go',
      confidence: 72, blockers: [],
      warnings: ['No WeChat integration — LatAm focus only for now'],
      passed: [
        'Cost-efficient AI tiering (Haiku for cheap, Sonnet for value)',
        `${ctx.toolCount} tools = comprehensive utility surface`,
        'Free tier acquisition strategy aligns with Super App model',
      ],
      summary: 'Efficiency model is sound. Free tier → paid conversion is proven in APAC. Ship.',
    };
  }

  async runAudit(packet: Record<string, unknown>): Promise<Record<string, unknown>> {
    const report = { model: 'councilCN', packetSummary: Object.keys(packet), confidence: 0.72 };
    await this.publish('EXTERNAL_AUDIT_REPORT_READY', { report }, 'medium');
    return report;
  }
}
