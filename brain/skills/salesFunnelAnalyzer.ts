/**
 * Sales Funnel Analyzer skill — Conversion bottleneck diagnosis, funnel metrics.
 * Owner: CRO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface FunnelStage { name: string; visitors: number; conversionRate: number; dropOffRate: number; bottleneck: boolean; fix: string; }
export interface FunnelAnalysis {
  stages: FunnelStage[];
  overallConversion: number;
  biggestBottleneck: string;
  revenueLeaked: number;
  optimizations: string[];
  abTestIdeas: string[];
  benchmarks: Record<string, string>;
  actionSteps: string[];
}

export interface SalesFunnelOptions {
  business: string;
  stages?: Array<{ name: string; visitors: number }>;
  revenue?: number;
  currency?: string;
  industry?: string;
  language?: string;
}

const SYSTEM = 'You are a sales funnel analyst for small businesses in Latin America. Diagnose conversion bottlenecks, calculate revenue leakage, recommend fixes. Default language: Spanish.';
const FORMAT = 'Respond with JSON: { "stages": [{ "name": string, "visitors": number, "conversionRate": number, "dropOffRate": number, "bottleneck": boolean, "fix": string }], "overallConversion": number, "biggestBottleneck": string, "revenueLeaked": number, "optimizations": [string], "abTestIdeas": [string], "benchmarks": object, "actionSteps": [string] }';

export async function analyzeFunnel(options: SalesFunnelOptions, llmClient?: LLMClient): Promise<FunnelAnalysis> {
  if (llmClient) {
    const prompt = `Funnel analysis for: ${options.business} (${options.industry ?? 'general'})\nStages: ${JSON.stringify(options.stages ?? [])}\nRevenue: ${options.currency ?? 'USD'} ${options.revenue ?? 0}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as FunnelAnalysis; } catch { /* fall through */ }
  }
  const stages = options.stages ?? [
    { name: 'Visitantes', visitors: 1000 }, { name: 'Interesados', visitors: 200 },
    { name: 'Leads', visitors: 50 }, { name: 'Clientes', visitors: 10 },
  ];
  const funnelStages = stages.map((s, i) => {
    const prev = i > 0 ? stages[i - 1].visitors : s.visitors;
    const rate = prev > 0 ? Math.round((s.visitors / prev) * 100) : 100;
    const drop = 100 - rate;
    return { name: s.name, visitors: s.visitors, conversionRate: rate, dropOffRate: drop, bottleneck: drop > 70, fix: drop > 70 ? `Optimiza la transición ${stages[i - 1]?.name ?? ''} → ${s.name}` : 'OK' };
  });
  const overall = stages.length > 1 ? Math.round((stages[stages.length - 1].visitors / stages[0].visitors) * 100) : 100;
  return {
    stages: funnelStages,
    overallConversion: overall,
    biggestBottleneck: funnelStages.find(s => s.bottleneck)?.name ?? 'Ninguno identificado',
    revenueLeaked: Math.round((options.revenue ?? 0) * (1 - overall / 100)),
    optimizations: ['Mejora el CTA de la landing page', 'Agrega prueba social (testimonios)', 'Simplifica el proceso de compra', 'Ofrece WhatsApp como canal de consulta'],
    abTestIdeas: ['Headlines: beneficio vs. curiosidad', 'CTA: "Comprar ahora" vs. "Escríbenos"', 'Precio: mostrar vs. "consulta precio"'],
    benchmarks: { 'Visitante → Lead': '2-5%', 'Lead → Cliente': '10-20%', 'E-commerce': '1-3%' },
    actionSteps: ['Mide cada etapa de tu funnel', 'Identifica dónde pierdes más personas', 'Optimiza la peor transición primero'],
  };
}
