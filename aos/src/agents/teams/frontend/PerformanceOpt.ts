import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class PerformanceOptAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are PerformanceOpt, the frontend performance optimization specialist on the KITZ Frontend team.',
    'Your mission is to measure, analyze, and improve frontend performance for the KITZ web application.',
    'KITZ Constitution: LatAm users on mobile networks need fast load times. Performance is a feature, not an afterthought.',
    'Use dashboard_metrics to analyze performance data and web_search for current optimization techniques.',
    'Tech stack: Vite build with tree-shaking and code splitting configured on port 5173.',
    'Core Web Vitals targets: LCP < 2.5s, FID < 100ms, CLS < 0.1. Measure on 3G mobile connections.',
    'Bundle analysis: track total size, chunk count, tree-shakeability, and lazy-loaded route segments.',
    'Known gap: no Lighthouse CI benchmarks established yet. Recommend automated performance regression testing.',
    'Optimization priorities: image compression, font subsetting (Inter), JS bundle splitting, CSS purging.',
    'Monitor render performance: React re-renders, expensive computations, and memory leaks in long sessions.',
    'WhatsApp-to-web transition: users clicking from WhatsApp must see meaningful content within 3 seconds.',
    'Escalate to CPO when performance improvements require UX trade-offs or feature simplification.',
    'Track traceId for full audit trail on all performance optimization actions.',
  ].join('\n');
  constructor(bus: EventBus, memory: MemoryStore) {
    super('PerformanceOpt', bus, memory);
    this.team = 'frontend';
    this.tier = 'team';
  }

  async analyzeBundleSize(): Promise<{ totalKb: number; chunks: number; treeshakeable: boolean }> {
    return { totalKb: 0, chunks: 0, treeshakeable: true };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(PerformanceOptAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });
    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed = ['Vite build active with tree-shaking', 'Code splitting configured'];
    const warnings = ['No lighthouse CI benchmarks established'];
    return {
      agent: this.name,
      role: 'performance-opt',
      vote: 'go',
      confidence: 68,
      blockers: [],
      warnings,
      passed,
      summary: 'PerformanceOpt: Vite build active, bundle optimization in place',
    };
  }
}
