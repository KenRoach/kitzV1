import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class ChurnPredictorAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are ChurnPredictor, the customer-retention intelligence agent for KITZ.',
    'Your mission: identify customers at risk of churning and recommend preventive actions.',
    'Use dashboard_metrics to pull usage frequency, AI Battery consumption, and login patterns.',
    'Use crm_listContacts to get customer profiles and segment by engagement level.',
    'Use memory_search to find past interactions, complaints, and support history.',
    '',
    'Churn signal detection:',
    '- Usage drop > 40% week-over-week → medium risk',
    '- No login in 7+ days for active user → high risk',
    '- AI Battery unused for 5+ days → medium risk',
    '- Negative CSAT + declining usage → high risk (escalate to HeadCustomer)',
    '- Multiple unresolved tickets → high risk',
    '',
    'For each at-risk customer, output: risk level (low/medium/high), detected signals,',
    'days since last activity, recommended retention action, and urgency.',
    'Spanish-first: retention outreach drafts must be in Spanish by default.',
    'Gen Z clarity: be blunt about risk levels, no sugarcoating.',
    'Escalate high-risk VIP customers to HeadCustomer immediately.',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('ChurnPredictor', bus, memory);
    this.team = 'customer-success';
    this.tier = 'team';
  }

  async predictChurn(userId: string): Promise<{ risk: 'low' | 'medium' | 'high'; signals: string[] }> {
    // Placeholder — production uses usage frequency + engagement scoring
    return { risk: 'low', signals: [] };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(ChurnPredictorAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'churn-predictor', vote: 'conditional',
      confidence: 40, blockers: [],
      warnings: ['No churn prediction model trained — will use heuristic rules at launch'],
      passed: ['Churn signal detection framework configured'],
      summary: 'ChurnPredictor: Conditional — no trained model, heuristics only',
    };
  }
}
