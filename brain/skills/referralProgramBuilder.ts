/**
 * Referral Program Builder skill — Incentive structures, viral loops, ambassador programs.
 *
 * Helps LatAm SMBs build word-of-mouth growth engines using referral programs,
 * ambassador programs, and viral loops adapted for WhatsApp-first markets.
 * Owner: CMO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface ReferralTier {
  name: string;
  referralsNeeded: number;
  reward: string;
  rewardValue: number;
}

export interface ReferralProgram {
  programName: string;
  type: 'simple_referral' | 'tiered' | 'ambassador' | 'affiliate' | 'viral_loop';
  tiers: ReferralTier[];
  referrerReward: string;
  refereeReward: string;
  mechanics: string;
  whatsappFlow: string[];
  messagingTemplates: { trigger: string; message: string }[];
  viralCoefficient: string;
  trackingMethod: string;
  costPerReferral: string;
  actionSteps: string[];
}

export interface ReferralOptions {
  business: string;
  product: string;
  averageOrderValue: number;
  currency?: string;
  currentCustomers?: number;
  budget?: number;
  channel?: string;
  language?: string;
}

const REFERRAL_SYSTEM =
  'You are a growth strategist specializing in referral programs for small businesses in Latin America. ' +
  'Design WhatsApp-first referral programs with simple mechanics. ' +
  'Account for the social/community culture in LatAm — word of mouth is king. ' +
  'Keep tracking simple (WhatsApp codes, not complex software). ' +
  'Default language: Spanish.';

const REFERRAL_FORMAT =
  'Respond with JSON: { "programName": string, "type": string, ' +
  '"tiers": [{ "name": string, "referralsNeeded": number, "reward": string, "rewardValue": number }], ' +
  '"referrerReward": string, "refereeReward": string, "mechanics": string, ' +
  '"whatsappFlow": [string], "messagingTemplates": [{ "trigger": string, "message": string }], ' +
  '"viralCoefficient": string, "trackingMethod": string, "costPerReferral": string, "actionSteps": [string] }';

export async function buildReferralProgram(options: ReferralOptions, llmClient?: LLMClient): Promise<ReferralProgram> {
  if (llmClient) {
    const prompt = `Referral program for: ${options.business}\nProduct: ${options.product}\n` +
      `AOV: ${options.currency ?? 'USD'} ${options.averageOrderValue}\n` +
      (options.currentCustomers ? `Current customers: ${options.currentCustomers}\n` : '') +
      (options.budget ? `Budget: ${options.currency ?? 'USD'} ${options.budget}\n` : '') +
      `Primary channel: ${options.channel ?? 'WhatsApp'}\n\n${REFERRAL_FORMAT}`;
    const response = await llmClient.complete({ prompt, system: REFERRAL_SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as ReferralProgram; } catch { /* fall through */ }
  }

  const aov = options.averageOrderValue;
  const rewardValue = Math.round(aov * 0.15);

  return {
    programName: `Recomienda y Gana — ${options.business}`,
    type: 'tiered',
    tiers: [
      { name: 'Amigo', referralsNeeded: 1, reward: `${rewardValue}% de descuento`, rewardValue },
      { name: 'Embajador', referralsNeeded: 5, reward: `Producto gratis + ${rewardValue * 2}% descuento permanente`, rewardValue: rewardValue * 3 },
      { name: 'VIP', referralsNeeded: 10, reward: 'Acceso exclusivo + comisión del 10% por cada venta referida', rewardValue: Math.round(aov * 0.1) },
    ],
    referrerReward: `${rewardValue}% de descuento en su próxima compra por cada referido`,
    refereeReward: '10% de descuento en su primera compra',
    mechanics: `1. Cliente recibe su código único por WhatsApp\n2. Comparte con amigos\n3. Amigo compra mencionando el código\n4. Ambos reciben su recompensa`,
    whatsappFlow: [
      'Cliente compra → recibe mensaje automático con su código de referido',
      'Cliente comparte código por WhatsApp/redes',
      'Nuevo cliente envía código al comprar ("Mi código es JUAN123")',
      'Sistema registra la referencia y aplica descuentos',
      'Referidor recibe notificación: "¡Tu amigo compró! Ganaste [recompensa]"',
    ],
    messagingTemplates: [
      { trigger: 'Post-compra', message: `¡Gracias por tu compra! 🎁 Tu código de referido es [CÓDIGO]. Compártelo con tus amigos — ambos ganan ${rewardValue}% de descuento.` },
      { trigger: 'Referido usado', message: `¡Tu amigo [nombre] usó tu código! Ganaste ${rewardValue}% de descuento en tu próxima compra. Ya llevas [X] referidos.` },
      { trigger: 'Recordatorio mensual', message: `¿Sabías que puedes ganar descuentos recomendando ${options.business}? Tu código: [CÓDIGO]. Compártelo por WhatsApp.` },
      { trigger: 'Nuevo tier', message: `¡Felicidades! Subiste a nivel [TIER]. Tu nueva recompensa: [REWARD]. Sigue recomendando para llegar a VIP.` },
    ],
    viralCoefficient: '0.3-0.5 (cada cliente trae 0.3-0.5 clientes nuevos)',
    trackingMethod: 'Código único por cliente (4-6 caracteres). Registro manual en CRM de Kitz o automático via WhatsApp bot.',
    costPerReferral: `~${options.currency ?? 'USD'} ${Math.round(aov * 0.2)} por referido (15% + 10% descuentos)`,
    actionSteps: [
      'Genera códigos únicos para tus 10 mejores clientes',
      'Envía el primer mensaje de referidos esta semana por WhatsApp',
      'Crea un WhatsApp Status anunciando el programa',
      'Registra cada referido en Kitz CRM',
      'Revisa resultados cada 2 semanas — ajusta recompensas si conversión < 5%',
    ],
  };
}
