/**
 * Supply Chain Advisor Tools — Supplier evaluation, negotiation, logistics.
 * 1 tool: supply_chain_advise (low)
 */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('supplyChainAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const SYSTEM = 'You are a supply chain advisor for LatAm SMBs. Evaluate suppliers, negotiate terms, optimize logistics. Spanish default. Respond with JSON: { "negotiationScripts": [string], "logisticsOptimization": [string], "costReduction": [string], "riskMitigation": [string], "actionSteps": [string] }';



export function getAllSupplyChainAdvisorTools(): ToolSchema[] {
  return [{ name: 'supply_chain_advise', description: 'Get supply chain advice: supplier evaluation, negotiation scripts, logistics optimization, cost reduction tips.', parameters: { type: 'object', properties: { business: { type: 'string', description: 'Business name' }, suppliers: { type: 'string', description: 'JSON of suppliers: [{ "name": string, "products": string, "monthlySpend": number }]' }, challenges: { type: 'string', description: 'Current challenges' }, country: { type: 'string', description: 'Country' } }, required: ['business'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYSTEM, `Supply chain for: ${args.business}\nSuppliers: ${args.suppliers || '[]'}\nCountry: ${args.country || 'LatAm'}\nChallenges: ${args.challenges || 'general'}`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } log.info('executed', { trace_id: traceId }); return parsed; } }];
}
