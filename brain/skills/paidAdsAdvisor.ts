/**
 * Paid Ads Advisor skill — Google Ads, Meta Ads, campaign structure, ROAS targeting.
 *
 * Helps LatAm SMBs run profitable paid advertising campaigns with
 * budget allocation, targeting, creative strategy, and ROAS optimization.
 * Owner: CMO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface AdCampaign {
  platform: 'google' | 'meta' | 'tiktok';
  objective: string;
  dailyBudget: number;
  targeting: { audiences: string[]; locations: string[]; interests: string[] };
  creativeGuidelines: string;
  expectedCPC: string;
  expectedROAS: string;
}

export interface PaidAdsStrategy {
  totalBudget: number;
  currency: string;
  campaigns: AdCampaign[];
  budgetSplit: Record<string, number>;
  creativeIdeas: string[];
  audienceStrategy: string;
  retargetingPlan: string;
  kpiTargets: { cpc: string; ctr: string; roas: string; cpa: string };
  weeklyOptimization: string[];
  actionSteps: string[];
}

export interface PaidAdsOptions {
  business: string;
  product: string;
  monthlyBudget: number;
  currency?: string;
  goal: 'sales' | 'leads' | 'traffic' | 'awareness';
  targetAudience: string;
  country: string;
  platforms?: string[];
  language?: string;
}

const ADS_SYSTEM =
  'You are a paid advertising strategist for small businesses in Latin America. ' +
  'Specialize in Google Ads, Meta (Facebook/Instagram) Ads, and TikTok Ads. ' +
  'Optimize for ROAS with limited budgets ($100-1000/month). ' +
  'Account for local market dynamics: WhatsApp as conversion channel, mobile-first audiences. ' +
  'Default language: Spanish.';

const ADS_FORMAT =
  'Respond with JSON: { "totalBudget": number, "currency": string, ' +
  '"campaigns": [{ "platform": string, "objective": string, "dailyBudget": number, ' +
  '"targeting": { "audiences": [string], "locations": [string], "interests": [string] }, ' +
  '"creativeGuidelines": string, "expectedCPC": string, "expectedROAS": string }], ' +
  '"budgetSplit": { "google": number, "meta": number }, "creativeIdeas": [string], ' +
  '"audienceStrategy": string, "retargetingPlan": string, ' +
  '"kpiTargets": { "cpc": string, "ctr": string, "roas": string, "cpa": string }, ' +
  '"weeklyOptimization": [string], "actionSteps": [string] }';

export async function advisePaidAds(options: PaidAdsOptions, llmClient?: LLMClient): Promise<PaidAdsStrategy> {
  if (llmClient) {
    const prompt = `Paid ads strategy for: ${options.business}\nProduct: ${options.product}\n` +
      `Budget: ${options.currency ?? 'USD'} ${options.monthlyBudget}/mo\nGoal: ${options.goal}\n` +
      `Audience: ${options.targetAudience}\nCountry: ${options.country}\n` +
      (options.platforms ? `Platforms: ${options.platforms.join(', ')}\n` : '') +
      `\n${ADS_FORMAT}`;
    const response = await llmClient.complete({ prompt, system: ADS_SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as PaidAdsStrategy; } catch { /* fall through */ }
  }

  const budget = options.monthlyBudget;
  return {
    totalBudget: budget,
    currency: options.currency ?? 'USD',
    campaigns: [
      { platform: 'meta', objective: `${options.goal} — ${options.product}`, dailyBudget: Math.round((budget * 0.6) / 30), targeting: { audiences: [options.targetAudience], locations: [options.country], interests: ['emprendimiento', 'negocios'] }, creativeGuidelines: 'Video corto (15s) mostrando el producto en uso. Texto: beneficio principal + CTA a WhatsApp.', expectedCPC: '$0.15-0.40', expectedROAS: '2-4x' },
      { platform: 'google', objective: `Búsqueda — ${options.product}`, dailyBudget: Math.round((budget * 0.4) / 30), targeting: { audiences: ['intent-based'], locations: [options.country], interests: [] }, creativeGuidelines: 'Anuncios de texto con keyword principal + extensiones de llamada y WhatsApp.', expectedCPC: '$0.30-0.80', expectedROAS: '3-6x' },
    ],
    budgetSplit: { meta: 60, google: 40 },
    creativeIdeas: [
      'Video testimonio de cliente (30s)',
      'Carrusel antes/después',
      'Story con encuesta o quiz',
      'Reels mostrando proceso/behind the scenes',
    ],
    audienceStrategy: `Lookalike de clientes actuales + intereses en ${options.product}`,
    retargetingPlan: 'Pixel de Meta + tag de Google en landing. Retarget visitantes 7-30 días con oferta especial.',
    kpiTargets: { cpc: '$0.20-0.50', ctr: '1.5-3%', roas: '3x mínimo', cpa: `< ${Math.round(budget * 0.1)}` },
    weeklyOptimization: [
      'Pausa anuncios con CTR < 1%',
      'Aumenta presupuesto en anuncios con ROAS > 3x',
      'Prueba nuevos creativos cada 2 semanas',
      'Revisa términos de búsqueda negativos en Google',
    ],
    actionSteps: [
      'Instala el Pixel de Meta y tag de Google en tu sitio/landing',
      'Crea tu primera campaña con el 60% del presupuesto en Meta',
      'Configura conversión a WhatsApp como evento principal',
      'Revisa resultados cada 3 días y optimiza',
    ],
  };
}
