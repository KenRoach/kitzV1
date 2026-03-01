/** Psychological safety assessment, trust-building practices, feedback frameworks */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('psychologicalSafetyAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Psychological safety advisor (Edmondson) for LatAm SMBs. Trust, feedback. Spanish default. Respond with JSON.';
export function getAllPsychologicalSafetyAdvisorTools(): ToolSchema[] {
  return [{ name: 'psych_safety_advise', description: 'Psychological safety assessment, trust-building practices, feedback frameworks', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, team_size: { type: "number", description: "Team size" }, challenges: { type: "string", description: "Current challenges" } }, required: ["business", "team_size"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
