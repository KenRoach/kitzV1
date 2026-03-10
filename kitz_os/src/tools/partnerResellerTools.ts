/**
 * Partner Reseller Tools — Generate co-branded reseller kits for LATAM IT partners.
 *
 * 1 tool:
 *   - partner_kit_generate (low) — Build co-branded materials, pitch script, and commission structure
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('partnerResellerTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';


const SYSTEM_PROMPT = `You are the KitZ Partner Reseller Kit Generator. Build co-branded materials for IT resellers in LATAM.
Position as "[Reseller] powered by KitZ". Lead modules: WhatsApp automation, workspace CRM, RenewFlow, QuoteFlow, AI Battery.
Yappy/BAC mandatory in payments. Spanish default. Output in JSON.`;


export function getAllPartnerResellerTools(): ToolSchema[] {
  return [{
    name: 'partner_kit_generate',
    description: 'Generate a co-branded partner reseller kit including one-pager, pitch script, and commission structure for LATAM IT resellers.',
    parameters: {
      type: 'object',
      properties: {
        reseller_name: { type: 'string', description: 'Reseller contact name' },
        company: { type: 'string', description: 'Reseller company name' },
        client_vertical: { type: 'string', description: 'Target client vertical (e.g., restaurants, retail, professional services)' },
        current_services: { type: 'string', description: 'Services the reseller currently offers' },
      },
      required: ['reseller_name', 'company', 'client_vertical', 'current_services'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const input = `Reseller: ${args.reseller_name}\nCompany: ${args.company}\nClient vertical: ${args.client_vertical}\nCurrent services: ${args.current_services}\n\nRespond with valid JSON:\n{ "onePager": { "headline": string, "painPoints": [string], "modules": [string], "paymentOptions": string }, "pitchScript": string, "commissionStructure": { "marginOnCredits": string, "referralFee": string, "model": string } }`;
      const raw = await callLLM(SYSTEM_PROMPT, input, { temperature: 0.3 });
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse' }; } catch { parsed = { raw: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
