/**
 * Compensation Advisor skill — Salary bands, benefits, equity, bonuses.
 * Owner: CFO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface CompensationPlan {
  salaryBands: Array<{ role: string; min: number; mid: number; max: number; currency: string }>;
  benefits: string[]; bonusStructure: string; equityGuidance: string;
  marketComparison: string; retentionStrategies: string[]; actionSteps: string[];
}
export interface CompensationOptions { business: string; roles: string[]; country: string; budget?: number; currency?: string; language?: string; }

const SYSTEM = 'You are a compensation advisor for LatAm SMBs. Design fair salary bands, benefits, bonuses. Consider local cost of living and legal minimums. Spanish default.';
const FORMAT = 'Respond with JSON: { "salaryBands": [object], "benefits": [string], "bonusStructure": string, "equityGuidance": string, "marketComparison": string, "retentionStrategies": [string], "actionSteps": [string] }';

export async function adviseCompensation(options: CompensationOptions, llmClient?: LLMClient): Promise<CompensationPlan> {
  if (llmClient) {
    const prompt = `Compensation for: ${options.business} in ${options.country}\nRoles: ${options.roles.join(', ')}\nBudget: ${options.currency ?? 'USD'} ${options.budget ?? 'market'}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as CompensationPlan; } catch { /* fall through */ }
  }
  return {
    salaryBands: options.roles.map(r => ({ role: r, min: 0, mid: 0, max: 0, currency: options.currency ?? 'USD' })),
    benefits: ['Horario flexible', 'Trabajo remoto (parcial o total)', 'Días de salud mental', 'Capacitación/educación', 'Seguro médico (si el presupuesto permite)'],
    bonusStructure: 'Bono trimestral basado en OKRs: 50% individual + 50% equipo. Rango: 5-15% del salario.',
    equityGuidance: 'Para startups: 0.5-2% para primeros empleados, vesting 4 años, cliff 1 año. Para SMBs: bonus en efectivo es más práctico.',
    marketComparison: 'Investiga salarios en Glassdoor, Computrabajo, y encuestas locales. Compara con empresas similares en tu ciudad.',
    retentionStrategies: ['Paga competitivo (P50-P75 del mercado)', 'Ofrece crecimiento profesional claro', 'Flexibilidad > dinero para muchos en LatAm', 'Reviews salariales cada 6-12 meses'],
    actionSteps: ['Investiga salarios de mercado para tus roles', 'Define bandas salariales (min-mid-max)', 'Crea un paquete de beneficios accesible', 'Comunica el plan de compensación a tu equipo'],
  };
}
