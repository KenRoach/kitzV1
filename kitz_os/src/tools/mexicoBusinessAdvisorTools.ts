/**
 * Mexico Business Advisor Tools — RFC, SAT, IMSS, CFDI, labor law.
 * 1 tool: mexico_business_advise (low)
 */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('mexicoBusinessAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const SYSTEM = 'You are a Mexico business advisor. Expert in SAT (RFC, CFDI), IMSS, INFONAVIT, ISR, IVA, RESICO, labor law. Spanish default. Respond with JSON: { "registration": object, "taxes": object, "labor": object, "compliance": object, "actionSteps": [string] }';



export function getAllMexicoBusinessAdvisorTools(): ToolSchema[] {
  return [{ name: 'mexico_business_advise', description: 'Mexico business advice: RFC, SAT, RESICO regime, IMSS, INFONAVIT, ISR/IVA, CFDI electronic invoicing, labor law.', parameters: { type: 'object', properties: { business_type: { type: 'string', description: 'Type of business' }, regime: { type: 'string', description: 'Tax regime (RESICO, general, etc.)' }, employees: { type: 'number', description: 'Number of employees' }, question: { type: 'string', description: 'Specific question' } }, required: ['business_type'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYSTEM, `Mexico: ${args.business_type}\nRegime: ${args.regime || 'RESICO'}\nEmployees: ${args.employees || 0}${args.question ? `\nQ: ${args.question}` : ''}`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } log.info('executed', { trace_id: traceId }); return parsed; } }];
}
