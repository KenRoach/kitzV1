/** Email/WhatsApp automated sequences, triggers, optimization */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('dripCampaignAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Drip campaign expert for LatAm SMBs. Email + WhatsApp sequences, automation. Spanish default. Respond with JSON.';

export function getAllDripCampaignAdvisorTools(): ToolSchema[] {
  return [{ name: 'drip_campaign_advise', description: 'Email/WhatsApp automated sequences, triggers, optimization', parameters: { type: "object", properties: { business_type: { type: "string", description: "Business type" }, goal: { type: "string", description: "Campaign goal" }, list_size: { type: "number", description: "List size" } }, required: ["business_type"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
