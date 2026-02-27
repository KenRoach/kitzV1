/**
 * Bookkeeping Advisor skill — P&L, cash flow, expense tracking guidance.
 *
 * Helps LatAm SMBs understand basic accounting: profit & loss statements,
 * cash flow forecasting, expense categories, and tax readiness.
 * Owner: CFO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface ExpenseCategory {
  name: string;
  monthlyEstimate: number;
  percentage: number;
  optimizationTip: string;
}

export interface CashFlowForecast {
  month: string;
  projectedIncome: number;
  projectedExpenses: number;
  netCashFlow: number;
  cumulativeBalance: number;
  warning?: string;
}

export interface BookkeepingAdvice {
  profitLossSnapshot: {
    revenue: number;
    costOfGoods: number;
    grossProfit: number;
    operatingExpenses: number;
    netProfit: number;
    margin: number;
  };
  expenseBreakdown: ExpenseCategory[];
  cashFlowForecast: CashFlowForecast[];
  taxReadiness: {
    score: number;
    missingDocs: string[];
    nextDeadline: string;
    recommendations: string[];
  };
  actionSteps: string[];
  healthScore: number;
}

export interface BookkeepingOptions {
  businessType: string;
  monthlyRevenue: number;
  monthlyExpenses: number;
  currency?: string;
  country?: string;
  expenseCategories?: Record<string, number>;
  question?: string;
  language?: string;
}

const BOOKKEEPING_SYSTEM =
  'You are a bookkeeping advisor for small businesses in Latin America. ' +
  'Explain P&L, cash flow, and expense tracking in simple terms. ' +
  'Assume informal businesses — many use cash, WhatsApp receipts, and notebooks. ' +
  'Give practical advice: what to track, when to pay taxes, how to separate personal/business money. ' +
  'Default language: Spanish. Be warm and encouraging — many are learning this for the first time.';

const BOOKKEEPING_FORMAT =
  'Respond with JSON: { "profitLossSnapshot": { "revenue": number, "costOfGoods": number, ' +
  '"grossProfit": number, "operatingExpenses": number, "netProfit": number, "margin": number }, ' +
  '"expenseBreakdown": [{ "name": string, "monthlyEstimate": number, "percentage": number, ' +
  '"optimizationTip": string }], "cashFlowForecast": [{ "month": string, "projectedIncome": number, ' +
  '"projectedExpenses": number, "netCashFlow": number, "cumulativeBalance": number }], ' +
  '"taxReadiness": { "score": number (1-10), "missingDocs": [string], "nextDeadline": string, ' +
  '"recommendations": [string] }, "actionSteps": [string], "healthScore": number (1-100) }';

export async function adviseBookkeeping(options: BookkeepingOptions, llmClient?: LLMClient): Promise<BookkeepingAdvice> {
  if (llmClient) {
    const prompt = `Bookkeeping analysis for a ${options.businessType} in ${options.country ?? 'Panama'}:\n` +
      `Monthly revenue: ${options.currency ?? 'USD'} ${options.monthlyRevenue}\n` +
      `Monthly expenses: ${options.currency ?? 'USD'} ${options.monthlyExpenses}\n` +
      (options.expenseCategories ? `Expense categories: ${JSON.stringify(options.expenseCategories)}\n` : '') +
      (options.question ? `Specific question: ${options.question}\n` : '') +
      `\n${BOOKKEEPING_FORMAT}`;
    const response = await llmClient.complete({ prompt, system: BOOKKEEPING_SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as BookkeepingAdvice; } catch { /* fall through */ }
  }

  const revenue = options.monthlyRevenue;
  const expenses = options.monthlyExpenses;
  const netProfit = revenue - expenses;
  const margin = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

  return {
    profitLossSnapshot: {
      revenue,
      costOfGoods: Math.round(expenses * 0.4),
      grossProfit: revenue - Math.round(expenses * 0.4),
      operatingExpenses: Math.round(expenses * 0.6),
      netProfit,
      margin,
    },
    expenseBreakdown: [
      { name: 'Costo de producto/servicio', monthlyEstimate: Math.round(expenses * 0.4), percentage: 40, optimizationTip: 'Negocia con proveedores para descuentos por volumen' },
      { name: 'Marketing/publicidad', monthlyEstimate: Math.round(expenses * 0.15), percentage: 15, optimizationTip: 'Usa WhatsApp y redes orgánicas antes de pagar ads' },
      { name: 'Logística/entregas', monthlyEstimate: Math.round(expenses * 0.1), percentage: 10, optimizationTip: 'Agrupa entregas por zona para reducir costos' },
      { name: 'Herramientas/software', monthlyEstimate: Math.round(expenses * 0.05), percentage: 5, optimizationTip: 'Consolida herramientas — Kitz reemplaza varias' },
      { name: 'Otros gastos', monthlyEstimate: Math.round(expenses * 0.3), percentage: 30, optimizationTip: 'Revisa gastos recurrentes y cancela los que no uses' },
    ],
    cashFlowForecast: [
      { month: 'Mes 1', projectedIncome: revenue, projectedExpenses: expenses, netCashFlow: netProfit, cumulativeBalance: netProfit },
      { month: 'Mes 2', projectedIncome: revenue, projectedExpenses: expenses, netCashFlow: netProfit, cumulativeBalance: netProfit * 2 },
      { month: 'Mes 3', projectedIncome: revenue, projectedExpenses: expenses, netCashFlow: netProfit, cumulativeBalance: netProfit * 3 },
    ],
    taxReadiness: {
      score: 4,
      missingDocs: ['Registro de ingresos mensuales', 'Facturas de gastos', 'Declaración de impuestos anterior'],
      nextDeadline: 'Fin del trimestre actual',
      recommendations: [
        'Separa tu cuenta personal de la del negocio',
        'Guarda fotos de cada recibo/factura',
        'Registra cada venta — aunque sea en WhatsApp',
      ],
    },
    actionSteps: [
      'Abre una cuenta bancaria separada para el negocio',
      'Registra tus ingresos y gastos diarios en Kitz',
      'Guarda todos los recibos (fotos por WhatsApp)',
      'Revisa tu P&L cada semana — 5 minutos',
      'Consulta un contador para tu declaración de impuestos',
    ],
    healthScore: margin > 20 ? 70 : margin > 10 ? 50 : 30,
  };
}
