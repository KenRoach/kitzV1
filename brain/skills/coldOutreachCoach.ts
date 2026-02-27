/**
 * Cold Outreach Coach skill — Email and WhatsApp outreach sequences.
 *
 * Builds personalized cold outreach sequences for B2B and B2C sales,
 * partnerships, and collaborations. WhatsApp-first for LatAm.
 * Owner: CRO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface OutreachMessage {
  step: number;
  channel: 'whatsapp' | 'email' | 'instagram_dm' | 'linkedin';
  dayFromStart: number;
  subject?: string;
  messageDraft: string;
  goal: string;
  followUpTrigger: string;
}

export interface OutreachSequence {
  sequenceName: string;
  targetProfile: string;
  totalSteps: number;
  messages: OutreachMessage[];
  personalizationTips: string[];
  doNotDo: string[];
  responseTemplates: { trigger: string; response: string }[];
  conversionTarget: string;
  actionSteps: string[];
}

export interface OutreachOptions {
  business: string;
  product: string;
  targetProfile: string;
  goal: 'sell' | 'partner' | 'collaborate' | 'recruit';
  channel?: string;
  valueProposition: string;
  language?: string;
}

const OUTREACH_SYSTEM =
  'You are a cold outreach coach for small businesses in Latin America. ' +
  'Write personalized, non-spammy outreach messages for WhatsApp, email, and Instagram DM. ' +
  'Lead with value, not pitch. Keep WhatsApp messages under 3 lines. ' +
  'Follow up 3-5 times with increasing value. Never be pushy. ' +
  'Default language: Spanish.';

const OUTREACH_FORMAT =
  'Respond with JSON: { "sequenceName": string, "targetProfile": string, "totalSteps": number, ' +
  '"messages": [{ "step": number, "channel": string, "dayFromStart": number, "subject": string, ' +
  '"messageDraft": string, "goal": string, "followUpTrigger": string }], ' +
  '"personalizationTips": [string], "doNotDo": [string], ' +
  '"responseTemplates": [{ "trigger": string, "response": string }], ' +
  '"conversionTarget": string, "actionSteps": [string] }';

export async function coachColdOutreach(options: OutreachOptions, llmClient?: LLMClient): Promise<OutreachSequence> {
  if (llmClient) {
    const prompt = `Cold outreach for: ${options.business}\nProduct: ${options.product}\n` +
      `Target: ${options.targetProfile}\nGoal: ${options.goal}\nValue: ${options.valueProposition}\n` +
      (options.channel ? `Primary channel: ${options.channel}\n` : '') +
      `\n${OUTREACH_FORMAT}`;
    const response = await llmClient.complete({ prompt, system: OUTREACH_SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as OutreachSequence; } catch { /* fall through */ }
  }

  return {
    sequenceName: `Outreach: ${options.product} → ${options.targetProfile}`,
    targetProfile: options.targetProfile,
    totalSteps: 4,
    messages: [
      { step: 1, channel: 'whatsapp', dayFromStart: 0, messageDraft: `Hola [nombre], vi que [contexto personal]. Trabajo en ${options.business} y creo que ${options.valueProposition}. ¿Te interesa saber más?`, goal: 'Open conversation', followUpTrigger: 'No responde en 3 días' },
      { step: 2, channel: 'whatsapp', dayFromStart: 3, messageDraft: `Hola [nombre], te envié un mensaje hace unos días. Quería compartirte [recurso gratis o dato relevante]. Sin compromiso.`, goal: 'Provide value', followUpTrigger: 'No responde en 4 días' },
      { step: 3, channel: 'email', dayFromStart: 7, subject: `${options.valueProposition} para [empresa]`, messageDraft: `Hola [nombre],\n\nTe contacté por WhatsApp sobre ${options.product}. Quería compartirte cómo [cliente similar] logró [resultado específico].\n\n¿Tienes 10 min esta semana para una llamada rápida?\n\nSaludos`, goal: 'Social proof + meeting request', followUpTrigger: 'No responde en 5 días' },
      { step: 4, channel: 'whatsapp', dayFromStart: 12, messageDraft: `[nombre], último mensaje — entiendo que estás ocupado. Si en algún momento necesitas ${options.valueProposition.toLowerCase()}, aquí estoy. ¡Éxitos!`, goal: 'Graceful close', followUpTrigger: 'End of sequence' },
    ],
    personalizationTips: [
      'Menciona algo específico de su perfil/negocio',
      'Referencia un post reciente o logro',
      'Encuentra una conexión en común',
      'Adapta el idioma a su estilo (formal vs casual)',
    ],
    doNotDo: [
      'No envíes mensajes genéricos copy-paste',
      'No pidas una venta en el primer mensaje',
      'No envíes audios sin permiso',
      'No insistas más de 4 veces sin respuesta',
      'No uses "estimado/a" — suena corporativo',
    ],
    responseTemplates: [
      { trigger: '"No me interesa"', response: 'Entendido, [nombre]. Gracias por tu tiempo. Si en el futuro necesitas [beneficio], aquí estamos.' },
      { trigger: '"Cuánto cuesta?"', response: 'Depende de lo que necesitas. ¿Puedo hacerte 2-3 preguntas para darte un número exacto?' },
      { trigger: '"Mándame info"', response: 'Con gusto. Te envío un resumen de 1 página. ¿Prefieres por WhatsApp o email?' },
    ],
    conversionTarget: '10-15% tasa de respuesta, 3-5% conversión a reunión',
    actionSteps: [
      'Haz una lista de 20 prospectos ideales',
      'Investiga cada uno (2 min por persona — Instagram, LinkedIn, Google)',
      'Personaliza el primer mensaje para cada uno',
      'Envía 5 mensajes por día — no más',
      'Registra respuestas en el CRM de Kitz',
    ],
  };
}
