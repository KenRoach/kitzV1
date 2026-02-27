/**
 * Supply Chain Advisor skill — Supplier evaluation, negotiation, logistics.
 * Owner: COO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface SupplierScore { name: string; reliability: number; priceCompetitiveness: number; quality: number; overallScore: number; }
export interface SupplyChainAdvice {
  supplierScores: SupplierScore[];
  negotiationScripts: string[];
  logisticsOptimization: string[];
  costReduction: string[];
  riskMitigation: string[];
  actionSteps: string[];
}

export interface SupplyChainOptions {
  business: string;
  suppliers?: Array<{ name: string; products: string; monthlySpend: number }>;
  challenges?: string;
  country?: string;
  language?: string;
}

const SYSTEM = 'You are a supply chain advisor for small businesses in Latin America. Evaluate suppliers, negotiate better terms, optimize logistics. Consider local challenges: customs, shipping delays, cash flow. Default language: Spanish.';
const FORMAT = 'Respond with JSON: { "supplierScores": [{ "name": string, "reliability": number, "priceCompetitiveness": number, "quality": number, "overallScore": number }], "negotiationScripts": [string], "logisticsOptimization": [string], "costReduction": [string], "riskMitigation": [string], "actionSteps": [string] }';

export async function adviseSupplyChain(options: SupplyChainOptions, llmClient?: LLMClient): Promise<SupplyChainAdvice> {
  if (llmClient) {
    const prompt = `Supply chain for: ${options.business} in ${options.country ?? 'Latin America'}\nSuppliers: ${JSON.stringify(options.suppliers ?? [])}\nChallenges: ${options.challenges ?? 'general'}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as SupplyChainAdvice; } catch { /* fall through */ }
  }
  return {
    supplierScores: (options.suppliers ?? []).map(s => ({ name: s.name, reliability: 7, priceCompetitiveness: 6, quality: 7, overallScore: 7 })),
    negotiationScripts: ['Pide 10% de descuento por pronto pago', 'Ofrece contrato a 6 meses por mejor precio', 'Compara con 2-3 proveedores antes de negociar'],
    logisticsOptimization: ['Consolida envíos semanales vs. pedidos diarios', 'Negocia tarifas fijas de envío por volumen', 'Usa puntos de acopio cercanos a clientes'],
    costReduction: ['Compra en volumen (MOQ = mejor precio)', 'Paga anticipado por descuento', 'Busca proveedores locales para reducir flete'],
    riskMitigation: ['Ten 2+ proveedores para productos críticos', 'Mantén stock de seguridad (2 semanas)', 'Documenta acuerdos por escrito'],
    actionSteps: ['Evalúa tus 3 proveedores principales', 'Cotiza con al menos 1 alternativa', 'Negocia términos de pago este mes'],
  };
}
