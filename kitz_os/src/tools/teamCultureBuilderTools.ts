/** Team values, rituals, communication norms, recognition programs */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('teamCultureBuilderTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Team culture builder for LatAm SMBs. Values, rituals, norms. Spanish default. Respond with JSON.';
export function getAllTeamCultureBuilderTools(): ToolSchema[] {
  return [{ name: 'team_culture_build', description: 'Team values, rituals, communication norms, recognition programs', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, team_size: { type: "number", description: "Team size" }, challenges: { type: "string", description: "Current challenges" } }, required: ["business", "team_size"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
