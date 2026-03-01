/**
 * Payment Collection Tools — Payment reminder schedules and follow-up.
 *
 * 1 tool:
 *   - payment_planCollection (medium) — Generate payment reminder schedule
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 * Tone escalation: friendly → firm → urgent. Never threatening.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('paymentCollectionTools');
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a payment collection specialist for small businesses in Latin America.
Create a gentle but effective payment reminder schedule. Escalate: friendly → firm → urgent.
Offer payment options (Yappy, bank transfer, cash). Draft-first. Default language: Spanish. Never threatening.

Respond with valid JSON:
{ "invoice_id": string, "reminders": [{ "day": number, "channel": "whatsapp"|"email"|"sms",
  "message_draft": string, "tone": "friendly"|"firm"|"urgent" }],
  "total_amount": number, "currency": string, "strategy": string }`;

async function planCollection(input: string): Promise<string> {
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

export function getAllPaymentCollectionTools(): ToolSchema[] {
  return [{
    name: 'payment_planCollection',
    description: 'Generate a payment reminder schedule with escalating tone (friendly→firm→urgent). Draft WhatsApp/email messages for each reminder. Never threatening.',
    parameters: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string', description: 'Invoice ID' },
        customer_name: { type: 'string', description: 'Customer name' },
        amount: { type: 'number', description: 'Amount owed' },
        currency: { type: 'string', description: 'Currency (default: USD)' },
        due_date: { type: 'string', description: 'Due date (ISO format)' },
        days_past_due: { type: 'number', description: 'Days past due (0 if not yet due)' },
      },
      required: ['invoice_id', 'customer_name', 'amount'],
    },
    riskLevel: 'medium',
    execute: async (args, traceId) => {
      const invoiceId = String(args.invoice_id || '').trim();
      if (!invoiceId) return { error: 'Invoice ID is required.' };
      const input = `Invoice: ${invoiceId}\nCustomer: ${args.customer_name}\nAmount: ${args.currency || 'USD'} ${args.amount}\nDue: ${args.due_date || 'TBD'}\nDays past due: ${args.days_past_due || 0}`;
      const raw = await planCollection(input);
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { invoice_id: invoiceId, reminders: [] }; } catch { parsed = { invoice_id: invoiceId, reminders: [] }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
