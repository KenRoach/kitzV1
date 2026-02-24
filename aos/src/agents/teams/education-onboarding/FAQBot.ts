import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class FAQBotAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('FAQBot', bus, memory);
    this.team = 'education-onboarding';
    this.tier = 'team';
  }

  async answerQuestion(query: string): Promise<{ answer: string; confidence: number; source: string }> {
    // Placeholder — production uses RAG from knowledge base
    return { answer: '', confidence: 0, source: 'knowledge-base' };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();

    const result = await this.invokeTool('memory_search', { query: payload.query ?? 'frequently asked questions', limit: 20 }, traceId);

    await this.invokeTool('memory_store_knowledge', {
      category: 'swarm-findings',
      content: JSON.stringify({ agent: this.name, team: this.team, result: result.data }),
    }, traceId);

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId, findings: result.data,
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const passed: string[] = [];
    const warnings: string[] = [];
    if (ctx.semanticRouterActive) passed.push('Semantic router active — FAQ routing enabled');
    else blockers.push('Semantic router inactive — FAQBot cannot classify questions');
    passed.push('Knowledge base query pipeline configured');
    return {
      agent: this.name, role: 'faq-bot', vote: blockers.length > 0 ? 'no-go' : 'go',
      confidence: blockers.length > 0 ? 30 : 72, blockers, warnings, passed,
      summary: `FAQBot: ${ctx.semanticRouterActive ? 'Ready to answer questions' : 'Blocked — needs semantic router'}`,
    };
  }
}
