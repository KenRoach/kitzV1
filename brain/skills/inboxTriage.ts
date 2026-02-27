/**
 * Inbox triage skill — classify inbound messages by intent, urgency,
 * and route to the correct handler (agent, SOP, or human).
 *
 * Combines sentiment analysis + intent classification + SLA enforcement.
 * Owner: HeadCustomer agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface TriageResult {
  intent: 'order' | 'support' | 'inquiry' | 'complaint' | 'payment' | 'greeting' | 'spam' | 'other';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  suggestedHandler: string;
  suggestedSop: string | null;
  autoReplyDraft: string | null;
  responseDeadlineMinutes: number;
  tags: string[];
}

export interface TriageOptions {
  message: string;
  channel: 'whatsapp' | 'email' | 'web' | 'sms';
  senderName?: string;
  isExistingCustomer?: boolean;
  language?: string;
}

const TRIAGE_SYSTEM =
  'You are an inbox triage agent for small businesses in Latin America. ' +
  'Classify every inbound message by intent, urgency, and sentiment. ' +
  'Route to the right handler and suggest an auto-reply draft. ' +
  'SLA rules: critical=15min, high=1hr, medium=4hr, low=24hr. ' +
  'Default language: Spanish.';

const TRIAGE_FORMAT =
  'Respond with JSON: { "intent": "order"|"support"|"inquiry"|"complaint"|"payment"|"greeting"|"spam"|"other", ' +
  '"urgency": "low"|"medium"|"high"|"critical", "sentiment": "positive"|"negative"|"neutral"|"mixed", ' +
  '"suggestedHandler": string (agent name or "human"), "suggestedSop": string|null, ' +
  '"autoReplyDraft": string|null (5-15 words, warm, Spanish), "responseDeadlineMinutes": number, "tags": string[] }';

export async function triageInbox(options: TriageOptions, llmClient?: LLMClient): Promise<TriageResult> {
  const language = options.language ?? 'es';
  if (llmClient) {
    const prompt = `Triage this ${options.channel} message:\n"${options.message}"\n` +
      `Sender: ${options.senderName ?? 'Unknown'}, Existing customer: ${options.isExistingCustomer ?? 'unknown'}\n` +
      `Language: ${language}\n\n${TRIAGE_FORMAT}`;
    const response = await llmClient.complete({ prompt, system: TRIAGE_SYSTEM, tier: 'haiku' });
    try {
      return JSON.parse(response.text) as TriageResult;
    } catch {
      return { intent: 'other', urgency: 'medium', sentiment: 'neutral', suggestedHandler: 'human', suggestedSop: null, autoReplyDraft: '¡Gracias por tu mensaje! Te respondemos pronto.', responseDeadlineMinutes: 240, tags: ['unclassified'] };
    }
  }
  return { intent: 'other', urgency: 'medium', sentiment: 'neutral', suggestedHandler: 'human', suggestedSop: null, autoReplyDraft: null, responseDeadlineMinutes: 240, tags: ['no-llm'] };
}
