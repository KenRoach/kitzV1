/** Job postings, interview questions, evaluation frameworks */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('hiringAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Hiring advisor for LatAm SMBs. Job postings, interviews, evaluation. Spanish default. Respond with JSON.';
export function getAllHiringAdvisorTools(): ToolSchema[] {
  return [{ name: 'hiring_advise', description: 'Job postings, interview questions, evaluation frameworks', parameters: { type: "object", properties: { role: { type: "string", description: "Role to hire" }, business: { type: "string", description: "Business name" }, country: { type: "string", description: "Country" } }, required: ["role", "business"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
