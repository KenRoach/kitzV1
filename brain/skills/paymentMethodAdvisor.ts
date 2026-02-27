/**
 * Payment Method Advisor skill — Gateway selection by country, fees, integration.
 * Owner: CFO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface PaymentGateway { name: string; countries: string[]; fees: string; settlementDays: number; localMethods: string[]; pros: string[]; cons: string[]; }
export interface PaymentMethodAdvice {
  recommended: PaymentGateway;
  alternatives: PaymentGateway[];
  localMethods: Array<{ method: string; country: string; popularity: string; howToAccept: string }>;
  feeComparison: string;
  actionSteps: string[];
}

export interface PaymentMethodOptions {
  business: string;
  country: string;
  monthlyVolume: number;
  currency?: string;
  currentGateway?: string;
  language?: string;
}

const SYSTEM = 'You are a payments advisor for small businesses in Latin America. Recommend payment gateways, local payment methods (Yappy, PIX, OXXO, Nequi, etc.), and optimize fees. Default language: Spanish.';
const FORMAT = 'Respond with JSON: { "recommended": { "name": string, "countries": [string], "fees": string, "settlementDays": number, "localMethods": [string], "pros": [string], "cons": [string] }, "alternatives": [...], "localMethods": [{ "method": string, "country": string, "popularity": string, "howToAccept": string }], "feeComparison": string, "actionSteps": [string] }';

export async function advisePaymentMethods(options: PaymentMethodOptions, llmClient?: LLMClient): Promise<PaymentMethodAdvice> {
  if (llmClient) {
    const prompt = `Payment methods for: ${options.business} in ${options.country}\nVolume: ${options.currency ?? 'USD'} ${options.monthlyVolume}/mo\n${options.currentGateway ? `Current: ${options.currentGateway}\n` : ''}\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as PaymentMethodAdvice; } catch { /* fall through */ }
  }
  const country = options.country.toLowerCase();
  const gateways: Record<string, PaymentGateway> = {
    panama: { name: 'Yappy + Stripe', countries: ['Panama'], fees: 'Yappy: gratis / Stripe: 2.9%+30¢', settlementDays: 2, localMethods: ['Yappy', 'ACH directo', 'Tarjeta Clave'], pros: ['Yappy es gratuito', 'Alta adopción local'], cons: ['Yappy solo para Panamá'] },
    mexico: { name: 'Stripe + Conekta', countries: ['Mexico'], fees: '3.6%+3MXN (Stripe) / 2.9%+2.5MXN (Conekta)', settlementDays: 3, localMethods: ['OXXO', 'SPEI', 'CoDi'], pros: ['OXXO cubre no bancarizados'], cons: ['OXXO tarda 24-48h en confirmar'] },
    colombia: { name: 'PayU + Nequi', countries: ['Colombia'], fees: '3.49%+900COP (PayU)', settlementDays: 3, localMethods: ['Nequi', 'Daviplata', 'PSE', 'Efecty'], pros: ['Nequi es mobile-first'], cons: ['PSE tiene alta tasa de abandono'] },
    brazil: { name: 'Stripe + PagSeguro', countries: ['Brazil'], fees: '3.99%+0.39BRL (Stripe)', settlementDays: 2, localMethods: ['PIX', 'Boleto', 'Nubank'], pros: ['PIX es instantáneo y gratis'], cons: ['Boleto tarda 1-3 días'] },
  };
  const gw = gateways[country] ?? gateways.panama;
  return {
    recommended: gw,
    alternatives: [{ name: 'PayPal', countries: ['Global'], fees: '3.49%+49¢', settlementDays: 1, localMethods: [], pros: ['Conocido globalmente'], cons: ['Fees altas para LatAm'] }],
    localMethods: [{ method: gw.localMethods[0] ?? 'Transferencia', country: options.country, popularity: 'Alta', howToAccept: 'Integra vía API o acepta manualmente' }],
    feeComparison: `${gw.name}: ${gw.fees} | PayPal: 3.49%+49¢ | Mercado Pago: 4.99%`,
    actionSteps: ['Regístrate en ' + gw.name.split('+')[0].trim(), 'Acepta al menos 1 método local', 'Muestra todas las opciones de pago en checkout'],
  };
}
