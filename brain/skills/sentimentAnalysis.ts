/**
 * Sentiment analysis skill — analyze customer message sentiment.
 */

import { PROMPTS } from '../prompts/templates.js';
import type { LLMClient } from './callTranscription.js';

export type Sentiment = 'positive' | 'negative' | 'neutral' | 'mixed';
export type Urgency = 'low' | 'medium' | 'high';

export interface SentimentResult {
  sentiment: Sentiment;
  score: number;
  keywords: string[];
  urgency: Urgency;
}

/**
 * Analyze sentiment of customer text using LLM.
 * When no llmClient is provided, returns a basic keyword-based analysis.
 */
export async function analyzeSentiment(
  text: string,
  llmClient?: LLMClient,
): Promise<SentimentResult> {
  if (llmClient) {
    const prompt = `Analyze this message:\n\n"${text}"\n\n${PROMPTS.sentiment.format}`;

    const response = await llmClient.complete({
      prompt,
      system: PROMPTS.sentiment.system,
      tier: 'haiku',
    });

    try {
      const parsed = JSON.parse(response.text) as SentimentResult;
      return {
        sentiment: parsed.sentiment,
        score: Math.max(-1, Math.min(1, parsed.score)),
        keywords: parsed.keywords ?? [],
        urgency: parsed.urgency ?? 'low',
      };
    } catch {
      return { sentiment: 'neutral', score: 0, keywords: [], urgency: 'low' };
    }
  }

  // Basic keyword-based fallback
  const lower = text.toLowerCase();
  const negativeWords = ['problema', 'mal', 'error', 'urgente', 'ayuda', 'queja', 'malo', 'terrible'];
  const positiveWords = ['gracias', 'excelente', 'genial', 'perfecto', 'bien', 'bueno', 'increíble'];

  const negCount = negativeWords.filter(w => lower.includes(w)).length;
  const posCount = positiveWords.filter(w => lower.includes(w)).length;

  let sentiment: Sentiment = 'neutral';
  let score = 0;
  if (negCount > posCount) { sentiment = 'negative'; score = -0.5; }
  else if (posCount > negCount) { sentiment = 'positive'; score = 0.5; }
  else if (negCount > 0 && posCount > 0) { sentiment = 'mixed'; score = 0; }

  const urgency: Urgency = lower.includes('urgente') || lower.includes('ayuda') ? 'high' : 'low';

  return { sentiment, score, keywords: [], urgency };
}
