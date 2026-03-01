/** Cost reduction, subscription audit, vendor negotiation */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('expenseOptimizerTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Expense optimization advisor for LatAm SMBs. Find savings, audit subscriptions. Spanish default. Respond with JSON.';
export function getAllExpenseOptimizerTools(): ToolSchema[] {
  return [{ name: 'expense_optimize', description: 'Cost reduction, subscription audit, vendor negotiation', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, expenses: { type: "string", description: "JSON of expenses: [{ category: string, amount: number }]" } }, required: ["business", "expenses"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
