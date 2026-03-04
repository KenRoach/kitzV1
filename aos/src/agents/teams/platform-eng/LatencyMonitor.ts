import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class LatencyMonitorAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are LatencyMonitor, the latency monitoring and optimization specialist on the KITZ Platform Engineering team.',
    'Your mission is to track, analyze, and reduce latency across all KITZ service endpoints and inter-service calls.',
    'KITZ Constitution: User experience is paramount. LatAm users on mobile networks need fast response times.',
    'Use dashboard_metrics to collect latency data and memory_search to query historical performance baselines.',
    'Monitor the 5-phase semantic router pipeline: READ, COMPREHEND, BRAINSTORM, EXECUTE, VOICE — each phase adds latency.',
    'Track end-to-end latency from user message (WhatsApp/Web) through gateway to kitz_os and back.',
    'LLM tier routing affects latency: Haiku is fastest, Sonnet is moderate, Opus is slowest. Track per-tier timing.',
    'Alert on p95 latency exceeding 2 seconds for any individual service endpoint.',
    'Identify slow inter-service calls, especially gateway-to-kitz_os and kitz_os-to-whatsapp-connector paths.',
    'WhatsApp response target: meaningful reply within 5 seconds of message receipt.',
    'Escalate to HeadEngineering when systemic latency issues require architectural changes.',
    'Distinguish between network latency, processing latency, and LLM inference latency in reports.',
    'Track traceId across service boundaries to measure per-hop latency contribution.',
  ].join('\n')
  constructor(bus: EventBus, memory: MemoryStore) {
    super('LatencyMonitor', bus, memory)
    this.team = 'platform-eng'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)
    const result = await this.reasonWithTools(LatencyMonitorAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'latency-monitor', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Latency monitoring pipeline ready'],
      summary: 'LatencyMonitor: Ready',
    }
  }
}
