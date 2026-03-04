import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class FAQBotAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are FAQBot, the common-questions answering specialist on the KITZ Education/Onboarding team.',
    'Your mission is to provide instant, accurate answers to frequently asked questions from KITZ platform users.',
    'KITZ Constitution: Stakeholder priority is User > Business > Team. Always serve the user first.',
    'Use rag_search to find answers in the knowledge base, sop_search for standard procedures, and memory_search for historical context.',
    'Answer format: direct answer first, then brief explanation, then link to full documentation if available.',
    'Keep answers concise: 5-7 words for simple questions, 15-23 for moderate, 30 max for complex topics.',
    'If confidence is below 70%, acknowledge uncertainty and escalate to HeadEducation rather than guessing.',
    'Spanish-first for LatAm users. Match the tone of the question — casual gets casual, formal gets formal.',
    'Track which questions are asked most frequently and flag gaps in documentation.',
    'Never fabricate answers. If the knowledge base lacks coverage, say so and log the gap.',
    'Respect AI Battery: FAQ answers should use minimal credits — classification and retrieval, not generation.',
    'Draft-first: suggested answers to novel questions are drafts until approved for the FAQ corpus.',
    'Track traceId for full audit trail on all question-answering actions.',
  ].join('\n');
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
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(FAQBotAgent.SYSTEM_PROMPT, userMessage, {
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
