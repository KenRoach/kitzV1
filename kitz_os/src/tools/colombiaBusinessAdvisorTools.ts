/**
 * Colombia Business Advisor Tools — NIT, DIAN, SIC, SAS, labor.
 * 1 tool: colombia_business_advise (low)
 */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('colombiaBusinessAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const SYSTEM = 'You are a Colombia business advisor. Expert in DIAN (NIT, RUT), Cámara de Comercio, EPS, ARL, factura electrónica, IVA 19%. Spanish default. Respond with JSON: { "registration": object, "taxes": object, "labor": object, "compliance": object, "actionSteps": [string] }';



export function getAllColombiaBusinessAdvisorTools(): ToolSchema[] {
  return [{ name: 'colombia_business_advise', description: 'Colombia business advice: SAS registration, DIAN (NIT/RUT), IVA 19%, EPS/ARL, electronic invoicing, labor law.', parameters: { type: 'object', properties: { business_type: { type: 'string', description: 'Type of business' }, employees: { type: 'number', description: 'Number of employees' }, question: { type: 'string', description: 'Specific question' } }, required: ['business_type'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYSTEM, `Colombia: ${args.business_type}\nEmployees: ${args.employees || 0}${args.question ? `\nQ: ${args.question}` : ''}`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } log.info('executed', { trace_id: traceId }); return parsed; } }];
}
