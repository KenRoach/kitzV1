/**
 * Copy Strategist skill — Headlines, CTAs, email copy, ad copy.
 *
 * Based on Copyhackers, Joanna Wiebe, Claude Hopkins (Scientific Advertising),
 * and David Ogilvy frameworks. Optimized for LatAm small businesses.
 * Owner: CMO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface HeadlineVariant {
  text: string;
  type: 'benefit' | 'curiosity' | 'urgency' | 'social_proof' | 'question';
  targetEmotion: string;
}

export interface CTAVariant {
  text: string;
  placement: string;
  urgencyElement?: string;
}

export interface CopyBlock {
  section: string;
  copy: string;
  wordCount: number;
  copywritingRule: string;
}

export interface CopyStrategy {
  headlines: HeadlineVariant[];
  subheadlines: string[];
  ctas: CTAVariant[];
  bodyBlocks: CopyBlock[];
  emailSubjectLines: string[];
  adCopy: { platform: string; text: string; hook: string }[];
  whatsappMessages: string[];
  voiceOfCustomer: string[];
  frameworkUsed: string;
  actionSteps: string[];
}

export interface CopyOptions {
  product: string;
  targetAudience: string;
  goal: 'sell' | 'lead_gen' | 'awareness' | 'engagement' | 'retention';
  tone?: 'casual' | 'professional' | 'urgent' | 'playful' | 'authoritative';
  platform?: string;
  existingCopy?: string;
  keyBenefit: string;
  language?: string;
}

const COPY_SYSTEM =
  'You are a conversion copywriter trained in Copyhackers methodology (Joanna Wiebe), ' +
  'Claude Hopkins (Scientific Advertising), and David Ogilvy. ' +
  'Write copy that converts. Lead with benefits, not features. Use voice-of-customer data. ' +
  'Headlines should stop scrolling. CTAs should reduce friction. ' +
  'Default language: Spanish. Adapt for WhatsApp-first LatAm businesses.';

const COPY_FORMAT =
  'Respond with JSON: { "headlines": [{ "text": string, "type": "benefit"|"curiosity"|"urgency"|"social_proof"|"question", ' +
  '"targetEmotion": string }], "subheadlines": [string], ' +
  '"ctas": [{ "text": string, "placement": string, "urgencyElement": string }], ' +
  '"bodyBlocks": [{ "section": string, "copy": string, "wordCount": number, "copywritingRule": string }], ' +
  '"emailSubjectLines": [string], "adCopy": [{ "platform": string, "text": string, "hook": string }], ' +
  '"whatsappMessages": [string], "voiceOfCustomer": [string], "frameworkUsed": string, "actionSteps": [string] }';

export async function createCopyStrategy(options: CopyOptions, llmClient?: LLMClient): Promise<CopyStrategy> {
  if (llmClient) {
    const prompt = `Create copy strategy for: ${options.product}\n` +
      `Target audience: ${options.targetAudience}\n` +
      `Goal: ${options.goal}\nTone: ${options.tone ?? 'casual'}\n` +
      `Key benefit: ${options.keyBenefit}\n` +
      (options.platform ? `Primary platform: ${options.platform}\n` : '') +
      (options.existingCopy ? `Current copy to improve: ${options.existingCopy}\n` : '') +
      `\n${COPY_FORMAT}`;
    const response = await llmClient.complete({ prompt, system: COPY_SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as CopyStrategy; } catch { /* fall through */ }
  }

  return {
    headlines: [
      { text: `${options.keyBenefit} — sin complicaciones`, type: 'benefit', targetEmotion: 'relief' },
      { text: `¿Por qué ${options.targetAudience} están eligiendo ${options.product}?`, type: 'curiosity', targetEmotion: 'curiosity' },
      { text: `Solo esta semana: ${options.keyBenefit}`, type: 'urgency', targetEmotion: 'FOMO' },
      { text: `+500 ${options.targetAudience} ya lo usan`, type: 'social_proof', targetEmotion: 'trust' },
      { text: `¿Cansado de no tener ${options.keyBenefit}?`, type: 'question', targetEmotion: 'frustration' },
    ],
    subheadlines: [
      `Lo que necesitas para ${options.keyBenefit.toLowerCase()}`,
      `Diseñado para ${options.targetAudience}`,
    ],
    ctas: [
      { text: 'Empieza gratis', placement: 'hero + footer', urgencyElement: 'Sin tarjeta de crédito' },
      { text: 'Quiero probarlo', placement: 'after benefits', urgencyElement: 'Cupos limitados' },
      { text: 'Escríbenos por WhatsApp', placement: 'floating button', urgencyElement: 'Respuesta en 5 min' },
    ],
    bodyBlocks: [
      { section: 'Problema', copy: `Sabemos que ${options.targetAudience} enfrentan [dolor]. No tiene que ser así.`, wordCount: 15, copywritingRule: 'PAS: Problem-Agitate-Solve' },
      { section: 'Solución', copy: `${options.product} te da ${options.keyBenefit} de forma simple.`, wordCount: 12, copywritingRule: 'Lead with benefit, not feature' },
      { section: 'Prueba social', copy: '"Desde que empecé a usar esto, mi negocio cambió." — Cliente real', wordCount: 14, copywritingRule: 'Voice of Customer > brand copy' },
    ],
    emailSubjectLines: [
      `${options.keyBenefit} (para ${options.targetAudience})`,
      `¿Puedo ayudarte con ${options.keyBenefit.toLowerCase()}?`,
      `3 cosas que ${options.targetAudience} hacen diferente`,
    ],
    adCopy: [
      { platform: 'Instagram', text: `${options.keyBenefit}. Para ${options.targetAudience} que quieren más. Link en bio.`, hook: 'Benefit + CTA' },
      { platform: 'WhatsApp Status', text: `Nuevo: ${options.product}. Escríbeme "info" para saber más.`, hook: 'Curiosity gap' },
    ],
    whatsappMessages: [
      `¡Hola! Te cuento sobre ${options.product} — ${options.keyBenefit}. ¿Te interesa saber más?`,
      `${options.keyBenefit}. Sin complicaciones. ¿Quieres que te explique cómo funciona?`,
    ],
    voiceOfCustomer: [
      '"Necesito algo simple que funcione"',
      '"No tengo tiempo para cosas complicadas"',
      '"Quiero ver resultados rápido"',
    ],
    frameworkUsed: 'Copyhackers + PAS (Problem-Agitate-Solve)',
    actionSteps: [
      'Prueba los 5 headlines con tu audiencia — mide clics',
      'Usa el CTA "Escríbenos por WhatsApp" — es el canal #1 en LatAm',
      'Agrega testimonios reales en la sección de prueba social',
      'A/B test email subject lines — envía 2 versiones',
    ],
  };
}
