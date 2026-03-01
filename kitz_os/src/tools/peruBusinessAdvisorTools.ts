/** SUNAT, Peruvian labor, IGV, business registration */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('peruBusinessAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Peru business advisor. SUNAT, RUC, IGV, labor, EsSalud, AFP. Spanish default. Respond with JSON.';

export function getAllPeruBusinessAdvisorTools(): ToolSchema[] {
  return [{ name: 'peru_business_advise', description: 'SUNAT, Peruvian labor, IGV, business registration', parameters: { type: "object", properties: { business_type: { type: "string", description: "Business type" }, employees: { type: "number", description: "Employees" }, question: { type: "string", description: "Question" } }, required: ["business_type"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
