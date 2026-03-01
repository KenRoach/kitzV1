/**
 * Brazil Business Advisor Tools — CNPJ, Simples Nacional, PIX, MEI.
 * 1 tool: brazil_business_advise (low)
 */
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('brazilBusinessAdvisorTools');
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const SYSTEM = 'You are a Brazil business advisor. Expert in Receita Federal (CNPJ), Simples Nacional, MEI, ICMS, ISS, PIX, NF-e, CLT. Portuguese/Spanish. Respond with JSON: { "registration": object, "taxes": object, "labor": object, "compliance": object, "payments": object, "actionSteps": [string] }';

async function callLLM(input: string): Promise<string> {
  if (CLAUDE_API_KEY) { try { const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, temperature: 0.2, system: SYSTEM, messages: [{ role: 'user', content: input }] }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find(c => c.type === 'text')?.text || ''; } } catch { /* fall */ } }
  if (OPENAI_API_KEY) { try { const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: input }], max_tokens: 1024 }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; } } catch { /* */ } }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllBrazilBusinessAdvisorTools(): ToolSchema[] {
  return [{ name: 'brazil_business_advise', description: 'Brazil business advice: MEI/CNPJ, Simples Nacional, PIX, NF-e, INSS, FGTS, CLT labor, Receita Federal.', parameters: { type: 'object', properties: { business_type: { type: 'string', description: 'Type of business' }, revenue: { type: 'number', description: 'Annual revenue in BRL' }, employees: { type: 'number', description: 'Number of employees' }, question: { type: 'string', description: 'Specific question' } }, required: ['business_type'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(`Brazil: ${args.business_type}\nRevenue: BRL ${args.revenue || 0}/year\nEmployees: ${args.employees || 0}${args.question ? `\nQ: ${args.question}` : ''}`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } log.info('executed', { trace_id: traceId }); return parsed; } }];
}
