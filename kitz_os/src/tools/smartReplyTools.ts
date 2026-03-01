/**
 * Smart Reply Tools — Generate quick reply options for WhatsApp conversations.
 *
 * 1 tool:
 *   - smartreply_generate (low) — Generate 3 reply options with recommendation
 *
 * Uses Claude Haiku (fast), falls back to OpenAI gpt-4o-mini.
 * Spanish-first, 5-15 words per reply, warm + professional.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('smartReplyTools');
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `Generate smart reply options for a business WhatsApp conversation.
Context: small businesses in Latin America communicating with customers.
Replies: 3 options, 5-15 words each, natural and actionable.
Default language: Spanish unless conversation is in another language.
Tone: direct, warm, professional. Never rude.

Respond with valid JSON:
{ "replies": ["string", "string", "string"], "recommended": number (0-indexed best option) }`;

async function generateReplies(conversation: string): Promise<string> {
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': CLAUDE_API_VERSION },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001', max_tokens: 512, temperature: 0.4,
          system: SYSTEM_PROMPT, messages: [{ role: 'user', content: conversation }],
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const data = await res.json() as { content: Array<{ type: string; text?: string }> };
        return data.content?.find(c => c.type === 'text')?.text || '';
      }
    } catch { /* fall through */ }
  }
  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: conversation }],
          max_tokens: 512, temperature: 0.4,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        return data.choices?.[0]?.message?.content || '';
      }
    } catch { /* return error */ }
  }
  return JSON.stringify({ error: 'No AI available for smart reply' });
}

export function getAllSmartReplyTools(): ToolSchema[] {
  return [
    {
      name: 'smartreply_generate',
      description: 'Generate 3 smart reply options for a WhatsApp business conversation. Returns recommended reply index. Spanish-first, 5-15 words each.',
      parameters: {
        type: 'object',
        properties: {
          conversation: { type: 'string', description: 'Recent conversation messages (format: "Cliente: ... / Negocio: ...")' },
          last_message: { type: 'string', description: 'The last customer message to reply to' },
        },
        required: ['last_message'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const lastMsg = String(args.last_message || '').trim();
        if (!lastMsg) return { error: 'Last message is required.' };
        const input = args.conversation ? `${args.conversation}\nCliente: ${lastMsg}` : `Cliente: ${lastMsg}`;
        const raw = await generateReplies(input);
        let parsed;
        try {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { replies: [raw.slice(0, 100)], recommended: 0 };
        } catch {
          parsed = { replies: [raw.slice(0, 100)], recommended: 0 };
        }
        if (parsed.replies) parsed.replies = parsed.replies.slice(0, 3);
        log.info('executed', { trace_id: traceId });
        return parsed;
      },
    },
  ];
}
