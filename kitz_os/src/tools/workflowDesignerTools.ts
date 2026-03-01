/** Design automation workflows using n8n, Zapier, Make */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('workflowDesignerTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Workflow automation designer for LatAm SMBs using n8n. Spanish default. Respond with JSON.';
export function getAllWorkflowDesignerTools(): ToolSchema[] {
  return [{ name: 'workflow_design', description: 'Design automation workflows using n8n, Zapier, Make', parameters: { type: "object", properties: { business: { type: "string", description: "Business name" }, process: { type: "string", description: "Process to automate" }, current_steps: { type: "string", description: "Current manual steps" } }, required: ["business", "process"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
