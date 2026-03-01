/** Document management, organization, digitization, compliance */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('documentArchiveAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';
const SYS = 'Document management specialist for LatAm SMBs. Organization, digitization, compliance. Spanish default. Respond with JSON.';

export function getAllDocumentArchiveAdvisorTools(): ToolSchema[] {
  return [{ name: 'document_archive_advise', description: 'Document management, organization, digitization, compliance', parameters: { type: "object", properties: { business_type: { type: "string", description: "Business type" }, document_volume: { type: "string", description: "Document volume" }, country: { type: "string", description: "Country" } }, required: ["business_type"] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYS, JSON.stringify(args)); let p; try { const m = raw.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { p = { raw }; } log.info('executed', { trace_id: traceId }); return p; } }];
}
