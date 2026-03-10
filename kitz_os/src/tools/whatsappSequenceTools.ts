/**
 * WhatsApp Sequence Tools — Build 5-touch outreach sequences for Panama/LATAM prospects.
 *
 * 1 tool:
 *   - whatsapp_sequence_generate (low) — Generate 5-touch WhatsApp outreach sequence
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('whatsappSequenceTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM_PROMPT = `You are the KitZ WhatsApp Sequence Generator. Build 5-touch outreach sequences for Panama/LATAM prospects.
Each message under 160 chars. Day 1: lead with pain. Day 3: value drop with KitZ capability.
Day 5: social proof from Panama. Day 7: soft CTA (15-min call or demo). Day 10: clean exit.
Messages must feel human, not automated. Spanish default.
Flag which steps can be automated via kitz-brain cron.

Respond with valid JSON:
{ "sequenceName": string, "messages": [{ "day": number, "message": string, "goal": string, "canAutomate": boolean }] }`;



export function getAllWhatsappSequenceTools(): ToolSchema[] {
  return [{
    name: 'whatsapp_sequence_generate',
    description: 'Generate a 5-touch WhatsApp outreach sequence (days 1,3,5,7,10) for Panama/LATAM prospects with automation flags.',
    parameters: {
      type: 'object',
      properties: {
        prospect_name: { type: 'string', description: 'Name of the prospect' },
        company: { type: 'string', description: 'Target company name' },
        industry: { type: 'string', description: 'Target industry (e.g., "restaurantes", "retail", "logística")' },
        pain_point: { type: 'string', description: 'Primary pain point to address' },
        relevant_module: { type: 'string', description: 'KitZ module most relevant to the prospect (e.g., "payments", "whatsapp-connector", "workspace")' },
      },
      required: ['prospect_name', 'company', 'industry', 'pain_point', 'relevant_module'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const input = `Prospect: ${args.prospect_name}\nCompany: ${args.company}\nIndustry: ${args.industry}\nPain point: ${args.pain_point}\nRelevant KitZ module: ${args.relevant_module}`;
      const raw = await callLLM(SYSTEM_PROMPT, input, { temperature: 0.3 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_plan: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
