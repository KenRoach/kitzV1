/**
 * Colombia Business Advisor Tools — NIT, DIAN, SIC, SAS, labor.
 * 1 tool: colombia_business_advise (low)
 */
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const SYSTEM = 'You are a Colombia business advisor. Expert in DIAN (NIT, RUT), Cámara de Comercio, EPS, ARL, factura electrónica, IVA 19%. Spanish default. Respond with JSON: { "registration": object, "taxes": object, "labor": object, "compliance": object, "actionSteps": [string] }';

async function callLLM(input: string): Promise<string> {
  if (CLAUDE_API_KEY) { try { const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, temperature: 0.2, system: SYSTEM, messages: [{ role: 'user', content: input }] }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find(c => c.type === 'text')?.text || ''; } } catch { /* fall */ } }
  if (OPENAI_API_KEY) { try { const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: input }], max_tokens: 1024 }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; } } catch { /* */ } }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllColombiaBusinessAdvisorTools(): ToolSchema[] {
  return [{ name: 'colombia_business_advise', description: 'Colombia business advice: SAS registration, DIAN (NIT/RUT), IVA 19%, EPS/ARL, electronic invoicing, labor law.', parameters: { type: 'object', properties: { business_type: { type: 'string', description: 'Type of business' }, employees: { type: 'number', description: 'Number of employees' }, question: { type: 'string', description: 'Specific question' } }, required: ['business_type'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(`Colombia: ${args.business_type}\nEmployees: ${args.employees || 0}${args.question ? `\nQ: ${args.question}` : ''}`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } console.log(JSON.stringify({ ts: new Date().toISOString(), module: 'colombiaBusinessAdvisorTools', trace_id: traceId })); return parsed; } }];
}
