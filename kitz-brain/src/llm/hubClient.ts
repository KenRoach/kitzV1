export type LLMTaskType = 'drafting' | 'summarizing' | 'search' | 'classification';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || process.env.AI_API_KEY || '';
const MODEL = 'claude-haiku-4-5-20251001';

export const llmHubClient = {
  async complete(taskType: LLMTaskType, prompt: string, traceId: string): Promise<{ text: string }> {
    if (!ANTHROPIC_API_KEY) {
      return { text: `[No API key configured] ${taskType} task received but cannot process.` };
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
          system: `You are a business AI assistant performing a ${taskType} task. Be concise and actionable. Respond in the same language as the prompt.`,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const err = await response.text().catch(() => '');
        return { text: `[LLM error ${response.status}] ${err.slice(0, 200)}` };
      }

      const data = await response.json() as { content: Array<{ type: string; text: string }> };
      const text = data.content?.find(c => c.type === 'text')?.text || '';
      return { text };
    } catch (err) {
      return { text: `[LLM unreachable] ${(err as Error).message}` };
    }
  }
};
