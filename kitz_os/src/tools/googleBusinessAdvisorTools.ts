/** Google My Business optimization, Search Console, local SEO */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('googleBusinessAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Google Business advisor for LatAm SMBs. GMB, Search Console, local SEO. Spanish default. Respond with JSON.';
export function getAllGoogleBusinessAdvisorTools(): ToolSchema[] {
  return [{ name: 'google_business_advise', description: 'Google My Business optimization, Search Console, local SEO', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, industry: { type: "string", description: "Industry" }, location: { type: "string", description: "Business location" } }, required: ["business", "industry", "location"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
