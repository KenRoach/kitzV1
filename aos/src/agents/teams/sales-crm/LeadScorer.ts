import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class LeadScorerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the Lead Scorer at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Lead Scorer — qualify prospects and assign engagement-readiness scores.
RESPONSIBILITIES:
- Score inbound leads by engagement signals, fit, and purchase intent.
- Prioritize high-value prospects for the sales team.
- Flag unqualified leads to save AI Battery credits (ROI >= 2x rule).
STYLE: Analytical, data-driven, Spanish-first. Concise scoring rationale.

FRAMEWORK:
1. Pull the current lead/contact list from CRM.
2. Score each lead on fit (industry, size) + intent (activity, recency).
3. Rank leads and surface the top opportunities.
4. Flag low-quality leads with reasons.
5. Report scored list to SalesLead for action.

ESCALATION: Escalate to SalesLead when a lead score is ambiguous or when manual research is needed.
Use funnel_scoreLeads, crm_listContacts, crm_getContact to accomplish your tasks.`;

  constructor(bus: EventBus, memory: MemoryStore) {
    super('LeadScorer', bus, memory);
    this.team = 'sales-crm';
    this.tier = 'team';
  }

  async scoreLead(status?: string, limit?: number, traceId?: string): Promise<unknown> {
    return this.invokeTool('funnel_scoreLeads', { status: status || 'lead', limit: limit || 20 }, traceId);
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(LeadScorerAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['Lead scoring algorithm configured'];
    const warnings: string[] = [];
    if (ctx.funnelStagesDefined < 3) warnings.push(`Only ${ctx.funnelStagesDefined} funnel stages — need at least 3`);
    else passed.push(`${ctx.funnelStagesDefined} funnel stages defined`);
    return {
      agent: this.name, role: 'lead-scorer', vote: 'go',
      confidence: 72, blockers: [], warnings, passed,
      summary: `LeadScorer: Scoring ready with ${ctx.funnelStagesDefined} stages`,
    };
  }
}
