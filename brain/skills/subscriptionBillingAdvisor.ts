/**
 * Subscription Billing Advisor skill — Pricing tiers, churn reduction, billing systems.
 * Owner: CFO agent.
 */
import type { LLMClient } from './callTranscription.js';

export interface SubscriptionAdvice {
  pricingTiers: Array<{ name: string; price: number; features: string[]; targetSegment: string }>;
  billingCycle: string; trialStrategy: string; churnReduction: string[];
  billingTools: Array<{ name: string; cost: string; bestFor: string }>;
  metricsToTrack: string[]; actionSteps: string[];
}
export interface SubscriptionOptions { business: string; product: string; currentPrice?: number; currency?: string; targetMarket?: string; language?: string; }

const SYSTEM = 'You are a subscription billing advisor for LatAm SMBs. Design pricing tiers, reduce churn, recommend billing tools. Spanish default.';
const FORMAT = 'Respond with JSON: { "pricingTiers": [object], "billingCycle": string, "trialStrategy": string, "churnReduction": [string], "billingTools": [object], "metricsToTrack": [string], "actionSteps": [string] }';

export async function adviseSubscriptionBilling(options: SubscriptionOptions, llmClient?: LLMClient): Promise<SubscriptionAdvice> {
  if (llmClient) {
    const prompt = `Subscription for: ${options.business}\nProduct: ${options.product}\nPrice: ${options.currency ?? 'USD'} ${options.currentPrice ?? 0}\nMarket: ${options.targetMarket ?? 'LatAm'}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as SubscriptionAdvice; } catch { /* fall through */ }
  }
  const base = options.currentPrice ?? 20;
  return {
    pricingTiers: [
      { name: 'Gratis', price: 0, features: ['Funciones básicas', 'Límite de uso'], targetSegment: 'Prueba / top of funnel' },
      { name: 'Starter', price: Math.round(base * 0.5), features: ['Todo de Gratis', 'Más límites', 'Soporte email'], targetSegment: 'Negocios pequeños' },
      { name: 'Pro', price: base, features: ['Todo de Starter', 'Sin límites', 'Soporte WhatsApp', 'Integraciones'], targetSegment: 'Negocios en crecimiento' },
    ],
    billingCycle: 'Mensual con descuento 20% anual. Cobra el día 1 del mes.',
    trialStrategy: '14 días gratis sin tarjeta → Pide tarjeta al día 10 → Cobra al día 15',
    churnReduction: ['Onboarding en primeras 24h (guía paso a paso)', 'Check-in al día 7 y 30', 'Ofrece descuento antes de cancelar', 'Encuesta de salida para entender razones'],
    billingTools: [{ name: 'Stripe Billing', cost: '2.9% + 30¢', bestFor: 'SaaS, recurrencia automática' }, { name: 'Mercado Pago', cost: '4.99%', bestFor: 'LatAm, tarjetas locales' }, { name: 'Manual (Yappy/transferencia)', cost: 'Gratis', bestFor: 'Pocas suscripciones, sin automatizar' }],
    metricsToTrack: ['MRR (Monthly Recurring Revenue)', 'Churn rate mensual', 'ARPU (Average Revenue Per User)', 'Trial-to-paid conversion rate', 'Net Revenue Retention'],
    actionSteps: ['Define 2-3 tiers con valor claro entre cada uno', 'Implementa cobro recurrente (Stripe o manual)', 'Envía recordatorio 3 días antes del cobro', 'Monitorea churn semanal — actúa si sube del 5%'],
  };
}
