/**
 * Budget Forecaster skill — Revenue projections, expense budgets, scenarios.
 * Owner: CFO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface BudgetForecast {
  monthly: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
  scenarios: { optimistic: string; realistic: string; pessimistic: string };
  breakEvenPoint: string; cashRunway: string; budgetAllocations: Record<string, number>; actionSteps: string[];
}
export interface BudgetOptions { business: string; currentRevenue: number; currentExpenses: number; growthRate?: number; currency?: string; months?: number; language?: string; }

const SYSTEM = 'You are a budget forecasting advisor for LatAm SMBs. Create realistic revenue projections and expense budgets. Spanish default.';
const FORMAT = 'Respond with JSON: { "monthly": [{ "month": string, "revenue": number, "expenses": number, "profit": number }], "scenarios": object, "breakEvenPoint": string, "cashRunway": string, "budgetAllocations": object, "actionSteps": [string] }';

export async function forecastBudget(options: BudgetOptions, llmClient?: LLMClient): Promise<BudgetForecast> {
  if (llmClient) {
    const prompt = `Budget for: ${options.business}\nRevenue: ${options.currency ?? 'USD'} ${options.currentRevenue}/mo\nExpenses: ${options.currency ?? 'USD'} ${options.currentExpenses}/mo\nGrowth: ${options.growthRate ?? 10}%/mo\nMonths: ${options.months ?? 6}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as BudgetForecast; } catch { /* fall through */ }
  }
  const gr = (options.growthRate ?? 10) / 100;
  const months = Array.from({ length: options.months ?? 6 }, (_, i) => {
    const rev = Math.round(options.currentRevenue * Math.pow(1 + gr, i));
    const exp = Math.round(options.currentExpenses * Math.pow(1 + gr * 0.5, i));
    return { month: `Mes ${i + 1}`, revenue: rev, expenses: exp, profit: rev - exp };
  });
  return {
    monthly: months, scenarios: { optimistic: `+${Math.round(gr * 150)}% crecimiento mensual`, realistic: `+${Math.round(gr * 100)}% crecimiento mensual`, pessimistic: `+${Math.round(gr * 50)}% crecimiento mensual` },
    breakEvenPoint: options.currentRevenue >= options.currentExpenses ? 'Ya eres rentable' : `~${Math.ceil(options.currentExpenses / (options.currentRevenue * gr || 1))} meses`,
    cashRunway: `${Math.round((options.currentRevenue - options.currentExpenses) > 0 ? 12 : Math.abs(options.currentRevenue - options.currentExpenses) > 0 ? 6 : 3)} meses estimados`,
    budgetAllocations: { 'Producto/servicio': 40, 'Marketing': 20, 'Operaciones': 15, 'Equipo': 15, 'Reserva': 10 },
    actionSteps: ['Registra ingresos y gastos reales cada semana', 'Compara real vs. proyectado mensualmente', 'Ajusta gastos si revenue < proyección', 'Mantén reserva de 3 meses de gastos'],
  };
}
