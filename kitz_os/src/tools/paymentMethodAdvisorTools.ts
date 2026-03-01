/**
 * Payment Method Advisor Tools — Gateway selection by country, fees, local methods.
 * 1 tool: payment_method_advise (low)
 */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('paymentMethodAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const SYSTEM = 'You are a payments advisor for LatAm SMBs. Recommend gateways, local methods (Yappy, PIX, OXXO, Nequi). Spanish default. Respond with JSON: { "recommended": { "name": string, "fees": string, "localMethods": [string] }, "alternatives": [object], "feeComparison": string, "actionSteps": [string] }';



export function getAllPaymentMethodAdvisorTools(): ToolSchema[] {
  return [{ name: 'payment_method_advise', description: 'Get payment method recommendations by country: gateways, local methods (Yappy/PIX/OXXO/Nequi), fee comparison.', parameters: { type: 'object', properties: { business: { type: 'string', description: 'Business name' }, country: { type: 'string', description: 'Country (Panama, Mexico, Colombia, Brazil, etc.)' }, monthly_volume: { type: 'number', description: 'Monthly payment volume' }, currency: { type: 'string', description: 'Currency' } }, required: ['business', 'country'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYSTEM, `Payments for: ${args.business} in ${args.country}\nVolume: ${args.currency || 'USD'} ${args.monthly_volume || 0}/mo`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } log.info('executed', { trace_id: traceId }); return parsed; } }];
}
