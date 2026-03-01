/**
 * LATAM Compliance Navigator Tools — Cross-border compliance, data privacy, trade.
 * 1 tool: latam_compliance_advise (low)
 */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('latamComplianceNavigatorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const SYSTEM = 'You are a LatAm compliance navigator. Expert in data privacy (LGPD, Ley 1581, LFPDPPP, Ley 81), e-commerce regulations, WhatsApp Business rules, cross-border trade. Spanish default. Respond with JSON: { "countries": [object], "crossBorderRules": [string], "dataPrivacy": object, "ecommerceCompliance": [string], "whatsappBusinessRules": [string], "actionSteps": [string] }';



export function getAllLatamComplianceNavigatorTools(): ToolSchema[] {
  return [{ name: 'latam_compliance_advise', description: 'LatAm compliance: data privacy (LGPD/LFPDPPP/Ley 1581), e-commerce rules, WhatsApp Business policies, cross-border trade regulations for multiple countries.', parameters: { type: 'object', properties: { business: { type: 'string', description: 'Business name' }, countries: { type: 'string', description: 'Comma-separated countries' }, sells_online: { type: 'boolean', description: 'Sells online?' }, question: { type: 'string', description: 'Specific compliance question' } }, required: ['business', 'countries'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYSTEM, `Compliance for: ${args.business} in ${args.countries}\nOnline: ${args.sells_online ?? true}${args.question ? `\nQ: ${args.question}` : ''}`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } log.info('executed', { trace_id: traceId }); return parsed; } }];
}
