/**
 * Relationship Builder — Dale Carnegie's "How to Win Friends and Influence People".
 *
 * 30 Principles organized in 4 parts (PKB-206 through PKB-211):
 *
 * Part 1 — Fundamental Techniques:
 *  - Don't criticize, condemn, or complain
 *  - Give honest, sincere appreciation
 *  - Arouse in the other person an eager want
 *
 * Part 2 — Six Ways to Make People Like You:
 *  - Become genuinely interested in other people
 *  - Smile, remember names, be a good listener
 *  - Talk in terms of the other person's interests
 *  - Make the other person feel important (sincerely)
 *
 * Part 3 — Win People to Your Way of Thinking:
 *  - Avoid arguments, never say "you're wrong"
 *  - Begin in a friendly way, get "yes" responses
 *  - Let the other person do the talking
 *  - Let them feel the idea is theirs
 *
 * Part 4 — Be a Leader:
 *  - Begin with praise, call attention to mistakes indirectly
 *  - Talk about your own mistakes first
 *  - Ask questions instead of giving orders
 *  - Give the person a fine reputation to live up to
 *
 * Source: KB_FOUNDER_MINDSET.md
 */

import type { LLMClient } from './callTranscription.js';

export interface RelationshipAdvice {
  situation_type: 'sales' | 'team' | 'partnership' | 'customer' | 'networking' | 'conflict';
  principles_applied: Array<{ principle: string; part: number; application: string; example_phrase: string }>;
  conversation_guide: {
    opening: string;
    key_questions: string[];
    appreciation_points: string[];
    their_interests: string[];
    closing: string;
  };
  mistakes_to_avoid: string[];
  leadership_approach?: string;
  follow_up_plan: string[];
}

export interface RelationshipOptions {
  situation: string;
  relationship_type?: 'sales' | 'team' | 'partnership' | 'customer' | 'networking' | 'conflict';
  other_person?: string;
  your_goal?: string;
  history?: string;
  language?: string;
}

const SYSTEM =
  'You are a relationship and influence advisor trained on Dale Carnegie\'s "How to Win Friends and Influence People." ' +
  'CORE PRINCIPLES: (1) Never criticize, condemn, or complain. (2) Give honest, sincere appreciation (not flattery). ' +
  '(3) Arouse in others an eager want — talk about THEIR interests and benefits. ' +
  'MAKING PEOPLE LIKE YOU: Be genuinely interested. Smile. Remember and use their name. Listen actively. ' +
  'Talk in terms of their interests. Make them feel important — and do it sincerely. ' +
  'WINNING PEOPLE OVER: Avoid arguments (you can\'t win by arguing). Never say "you\'re wrong." ' +
  'If you\'re wrong, admit it quickly. Begin in a friendly way. Get early "yes" responses. ' +
  'Let them talk more. Let them feel the idea is theirs. See things from their point of view. ' +
  'Be sympathetic to their desires. Appeal to nobler motives. Dramatize your ideas. ' +
  'LEADERSHIP: Begin with praise. Call attention to mistakes indirectly. Talk about your own mistakes first. ' +
  'Ask questions instead of giving orders. Let them save face. Praise every improvement. ' +
  'Give a reputation to live up to. Encourage — make faults seem easy to correct. Make them happy to do what you suggest. ' +
  'Context: LatAm SMB founders in sales, team management, client relationships. Default language: Spanish.';

export async function adviseRelationship(options: RelationshipOptions, llmClient?: LLMClient): Promise<RelationshipAdvice> {
  if (llmClient) {
    const prompt = `Advise on this relationship/interaction:\n"${options.situation}"\n` +
      `Type: ${options.relationship_type ?? 'general'}\nOther person: ${options.other_person ?? 'unknown'}\n` +
      `Your goal: ${options.your_goal ?? 'build rapport'}\nHistory: ${options.history ?? 'none'}\n` +
      `Language: ${options.language ?? 'es'}\n\n` +
      'Respond with JSON: { "situation_type": string, ' +
      '"principles_applied": [{ "principle": string, "part": number, "application": string, "example_phrase": string }], ' +
      '"conversation_guide": { "opening": string, "key_questions": ["string"], "appreciation_points": ["string"], ' +
      '"their_interests": ["string"], "closing": string }, ' +
      '"mistakes_to_avoid": ["string"], "leadership_approach": string, "follow_up_plan": ["string"] }';
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as RelationshipAdvice; } catch { /* fall through */ }
  }
  return {
    situation_type: options.relationship_type ?? 'customer',
    principles_applied: [
      { principle: 'Be genuinely interested in other people', part: 2, application: 'Ask about their business', example_phrase: '¿Cómo va su negocio? Cuénteme más...' },
      { principle: 'Give honest, sincere appreciation', part: 1, application: 'Acknowledge their effort', example_phrase: 'Admiro lo que ha construido...' },
    ],
    conversation_guide: { opening: 'Start with genuine interest in them', key_questions: ['¿Qué es lo más importante para usted?'], appreciation_points: ['Find something genuinely admirable'], their_interests: ['Discover through active listening'], closing: 'Summarize what you heard, confirm next steps' },
    mistakes_to_avoid: ['Don\'t criticize', 'Don\'t argue', 'Don\'t make it about you'],
    follow_up_plan: ['Send a thank-you within 24 hours', 'Reference something specific they said'],
  };
}
