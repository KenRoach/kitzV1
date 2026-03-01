/**
 * Relationship Builder Tools — Dale Carnegie's 30 principles.
 *
 * 1 tool:
 *   - relationship_advise (medium) — Get Carnegie-style advice for any relationship/interaction
 *
 * Uses Claude Sonnet, falls back to OpenAI gpt-4o.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('relationshipBuilderTools');
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM = `You are a relationship and influence advisor trained on Dale Carnegie's "How to Win Friends and Influence People."
CORE: Never criticize, condemn, or complain. Give honest, sincere appreciation (not flattery). Arouse an eager want.
MAKE PEOPLE LIKE YOU: Be genuinely interested. Smile. Remember names. Listen actively. Talk about their interests. Make them feel important sincerely.
WIN PEOPLE OVER: Avoid arguments. Never say "you're wrong." Admit mistakes quickly. Begin friendly. Get early "yes." Let them talk more. Let them feel the idea is theirs. See their point of view. Be sympathetic. Appeal to nobler motives.
LEADERSHIP: Begin with praise. Call attention to mistakes indirectly. Talk about your own mistakes first. Ask questions instead of orders. Let them save face. Praise every improvement. Give a reputation to live up to. Encourage. Make them happy to do what you suggest.
Context: LatAm SMB founders in sales, team, client relationships. Default language: Spanish.

Respond with valid JSON:
{ "situation_type": string,
  "principles_applied": [{ "principle": string, "part": number, "application": string, "example_phrase": string }],
  "conversation_guide": { "opening": string, "key_questions": ["string"], "appreciation_points": ["string"], "their_interests": ["string"], "closing": string },
  "mistakes_to_avoid": ["string"], "leadership_approach": string, "follow_up_plan": ["string"] }`;

async function callLLM(input: string): Promise<string> {
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': CLAUDE_API_VERSION },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1024, temperature: 0.5, system: SYSTEM, messages: [{ role: 'user', content: input }] }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) { const d = await res.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find(c => c.type === 'text')?.text || ''; }
    } catch { /* fall through */ }
  }
  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: input }], max_tokens: 1024, temperature: 0.5 }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) { const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; }
    } catch { /* return error */ }
  }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllRelationshipBuilderTools(): ToolSchema[] {
  return [{
    name: 'relationship_advise',
    description: 'Get Dale Carnegie-style advice for any relationship or interaction. Returns applicable principles with exact phrases, conversation guide, mistakes to avoid, and follow-up plan.',
    parameters: {
      type: 'object',
      properties: {
        situation: { type: 'string', description: 'The relationship situation or interaction' },
        relationship_type: { type: 'string', enum: ['sales', 'team', 'partnership', 'customer', 'networking', 'conflict'], description: 'Type of relationship' },
        other_person: { type: 'string', description: 'Who the other person is' },
        your_goal: { type: 'string', description: 'What you want to achieve' },
        history: { type: 'string', description: 'Relationship history' },
        language: { type: 'string', description: 'Response language (default: es)' },
      },
      required: ['situation'],
    },
    riskLevel: 'medium',
    execute: async (args, traceId) => {
      const situation = String(args.situation || '').trim();
      if (!situation) return { error: 'Situation is required.' };
      const input = `Advise on this interaction:\n"${situation}"\nType: ${args.relationship_type || 'general'}\nPerson: ${args.other_person || 'unknown'}\nGoal: ${args.your_goal || 'build rapport'}\nHistory: ${args.history || 'none'}\nLanguage: ${args.language || 'es'}`;
      const raw = await callLLM(input);
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
      if (!parsed) parsed = { situation_type: args.relationship_type || 'general', principles_applied: [], conversation_guide: {}, mistakes_to_avoid: [], follow_up_plan: [] };
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
