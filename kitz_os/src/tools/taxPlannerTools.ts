/** Tax optimization, deductions, filing strategy by country */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('taxPlannerTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Tax planning advisor for LatAm SMBs. ITBMS, ISR, IVA by country. Spanish default. Respond with JSON.';
export function getAllTaxPlannerTools(): ToolSchema[] {
  return [{ name: 'tax_plan', description: 'Tax optimization, deductions, filing strategy by country', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, country: { type: "string", description: "Country" }, revenue: { type: "number", description: "Annual revenue" }, expenses: { type: "number", description: "Annual expenses" } }, required: ["business", "country"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
