/**
 * Expense Optimizer skill — Cost reduction, subscription audit, vendor negotiation.
 * Owner: CFO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface ExpenseOptimization {
  totalMonthly: number; potentialSavings: number;
  categories: Array<{ name: string; current: number; optimized: number; savings: number; action: string }>;
  subscriptionAudit: string[]; negotiationTips: string[]; quickWins: string[]; actionSteps: string[];
}
export interface ExpenseOptions { business: string; expenses: Array<{ category: string; amount: number }>; currency?: string; language?: string; }

const SYSTEM = 'You are an expense optimization advisor for LatAm SMBs. Find savings, audit subscriptions, negotiate better rates. Spanish default.';
const FORMAT = 'Respond with JSON: { "totalMonthly": number, "potentialSavings": number, "categories": [object], "subscriptionAudit": [string], "negotiationTips": [string], "quickWins": [string], "actionSteps": [string] }';

export async function optimizeExpenses(options: ExpenseOptions, llmClient?: LLMClient): Promise<ExpenseOptimization> {
  if (llmClient) {
    const prompt = `Expense optimization for: ${options.business}\nExpenses: ${JSON.stringify(options.expenses)}\nCurrency: ${options.currency ?? 'USD'}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as ExpenseOptimization; } catch { /* fall through */ }
  }
  const total = options.expenses.reduce((s, e) => s + e.amount, 0);
  return {
    totalMonthly: total, potentialSavings: Math.round(total * 0.15),
    categories: options.expenses.map(e => ({ name: e.category, current: e.amount, optimized: Math.round(e.amount * 0.85), savings: Math.round(e.amount * 0.15), action: 'Renegocia o busca alternativa' })),
    subscriptionAudit: ['Cancela suscripciones que no uses', 'Baja de plan si no usas todas las features', 'Paga anual (20-40% descuento vs. mensual)', 'Usa alternativas gratis cuando sea posible'],
    negotiationTips: ['Pide descuento por pago anual', 'Menciona que estás evaluando alternativas', 'Pide match del precio de un competidor', 'Negocia al final del trimestre (cuotas de ventas)'],
    quickWins: ['Cancela 1 suscripción innecesaria hoy', 'Cambia a plan anual tu herramienta principal', 'Renegocia con tu proveedor más caro'],
    actionSteps: ['Lista TODAS tus suscripciones y gastos recurrentes', 'Clasifica: esencial / útil / innecesario', 'Cancela los innecesarios hoy', 'Renegocia los top 3 gastos este mes'],
  };
}
