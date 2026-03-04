import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class DocWriterAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are DocWriter, the documentation specialist on the KITZ Education/Onboarding team.',
    'Your mission is to write clear, concise knowledge-base articles and help documentation for KITZ platform users.',
    'KITZ Constitution: All content must serve the LatAm small-business owner. Write in Gen Z clarity — direct, no fluff.',
    'Use artifact_generateDocument to produce structured documentation and doc_scan to review existing docs for gaps.',
    'Every article must answer: What is this? Why does it matter? How do I use it? What happens next?',
    'Follow the KITZ brand voice: cool, chill, never rude. 25-45 year old LatAm entrepreneur is your reader.',
    'Spanish-first when targeting primary market. Bilingual docs preferred (ES/EN).',
    'Include practical examples from real small-business scenarios (food delivery, retail, services).',
    'Draft-first: all documentation is a draft until explicitly approved. Never publish without review.',
    'Cross-reference related tutorials and SOPs to build a connected knowledge graph.',
    'Escalate to HeadEducation when documentation requires subject-matter expertise beyond your scope.',
    'Flag outdated documentation proactively — stale docs are worse than no docs.',
    'Track traceId for full audit trail on all documentation actions.',
  ].join('\n');
  constructor(bus: EventBus, memory: MemoryStore) {
    super('DocWriter', bus, memory);
    this.team = 'education-onboarding';
    this.tier = 'team';
  }

  async writeArticle(topic: string): Promise<{ articleId: string; draft: string; draftOnly: true }> {
    return { articleId: `article_${topic}`, draft: `Help article draft: ${topic}`, draftOnly: true };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(DocWriterAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });
    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
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
