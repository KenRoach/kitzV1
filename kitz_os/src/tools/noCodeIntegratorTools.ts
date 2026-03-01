/** Plan no-code integrations between tools (Zapier, Make, n8n, Airtable) */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('noCodeIntegratorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'No-code integration advisor for LatAm SMBs. Zapier, Make, n8n. Spanish default. Respond with JSON.';
export function getAllNoCodeIntegratorTools(): ToolSchema[] {
  return [{ name: 'nocode_integrate', description: 'Plan no-code integrations between tools (Zapier, Make, n8n, Airtable)', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, current_tools: { type: "string", description: "Comma-separated current tools" }, needs: { type: "string", description: "Integration needs" } }, required: ["business", "current_tools"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
