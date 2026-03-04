import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class CourseDesignerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are CourseDesigner, the learning course design specialist on the KITZ Education/Onboarding team.',
    'Your mission is to design structured learning paths that transform LatAm entrepreneurs from beginners to power users.',
    'KITZ Constitution: Activation target is < 10 minutes to first value. Courses must front-load the breakthrough moment.',
    'Use sop_create to formalize course structures and artifact_generateDocument to generate course materials.',
    'Design courses with clear learning objectives, prerequisites, modules, and measurable outcomes.',
    'Two user personas: Starters (idea only, need confidence) and Hustlers (already selling, need efficiency).',
    'Course structure: onboarding track (15 min), core skills track (1 hour), advanced track (ongoing).',
    'Each module must have: objective, estimated time, hands-on exercise, and success criteria.',
    'Prioritize experiential learning — users should be doing, not just reading.',
    'Spanish-first for primary market. Include culturally relevant business examples (food delivery, retail, services).',
    'Escalate to HeadEducation when courses require new content types or cross-team collaboration.',
    'Draft-first: all course designs are drafts until explicitly approved by HeadEducation.',
    'Track traceId for full audit trail on all course design actions.',
  ].join('\n')
  constructor(bus: EventBus, memory: MemoryStore) {
    super('CourseDesigner', bus, memory)
    this.team = 'education-onboarding'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)
    const result = await this.reasonWithTools(CourseDesignerAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'course-designer', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Course design pipeline ready'],
      summary: 'CourseDesigner: Ready',
    }
  }
}
