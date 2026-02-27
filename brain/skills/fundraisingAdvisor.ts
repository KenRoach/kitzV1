/**
 * Fundraising Advisor skill — Pitch deck, investor targeting, term sheets.
 * Owner: CEO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface FundraisingStrategy {
  readiness: { score: number; gaps: string[]; strengths: string[] };
  fundingOptions: Array<{ type: string; range: string; pros: string[]; cons: string[]; bestFor: string }>;
  pitchDeckOutline: Array<{ slide: number; title: string; content: string }>;
  investorTargets: string[];
  valuationGuidance: string;
  termSheetBasics: string[];
  timeline: string;
  actionSteps: string[];
}
export interface FundraisingOptions { business: string; stage: string; revenue?: number; seeking?: number; currency?: string; country?: string; language?: string; }

const SYSTEM = 'You are a fundraising advisor for LatAm startups and SMBs. Cover bootstrapping, angels, VCs, grants, and revenue-based financing. Realistic about LatAm funding landscape. Spanish default.';
const FORMAT = 'Respond with JSON: { "readiness": { "score": number, "gaps": [string], "strengths": [string] }, "fundingOptions": [object], "pitchDeckOutline": [{ "slide": number, "title": string, "content": string }], "investorTargets": [string], "valuationGuidance": string, "termSheetBasics": [string], "timeline": string, "actionSteps": [string] }';

export async function adviseFundraising(options: FundraisingOptions, llmClient?: LLMClient): Promise<FundraisingStrategy> {
  if (llmClient) {
    const prompt = `Fundraising for: ${options.business}\nStage: ${options.stage}\nRevenue: ${options.currency ?? 'USD'} ${options.revenue ?? 0}\nSeeking: ${options.currency ?? 'USD'} ${options.seeking ?? 0}\nCountry: ${options.country ?? 'LatAm'}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as FundraisingStrategy; } catch { /* fall through */ }
  }
  return {
    readiness: { score: 5, gaps: ['Falta pitch deck', 'Métricas de tracción incompletas', 'Sin data room'], strengths: ['Producto funcional', 'Clientes pagando'] },
    fundingOptions: [
      { type: 'Bootstrapping', range: '$0', pros: ['Control total', 'Sin dilución'], cons: ['Crecimiento lento'], bestFor: 'Etapa temprana con ingresos' },
      { type: 'Angel investors', range: '$10K-100K', pros: ['Rápido', 'Mentorship'], cons: ['Dilución', 'Menos capital'], bestFor: 'Pre-seed con tracción' },
      { type: 'VC (Pre-seed/Seed)', range: '$100K-2M', pros: ['Capital para escalar', 'Red'], cons: ['Alta dilución', 'Presión de crecimiento'], bestFor: 'Product-market fit demostrado' },
      { type: 'Revenue-based financing', range: '$10K-500K', pros: ['Sin dilución', 'Basado en ingresos'], cons: ['Requiere ingresos estables'], bestFor: 'Negocios con MRR predecible' },
    ],
    pitchDeckOutline: [
      { slide: 1, title: 'Problema', content: 'El dolor que resuelves — datos y historia' },
      { slide: 2, title: 'Solución', content: 'Tu producto — demo o screenshots' },
      { slide: 3, title: 'Mercado', content: 'TAM/SAM/SOM — oportunidad en LatAm' },
      { slide: 4, title: 'Tracción', content: 'Métricas: usuarios, revenue, crecimiento' },
      { slide: 5, title: 'Modelo de negocio', content: 'Cómo ganas dinero — unit economics' },
      { slide: 6, title: 'Equipo', content: 'Por qué ustedes van a ganar' },
      { slide: 7, title: 'Ask', content: 'Cuánto levantas y para qué' },
    ],
    investorTargets: ['500 Startups LatAm', 'Y Combinator', 'ALLVP', 'Kaszek', 'Angels locales'],
    valuationGuidance: 'Pre-seed LatAm: $1-3M pre-money / Seed: $3-10M / Depende de tracción',
    termSheetBasics: ['Valuación pre-money', 'Dilución (15-25% típico)', 'Liquidation preference', 'Vesting de fundadores (4 años, 1 año cliff)', 'Board seats'],
    timeline: '3-6 meses desde primer contacto hasta cierre',
    actionSteps: ['Crea tu pitch deck (7-10 slides)', 'Prepara un data room (métricas, financieros, legal)', 'Identifica 20 inversores relevantes', 'Practica tu pitch 10 veces antes de presentar'],
  };
}
