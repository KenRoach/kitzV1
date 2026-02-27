/**
 * Negotiation advisor skill — Chris Voss's tactical empathy frameworks applied to SMBs.
 *
 * Implements Voss's core systems from "Never Split the Difference":
 *  - Tactical Empathy (understand emotions, don't agree)
 *  - Mirroring (repeat last 1-3 words)
 *  - Labeling ("It sounds like...", "It seems like...")
 *  - Calibrated Questions ("How" and "What" questions)
 *  - Accusation Audit (preempt negatives)
 *  - Getting "That's right" (not "You're right")
 *  - Black Swan discovery (unknown unknowns)
 *
 * Source: KB_FOUNDER_MINDSET.md (PKB-247)
 */

import type { LLMClient } from './callTranscription.js';

export interface NegotiationAdvice {
  situation_analysis: string;
  emotional_landscape: string;
  tactics: Array<{
    tactic: string;
    description: string;
    example_phrase: string;
    when_to_use: string;
  }>;
  calibrated_questions: string[];
  accusation_audit: string[];
  desired_outcome: string;
  black_swans: string[];
  script: string;
}

export interface NegotiationOptions {
  situation: string;
  counterparty?: string;
  your_position?: string;
  their_likely_position?: string;
  relationship_importance?: 'one-time' | 'ongoing' | 'critical';
  language?: string;
}

const SYSTEM =
  'You are a negotiation coach trained on Chris Voss\'s "Never Split the Difference" methodology. ' +
  'Apply: (1) Tactical Empathy — understand their emotions without agreeing. ' +
  '(2) Mirroring — repeat last 1-3 words to encourage elaboration. ' +
  '(3) Labeling — "It sounds like..." to validate feelings. ' +
  '(4) Calibrated Questions — open-ended "How" and "What" questions that give them illusion of control. ' +
  '(5) Accusation Audit — list every negative thing they could say about you upfront. ' +
  '(6) Get "That\'s right" — summarize their world until they say it. ' +
  '(7) Black Swans — discover the unknown unknowns that change everything. ' +
  'Context: small business owners in Latin America negotiating with suppliers, clients, partners. Default language: Spanish. ' +
  'Be tactical, specific, give exact phrases they can use.';

export async function adviseNegotiation(options: NegotiationOptions, llmClient?: LLMClient): Promise<NegotiationAdvice> {
  if (llmClient) {
    const prompt = `Coach me through this negotiation:\n"${options.situation}"\n` +
      `Counterparty: ${options.counterparty ?? 'unknown'}\nMy position: ${options.your_position ?? 'unknown'}\n` +
      `Their likely position: ${options.their_likely_position ?? 'unknown'}\n` +
      `Relationship: ${options.relationship_importance ?? 'ongoing'}\nLanguage: ${options.language ?? 'es'}\n\n` +
      'Respond with JSON: { "situation_analysis": string, "emotional_landscape": string, ' +
      '"tactics": [{ "tactic": string, "description": string, "example_phrase": string, "when_to_use": string }], ' +
      '"calibrated_questions": ["string"], "accusation_audit": ["string"], ' +
      '"desired_outcome": string, "black_swans": ["string"], "script": string }';
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as NegotiationAdvice; } catch { /* fall through */ }
  }
  return {
    situation_analysis: options.situation,
    emotional_landscape: '[Analysis unavailable — no LLM]',
    tactics: [
      { tactic: 'Mirroring', description: 'Repeat their last 1-3 words', example_phrase: '¿...último precio?', when_to_use: 'When you need them to elaborate' },
      { tactic: 'Labeling', description: 'Name their emotion', example_phrase: 'Parece que esto es muy importante para usted...', when_to_use: 'When tension is high' },
    ],
    calibrated_questions: ['¿Cómo puedo hacer que esto funcione para ambos?', '¿Qué es lo más importante para usted?'],
    accusation_audit: ['Probablemente piensa que estoy pidiendo demasiado...'],
    desired_outcome: 'Define your ideal outcome',
    black_swans: ['What don\'t you know about their constraints?'],
    script: '[Script unavailable — no LLM]',
  };
}
