/**
 * Panama Business Advisor Tools — Registration, taxes, labor, compliance.
 * 1 tool: panama_business_advise (low)
 */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('panamaBusinessAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const SYSTEM = 'You are a Panama business advisor. Expert in Registro Público, DGI (ITBMS 7%), CSS, labor code, municipality permits. Spanish default. Respond with JSON: { "registration": object, "taxes": object, "labor": object, "compliance": object, "actionSteps": [string] }';



export function getAllPanamaBusinessAdvisorTools(): ToolSchema[] {
  return [{ name: 'panama_business_advise', description: 'Panama business advice: company registration (S.A., SRL), DGI taxes (ITBMS 7%), CSS social security, labor law, municipality permits.', parameters: { type: 'object', properties: { business_type: { type: 'string', description: 'Type of business' }, employees: { type: 'number', description: 'Number of employees' }, question: { type: 'string', description: 'Specific question' } }, required: ['business_type'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYSTEM, `Panama: ${args.business_type}\nEmployees: ${args.employees || 0}${args.question ? `\nQ: ${args.question}` : ''}`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } log.info('executed', { trace_id: traceId }); return parsed; } }];
}
