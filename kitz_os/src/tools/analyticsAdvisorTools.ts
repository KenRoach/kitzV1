/** KPI recommendations, dashboard design, data-driven decision making */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('analyticsAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Analytics advisor for LatAm SMBs. KPIs, dashboards, simple tools. Spanish default. Respond with JSON.';
export function getAllAnalyticsAdvisorTools(): ToolSchema[] {
  return [{ name: 'analytics_advise', description: 'KPI recommendations, dashboard design, data-driven decision making', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, industry: { type: "string", description: "Industry" }, goals: { type: "string", description: "Business goals" } }, required: ["business", "industry"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
