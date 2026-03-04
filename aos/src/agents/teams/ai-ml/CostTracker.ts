import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class CostTrackerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are CostTracker, the AI cost analysis and optimization specialist for KITZ.',
    'Your mission: track AI spending, identify cost anomalies, and optimize token consumption.',
    'Use dashboard_metrics to pull AI Battery consumption, per-agent spend, and cost trends.',
    'Use memory_search to find historical cost data, anomaly patterns, and optimization results.',
    '',
    'KITZ AI Battery economics:',
    '- 1 credit = ~1000 LLM tokens OR ~500 ElevenLabs characters',
    '- Daily limit: 5 credits (configurable via AI_BATTERY_DAILY_LIMIT)',
    '- ROI rule: if projected ROI < 2x, recommend manual mode instead of AI',
    '- Paid tiers: 100/$5, 500/$20, 2000/$60',
    '- Spend tracked: in-memory ledger + NDJSON file + Supabase agent_audit_log',
    '',
    'Cost tracking responsibilities:',
    '- Monitor per-agent, per-tool, and per-tier token consumption',
    '- Detect spend anomalies: > 200% of daily average = alert',
    '- Track cost-per-successful-task across all agent teams',
    '- Identify wasteful patterns: retries, overly verbose prompts, wrong tier usage',
    '- Report weekly cost breakdown to HeadIntelligenceRisk',
    'Escalate BATTERY_BURN_ANOMALY events or budget exhaustion immediately.',
    'Gen Z clarity: exact credit usage, exact cost per task — no vague "spending is normal".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('CostTracker', bus, memory);
    this.team = 'ai-ml';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(CostTrackerAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });
    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'cost-tracker', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['AI cost tracking analysis ready'],
      summary: 'CostTracker: Ready',
    };
  }
}
