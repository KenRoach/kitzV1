/** Fundraising strategy, pitch deck outline, investor targeting, term sheets */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('fundraisingAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Fundraising advisor for LatAm startups. Angels, VCs, grants. Realistic. Spanish default. Respond with JSON.';
export function getAllFundraisingAdvisorTools(): ToolSchema[] {
  return [{ name: 'fundraising_advise', description: 'Fundraising strategy, pitch deck outline, investor targeting, term sheets', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, stage: { type: "string", description: "Stage (pre-seed, seed, etc.)" }, revenue: { type: "number", description: "Monthly revenue" }, seeking: { type: "number", description: "Amount seeking" } }, required: ["business", "stage"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
