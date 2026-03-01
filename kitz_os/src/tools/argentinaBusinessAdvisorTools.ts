/** AFIP, Monotributo, Argentine labor, IVA, Ganancias */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('argentinaBusinessAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Argentina business advisor. AFIP, CUIT, Monotributo, labor, ANSES. Spanish default. Respond with JSON.';

export function getAllArgentinaBusinessAdvisorTools(): ToolSchema[] {
  return [{ name: 'argentina_business_advise', description: 'AFIP, Monotributo, Argentine labor, IVA, Ganancias', parameters: { type: "object", properties: { business_type: { type: "string", description: "Business type" }, employees: { type: "number", description: "Employees" }, question: { type: "string", description: "Question" } }, required: ["business_type"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
