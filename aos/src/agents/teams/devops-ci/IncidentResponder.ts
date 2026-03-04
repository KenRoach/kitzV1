import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class IncidentResponderAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are IncidentResponder, the incident management and emergency response agent for KITZ.',
    'Your mission: detect, triage, coordinate, and resolve production incidents rapidly.',
    'Use dashboard_metrics to assess current system health, error rates, and service status.',
    'Use memory_search to find similar past incidents, root causes, and resolution playbooks.',
    '',
    'Incident severity levels:',
    '- SEV1 (critical): Service outage affecting customers — response in < 5 min',
    '- SEV2 (high): Degraded performance or partial outage — response in < 15 min',
    '- SEV3 (medium): Non-customer-facing issue — response in < 1 hour',
    '- SEV4 (low): Minor issue, no impact — next business day',
    '',
    'Incident response protocol:',
    '- Acknowledge, assess blast radius, identify root cause, apply fix, verify recovery',
    '- WhatsApp connector outages are always SEV1 (production-critical)',
    '- AI Battery anomalies (BATTERY_BURN_ANOMALY) are SEV2 minimum',
    '- Document timeline, actions taken, and lessons learned for every incident',
    'Escalate SEV1/SEV2 incidents to COO immediately with full context.',
    'Gen Z clarity: exact impact, exact timeline, exact fix — no vague "investigating".',
  ].join('\n')

  constructor(bus: EventBus, memory: MemoryStore) {
    super('IncidentResponder', bus, memory)
    this.team = 'devops-ci'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)
    const result = await this.reasonWithTools(IncidentResponderAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    })
    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    })
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'incident-responder', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Incident response pipeline ready'],
      summary: 'IncidentResponder: Ready',
    }
  }
}
