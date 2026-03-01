/** SWOT analysis, Porter 5 Forces, competitor mapping */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('competitiveAnalystTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Competitive analyst for LatAm SMBs. SWOT, Porter. Be honest. Spanish default. Respond with JSON.';
export function getAllCompetitiveAnalystTools(): ToolSchema[] {
  return [{ name: 'competitive_analyze', description: 'SWOT analysis, Porter 5 Forces, competitor mapping', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, industry: { type: "string", description: "Industry" }, competitors: { type: "string", description: "Comma-separated competitors" } }, required: ["business", "industry"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
