/**
 * Inbox Triage Tools — Classify inbound messages by intent, urgency, sentiment.
 *
 * 1 tool:
 *   - inbox_triage (low) — Classify and route inbound message
 *
 * Uses Claude Haiku (fast classification), falls back to OpenAI gpt-4o-mini.
 */

import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are an inbox triage agent for small businesses in Latin America.
Classify every inbound message: intent, urgency, sentiment, handler, suggested SOP, auto-reply draft.
SLA: critical=15min, high=1hr, medium=4hr, low=24hr. Default language: Spanish.

Respond with valid JSON:
{ "intent": "order"|"support"|"inquiry"|"complaint"|"payment"|"greeting"|"spam"|"other",
  "urgency": "low"|"medium"|"high"|"critical", "sentiment": "positive"|"negative"|"neutral"|"mixed",
  "suggested_handler": "string", "suggested_sop": "string|null",
  "auto_reply_draft": "string (5-15 words, warm, Spanish)",
  "response_deadline_minutes": number, "tags": ["string"] }`;

async function triageMessage(message: string, channel: string): Promise<string> {
  const userMsg = `Channel: ${channel}\nMessage: "${message}"`;
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': CLAUDE_API_VERSION },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 512, temperature: 0.1, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: userMsg }] }),
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
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userMsg }], max_tokens: 512, temperature: 0.1 }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) { const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; }
    } catch { /* return error */ }
  }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllInboxTriageTools(): ToolSchema[] {
  return [{
    name: 'inbox_triage',
    description: 'Classify an inbound message by intent (order/support/inquiry/complaint/payment/greeting/spam), urgency, sentiment. Suggests handler, SOP, and auto-reply draft. SLA-aware.',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'The inbound message text' },
        channel: { type: 'string', enum: ['whatsapp', 'email', 'web', 'sms'], description: 'Source channel (default: whatsapp)' },
        sender_name: { type: 'string', description: 'Sender name if known' },
      },
      required: ['message'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const message = String(args.message || '').trim();
      if (!message) return { error: 'Message is required.' };
      const raw = await triageMessage(message, String(args.channel || 'whatsapp'));
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { intent: 'other', urgency: 'medium' }; } catch { parsed = { intent: 'other', urgency: 'medium' }; }
      console.log(JSON.stringify({ ts: new Date().toISOString(), module: 'inboxTriageTools', intent: parsed.intent, urgency: parsed.urgency, trace_id: traceId }));
      return parsed;
    },
  }];
}
