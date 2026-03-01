/** Salary bands, benefits packages, bonus structures, equity guidance */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('compensationAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Compensation advisor for LatAm SMBs. Salary bands, benefits, bonuses. Spanish default. Respond with JSON.';
export function getAllCompensationAdvisorTools(): ToolSchema[] {
  return [{ name: 'compensation_advise', description: 'Salary bands, benefits packages, bonus structures, equity guidance', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, roles: { type: "string", description: "Comma-separated roles" }, country: { type: "string", description: "Country" } }, required: ["business", "roles", "country"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
