/**
 * Brazil Business Advisor Tools — CNPJ, Simples Nacional, PIX, MEI.
 * 1 tool: brazil_business_advise (low)
 */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('brazilBusinessAdvisorTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const SYSTEM = 'You are a Brazil business advisor. Expert in Receita Federal (CNPJ), Simples Nacional, MEI, ICMS, ISS, PIX, NF-e, CLT. Portuguese/Spanish. Respond with JSON: { "registration": object, "taxes": object, "labor": object, "compliance": object, "payments": object, "actionSteps": [string] }';



export function getAllBrazilBusinessAdvisorTools(): ToolSchema[] {
  return [{ name: 'brazil_business_advise', description: 'Brazil business advice: MEI/CNPJ, Simples Nacional, PIX, NF-e, INSS, FGTS, CLT labor, Receita Federal.', parameters: { type: 'object', properties: { business_type: { type: 'string', description: 'Type of business' }, revenue: { type: 'number', description: 'Annual revenue in BRL' }, employees: { type: 'number', description: 'Number of employees' }, question: { type: 'string', description: 'Specific question' } }, required: ['business_type'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(SYSTEM, `Brazil: ${args.business_type}\nRevenue: BRL ${args.revenue || 0}/year\nEmployees: ${args.employees || 0}${args.question ? `\nQ: ${args.question}` : ''}`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } log.info('executed', { trace_id: traceId }); return parsed; } }];
}
