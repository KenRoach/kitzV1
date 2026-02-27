/**
 * Unit Economics Advisor skill — CAC, LTV, payback, contribution margin.
 * Owner: CFO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface UnitEconomicsAnalysis {
  metrics: { cac: number; ltv: number; ltvCacRatio: number; paybackMonths: number; contributionMargin: number; grossMargin: number };
  health: 'healthy' | 'warning' | 'critical';
  diagnosis: string; benchmarks: Record<string, string>; improvements: string[]; actionSteps: string[];
}
export interface UnitEconomicsOptions { business: string; cac: number; averageRevenue: number; grossMargin: number; churnRate: number; currency?: string; language?: string; }

const SYSTEM = 'You are a unit economics advisor for LatAm SMBs. Calculate CAC, LTV, payback, margins. Be direct about health. Spanish default.';
const FORMAT = 'Respond with JSON: { "metrics": { "cac": number, "ltv": number, "ltvCacRatio": number, "paybackMonths": number, "contributionMargin": number, "grossMargin": number }, "health": string, "diagnosis": string, "benchmarks": object, "improvements": [string], "actionSteps": [string] }';

export async function analyzeUnitEconomics(options: UnitEconomicsOptions, llmClient?: LLMClient): Promise<UnitEconomicsAnalysis> {
  if (llmClient) {
    const prompt = `Unit economics for: ${options.business}\nCAC: ${options.currency ?? 'USD'} ${options.cac}\nAvg Revenue: ${options.currency ?? 'USD'} ${options.averageRevenue}/mo\nGross Margin: ${options.grossMargin}%\nChurn: ${options.churnRate}%/mo\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as UnitEconomicsAnalysis; } catch { /* fall through */ }
  }
  const ltv = options.churnRate > 0 ? Math.round(options.averageRevenue * (options.grossMargin / 100) / (options.churnRate / 100)) : options.averageRevenue * 12;
  const ratio = options.cac > 0 ? Math.round((ltv / options.cac) * 10) / 10 : 0;
  const payback = options.cac > 0 ? Math.round(options.cac / (options.averageRevenue * options.grossMargin / 100)) : 0;
  return {
    metrics: { cac: options.cac, ltv, ltvCacRatio: ratio, paybackMonths: payback, contributionMargin: Math.round(options.averageRevenue * options.grossMargin / 100), grossMargin: options.grossMargin },
    health: ratio >= 3 ? 'healthy' : ratio >= 1.5 ? 'warning' : 'critical',
    diagnosis: ratio >= 3 ? 'Unit economics saludables. Puedes invertir más en crecimiento.' : ratio >= 1.5 ? 'Márgenes ajustados. Optimiza CAC o aumenta retención.' : 'Pierdes dinero por cada cliente. Urgente: reduce CAC o aumenta LTV.',
    benchmarks: { 'LTV:CAC': '> 3:1 (saludable)', 'Payback': '< 12 meses', 'Gross Margin': '> 50% (SaaS) / > 30% (servicios)', 'Churn': '< 5%/mes' },
    improvements: ['Reduce CAC: referidos, orgánico, mejores conversiones', 'Aumenta LTV: upsell, retención, precio', 'Mejora margen: reduce costos variables, automatiza'],
    actionSteps: ['Calcula tu CAC real por canal', 'Mide churn mensual exacto', 'Si LTV:CAC < 3, enfócate en retención antes de crecer'],
  };
}
