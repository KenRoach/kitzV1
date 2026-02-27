/**
 * Customer Retention Advisor skill — Churn prediction, win-back, loyalty.
 * Owner: CRO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface ChurnSignal { signal: string; severity: 'low' | 'medium' | 'high'; action: string; }
export interface RetentionStrategy {
  churnSignals: ChurnSignal[];
  retentionTactics: string[];
  winBackSequence: Array<{ day: number; channel: string; message: string }>;
  loyaltyProgram: { type: string; tiers: string[]; rewards: string[] };
  metrics: { targetRetention: string; ltv: string; churnRate: string };
  actionSteps: string[];
}

export interface RetentionOptions {
  business: string;
  averageOrderValue: number;
  purchaseFrequency?: string;
  currentChurnRate?: number;
  currency?: string;
  language?: string;
}

const SYSTEM = 'You are a customer retention strategist for small businesses in Latin America. Identify churn signals, build win-back sequences, design loyalty programs. WhatsApp-first. Default language: Spanish.';
const FORMAT = 'Respond with JSON: { "churnSignals": [{ "signal": string, "severity": string, "action": string }], "retentionTactics": [string], "winBackSequence": [{ "day": number, "channel": string, "message": string }], "loyaltyProgram": { "type": string, "tiers": [string], "rewards": [string] }, "metrics": object, "actionSteps": [string] }';

export async function adviseRetention(options: RetentionOptions, llmClient?: LLMClient): Promise<RetentionStrategy> {
  if (llmClient) {
    const prompt = `Retention for: ${options.business}\nAOV: ${options.currency ?? 'USD'} ${options.averageOrderValue}\nFrequency: ${options.purchaseFrequency ?? 'monthly'}\nChurn: ${options.currentChurnRate ?? 'unknown'}%\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as RetentionStrategy; } catch { /* fall through */ }
  }
  return {
    churnSignals: [
      { signal: 'No compra en 60+ días', severity: 'high', action: 'Enviar oferta de win-back por WhatsApp' },
      { signal: 'No abre mensajes en 30 días', severity: 'medium', action: 'Cambiar canal (email → WhatsApp)' },
      { signal: 'Queja o calificación baja', severity: 'high', action: 'Llamada personal del dueño' },
    ],
    retentionTactics: [
      'Mensaje de agradecimiento post-compra (WhatsApp, mismo día)',
      'Oferta exclusiva al mes de la primera compra',
      'Cumpleaños: descuento especial + mensaje personalizado',
      'Preview de nuevos productos solo para clientes actuales',
    ],
    winBackSequence: [
      { day: 30, channel: 'whatsapp', message: '¡Te extrañamos! Mira lo nuevo que tenemos para ti...' },
      { day: 45, channel: 'whatsapp', message: 'Oferta especial solo para ti: 15% de descuento esta semana' },
      { day: 60, channel: 'email', message: 'Queremos saber cómo podemos mejorar. ¿Nos das 2 minutos?' },
    ],
    loyaltyProgram: { type: 'Puntos por compra', tiers: ['Bronce (0-500 pts)', 'Plata (500-1500 pts)', 'Oro (1500+ pts)'], rewards: ['Descuentos', 'Envío gratis', 'Acceso anticipado', 'Regalos exclusivos'] },
    metrics: { targetRetention: '70-80%', ltv: `${options.currency ?? 'USD'} ${options.averageOrderValue * 12}`, churnRate: '< 20% anual' },
    actionSteps: ['Identifica clientes que no compran en 30+ días', 'Envía primer mensaje de win-back esta semana', 'Crea programa de lealtad simple (puntos por compra)'],
  };
}
