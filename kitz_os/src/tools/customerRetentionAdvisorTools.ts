/**
 * Customer Retention Advisor Tools — Churn signals, win-back, loyalty programs.
 * 1 tool: retention_advise (low)
 */
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const SYSTEM = 'You are a retention strategist for LatAm SMBs. Identify churn signals, build win-back sequences, design loyalty programs. WhatsApp-first. Spanish default. Respond with JSON: { "churnSignals": [{ "signal": string, "severity": string, "action": string }], "retentionTactics": [string], "winBackSequence": [object], "loyaltyProgram": object, "actionSteps": [string] }';

async function callLLM(input: string): Promise<string> {
  if (CLAUDE_API_KEY) { try { const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, temperature: 0.2, system: SYSTEM, messages: [{ role: 'user', content: input }] }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find(c => c.type === 'text')?.text || ''; } } catch { /* fall */ } }
  if (OPENAI_API_KEY) { try { const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: input }], max_tokens: 1024 }), signal: AbortSignal.timeout(15_000) }); if (r.ok) { const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; } } catch { /* */ } }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllCustomerRetentionAdvisorTools(): ToolSchema[] {
  return [{ name: 'retention_advise', description: 'Get customer retention strategy: churn signals, win-back WhatsApp sequences, loyalty program design, retention metrics.', parameters: { type: 'object', properties: { business: { type: 'string', description: 'Business name' }, average_order_value: { type: 'number', description: 'Average order value' }, purchase_frequency: { type: 'string', description: 'How often customers buy (weekly/monthly/quarterly)' }, churn_rate: { type: 'number', description: 'Current churn rate %' }, currency: { type: 'string', description: 'Currency' } }, required: ['business', 'average_order_value'] }, riskLevel: 'low' as const, execute: async (args, traceId) => { const raw = await callLLM(`Retention for: ${args.business}\nAOV: ${args.currency || 'USD'} ${args.average_order_value}\nFrequency: ${args.purchase_frequency || 'monthly'}\nChurn: ${args.churn_rate || 'unknown'}%`); let parsed; try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Parse failed' }; } catch { parsed = { raw: raw }; } console.log(JSON.stringify({ ts: new Date().toISOString(), module: 'customerRetentionAdvisorTools', trace_id: traceId })); return parsed; } }];
}
