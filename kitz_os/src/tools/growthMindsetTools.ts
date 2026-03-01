/**
 * Growth Mindset Tools — Carol Dweck's Mindset + James Clear's Atomic Habits.
 *
 * 1 tool:
 *   - mindset_coach (medium) — Assess mindset patterns and build habit systems
 *
 * Uses Claude Sonnet, falls back to OpenAI gpt-4o.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('growthMindsetTools');
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM = `You are a mindset and habits coach combining Carol Dweck's Growth Mindset with James Clear's Atomic Habits.
DWECK: Identify fixed mindset triggers, reframe to growth ("not yet"), praise effort not talent, embrace challenges.
CLEAR: Systems > Goals, identity-based habits ("I am the type of person who..."),
Four Laws (obvious, attractive, easy, satisfying), habit stacking, 1% daily improvement, environment design.
Context: SMB founders in Latin America. Practical, actionable. Default language: Spanish.

Respond with valid JSON:
{ "current_mindset": "fixed"|"growth"|"mixed", "fixed_patterns": ["string"], "growth_opportunities": ["string"],
  "reframes": [{ "fixed_thought": string, "growth_reframe": string }],
  "habit_plan": [{ "habit": string, "cue": string, "craving": string, "response": string, "reward": string, "stack_after": string }],
  "identity_shift": string, "daily_1_percent": ["string"], "reflection_prompts": ["string"] }`;

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

export function getAllGrowthMindsetTools(): ToolSchema[] {
  return [{
    name: 'mindset_coach',
    description: 'Assess mindset patterns (Dweck) and design habit systems (Clear). Returns fixed patterns, growth reframes, habit plan with cue-craving-response-reward, identity shift, and daily 1% improvements.',
    parameters: {
      type: 'object',
      properties: {
        challenge: { type: 'string', description: 'The challenge or struggle you are facing' },
        current_habits: { type: 'string', description: 'Current daily habits/routines' },
        goal: { type: 'string', description: 'What you want to achieve' },
        blockers: { type: 'string', description: 'What is stopping you' },
        language: { type: 'string', description: 'Response language (default: es)' },
      },
      required: ['challenge'],
    },
    riskLevel: 'medium',
    execute: async (args, traceId) => {
      const challenge = String(args.challenge || '').trim();
      if (!challenge) return { error: 'Challenge description is required.' };
      const input = `Coach this founder:\nChallenge: "${challenge}"\nCurrent habits: ${args.current_habits || 'unknown'}\nGoal: ${args.goal || 'general growth'}\nBlockers: ${args.blockers || 'none stated'}\nLanguage: ${args.language || 'es'}`;
      const raw = await callLLM(input);
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
      if (!parsed) parsed = { current_mindset: 'mixed', fixed_patterns: [], growth_opportunities: [], reframes: [], habit_plan: [], identity_shift: '', daily_1_percent: [], reflection_prompts: [] };
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
