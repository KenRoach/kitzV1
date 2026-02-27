/**
 * OpenAI provider — Chat Completions API.
 * Ported from kitz_os/src/llm/claudeClient.ts (fallback path).
 */

import type { LLMCompletionRequest, LLMCompletionResponse } from 'kitz-schemas';
import type { RouteDecision } from '../router.js';

const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function callOpenAI(
  req: LLMCompletionRequest,
  route: RouteDecision,
  model?: string,
): Promise<LLMCompletionResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (req.system) messages.push({ role: 'system', content: req.system });
  if (req.messages?.length) {
    for (const m of req.messages) messages.push({ role: m.role, content: m.content });
  }
  if (req.prompt) messages.push({ role: 'user', content: req.prompt });

  const start = Date.now();
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: model ?? route.model,
      messages,
      max_tokens: req.maxTokens ?? route.maxTokens,
      temperature: req.temperature ?? route.temperature,
      stream: false,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`OpenAI API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
    model: string;
    usage: { prompt_tokens: number; completion_tokens: number };
  };

  return {
    text: data.choices?.[0]?.message?.content ?? '',
    provider: 'openai',
    model: data.model,
    tier: req.tier ?? 'sonnet',
    tokensUsed: (data.usage?.prompt_tokens ?? 0) + (data.usage?.completion_tokens ?? 0),
    traceId: req.traceId,
    durationMs: Date.now() - start,
  };
}
