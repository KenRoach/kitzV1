/**
 * Tax Planner skill — Tax optimization, deductions, filing strategy.
 * Owner: CFO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface TaxPlan {
  taxObligation: { annual: string; monthly: string; filingDates: string[] };
  deductions: Array<{ category: string; description: string; estimatedSavings: string }>;
  optimizations: string[]; complianceChecklist: string[]; commonMistakes: string[]; actionSteps: string[];
}
export interface TaxPlannerOptions { business: string; country: string; revenue: number; expenses: number; currency?: string; entityType?: string; language?: string; }

const SYSTEM = 'You are a tax planning advisor for LatAm SMBs. Optimize taxes legally, identify deductions, ensure compliance. Cover ITBMS, ISR, IVA by country. Spanish default.';
const FORMAT = 'Respond with JSON: { "taxObligation": object, "deductions": [object], "optimizations": [string], "complianceChecklist": [string], "commonMistakes": [string], "actionSteps": [string] }';

export async function planTaxes(options: TaxPlannerOptions, llmClient?: LLMClient): Promise<TaxPlan> {
  if (llmClient) {
    const prompt = `Tax plan for: ${options.business} in ${options.country}\nRevenue: ${options.currency ?? 'USD'} ${options.revenue}\nExpenses: ${options.currency ?? 'USD'} ${options.expenses}\nEntity: ${options.entityType ?? 'unknown'}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as TaxPlan; } catch { /* fall through */ }
  }
  return {
    taxObligation: { annual: 'Depende del país y régimen', monthly: 'IVA/ITBMS mensual', filingDates: ['Mensual: día 15', 'Anual: marzo-abril'] },
    deductions: [{ category: 'Gastos operativos', description: 'Alquiler, servicios, internet', estimatedSavings: '10-15% de impuestos' }, { category: 'Equipos y tecnología', description: 'Computadoras, software, celulares', estimatedSavings: '5-10%' }],
    optimizations: ['Registra todos los gastos deducibles', 'Elige el régimen fiscal más favorable', 'Anticipa pagos de impuestos para evitar recargos'],
    complianceChecklist: ['Emitir factura por cada venta', 'Declarar impuestos a tiempo', 'Guardar registros 5+ años', 'Separar finanzas personales y de negocio'],
    commonMistakes: ['No guardar facturas de gastos', 'Mezclar dinero personal con el negocio', 'Declarar tarde (multas e intereses)'],
    actionSteps: ['Consulta un contador local', 'Organiza tus facturas de gastos del año', 'Calcula tu obligación fiscal estimada', 'Programa recordatorios de fechas de declaración'],
  };
}
