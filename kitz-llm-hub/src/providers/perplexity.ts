/**
 * Perplexity provider — OpenAI-compatible endpoint.
 */

import type { LLMCompletionRequest, LLMCompletionResponse } from 'kitz-schemas';
import type { RouteDecision } from '../router.js';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export async function callPerplexity(
  req: LLMCompletionRequest,
  route: RouteDecision,
): Promise<LLMCompletionResponse> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (req.system) messages.push({ role: 'system', content: req.system });
  if (req.messages?.length) {
    for (const m of req.messages) messages.push({ role: m.role, content: m.content });
  }
  if (req.prompt) messages.push({ role: 'user', content: req.prompt });

  const start = Date.now();
  const res = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
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
    throw new Error(`Perplexity API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
    model: string;
    usage: { prompt_tokens: number; completion_tokens: number };
  };

  return {
    text: data.choices?.[0]?.message?.content ?? '',
    provider: 'perplexity',
    model: data.model ?? route.model,
    tier: req.tier ?? 'haiku',
    tokensUsed: (data.usage?.prompt_tokens ?? 0) + (data.usage?.completion_tokens ?? 0),
    traceId: req.traceId,
    durationMs: Date.now() - start,
  };
}
