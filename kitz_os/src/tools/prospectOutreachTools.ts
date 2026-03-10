/**
 * Prospect Outreach Tools — Generate personalized first-touch messages per channel.
 *
 * 1 tool:
 *   - prospect_outreach_generate (low) — Generate multi-channel first-touch outreach messages
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('prospectOutreachTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM_PROMPT = `You are the KitZ Prospect Outreach Generator for LATAM businesses.
Generate personalized first-touch messages per channel. WhatsApp under 160 chars, email with subject + body,
LinkedIn connection note, Instagram DM. Spanish default. Always anchor to LATAM business reality.
Reference KitZ capabilities where natural.

Respond with valid JSON:
{ "whatsappMessage": string, "emailSubject": string, "emailBody": string,
  "linkedinMessage": string, "instagramDM": string }`;



export function getAllProspectOutreachTools(): ToolSchema[] {
  return [{
    name: 'prospect_outreach_generate',
    description: 'Generate personalized first-touch outreach messages for WhatsApp, Email, LinkedIn, and Instagram DM targeting LATAM businesses.',
    parameters: {
      type: 'object',
      properties: {
        company: { type: 'string', description: 'Target company name' },
        industry: { type: 'string', description: 'Target industry (e.g., "restaurantes", "retail", "logística")' },
        pain_point: { type: 'string', description: 'Primary pain point to address' },
        channel: { type: 'string', description: 'Primary channel focus (default: all)' },
        language: { type: 'string', description: 'Output language (default: es)' },
      },
      required: ['company', 'industry', 'pain_point'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const input = `Company: ${args.company}\nIndustry: ${args.industry}\nPain point: ${args.pain_point}` + (args.channel ? `\nChannel focus: ${args.channel}` : '\nChannel focus: all') + `\nLanguage: ${args.language || 'es'}`;
      const raw = await callLLM(SYSTEM_PROMPT, input, { temperature: 0.3 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw_plan: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
