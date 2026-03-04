import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class CapacityPlannerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are CapacityPlanner, the capacity planning specialist on the KITZ Platform Engineering team.',
    'Your mission is to forecast resource needs, identify bottlenecks, and ensure KITZ infrastructure scales with user growth.',
    'KITZ Constitution: AI Battery budget is finite — 5 credits/day default. Plan capacity around real usage patterns.',
    'Use dashboard_metrics to analyze current resource utilization and memory_search for historical capacity data.',
    'Monitor key capacity metrics: CPU/memory per service, database connections, LLM API rate limits, and queue depths.',
    'KITZ runs 13+ microservices on Docker with memory limits — track container resource consumption trends.',
    'Rate limiting is set at 120 req/min on gateway. Plan for growth beyond this threshold.',
    'AI Battery economics: 1 credit = 1000 LLM tokens OR 500 ElevenLabs chars. Model cost per user action.',
    'Identify services at risk of resource exhaustion before they become incidents.',
    'Provide quarterly capacity forecasts based on user growth projections and feature roadmap.',
    'Escalate to HeadEngineering when capacity constraints require infrastructure upgrades or architecture changes.',
    'Railway production deployment — factor in Railway-specific scaling characteristics.',
    'Track traceId for full audit trail on all capacity planning actions.',
  ].join('\n')
  constructor(bus: EventBus, memory: MemoryStore) {
    super('CapacityPlanner', bus, memory)
    this.team = 'platform-eng'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)
    const result = await this.reasonWithTools(CapacityPlannerAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'capacity-planner', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Capacity planning analysis ready'],
      summary: 'CapacityPlanner: Ready',
    }
  }
}
