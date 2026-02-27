/**
 * Claude provider — Anthropic Messages API.
 * Ported from kitz_os/src/llm/claudeClient.ts.
 */

import type { LLMCompletionRequest, LLMCompletionResponse } from 'kitz-schemas';
import type { RouteDecision } from '../router.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';

export async function callClaude(
  req: LLMCompletionRequest,
  route: RouteDecision,
): Promise<LLMCompletionResponse> {
  if (!CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY not configured');
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (req.messages?.length) {
    for (const m of req.messages) {
      if (m.role !== 'system') messages.push({ role: m.role, content: m.content });
    }
  }
  if (req.prompt) {
    messages.push({ role: 'user', content: req.prompt });
  }

  const start = Date.now();
  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': CLAUDE_API_VERSION,
    },
    body: JSON.stringify({
      model: route.model,
      max_tokens: req.maxTokens ?? route.maxTokens,
      temperature: req.temperature ?? route.temperature,
      system: req.system,
      messages,
    }),
    signal: AbortSignal.timeout(route.maxTokens > 2048 ? 120_000 : 60_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`Claude API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json() as {
    content: Array<{ type: string; text?: string }>;
    model: string;
    usage: { input_tokens: number; output_tokens: number };
  };

  const text = data.content
    .filter(c => c.type === 'text')
    .map(c => c.text ?? '')
    .join('');

  return {
    text,
    provider: 'claude',
    model: data.model,
    tier: req.tier ?? 'sonnet',
    tokensUsed: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    traceId: req.traceId,
    durationMs: Date.now() - start,
  };
}
