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
import { callLLM } from './shared/callLLM.js';


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
      const raw = await callLLM(SYSTEM_PROMPT, input);
      let parsed;
      try { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { error: 'Could not parse response' }; } catch { parsed = { raw_advice: raw }; }
      log.info('executed', { trace_id: traceId });
      return parsed;
    },
  }];
}
