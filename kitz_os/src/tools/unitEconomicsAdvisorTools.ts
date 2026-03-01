/** CAC, LTV, payback period, contribution margin analysis */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('unitEconomicsAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Unit economics advisor for LatAm SMBs. CAC, LTV, payback. Be direct. Spanish default. Respond with JSON.';
export function getAllUnitEconomicsAdvisorTools(): ToolSchema[] {
  return [{ name: 'unit_economics_analyze', description: 'CAC, LTV, payback period, contribution margin analysis', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, cac: { type: "number", description: "Customer acquisition cost" }, average_revenue: { type: "number", description: "Average monthly revenue per customer" }, gross_margin: { type: "number", description: "Gross margin %" }, churn_rate: { type: "number", description: "Monthly churn rate %" } }, required: ["business", "cac", "average_revenue", "gross_margin", "churn_rate"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
