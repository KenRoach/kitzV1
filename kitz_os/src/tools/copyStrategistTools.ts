/**
 * Copy Strategist Tools — Headlines, CTAs, email copy, ad copy, WhatsApp messages.
 *
 * 1 tool:
 *   - copy_create (low) — Generate conversion copy: headlines, CTAs, email subjects, ad copy
 *
 * Uses Claude Sonnet for quality copy, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('copyStrategistTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM_PROMPT = `You are a conversion copywriter trained in Copyhackers (Joanna Wiebe), Claude Hopkins, and David Ogilvy.
Write copy that converts. Lead with benefits. Use voice-of-customer data. Headlines stop scrolling. CTAs reduce friction.
Default language: Spanish. Adapt for WhatsApp-first LatAm businesses.

Respond with valid JSON:
{ "headlines": [{ "text": string, "type": string, "targetEmotion": string }],
  "ctas": [{ "text": string, "placement": string }],
  "emailSubjectLines": [string],
  "adCopy": [{ "platform": string, "text": string, "hook": string }],
  "whatsappMessages": [string],
  "frameworkUsed": string, "actionSteps": [string] }`;



export function getAllCopyStrategistTools(): ToolSchema[] {
  return [{
    name: 'copy_create',
    description: 'Generate conversion copy: headlines (5 types), CTAs, email subject lines, ad copy for Instagram/WhatsApp, and WhatsApp sales messages. Copyhackers methodology.',
    parameters: {
      type: 'object',
      properties: {
        product: { type: 'string', description: 'Product or service name' },
        target_audience: { type: 'string', description: 'Who is this for' },
        key_benefit: { type: 'string', description: 'Main benefit/transformation' },
        goal: { type: 'string', enum: ['sell', 'lead_gen', 'awareness', 'engagement', 'retention'], description: 'Marketing goal' },
        tone: { type: 'string', enum: ['casual', 'professional', 'urgent', 'playful', 'authoritative'], description: 'Tone (default: casual)' },
        platform: { type: 'string', description: 'Primary platform (WhatsApp, Instagram, etc.)' },
        existing_copy: { type: 'string', description: 'Current copy to improve (optional)' },
      },
      required: ['product', 'target_audience', 'key_benefit'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const input = `Copy for: ${args.product}\nAudience: ${args.target_audience}\nBenefit: ${args.key_benefit}\nGoal: ${args.goal || 'sell'}\nTone: ${args.tone || 'casual'}` +
        (args.platform ? `\nPlatform: ${args.platform}` : '') +
        (args.existing_copy ? `\nImprove this: ${args.existing_copy}` : '');
      const raw = await callLLM(SYSTEM_PROMPT, input, { temperature: 0.5 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse response' }; } catch { parsed = { raw_copy: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
