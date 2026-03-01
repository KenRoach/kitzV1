/**
 * Customer Onboarding Tools — Guide new customers to first value in <10 minutes.
 *
 * 1 tool:
 *   - onboarding_plan (medium) — Generate personalized onboarding plan
 *
 * Uses Claude Sonnet for personalization, falls back to OpenAI gpt-4o.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('customerOnboardingTools');
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are an onboarding specialist for KITZ, an AI business OS for Latin American SMBs.
Create a personalized onboarding plan: <10 minutes to first value.
Breakthrough moment: when they see THEIR OWN data in the system (identity shift).
Steps should be concrete with WhatsApp message drafts. Default language: Spanish.

Respond with valid JSON:
{ "steps": [{ "step": number, "action": string, "channel": "whatsapp"|"web"|"email",
  "message_draft": string, "wait_minutes": number }],
  "estimated_minutes": number, "first_value_action": string, "breakthrough_moment": string }`;

async function generatePlan(input: string): Promise<string> {
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': CLAUDE_API_VERSION },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2048, temperature: 0.3, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: input }] }),
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
        body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: input }], max_tokens: 2048, temperature: 0.3 }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) { const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; }
    } catch { /* return error */ }
  }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllCustomerOnboardingTools(): ToolSchema[] {
  return [{
    name: 'onboarding_plan',
    description: 'Generate a personalized customer onboarding plan. Target: <10 minutes to first value. Returns step-by-step with WhatsApp message drafts.',
    parameters: {
      type: 'object',
      properties: {
        customer_name: { type: 'string', description: 'New customer name' },
        business_type: { type: 'string', description: 'Their business type (restaurant, store, consulting, etc.)' },
        channel: { type: 'string', enum: ['whatsapp', 'web', 'email'], description: 'Primary channel (default: whatsapp)' },
        tier: { type: 'string', enum: ['starter', 'hustler'], description: 'Customer tier (default: starter)' },
      },
      required: ['customer_name'],
    },
    riskLevel: 'medium',
    execute: async (args, traceId) => {
      const name = String(args.customer_name || '').trim();
      if (!name) return { error: 'Customer name is required.' };
      const input = `Name: ${name}\nBusiness: ${args.business_type || 'unknown'}\nChannel: ${args.channel || 'whatsapp'}\nTier: ${args.tier || 'starter'}`;
      const raw = await generatePlan(input);
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { steps: [], error: 'Failed to parse' }; } catch { parsed = { steps: [], error: 'Failed to parse' }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
