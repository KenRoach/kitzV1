/**
 * Email Sequence Builder Tools — Nurture sequences, drip campaigns, segmentation.
 *
 * 1 tool:
 *   - email_sequence_build (medium) — Build an automated email sequence with segment rules
 *
 * Uses Claude Sonnet, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('emailSequenceBuilderTools');
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are an email marketing strategist for small businesses in Latin America.
Build email sequences that nurture relationships and drive conversions.
Keep emails short (< 200 words), mobile-friendly, action-oriented.
Subject lines < 50 characters. Default language: Spanish.

Respond with valid JSON:
{ "sequenceName": string, "sequenceType": string, "totalEmails": number, "durationDays": number,
  "emails": [{ "day": number, "subject": string, "previewText": string, "bodyOutline": string,
    "cta": string, "goal": string, "tone": string }],
  "segments": [{ "name": string, "criteria": string, "sequenceType": string }],
  "automationTrigger": string,
  "metrics": { "targetOpenRate": string, "targetClickRate": string, "targetConversion": string },
  "bestPractices": [string], "actionSteps": [string] }`;

async function callLLM(input: string): Promise<string> {
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': CLAUDE_API_VERSION },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, temperature: 0.4, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: input }] }),
        signal: AbortSignal.timeout(20_000),
      });
      if (res.ok) { const d = await res.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find(c => c.type === 'text')?.text || ''; }
    } catch { /* fall through */ }
  }
  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: input }], max_tokens: 1500, temperature: 0.4 }),
        signal: AbortSignal.timeout(20_000),
      });
      if (res.ok) { const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; }
    } catch { /* return error */ }
  }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllEmailSequenceBuilderTools(): ToolSchema[] {
  return [{
    name: 'email_sequence_build',
    description: 'Build an automated email sequence: welcome, nurture, sales, onboarding, re-engagement, or upsell. Returns email schedule with subjects, outlines, CTAs, segment rules, and automation triggers.',
    parameters: {
      type: 'object',
      properties: {
        business: { type: 'string', description: 'Business name' },
        product: { type: 'string', description: 'Product or service' },
        goal: { type: 'string', enum: ['welcome', 'nurture', 'sell', 'onboard', 'reengage', 'upsell'], description: 'Sequence goal' },
        target_audience: { type: 'string', description: 'Who receives these emails' },
        email_count: { type: 'number', description: 'Number of emails (default: 5)' },
        duration_days: { type: 'number', description: 'Sequence duration in days (default: 14)' },
      },
      required: ['business', 'product', 'goal', 'target_audience'],
    },
    riskLevel: 'medium',
    execute: async (args, traceId) => {
      const input = `Email sequence for: ${args.business}\nProduct: ${args.product}\nGoal: ${args.goal}\n` +
        `Audience: ${args.target_audience}\nEmails: ${args.email_count || 5}\nDuration: ${args.duration_days || 14} days`;
      const raw = await callLLM(input);
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse response' }; } catch { parsed = { raw_plan: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
