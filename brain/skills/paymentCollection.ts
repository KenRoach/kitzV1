/**
 * Payment collection skill — manage payment reminders, reconciliation, and follow-up.
 *
 * Flow: invoice sent → reminder schedule → payment received → reconcile → receipt
 * Owner: CFO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface PaymentReminderStep {
  day: number;
  channel: 'whatsapp' | 'email' | 'sms';
  messageDraft: string;
  tone: 'friendly' | 'firm' | 'urgent';
  escalate: boolean;
}

export interface PaymentCollectionResult {
  invoiceId: string;
  reminderSchedule: PaymentReminderStep[];
  paymentLink: string | null;
  totalAmount: number;
  currency: string;
  followUpStrategy: string;
}

export interface PaymentCollectionOptions {
  invoiceId: string;
  customerName: string;
  amount: number;
  currency?: string;
  dueDate: string;
  daysPastDue?: number;
  paymentMethods: string[];
  language?: string;
}

const PAYMENT_SYSTEM =
  'You are a payment collection specialist for small businesses in Latin America. ' +
  'Create a gentle but effective payment reminder schedule. ' +
  'Escalate tone gradually: friendly → firm → urgent. ' +
  'Always offer payment options (Yappy, bank transfer, cash). ' +
  'Draft-first: all messages need approval. Default language: Spanish. Never threatening.';

const PAYMENT_FORMAT =
  'Respond with JSON: { "invoiceId": string, "reminderSchedule": [{ "day": number (days from now), ' +
  '"channel": "whatsapp"|"email"|"sms", "messageDraft": string, "tone": "friendly"|"firm"|"urgent", ' +
  '"escalate": boolean }], "paymentLink": string|null, "totalAmount": number, "currency": string, ' +
  '"followUpStrategy": string }';

export async function planPaymentCollection(options: PaymentCollectionOptions, llmClient?: LLMClient): Promise<PaymentCollectionResult> {
  if (llmClient) {
    const prompt = `Plan payment collection for invoice ${options.invoiceId}:\n` +
      `Customer: ${options.customerName}\nAmount: ${options.currency ?? 'USD'} ${options.amount}\n` +
      `Due: ${options.dueDate}\nDays past due: ${options.daysPastDue ?? 0}\n` +
      `Payment methods: ${options.paymentMethods.join(', ')}\n` +
      `Language: ${options.language ?? 'es'}\n\n${PAYMENT_FORMAT}`;
    const response = await llmClient.complete({ prompt, system: PAYMENT_SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as PaymentCollectionResult; } catch { /* fall through */ }
  }
  return {
    invoiceId: options.invoiceId,
    reminderSchedule: [
      { day: 0, channel: 'whatsapp', messageDraft: `Hola ${options.customerName}, te enviamos el detalle de tu factura ${options.invoiceId} por $${options.amount}. ¿Cómo prefieres pagar?`, tone: 'friendly', escalate: false },
      { day: 3, channel: 'whatsapp', messageDraft: `Recordatorio amistoso: tu pago de $${options.amount} está pendiente. ¡Escríbenos si tienes dudas!`, tone: 'friendly', escalate: false },
      { day: 7, channel: 'email', messageDraft: `Segundo aviso: factura ${options.invoiceId} pendiente por $${options.amount}. Agradecemos tu pronto pago.`, tone: 'firm', escalate: true },
    ],
    paymentLink: null,
    totalAmount: options.amount,
    currency: options.currency ?? 'USD',
    followUpStrategy: 'Escalate to phone call after 14 days past due',
  };
}
