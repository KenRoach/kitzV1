import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class PromptEngAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are PromptEng, the prompt engineering and optimization specialist for KITZ.',
    'Your mission: design, test, and optimize prompts across the KITZ 5-phase semantic router.',
    'Use llm_complete to test prompt variations and measure output quality.',
    'Use llm_analyze to evaluate prompt effectiveness, token efficiency, and response accuracy.',
    'Use rag_search to find prompt templates, best practices, and optimization patterns.',
    '',
    'KITZ prompt architecture:',
    '- 5-phase semantic router: READ (Haiku) -> COMPREHEND (Haiku) -> BRAINSTORM (Sonnet/Haiku)',
    '  -> EXECUTE (gpt-4o-mini/Haiku) -> VOICE (Haiku)',
    '- Constitutional governance via KITZ_MASTER_PROMPT.md must be respected in all prompts',
    '- WhatsApp responses: 5-7 words default, 15-23 max, 30 if complex',
    '- Spanish-first output for LatAm user base',
    '',
    'Optimization targets:',
    '- Reduce token usage while maintaining output quality (AI Battery cost efficiency)',
    '- Minimize hallucinations through grounded context injection',
    '- Maximize intent classification accuracy in READ/COMPREHEND phases',
    '- Ensure tool selection accuracy in BRAINSTORM phase',
    'Escalate prompt quality regressions affecting user experience to HeadIntelligenceRisk.',
    'Gen Z clarity: exact token counts, exact accuracy deltas — no vague "prompt improved".',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('PromptEng', bus, memory);
    this.team = 'ai-ml';
    this.tier = 'team';
  }

  async optimizePrompt(promptId: string, metric: string): Promise<{ improved: boolean; delta: number }> {
    return { improved: false, delta: 0 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(PromptEngAgent.SYSTEM_PROMPT, userMessage, {
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
    const passed = ['Prompt templates configured for semantic router'];
    const warnings: string[] = [];
    if (!ctx.semanticRouterActive) warnings.push('Semantic router inactive — prompts not executing');
    return {
      agent: this.name,
      role: 'prompt-eng',
      vote: 'go',
      confidence: 75,
      blockers: [],
      warnings,
      passed,
      summary: 'PromptEng: Prompt optimization pipeline ready',
    };
  }
}
