/** Invoice management, payment terms, collections, compliance */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('invoicingAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Invoicing and collections specialist for LatAm SMBs. Electronic invoicing. Spanish default. Respond with JSON.';

export function getAllInvoicingAdvisorTools(): ToolSchema[] {
  return [{ name: 'invoicing_advise', description: 'Invoice management, payment terms, collections, compliance', parameters: { type: "object", properties: { business_type: { type: "string", description: "Business type" }, country: { type: "string", description: "Country" }, monthly_invoices: { type: "number", description: "Monthly invoices" } }, required: ["business_type"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
