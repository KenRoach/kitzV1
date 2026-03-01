/**
 * Cold Outreach Coach Tools — WhatsApp/email outreach sequences.
 *
 * 1 tool:
 *   - outreach_plan (low) — Generate cold outreach sequence with messages, personalization, templates
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('coldOutreachCoachTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM_PROMPT = `You are a cold outreach coach for small businesses in Latin America.
Personalized, non-spammy WhatsApp/email/Instagram DM outreach. Lead with value.
WhatsApp messages under 3 lines. Follow up 3-5 times. Never pushy. Default language: Spanish.

Respond with valid JSON:
{ "sequenceName": string, "totalSteps": number,
  "messages": [{ "step": number, "channel": string, "dayFromStart": number, "messageDraft": string, "goal": string }],
  "personalizationTips": [string], "doNotDo": [string],
  "responseTemplates": [{ "trigger": string, "response": string }],
  "conversionTarget": string, "actionSteps": [string] }`;



export function getAllColdOutreachCoachTools(): ToolSchema[] {
  return [{
    name: 'outreach_plan',
    description: 'Generate cold outreach sequence: multi-step WhatsApp/email messages, personalization tips, response templates, and conversion targets for sales or partnerships.',
    parameters: {
      type: 'object',
      properties: {
        business: { type: 'string', description: 'Your business name' },
        product: { type: 'string', description: 'Product or service you want to sell/promote' },
        target_profile: { type: 'string', description: 'Who you want to reach (e.g., "restaurantes en Ciudad de Panamá")' },
        goal: { type: 'string', enum: ['sell', 'partner', 'collaborate', 'recruit'], description: 'Outreach goal' },
        value_proposition: { type: 'string', description: 'Main value you offer' },
        channel: { type: 'string', description: 'Primary channel (default: WhatsApp)' },
      },
      required: ['business', 'product', 'target_profile', 'value_proposition'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const input = `Outreach for: ${args.business}\nProduct: ${args.product}\nTarget: ${args.target_profile}\nGoal: ${args.goal || 'sell'}\nValue: ${args.value_proposition}` + (args.channel ? `\nChannel: ${args.channel}` : '');
      const raw = await callLLM(SYSTEM_PROMPT, input, { temperature: 0.3 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_plan: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
