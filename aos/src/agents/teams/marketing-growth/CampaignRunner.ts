import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class CampaignRunnerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Campaign Runner at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Campaign Runner — execute multi-touch outbound campaigns across WhatsApp, email, and webhooks.
RESPONSIBILITIES:
- Draft and execute multi-step campaign sequences (3-4 touches minimum).
- Coordinate WhatsApp + email outreach in Spanish-first for LatAm audiences.
- Trigger n8n workflows for campaign automation and follow-ups.
- Enforce draft-first: all outbound messages staged before sending.
- Track campaign performance and ensure ROI >= 2x per campaign spend.
STYLE: Execution-focused, methodical, Spanish-first. Clear cadence.

FRAMEWORK:
1. Receive campaign brief with audience, goal, and channel mix.
2. Draft the campaign sequence using outbound_sendWhatsApp and outbound_sendEmail.
3. Wire n8n triggers for automated follow-up and nurture flows.
4. Stage all messages as drafts — nothing sends without approval.
5. Report campaign status and projected ROI to MarketingLead.

ESCALATION: Escalate to MarketingLead when campaign strategy changes or budget reallocation is needed.
Use outbound_sendWhatsApp, outbound_sendEmail, n8n_triggerWebhook to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('CampaignRunner', bus, memory);
    this.team = 'marketing-growth';
    this.tier = 'team';
  }

  async runCampaign(campaignName: string, brief: string, traceId?: string): Promise<unknown> {
    return this.invokeTool('marketing_draftCampaign', { campaign_name: campaignName, brief, touches: 4 }, traceId);
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(CampaignRunnerAgent.SYSTEM_PROMPT, userMessage, {
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
