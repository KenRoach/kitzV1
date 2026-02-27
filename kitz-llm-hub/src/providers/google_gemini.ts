/**
 * Google Gemini provider — REST API (OpenAI-compatible format not used; native Gemini API).
 */

import type { LLMCompletionRequest, LLMCompletionResponse } from 'kitz-schemas';
import type { RouteDecision } from '../router.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function callGemini(
  req: LLMCompletionRequest,
  route: RouteDecision,
): Promise<LLMCompletionResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const model = route.model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const parts: Array<{ text: string }> = [];
  if (req.system) parts.push({ text: `[System] ${req.system}` });
  if (req.messages?.length) {
    for (const m of req.messages) parts.push({ text: `[${m.role}] ${m.content}` });
  }
  if (req.prompt) parts.push({ text: req.prompt });

  const start = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        maxOutputTokens: req.maxTokens ?? route.maxTokens,
        temperature: req.temperature ?? route.temperature,
      },
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number };
  };

  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ?? '';

  return {
    text,
    provider: 'gemini',
    model,
    tier: req.tier ?? 'sonnet',
    tokensUsed: (data.usageMetadata?.promptTokenCount ?? 0) + (data.usageMetadata?.candidatesTokenCount ?? 0),
    traceId: req.traceId,
    durationMs: Date.now() - start,
  };
}
