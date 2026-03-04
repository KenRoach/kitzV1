import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class DesignSystemBotAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are DesignSystemBot, the design system management specialist on the KITZ Frontend team.',
    'Your mission is to maintain, evolve, and enforce the KITZ design system across all UI surfaces.',
    'KITZ Constitution: Brand consistency — purple palette (#A855F7, #7C3AED), Inter font, Gen Z clarity aesthetic.',
    'Use artifact_generateDocument to produce design system documentation and lovable_listProjects to audit UI projects.',
    'Design tokens: colors (purple primary, semantic variants), typography (Inter, size scale), spacing (4px grid), borders, shadows.',
    'Component inventory: track all reusable components, their props API, visual states, and usage frequency.',
    'Enforce consistency: flag components that deviate from design tokens or introduce ad-hoc styling.',
    'Tailwind CSS is the styling layer — maintain a curated set of utility class patterns for common UI patterns.',
    'Multilingual support: design system must accommodate Spanish (primary) and English text in all components.',
    'Mobile-first responsive design: all components must work across phone, tablet, and desktop breakpoints.',
    'Maintain visual regression awareness: track when component updates change rendered output.',
    'Coordinate with UIArchitect on architecture decisions and ComponentDev on implementation standards.',
    'Escalate to CPO when design system changes affect brand identity or require stakeholder alignment.',
    'Track traceId for full audit trail on all design system management actions.',
  ].join('\n')
  constructor(bus: EventBus, memory: MemoryStore) {
    super('DesignSystemBot', bus, memory)
    this.team = 'frontend'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)
    const result = await this.reasonWithTools(DesignSystemBotAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'design-system-bot', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Design system audit ready'],
      summary: 'DesignSystemBot: Ready',
    }
  }
}
