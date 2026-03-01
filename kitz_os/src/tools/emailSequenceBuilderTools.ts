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
import { callLLM } from './shared/callLLM.js';


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
      const raw = await callLLM(SYSTEM_PROMPT, input, { temperature: 0.4 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse response' }; } catch { parsed = { raw_plan: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
