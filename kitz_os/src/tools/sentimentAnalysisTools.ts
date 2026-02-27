/**
 * Sentiment Analysis Tools — Analyze customer message sentiment and urgency.
 *
 * 1 tool:
 *   - sentiment_analyze (low) — Classify sentiment, score, urgency, keywords
 *
 * Uses Claude Haiku (fast), falls back to OpenAI gpt-4o-mini.
 * Cultural context for Latin American Spanish expressions.
 */

import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `Analyze the sentiment of customer messages for small businesses in Latin America.
Consider cultural context for Latin American Spanish expressions.
Detect urgency based on language intensity, business impact, and time sensitivity.

Respond with valid JSON:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "score": number (-1.0 to 1.0),
  "urgency": "low" | "medium" | "high",
  "keywords": ["string (key emotional/intent words)"],
  "reason": "string (1-sentence explanation)"
}`;

async function analyzeSentiment(text: string): Promise<string> {
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': CLAUDE_API_VERSION },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001', max_tokens: 512, temperature: 0.1,
          system: SYSTEM_PROMPT, messages: [{ role: 'user', content: text }],
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const data = await res.json() as { content: Array<{ type: string; text?: string }> };
        return data.content?.find(c => c.type === 'text')?.text || '';
      }
    } catch { /* fall through */ }
  }
  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: text }],
          max_tokens: 512, temperature: 0.1,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        return data.choices?.[0]?.message?.content || '';
      }
    } catch { /* return error */ }
  }
  return JSON.stringify({ error: 'No AI available for sentiment analysis' });
}

export function getAllSentimentAnalysisTools(): ToolSchema[] {
  return [
    {
      name: 'sentiment_analyze',
      description: 'Analyze customer message sentiment (positive/negative/neutral/mixed), urgency level, and extract key emotional keywords. Cultural context for Latin American Spanish.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Customer message text to analyze' },
          context: { type: 'string', description: 'Optional business context (e.g., "after delivery delay")' },
        },
        required: ['text'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const text = String(args.text || '').trim();
        if (!text) return { error: 'Text is required.' };
        const input = args.context ? `Context: ${args.context}\n\nMessage: ${text}` : text;
        const raw = await analyzeSentiment(input);
        let parsed;
        try {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { sentiment: 'neutral', score: 0, urgency: 'low', keywords: [], reason: raw };
        } catch {
          parsed = { sentiment: 'neutral', score: 0, urgency: 'low', keywords: [], reason: raw };
        }
        console.log(JSON.stringify({ ts: new Date().toISOString(), module: 'sentimentAnalysisTools', action: 'sentiment_analyze', sentiment: parsed.sentiment, urgency: parsed.urgency, trace_id: traceId }));
        return parsed;
      },
    },
  ];
}
