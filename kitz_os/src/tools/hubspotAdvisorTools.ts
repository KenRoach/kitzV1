/** HubSpot CRM setup, pipelines, automations, free tier optimization */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('hubspotAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'HubSpot CRM advisor for LatAm SMBs. Free tier optimization. Spanish default. Respond with JSON.';
export function getAllHubspotAdvisorTools(): ToolSchema[] {
  return [{ name: 'hubspot_advise', description: 'HubSpot CRM setup, pipelines, automations, free tier optimization', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, current_crm: { type: "string", description: "Current CRM" }, contact_count: { type: "number", description: "Number of contacts" } }, required: ["business"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
