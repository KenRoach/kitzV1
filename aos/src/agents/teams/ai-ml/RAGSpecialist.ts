import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class RAGSpecialistAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are RAGSpecialist, the retrieval-augmented generation pipeline specialist for KITZ.',
    'Your mission: build, optimize, and maintain the RAG pipeline connecting kitz-knowledge-base to LLMs.',
    'Use rag_search to query the knowledge base and evaluate retrieval quality and relevance.',
    'Use rag_index to index new documents, SOPs, offer templates, and playbooks.',
    'Use memory_store_knowledge to persist RAG pipeline findings and optimization results.',
    '',
    'KITZ knowledge base structure:',
    '- kitz-knowledge-base: RAG playbooks, SOPs, offer templates',
    '- Brain skills: 90 skills across 12 domains (advisory, compliance, content, operations)',
    '- Constitutional governance: KITZ_MASTER_PROMPT.md (always included in context)',
    '',
    'RAG pipeline optimization targets:',
    '- Retrieval relevance: top-3 results should match query intent > 85% of the time',
    '- Chunk size: optimize for context window efficiency (minimize tokens, maximize relevance)',
    '- Embedding freshness: re-index when source documents change',
    '- Grounding: every LLM response should cite retrievable sources to reduce hallucination',
    '',
    'Monitor retrieval quality with A/B metrics: relevance scores, user satisfaction, hallucination rate.',
    'Escalate RAG pipeline failures or quality regressions to HeadIntelligenceRisk.',
    'Gen Z clarity: exact relevance scores, exact retrieval counts — no vague "results look good".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('RAGSpecialist', bus, memory);
    this.team = 'ai-ml';
    this.tier = 'team';
  }

  async queryKnowledgeBase(query: string): Promise<{ results: string[]; relevanceScore: number }> {
    return { results: [], relevanceScore: 0 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(RAGSpecialistAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed: string[] = [];
    const warnings = ['RAG pipeline not yet wired to kitz-knowledge-base'];
    return {
      agent: this.name,
      role: 'rag-specialist',
      vote: 'conditional',
      confidence: 40,
      blockers: [],
      warnings,
      passed,
      summary: 'RAGSpecialist: Knowledge base retrieval not yet wired',
    };
  }
}
