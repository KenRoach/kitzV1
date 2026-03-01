/** PIX Brazil instant payments setup and optimization */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('pixIntegrationAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'PIX integration expert. QR codes, webhooks, BCB compliance. Portuguese/Spanish default. Respond with JSON.';

export function getAllPixIntegrationAdvisorTools(): ToolSchema[] {
  return [{ name: 'pix_integration_advise', description: 'PIX Brazil instant payments setup and optimization', parameters: { type: "object", properties: { business_type: { type: "string", description: "Business type" }, monthly_volume: { type: "string", description: "Monthly volume" }, challenges: { type: "string", description: "Challenges" } }, required: ["business_type"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
