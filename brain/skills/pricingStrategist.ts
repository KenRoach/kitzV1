/**
 * Pricing Strategist skill — Value-based pricing, willingness-to-pay, margins.
 *
 * Helps LatAm SMBs set prices using value-based frameworks instead of
 * cost-plus guessing. Covers competitive positioning, perceived value,
 * and price anchoring.
 * Owner: CRO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface PriceTier {
  name: string;
  price: number;
  features: string[];
  targetCustomer: string;
  margin: number;
}

export interface CompetitorPrice {
  competitor: string;
  price: number;
  positioning: string;
}

export interface PricingStrategy {
  recommendedPrice: number;
  priceRange: { low: number; mid: number; high: number };
  strategy: 'value_based' | 'competitive' | 'penetration' | 'premium' | 'freemium';
  rationale: string;
  tiers: PriceTier[];
  competitorAnalysis: CompetitorPrice[];
  valueStack: string[];
  anchoring: { highAnchor: number; revealPrice: number; savings: string };
  psychologicalPricing: string[];
  actionSteps: string[];
}

export interface PricingOptions {
  productOrService: string;
  currentPrice?: number;
  costPerUnit: number;
  targetMargin?: number;
  competitors?: Array<{ name: string; price: number }>;
  valueProposition: string;
  currency?: string;
  market?: string;
  language?: string;
}

const PRICING_SYSTEM =
  'You are a pricing strategist for small businesses in Latin America. ' +
  'Use value-based pricing frameworks (not cost-plus). ' +
  'Consider willingness-to-pay, perceived value, anchoring, and competitive positioning. ' +
  'Recommend 2-3 tiers when appropriate. Account for local market dynamics. ' +
  'Default language: Spanish. Be direct — tell them if they are undercharging.';

const PRICING_FORMAT =
  'Respond with JSON: { "recommendedPrice": number, "priceRange": { "low": number, "mid": number, "high": number }, ' +
  '"strategy": "value_based"|"competitive"|"penetration"|"premium"|"freemium", "rationale": string, ' +
  '"tiers": [{ "name": string, "price": number, "features": [string], "targetCustomer": string, "margin": number }], ' +
  '"competitorAnalysis": [{ "competitor": string, "price": number, "positioning": string }], ' +
  '"valueStack": [string], "anchoring": { "highAnchor": number, "revealPrice": number, "savings": string }, ' +
  '"psychologicalPricing": [string], "actionSteps": [string] }';

export async function advisePricing(options: PricingOptions, llmClient?: LLMClient): Promise<PricingStrategy> {
  if (llmClient) {
    const prompt = `Pricing strategy for: ${options.productOrService}\n` +
      `Cost per unit: ${options.currency ?? 'USD'} ${options.costPerUnit}\n` +
      (options.currentPrice ? `Current price: ${options.currency ?? 'USD'} ${options.currentPrice}\n` : '') +
      `Value proposition: ${options.valueProposition}\n` +
      `Market: ${options.market ?? 'Latin America'}\n` +
      (options.competitors ? `Competitors: ${JSON.stringify(options.competitors)}\n` : '') +
      `Target margin: ${options.targetMargin ?? 50}%\n\n${PRICING_FORMAT}`;
    const response = await llmClient.complete({ prompt, system: PRICING_SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as PricingStrategy; } catch { /* fall through */ }
  }

  const cost = options.costPerUnit;
  const targetMargin = options.targetMargin ?? 50;
  const recommended = Math.round(cost / (1 - targetMargin / 100));

  return {
    recommendedPrice: recommended,
    priceRange: { low: Math.round(recommended * 0.8), mid: recommended, high: Math.round(recommended * 1.4) },
    strategy: 'value_based',
    rationale: `Basado en tu costo de ${options.currency ?? 'USD'} ${cost} y un margen objetivo de ${targetMargin}%, tu precio base debería ser ${options.currency ?? 'USD'} ${recommended}. Ajusta según el valor percibido.`,
    tiers: [
      { name: 'Básico', price: Math.round(recommended * 0.8), features: ['Servicio estándar'], targetCustomer: 'Sensible al precio', margin: Math.round(targetMargin * 0.6) },
      { name: 'Profesional', price: recommended, features: ['Servicio completo', 'Soporte prioritario'], targetCustomer: 'Cliente ideal', margin: targetMargin },
      { name: 'Premium', price: Math.round(recommended * 1.4), features: ['Todo incluido', 'Atención VIP', 'Garantía extendida'], targetCustomer: 'Dispuesto a pagar por calidad', margin: Math.round(targetMargin * 1.3) },
    ],
    competitorAnalysis: (options.competitors || []).map(c => ({ competitor: c.name, price: c.price, positioning: c.price > recommended ? 'Premium' : 'Económico' })),
    valueStack: [
      options.valueProposition,
      'Ahorro de tiempo',
      'Tranquilidad / garantía',
      'Soporte dedicado',
    ],
    anchoring: {
      highAnchor: Math.round(recommended * 2),
      revealPrice: recommended,
      savings: `Te ahorras ${options.currency ?? 'USD'} ${Math.round(recommended)}`,
    },
    psychologicalPricing: [
      `Usa $${recommended - 1} en vez de $${recommended} (efecto de dígito izquierdo)`,
      'Muestra el precio por día/semana si el precio mensual parece alto',
      'Ofrece 3 opciones — la mayoría elige la del medio',
    ],
    actionSteps: [
      'Empieza con el precio Profesional como ancla',
      'Prueba el precio Premium con 5 clientes — mide aceptación',
      'Si nadie rechaza tu precio, probablemente cobras poco',
      'Revisa precios cada trimestre',
    ],
  };
}
