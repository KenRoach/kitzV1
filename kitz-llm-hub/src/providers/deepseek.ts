/**
 * DeepSeek provider — OpenAI-compatible endpoint.
 */

import type { LLMCompletionRequest, LLMCompletionResponse } from 'kitz-schemas';
import type { RouteDecision } from '../router.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function callDeepSeek(
  req: LLMCompletionRequest,
  route: RouteDecision,
): Promise<LLMCompletionResponse> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (req.system) messages.push({ role: 'system', content: req.system });
  if (req.messages?.length) {
    for (const m of req.messages) messages.push({ role: m.role, content: m.content });
  }
  if (req.prompt) messages.push({ role: 'user', content: req.prompt });

  const start = Date.now();
  const res = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: route.model,
      messages,
      max_tokens: req.maxTokens ?? route.maxTokens,
      temperature: req.temperature ?? route.temperature,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`DeepSeek API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
    model: string;
    usage: { prompt_tokens: number; completion_tokens: number };
  };

  return {
    text: data.choices?.[0]?.message?.content ?? '',
    provider: 'deepseek',
    model: data.model ?? route.model,
    tier: req.tier ?? 'sonnet',
    tokensUsed: (data.usage?.prompt_tokens ?? 0) + (data.usage?.completion_tokens ?? 0),
    traceId: req.traceId,
    durationMs: Date.now() - start,
  };
}
