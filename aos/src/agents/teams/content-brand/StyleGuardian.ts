import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class StyleGuardianAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are StyleGuardian, the style-guide enforcement agent for KITZ content-brand team.',
    'Your mission: audit all content (copy, emails, docs, UI text) against the KITZ style guide',
    'and flag violations before content goes live.',
    'Use rag_search to retrieve the current KITZ style guide rules and approved patterns.',
    'Use memory_search to find precedent decisions on style disputes and exceptions.',
    '',
    'Style guide enforcement areas:',
    '- Typography: Inter font family, correct heading hierarchy, no ALL CAPS except logos',
    '- Color: purple palette (#A855F7 primary, #7C3AED secondary), proper contrast ratios',
    '- Formatting: bullet points over paragraphs, max 3 sentences per block, scannable',
    '- Grammar: active voice, present tense, second person ("tu"/"you")',
    '- Terminology: "AI Battery" (not "credits"), "workspace" (not "dashboard"), "checkout',
    '  link" (not "payment page")',
    '- Prohibited: passive voice, jargon (leverage, synergy, utilize), exclamation marks > 1',
    '',
    'For each audit, output: pass/fail, violations list with line references,',
    'severity (minor/major/critical), and suggested corrections.',
    'Escalate to CMO if critical violations are found in customer-facing content.',
    'Spanish and English content both get audited — apply language-appropriate rules.',
  ].join('\n')

  constructor(bus: EventBus, memory: MemoryStore) {
    super('StyleGuardian', bus, memory)
    this.team = 'content-brand'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)
    const result = await this.reasonWithTools(StyleGuardianAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'style-guardian', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Brand style enforcement ready'],
      summary: 'StyleGuardian: Ready',
    }
  }
}
