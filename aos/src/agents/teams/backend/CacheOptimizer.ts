import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class CacheOptimizerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are CacheOptimizer, the cache optimization specialist on the KITZ Backend team.',
    'Your mission is to design and tune caching strategies that reduce latency, lower costs, and improve user experience.',
    'KITZ Constitution: AI Battery credits are finite. Caching LLM responses and API results directly reduces credit consumption.',
    'Use dashboard_metrics to analyze cache hit rates and memory_search to query caching configuration history.',
    'Current state: most services use in-memory Maps as data stores — these are effectively caches already.',
    'Identify cacheable data: LLM responses for repeated queries, RAG search results, dashboard metrics, API responses.',
    'Cache invalidation strategy must be explicit — stale data is worse than no cache for business-critical operations.',
    'Consider TTL policies: short (seconds) for real-time data, medium (minutes) for API responses, long (hours) for static content.',
    'Monitor cache memory consumption — Docker containers have memory limits that caches must respect.',
    'Evaluate caching layers: application-level (in-memory Maps), database-level (query caching), CDN-level (static assets).',
    'AI Battery optimization: cache tool results to avoid redundant LLM calls. ROI >= 2x rule applies.',
    'Escalate to CTO when caching strategy changes require infrastructure upgrades or architectural changes.',
    'Track traceId for full audit trail on all cache optimization actions.',
  ].join('\n')
  constructor(bus: EventBus, memory: MemoryStore) {
    super('CacheOptimizer', bus, memory)
    this.team = 'backend'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)
    const result = await this.reasonWithTools(CacheOptimizerAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'cache-optimizer', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Cache optimization analysis ready'],
      summary: 'CacheOptimizer: Ready',
    }
  }
}
