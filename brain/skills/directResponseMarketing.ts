/**
 * Direct Response Marketing skill — Dan Kennedy's frameworks applied to SMBs.
 *
 * Implements Kennedy's core systems:
 *  - Results Triangle: Market → Message → Media → Math
 *  - 10 Rules of Direct Marketing
 *  - No B.S. Sales Letter methodology
 *  - Follow-up sequences
 *  - Premium pricing psychology
 *
 * Source: KB_FOUNDER_MINDSET.md (PKB-251 through PKB-268)
 */

import type { LLMClient } from './callTranscription.js';

export interface DirectResponseResult {
  headline: string;
  offer: string;
  urgencyTrigger: string;
  callToAction: string;
  followUpSequence: Array<{ day: number; channel: string; message: string }>;
  trackingMetrics: string[];
  kennedyRulesApplied: string[];
}

export interface SalesLetterResult {
  headline: string;
  openingHook: string;
  problemStatement: string;
  solution: string;
  proof: string[];
  offer: string;
  urgency: string;
  guarantee: string;
  callToAction: string;
  ps: string;
}

export interface DirectResponseOptions {
  product: string;
  targetMarket: string;
  price?: number;
  channel: 'whatsapp' | 'email' | 'instagram' | 'landing-page';
  goal: 'lead-gen' | 'sale' | 'appointment' | 'referral';
  language?: string;
}

export interface SalesLetterOptions {
  product: string;
  targetAudience: string;
  price: number;
  mainBenefit: string;
  testimonials?: string[];
  guarantee?: string;
  language?: string;
}

const DR_SYSTEM =
  'You are a direct response marketing strategist trained on Dan Kennedy\'s methodology. ' +
  'Apply the Results Triangle (Market → Message → Media → Math) and the 10 Rules of Direct Marketing. ' +
  'RULES: (1) Always have an offer. (2) Reason to respond NOW (urgency/scarcity). ' +
  '(3) Clear instructions (tell them exactly what to do). (4) Track everything. ' +
  '(5) No-cost brand building only. (6) Systematic follow-up. (7) Strong copy that sells. ' +
  '(8) Proven formats. (9) Results rule. (10) Be disciplined. ' +
  'Context: small businesses in Latin America, WhatsApp-first. Default language: Spanish. ' +
  'No corporate fluff — direct, results-focused, No B.S.';

const SALES_LETTER_SYSTEM =
  'You are a sales letter copywriter trained on Dan Kennedy\'s Ultimate Sales Letter methodology. ' +
  'Structure: Headline → Opening Hook → Problem → Solution → Proof → Offer → Urgency → Guarantee → CTA → P.S. ' +
  'Write like Kennedy: conversational, benefit-driven, urgency-loaded, proof-heavy. ' +
  'Context: Latin American SMBs. Default language: Spanish.';

export async function createDirectResponse(options: DirectResponseOptions, llmClient?: LLMClient): Promise<DirectResponseResult> {
  if (llmClient) {
    const prompt = `Create a direct response campaign:\nProduct: ${options.product}\nMarket: ${options.targetMarket}\n` +
      `Price: ${options.price ?? 'TBD'}\nChannel: ${options.channel}\nGoal: ${options.goal}\nLanguage: ${options.language ?? 'es'}\n\n` +
      'Respond with JSON: { "headline": string, "offer": string, "urgencyTrigger": string, ' +
      '"callToAction": string, "followUpSequence": [{ "day": number, "channel": string, "message": string }], ' +
      '"trackingMetrics": ["string"], "kennedyRulesApplied": ["string"] }';
    const response = await llmClient.complete({ prompt, system: DR_SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as DirectResponseResult; } catch { /* fall through */ }
  }
  return {
    headline: `[DR campaign for ${options.product} — no LLM]`,
    offer: options.product, urgencyTrigger: 'Limited time', callToAction: '¡Escríbenos ahora!',
    followUpSequence: [{ day: 0, channel: options.channel, message: 'Initial offer' }, { day: 3, channel: options.channel, message: 'Follow-up' }],
    trackingMetrics: ['response_rate', 'conversion_rate', 'cost_per_acquisition'],
    kennedyRulesApplied: ['Rule 1: Always have an offer', 'Rule 2: Urgency'],
  };
}

export async function writeSalesLetter(options: SalesLetterOptions, llmClient?: LLMClient): Promise<SalesLetterResult> {
  if (llmClient) {
    const prompt = `Write a sales letter:\nProduct: ${options.product}\nAudience: ${options.targetAudience}\n` +
      `Price: $${options.price}\nMain benefit: ${options.mainBenefit}\n` +
      `Testimonials: ${options.testimonials?.join('; ') ?? 'none'}\n` +
      `Guarantee: ${options.guarantee ?? 'satisfaction guaranteed'}\nLanguage: ${options.language ?? 'es'}\n\n` +
      'Respond with JSON: { "headline": string, "openingHook": string, "problemStatement": string, ' +
      '"solution": string, "proof": ["string"], "offer": string, "urgency": string, ' +
      '"guarantee": string, "callToAction": string, "ps": string }';
    const response = await llmClient.complete({ prompt, system: SALES_LETTER_SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as SalesLetterResult; } catch { /* fall through */ }
  }
  return {
    headline: `[Sales letter for ${options.product} — no LLM]`,
    openingHook: '', problemStatement: '', solution: '', proof: [],
    offer: `$${options.price}`, urgency: 'Limited time', guarantee: options.guarantee ?? 'Satisfacción garantizada',
    callToAction: '¡Ordena ahora!', ps: '',
  };
}
