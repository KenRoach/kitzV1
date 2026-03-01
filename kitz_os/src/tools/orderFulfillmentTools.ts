/**
 * Order Fulfillment Tools — Orchestrate end-to-end order processing.
 *
 * 1 tool:
 *   - fulfillment_plan (medium) — Generate fulfillment plan with customer notifications
 *
 * Uses Claude Haiku (fast), falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('orderFulfillmentTools');
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are an order fulfillment coordinator for small businesses in Latin America.
Create a step-by-step fulfillment plan with customer notification drafts.
Flag risks (payment pending, stock issues). Draft-first: all messages need approval. Default language: Spanish.

Respond with valid JSON:
{ "order_id": string, "steps": [{ "step": number, "action": string, "owner": string,
  "message_draft": string|null, "automatable": boolean }],
  "estimated_hours": number, "notifications": ["string"], "risks": ["string"] }`;

async function planFulfillment(input: string): Promise<string> {
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': CLAUDE_API_VERSION },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, temperature: 0.2, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: input }] }),
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
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: input }], max_tokens: 1024, temperature: 0.2 }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) { const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; }
    } catch { /* return error */ }
  }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllOrderFulfillmentTools(): ToolSchema[] {
  return [{
    name: 'fulfillment_plan',
    description: 'Generate an order fulfillment plan with steps, owners, customer notification drafts, and risk flags. For pickup, delivery, or digital orders.',
    parameters: {
      type: 'object',
      properties: {
        order_id: { type: 'string', description: 'Order ID' },
        customer_name: { type: 'string', description: 'Customer name' },
        items: { type: 'string', description: 'JSON array: [{"name":"...", "quantity": 1, "price": 10}]' },
        delivery_method: { type: 'string', enum: ['pickup', 'delivery', 'digital'], description: 'Delivery method' },
        payment_status: { type: 'string', enum: ['pending', 'paid', 'partial'], description: 'Payment status' },
      },
      required: ['order_id', 'customer_name'],
    },
    riskLevel: 'medium',
    execute: async (args, traceId) => {
      const orderId = String(args.order_id || '').trim();
      if (!orderId) return { error: 'Order ID is required.' };
      const input = `Order: ${orderId}\nCustomer: ${args.customer_name}\nItems: ${args.items || '[]'}\nDelivery: ${args.delivery_method || 'pickup'}\nPayment: ${args.payment_status || 'pending'}`;
      const raw = await planFulfillment(input);
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { order_id: orderId, steps: [] }; } catch { parsed = { order_id: orderId, steps: [] }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
