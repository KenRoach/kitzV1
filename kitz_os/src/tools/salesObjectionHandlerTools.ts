/**
 * Sales Objection Handler Tools — Chris Voss tactical empathy scripts.
 *
 * 1 tool:
 *   - objection_handle (low) — Get objection handling scripts with labeling, mirroring, calibrated questions
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('salesObjectionHandlerTools');
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a sales coach using Chris Voss tactical empathy for Latin American businesses.
Handle objections with labels ("Parece que..."), mirrors, calibrated questions ("¿Cómo...?").
Never aggressive. Cover price, timing, trust, need, competition objections. Default language: Spanish.

Respond with valid JSON:
{ "scripts": [{ "objection": string, "category": string, "tacticalResponse": string,
  "vossLabel": string, "mirrorQuestion": string, "calibratedQuestion": string, "reframe": string }],
  "generalPrinciples": [string], "closingStrategies": [string], "actionSteps": [string] }`;

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

export function getAllSalesObjectionHandlerTools(): ToolSchema[] {
  return [{
    name: 'objection_handle',
    description: 'Get sales objection handling scripts using Chris Voss tactical empathy: labeling, mirroring, calibrated questions, and reframes for price/timing/trust/need/competition objections.',
    parameters: {
      type: 'object',
      properties: {
        product: { type: 'string', description: 'Product or service being sold' },
        price: { type: 'number', description: 'Price of product/service' },
        specific_objection: { type: 'string', description: 'The specific objection to handle (e.g., "Está muy caro")' },
        customer_type: { type: 'string', description: 'Type of customer' },
        currency: { type: 'string', description: 'Currency (default: USD)' },
      },
      required: ['product', 'price'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const input = `Objection handling for: ${args.product} (${args.currency || 'USD'} ${args.price})` +
        (args.specific_objection ? `\nObjection: "${args.specific_objection}"` : '') +
        (args.customer_type ? `\nCustomer: ${args.customer_type}` : '');
      const raw = await callLLM(input);
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_advice: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
