/**
 * Referral Program Builder Tools — Incentive structures, viral loops, ambassador programs.
 *
 * 1 tool:
 *   - referral_build (low) — Design a referral/ambassador program with tiers, rewards, WhatsApp flow
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('referralProgramBuilderTools');
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a growth strategist specializing in referral programs for small businesses in Latin America.
WhatsApp-first referral programs with simple mechanics. Word of mouth is king in LatAm.
Keep tracking simple (WhatsApp codes, not complex software). Default language: Spanish.

Respond with valid JSON:
{ "programName": string, "type": string,
  "tiers": [{ "name": string, "referralsNeeded": number, "reward": string, "rewardValue": number }],
  "referrerReward": string, "refereeReward": string, "mechanics": string,
  "whatsappFlow": [string], "messagingTemplates": [{ "trigger": string, "message": string }],
  "costPerReferral": string, "actionSteps": [string] }`;

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

export function getAllReferralProgramBuilderTools(): ToolSchema[] {
  return [{
    name: 'referral_build',
    description: 'Design a referral/ambassador program: tiered rewards, WhatsApp flow, messaging templates, tracking method. Optimized for word-of-mouth growth in LatAm.',
    parameters: {
      type: 'object',
      properties: {
        business: { type: 'string', description: 'Business name' },
        product: { type: 'string', description: 'Product or service' },
        average_order_value: { type: 'number', description: 'Average order value' },
        current_customers: { type: 'number', description: 'Number of current customers' },
        budget: { type: 'number', description: 'Monthly budget for referral rewards' },
        currency: { type: 'string', description: 'Currency (default: USD)' },
      },
      required: ['business', 'product', 'average_order_value'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const input = `Referral program for: ${args.business}\nProduct: ${args.product}\nAOV: ${args.currency || 'USD'} ${args.average_order_value}` +
        (args.current_customers ? `\nCustomers: ${args.current_customers}` : '') +
        (args.budget ? `\nBudget: ${args.currency || 'USD'} ${args.budget}` : '');
      const raw = await callLLM(input);
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_plan: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
