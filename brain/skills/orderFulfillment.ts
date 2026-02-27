/**
 * Order fulfillment skill — orchestrate end-to-end order processing.
 *
 * Flow: order received → validate → prepare → ship/deliver → confirm → follow-up
 * Owner: COO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface FulfillmentStep {
  step: number;
  action: string;
  owner: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  messageDraft?: string;
  automatable: boolean;
}

export interface FulfillmentResult {
  orderId: string;
  steps: FulfillmentStep[];
  estimatedDeliveryHours: number;
  customerNotificationDrafts: string[];
  risks: string[];
}

export interface FulfillmentOptions {
  orderId: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  deliveryMethod: 'pickup' | 'delivery' | 'digital';
  paymentStatus: 'pending' | 'paid' | 'partial';
  language?: string;
}

const FULFILLMENT_SYSTEM =
  'You are an order fulfillment coordinator for small businesses in Latin America. ' +
  'Create a step-by-step fulfillment plan with customer notification drafts. ' +
  'Flag risks (payment pending, stock issues, delivery delays). ' +
  'Draft-first: all customer messages are drafts for approval. Default language: Spanish.';

const FULFILLMENT_FORMAT =
  'Respond with JSON: { "orderId": string, "steps": [{ "step": number, "action": string, ' +
  '"owner": string, "status": "pending", "messageDraft": string|null, "automatable": boolean }], ' +
  '"estimatedDeliveryHours": number, "customerNotificationDrafts": string[], "risks": string[] }';

export async function planFulfillment(options: FulfillmentOptions, llmClient?: LLMClient): Promise<FulfillmentResult> {
  if (llmClient) {
    const prompt = `Plan fulfillment for order ${options.orderId}:\n` +
      `Customer: ${options.customerName}\nItems: ${JSON.stringify(options.items)}\n` +
      `Delivery: ${options.deliveryMethod}\nPayment: ${options.paymentStatus}\n` +
      `Language: ${options.language ?? 'es'}\n\n${FULFILLMENT_FORMAT}`;
    const response = await llmClient.complete({ prompt, system: FULFILLMENT_SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as FulfillmentResult; } catch { /* fall through */ }
  }
  const risks = options.paymentStatus !== 'paid' ? ['Payment not confirmed'] : [];
  return {
    orderId: options.orderId,
    steps: [
      { step: 1, action: 'Confirm order received', owner: 'system', status: 'pending', messageDraft: `¡Pedido ${options.orderId} recibido! Te confirmamos pronto.`, automatable: true },
      { step: 2, action: 'Verify payment', owner: 'finance', status: 'pending', automatable: true },
      { step: 3, action: 'Prepare order', owner: 'operations', status: 'pending', automatable: false },
      { step: 4, action: 'Notify customer ready', owner: 'system', status: 'pending', messageDraft: `Tu pedido está listo para ${options.deliveryMethod === 'pickup' ? 'recoger' : 'envío'} 📦`, automatable: true },
    ],
    estimatedDeliveryHours: options.deliveryMethod === 'digital' ? 0.5 : 24,
    customerNotificationDrafts: [`Pedido ${options.orderId} confirmado`, `Tu pedido está en camino`],
    risks,
  };
}
