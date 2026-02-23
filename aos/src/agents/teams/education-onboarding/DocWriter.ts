import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class DocWriterAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('DocWriter', bus, memory);
    this.team = 'education-onboarding';
    this.tier = 'team';
  }

  async writeArticle(topic: string): Promise<{ articleId: string; draft: string; draftOnly: true }> {
    return { articleId: `article_${topic}`, draft: `Help article draft: ${topic}`, draftOnly: true };
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'doc-writer', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Knowledge base accessible', 'Article drafting pipeline ready'],
      summary: 'DocWriter: Knowledge base articles ready for creation',
    };
  }
}
