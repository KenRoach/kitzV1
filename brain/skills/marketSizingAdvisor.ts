/**
 * Market Sizing Advisor skill — TAM/SAM/SOM, market opportunity.
 * Owner: CEO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface MarketSizing {
  tam: { value: string; description: string };
  sam: { value: string; description: string };
  som: { value: string; description: string };
  growthRate: string;
  marketTrends: string[];
  entryStrategy: string;
  revenueProjection: { year1: string; year2: string; year3: string };
  assumptions: string[];
  actionSteps: string[];
}
export interface MarketSizingOptions { business: string; industry: string; targetMarket: string; country: string; currency?: string; language?: string; }

const SYSTEM = 'You are a market sizing advisor for LatAm entrepreneurs. Calculate TAM/SAM/SOM using top-down and bottom-up methods. Be realistic about LatAm market sizes. Spanish default.';
const FORMAT = 'Respond with JSON: { "tam": { "value": string, "description": string }, "sam": { "value": string, "description": string }, "som": { "value": string, "description": string }, "growthRate": string, "marketTrends": [string], "entryStrategy": string, "revenueProjection": { "year1": string, "year2": string, "year3": string }, "assumptions": [string], "actionSteps": [string] }';

export async function sizeMarket(options: MarketSizingOptions, llmClient?: LLMClient): Promise<MarketSizing> {
  if (llmClient) {
    const prompt = `Market sizing for: ${options.business} (${options.industry})\nMarket: ${options.targetMarket}\nCountry: ${options.country}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as MarketSizing; } catch { /* fall through */ }
  }
  return {
    tam: { value: 'Investigar — depende del sector', description: `Mercado total de ${options.industry} en ${options.country}` },
    sam: { value: 'TAM × % segmento accesible', description: `${options.targetMarket} en ${options.country} que compra online/WhatsApp` },
    som: { value: 'SAM × % captura realista (1-5% año 1)', description: 'Lo que puedes capturar con tus recursos actuales' },
    growthRate: 'E-commerce LatAm: 20-30% anual',
    marketTrends: ['Crecimiento de pagos digitales', 'WhatsApp como canal de ventas', 'Formalización de negocios informales', 'IA para PyMEs'],
    entryStrategy: 'Nicho primero → expande geográficamente',
    revenueProjection: { year1: 'SOM × ticket promedio', year2: 'Año 1 × 2-3x (si hay product-market fit)', year3: 'Año 2 × 2x (expansión a nuevos segmentos/países)' },
    assumptions: ['Tasa de conversión: 2-5%', 'Retención: 60-80% anual', 'Crecimiento orgánico: 20-30% del total'],
    actionSteps: ['Investiga el tamaño del mercado en reportes de Statista/eMarketer', 'Valida tu SOM con datos reales (clientes actuales × expansión)', 'Habla con 20 clientes potenciales para validar willingness-to-pay'],
  };
}
