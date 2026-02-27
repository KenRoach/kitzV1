/**
 * Lead Qualification Tools — Score and qualify inbound leads.
 *
 * 1 tool:
 *   - lead_qualify (low) — Score a lead 0-100, classify hot/warm/cold, suggest next action
 *
 * Uses Claude Haiku (fast), falls back to OpenAI gpt-4o-mini.
 */

import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a lead qualification specialist for KITZ, targeting SMBs in Latin America.
Score leads 0-100. Hot (70+): ready to activate. Warm (40-69): needs nurturing. Cold (<40): low priority.
Evaluate: business type fit, engagement, response speed, revenue potential.

Respond with valid JSON:
{ "score": number (0-100), "tier": "hot"|"warm"|"cold", "signals": ["string"],
  "next_action": string, "estimated_monthly_value": number, "conversion_probability": number (0-1) }`;

async function scoreLead(input: string): Promise<string> {
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': CLAUDE_API_VERSION },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 512, temperature: 0.1, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: input }] }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) { const d = await res.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find(c => c.type === 'text')?.text || ''; }
    } catch { /* fall through */ }
  }
  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: input }], max_tokens: 512, temperature: 0.1 }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) { const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; }
    } catch { /* return error */ }
  }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllLeadQualificationTools(): ToolSchema[] {
  return [{
    name: 'lead_qualify',
    description: 'Score and qualify a lead (0-100). Returns tier (hot/warm/cold), signals, next action, estimated value, and conversion probability.',
    parameters: {
      type: 'object',
      properties: {
        contact_name: { type: 'string', description: 'Lead/contact name' },
        business_type: { type: 'string', description: 'Their business type' },
        channel: { type: 'string', description: 'How they reached us (whatsapp, web, referral)' },
        message_history: { type: 'string', description: 'Summary of conversation so far' },
        responsiveness: { type: 'string', enum: ['fast', 'moderate', 'slow'], description: 'How quickly they respond' },
      },
      required: ['contact_name'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const name = String(args.contact_name || '').trim();
      if (!name) return { error: 'Contact name is required.' };
      const input = `Lead: ${name}\nBusiness: ${args.business_type || 'unknown'}\nChannel: ${args.channel || 'unknown'}\nResponsiveness: ${args.responsiveness || 'unknown'}\nHistory: ${args.message_history || 'none'}`;
      const raw = await scoreLead(input);
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { score: 50, tier: 'warm' }; } catch { parsed = { score: 50, tier: 'warm' }; }
      console.log(JSON.stringify({ ts: new Date().toISOString(), module: 'leadQualificationTools', contact: name, score: parsed.score, tier: parsed.tier, trace_id: traceId }));
      return parsed;
    },
  }];
}
