/** Revenue projections, expense budgets, scenario planning */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('budgetForecasterTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Budget forecasting advisor for LatAm SMBs. Revenue projections, scenarios. Spanish default. Respond with JSON.';
export function getAllBudgetForecasterTools(): ToolSchema[] {
  return [{ name: 'budget_forecast', description: 'Revenue projections, expense budgets, scenario planning', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, current_revenue: { type: "number", description: "Monthly revenue" }, current_expenses: { type: "number", description: "Monthly expenses" }, growth_rate: { type: "number", description: "Growth rate %/month" } }, required: ["business", "current_revenue", "current_expenses"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
