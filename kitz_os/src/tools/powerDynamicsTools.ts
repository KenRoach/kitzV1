/**
 * Power Dynamics Tools — Robert Greene's 4 masterworks for business.
 *
 * 1 tool:
 *   - power_analyze (medium) — Analyze power dynamics using 48 Laws, 33 Strategies, Human Nature, Mastery
 *
 * Uses Claude Sonnet, falls back to OpenAI gpt-4o.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('powerDynamicsTools');
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM = `You are a power dynamics advisor trained on Robert Greene's four masterworks.
48 LAWS OF POWER: Never outshine the master (1), Use enemies (2), Conceal intentions (3), Say less (4), Guard reputation (5), Win through actions (9), Use selective honesty (12), Concentrate forces (23), Re-create yourself (25).
33 STRATEGIES OF WAR: Identify end-state first, unconventional approaches, know when to retreat, controlled aggression, alliance strategy.
LAWS OF HUMAN NATURE: Read emotional patterns, understand hidden motivations, influence through empathy not force, manage your shadow side.
MASTERY: Find your life's task, apprenticeship, creative-active phase, deep practice.
Context: SMB founders navigating business relationships in LatAm. Power for building, not destroying. Default language: Spanish.

Respond with valid JSON:
{ "situation_read": string,
  "power_dynamics": [{ "player": string, "power_level": string, "motivations": string, "vulnerabilities": string }],
  "applicable_laws": [{ "law_number": number, "law": string, "application": string, "caution": string }],
  "strategy": { "approach": string, "offensive_moves": ["string"], "defensive_moves": ["string"], "unconventional_moves": ["string"] },
  "human_nature_read": { "their_emotional_state": string, "hidden_motivations": string, "influence_approach": string },
  "warnings": ["string"], "action_plan": ["string"] }`;

async function callLLM(input: string): Promise<string> {
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': CLAUDE_API_VERSION },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1536, temperature: 0.5, system: SYSTEM, messages: [{ role: 'user', content: input }] }),
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
        body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: input }], max_tokens: 1536, temperature: 0.5 }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) { const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; }
    } catch { /* return error */ }
  }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllPowerDynamicsTools(): ToolSchema[] {
  return [{
    name: 'power_analyze',
    description: 'Analyze power dynamics using Robert Greene\'s frameworks (48 Laws, 33 Strategies, Human Nature, Mastery). Returns player analysis, applicable laws, strategy with offensive/defensive/unconventional moves, and human nature read.',
    parameters: {
      type: 'object',
      properties: {
        situation: { type: 'string', description: 'The situation to analyze' },
        players: { type: 'string', description: 'Key players involved' },
        your_goal: { type: 'string', description: 'What you want to achieve' },
        your_position: { type: 'string', enum: ['stronger', 'equal', 'weaker', 'unknown'], description: 'Your relative power position' },
        context_type: { type: 'string', enum: ['negotiation', 'partnership', 'competition', 'team', 'leadership'], description: 'Type of interaction' },
        language: { type: 'string', description: 'Response language (default: es)' },
      },
      required: ['situation'],
    },
    riskLevel: 'medium',
    execute: async (args, traceId) => {
      const situation = String(args.situation || '').trim();
      if (!situation) return { error: 'Situation is required.' };
      const input = `Analyze power dynamics:\n"${situation}"\nPlayers: ${args.players || 'unknown'}\nGoal: ${args.your_goal || 'unknown'}\nPosition: ${args.your_position || 'unknown'}\nContext: ${args.context_type || 'general'}\nLanguage: ${args.language || 'es'}`;
      const raw = await callLLM(input);
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
      if (!parsed) parsed = { situation_read: situation, power_dynamics: [], applicable_laws: [], strategy: {}, human_nature_read: {}, warnings: [], action_plan: [] };
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
