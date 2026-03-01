/**
 * Shared LLM helper — Claude-first with OpenAI fallback.
 *
 * Used by all brain-skill tool modules instead of duplicating fetch logic.
 * Claude Haiku by default, falls back to OpenAI gpt-4o-mini.
 */

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface CallLLMOptions {
  model?: string;
  openaiModel?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export async function callLLM(
  systemPrompt: string,
  userInput: string,
  options?: CallLLMOptions,
): Promise<string> {
  const model = options?.model || 'claude-haiku-4-5-20251001';
  const openaiModel = options?.openaiModel || 'gpt-4o-mini';
  const maxTokens = options?.maxTokens || 1024;
  const temperature = options?.temperature || 0.2;
  const timeoutMs = options?.timeoutMs || 15_000;

  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': CLAUDE_API_VERSION,
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: [{ role: 'user', content: userInput }],
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) {
        const d = (await res.json()) as {
          content: Array<{ type: string; text?: string }>;
        };
        return d.content?.find((c) => c.type === 'text')?.text || '';
      }
    } catch {
      /* fall through to OpenAI */
    }
  }

  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: openaiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInput },
          ],
          max_tokens: maxTokens,
          temperature,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) {
        const d = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        return d.choices?.[0]?.message?.content || '';
      }
    } catch {
      /* return error */
    }
  }

  return JSON.stringify({ error: 'No AI available' });
}
