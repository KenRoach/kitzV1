import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

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
