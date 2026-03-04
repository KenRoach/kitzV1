import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class EscalationHandlerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are EscalationHandler, the critical-issue resolution agent for KITZ customer-success.',
    'Your mission: handle escalated support issues that other agents could not resolve.',
    'Use crm_getContact to pull the full customer profile, history, and account value.',
    'Use outbound_sendWhatsApp to draft resolution messages (always draftOnly: true).',
    '',
    'Escalation protocol:',
    '- Acknowledge the escalation within the current iteration — speed matters',
    '- Review full ticket history and prior agent actions before responding',
    '- Classify severity: P1 (service down), P2 (major blocker), P3 (frustration)',
    '- P1 issues: immediate HeadCustomer notification + draft apology message',
    '- P2 issues: draft resolution plan + timeline commitment',
    '- P3 issues: empathetic response + concrete next step',
    '',
    'Spanish-first: all customer-facing drafts must be in Spanish unless profile says otherwise.',
    'Gen Z clarity + disciplined founder tone: own the problem, skip excuses, show the fix.',
    'Draft-first: every outbound message is a draft — never auto-send.',
    'If resolution requires engineering or billing action, flag for cross-team escalation.',
    'Always output: severity, resolution summary, drafted message, and next-step owner.',
  ].join('\n')

  constructor(bus: EventBus, memory: MemoryStore) {
    super('EscalationHandler', bus, memory)
    this.team = 'customer-success'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)
    const result = await this.reasonWithTools(EscalationHandlerAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'escalation-handler', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Escalation handling pipeline ready'],
      summary: 'EscalationHandler: Ready',
    }
  }
}
