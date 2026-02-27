/**
 * Cold Outreach Coach Tools — WhatsApp/email outreach sequences.
 *
 * 1 tool:
 *   - outreach_plan (low) — Generate cold outreach sequence with messages, personalization, templates
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a cold outreach coach for small businesses in Latin America.
Personalized, non-spammy WhatsApp/email/Instagram DM outreach. Lead with value.
WhatsApp messages under 3 lines. Follow up 3-5 times. Never pushy. Default language: Spanish.

Respond with valid JSON:
{ "sequenceName": string, "totalSteps": number,
  "messages": [{ "step": number, "channel": string, "dayFromStart": number, "messageDraft": string, "goal": string }],
  "personalizationTips": [string], "doNotDo": [string],
  "responseTemplates": [{ "trigger": string, "response": string }],
  "conversionTarget": string, "actionSteps": [string] }`;

async function callLLM(input: string): Promise<string> {
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': CLAUDE_API_VERSION }, body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, temperature: 0.3, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: input }] }), signal: AbortSignal.timeout(15_000) });
      if (res.ok) { const d = await res.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find(c => c.type === 'text')?.text || ''; }
    } catch { /* fall through */ }
  }
  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(OPENAI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: input }], max_tokens: 1024, temperature: 0.3 }), signal: AbortSignal.timeout(15_000) });
      if (res.ok) { const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; }
    } catch { /* return error */ }
  }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllColdOutreachCoachTools(): ToolSchema[] {
  return [{
    name: 'outreach_plan',
    description: 'Generate cold outreach sequence: multi-step WhatsApp/email messages, personalization tips, response templates, and conversion targets for sales or partnerships.',
    parameters: {
      type: 'object',
      properties: {
        business: { type: 'string', description: 'Your business name' },
        product: { type: 'string', description: 'Product or service you want to sell/promote' },
        target_profile: { type: 'string', description: 'Who you want to reach (e.g., "restaurantes en Ciudad de Panamá")' },
        goal: { type: 'string', enum: ['sell', 'partner', 'collaborate', 'recruit'], description: 'Outreach goal' },
        value_proposition: { type: 'string', description: 'Main value you offer' },
        channel: { type: 'string', description: 'Primary channel (default: WhatsApp)' },
      },
      required: ['business', 'product', 'target_profile', 'value_proposition'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const input = `Outreach for: ${args.business}\nProduct: ${args.product}\nTarget: ${args.target_profile}\nGoal: ${args.goal || 'sell'}\nValue: ${args.value_proposition}` + (args.channel ? `\nChannel: ${args.channel}` : '');
      const raw = await callLLM(input);
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_plan: raw }; }
      console.log(JSON.stringify({ ts: new Date().toISOString(), module: 'coldOutreachCoachTools', trace_id: traceId }));
      return parsed;
    },
  }];
}
