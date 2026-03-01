/**
 * Bookkeeping Advisor Tools — P&L snapshots, cash flow, expense analysis.
 *
 * 1 tool:
 *   - bookkeeping_advise (low) — Get bookkeeping advice, P&L snapshot, and cash flow forecast
 *
 * Uses Claude Haiku, falls back to OpenAI gpt-4o-mini.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('bookkeepingAdvisorTools');
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a bookkeeping advisor for small businesses in Latin America.
Explain P&L, cash flow, and expense tracking in simple terms.
Assume informal businesses — many use cash, WhatsApp receipts, and notebooks.
Default language: Spanish. Be warm and encouraging.

Respond with valid JSON:
{ "profitLossSnapshot": { "revenue": number, "costOfGoods": number, "grossProfit": number,
  "operatingExpenses": number, "netProfit": number, "margin": number },
  "expenseBreakdown": [{ "name": string, "monthlyEstimate": number, "percentage": number, "optimizationTip": string }],
  "cashFlowForecast": [{ "month": string, "projectedIncome": number, "projectedExpenses": number, "netCashFlow": number }],
  "taxReadiness": { "score": number, "missingDocs": [string], "recommendations": [string] },
  "actionSteps": [string], "healthScore": number }`;

async function callLLM(input: string): Promise<string> {
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': CLAUDE_API_VERSION },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, temperature: 0.2, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: input }] }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) { const d = await res.json() as { content: Array<{ type: string; text?: string }> }; return d.content?.find(c => c.type === 'text')?.text || ''; }
    } catch { /* fall through */ }
  }
  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: input }], max_tokens: 1024, temperature: 0.2 }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) { const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> }; return d.choices?.[0]?.message?.content || ''; }
    } catch { /* return error */ }
  }
  return JSON.stringify({ error: 'No AI available' });
}

export function getAllBookkeepingAdvisorTools(): ToolSchema[] {
  return [{
    name: 'bookkeeping_advise',
    description: 'Get bookkeeping advice: P&L snapshot, expense breakdown, cash flow forecast, tax readiness score, and action steps. For small businesses in Latin America.',
    parameters: {
      type: 'object',
      properties: {
        business_type: { type: 'string', description: 'Type of business (e.g., restaurante, tienda de ropa)' },
        monthly_revenue: { type: 'number', description: 'Monthly revenue' },
        monthly_expenses: { type: 'number', description: 'Monthly expenses' },
        currency: { type: 'string', description: 'Currency (default: USD)' },
        country: { type: 'string', description: 'Country (default: Panama)' },
        question: { type: 'string', description: 'Specific bookkeeping question' },
      },
      required: ['business_type', 'monthly_revenue', 'monthly_expenses'],
    },
    riskLevel: 'low',
    execute: async (args, traceId) => {
      const input = `Bookkeeping for: ${args.business_type}\nRevenue: ${args.currency || 'USD'} ${args.monthly_revenue}/mo\nExpenses: ${args.currency || 'USD'} ${args.monthly_expenses}/mo\nCountry: ${args.country || 'Panama'}` +
        (args.question ? `\nQuestion: ${args.question}` : '');
      const raw = await callLLM(input);
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse response' }; } catch { parsed = { raw_advice: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
