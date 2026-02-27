/**
 * Email Sequence Builder skill — Nurture sequences, segment targeting, drips.
 *
 * Builds automated email sequences for lead nurturing, onboarding, re-engagement,
 * and upselling. Optimized for LatAm SMBs using Resend/SMTP.
 * Owner: CMO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface SequenceEmail {
  day: number;
  subject: string;
  previewText: string;
  bodyOutline: string;
  cta: string;
  goal: 'introduce' | 'educate' | 'nurture' | 'convert' | 'retain' | 'reactivate';
  tone: 'warm' | 'professional' | 'urgent' | 'casual';
}

export interface SegmentRule {
  name: string;
  criteria: string;
  sequenceType: string;
}

export interface EmailSequencePlan {
  sequenceName: string;
  sequenceType: 'welcome' | 'nurture' | 'onboarding' | 'sales' | 'reengagement' | 'upsell' | 'post_purchase';
  totalEmails: number;
  durationDays: number;
  emails: SequenceEmail[];
  segments: SegmentRule[];
  automationTrigger: string;
  metrics: { targetOpenRate: string; targetClickRate: string; targetConversion: string };
  bestPractices: string[];
  actionSteps: string[];
}

export interface EmailSequenceOptions {
  business: string;
  product: string;
  goal: 'welcome' | 'nurture' | 'sell' | 'onboard' | 'reengage' | 'upsell';
  targetAudience: string;
  emailCount?: number;
  durationDays?: number;
  existingList?: number;
  language?: string;
}

const EMAIL_SYSTEM =
  'You are an email marketing strategist for small businesses in Latin America. ' +
  'Build email sequences that nurture relationships and drive conversions. ' +
  'Keep emails short (< 200 words), mobile-friendly, and action-oriented. ' +
  'Subject lines should be < 50 characters. Use curiosity and benefit-driven copy. ' +
  'Default language: Spanish. Consider that many recipients check email on mobile via WhatsApp notification.';

const EMAIL_FORMAT =
  'Respond with JSON: { "sequenceName": string, "sequenceType": string, "totalEmails": number, ' +
  '"durationDays": number, "emails": [{ "day": number, "subject": string, "previewText": string, ' +
  '"bodyOutline": string, "cta": string, "goal": string, "tone": string }], ' +
  '"segments": [{ "name": string, "criteria": string, "sequenceType": string }], ' +
  '"automationTrigger": string, "metrics": { "targetOpenRate": string, "targetClickRate": string, ' +
  '"targetConversion": string }, "bestPractices": [string], "actionSteps": [string] }';

export async function buildEmailSequence(options: EmailSequenceOptions, llmClient?: LLMClient): Promise<EmailSequencePlan> {
  if (llmClient) {
    const prompt = `Build email sequence for: ${options.business}\n` +
      `Product: ${options.product}\nGoal: ${options.goal}\n` +
      `Target audience: ${options.targetAudience}\n` +
      `Emails: ${options.emailCount ?? 5}\nDuration: ${options.durationDays ?? 14} days\n` +
      (options.existingList ? `Existing list size: ${options.existingList}\n` : '') +
      `\n${EMAIL_FORMAT}`;
    const response = await llmClient.complete({ prompt, system: EMAIL_SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as EmailSequencePlan; } catch { /* fall through */ }
  }

  const goalToType: Record<string, EmailSequencePlan['sequenceType']> = {
    welcome: 'welcome', nurture: 'nurture', sell: 'sales',
    onboard: 'onboarding', reengage: 'reengagement', upsell: 'upsell',
  };

  return {
    sequenceName: `Secuencia de ${options.goal} — ${options.product}`,
    sequenceType: goalToType[options.goal] ?? 'nurture',
    totalEmails: options.emailCount ?? 5,
    durationDays: options.durationDays ?? 14,
    emails: [
      { day: 0, subject: `Bienvenido a ${options.business}`, previewText: `Te contamos cómo ${options.product} puede ayudarte`, bodyOutline: `Presentación + valor principal + qué esperar en los próximos emails`, cta: 'Explora tu cuenta', goal: 'introduce', tone: 'warm' },
      { day: 2, subject: `El secreto que ${options.targetAudience} no saben`, previewText: 'Te cuento algo que cambió todo para nuestros clientes', bodyOutline: `Historia de cliente exitoso + cómo lo logró con ${options.product}`, cta: 'Lee la historia completa', goal: 'educate', tone: 'casual' },
      { day: 5, subject: `3 formas de sacar más de ${options.product}`, previewText: 'Tips rápidos que puedes aplicar hoy', bodyOutline: `3 tips prácticos + resultados esperados + enlace a guía`, cta: 'Pruébalos ahora', goal: 'nurture', tone: 'professional' },
      { day: 9, subject: `¿Listo para el siguiente paso?`, previewText: `${options.targetAudience} están logrando [resultado]`, bodyOutline: `Caso de éxito + oferta especial + deadline`, cta: 'Quiero empezar', goal: 'convert', tone: 'warm' },
      { day: 14, subject: `Última oportunidad: oferta especial para ti`, previewText: 'Se acaba esta semana', bodyOutline: `Resumen de beneficios + urgencia + garantía + CTA final`, cta: 'Activa tu oferta', goal: 'convert', tone: 'urgent' },
    ],
    segments: [
      { name: 'Nuevos suscriptores', criteria: 'Registrados en los últimos 7 días', sequenceType: 'welcome' },
      { name: 'Activos sin compra', criteria: 'Abrieron 3+ emails pero no compraron', sequenceType: 'nurture' },
      { name: 'Inactivos', criteria: 'Sin apertura en 30+ días', sequenceType: 'reengagement' },
    ],
    automationTrigger: options.goal === 'welcome' ? 'Al registrarse' : options.goal === 'reengage' ? '30 días sin actividad' : 'Manual o por segmento',
    metrics: { targetOpenRate: '25-35%', targetClickRate: '3-5%', targetConversion: '1-3%' },
    bestPractices: [
      'Subject lines < 50 caracteres — móvil primero',
      'Un solo CTA por email — no confundas al lector',
      'Envía entre 9-11am hora local — mejor apertura',
      'Personaliza con nombre del contacto',
      'Incluye opción de WhatsApp como canal alternativo',
    ],
    actionSteps: [
      'Configura la secuencia en tu proveedor de email (Resend, Mailchimp, etc.)',
      'Escribe el contenido completo de cada email basándote en los outlines',
      'Crea los segmentos de audiencia en tu CRM',
      'Programa el primer envío y monitorea tasas de apertura',
      'Optimiza subject lines después de 100 envíos',
    ],
  };
}
