/**
 * LLM-powered marketing content generator.
 * Generates social media posts, email subject lines, product descriptions.
 */

const LLM_HUB_URL = process.env.LLM_HUB_URL || 'http://localhost:4010';

export type ContentType = 'social_post' | 'email_subject' | 'product_description' | 'whatsapp_blast' | 'promo_offer';

export interface ContentRequest {
  type: ContentType;
  context: string;
  tone?: 'professional' | 'casual' | 'urgent' | 'friendly';
  language?: 'es' | 'en';
  maxLength?: number;
}

export interface ContentResult {
  type: ContentType;
  content: string;
  language: string;
  generatedAt: string;
  provider: string;
}

const SYSTEM_PROMPTS: Record<ContentType, string> = {
  social_post:
    'You are a social media content specialist for small businesses in Latin America. ' +
    'Write concise, engaging posts. Use emojis sparingly. Focus on value and action. ' +
    'Output ONLY the post text, no explanations.',
  email_subject:
    'You are an email marketing specialist. Write compelling subject lines that drive opens. ' +
    'Keep under 60 characters. Output ONLY the subject line.',
  product_description:
    'You are a product copywriter for e-commerce. Write clear, benefit-focused descriptions. ' +
    'Keep it under 150 words. Output ONLY the description.',
  whatsapp_blast:
    'You are a WhatsApp marketing specialist for LatAm small businesses. ' +
    'Write short, direct messages (max 160 chars). Friendly but professional. ' +
    'Output ONLY the message.',
  promo_offer:
    'You are a promotional offer writer. Create compelling, time-sensitive offers. ' +
    'Include a clear call to action. Output ONLY the offer text.',
};

export async function generateContent(req: ContentRequest): Promise<ContentResult> {
  const language = req.language || 'es';
  const languageInstruction = language === 'es' ? 'Write in Spanish.' : 'Write in English.';

  const prompt = `${languageInstruction} Tone: ${req.tone || 'friendly'}. ` +
    `Context: ${req.context}` +
    (req.maxLength ? ` Max length: ${req.maxLength} characters.` : '');

  try {
    const res = await fetch(`${LLM_HUB_URL}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        system: SYSTEM_PROMPTS[req.type],
        tier: 'haiku',
        taskType: 'drafting',
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      throw new Error(`LLM Hub ${res.status}`);
    }

    const data = (await res.json()) as { text?: string; model?: string };
    let content = data.text || '';

    if (req.maxLength && content.length > req.maxLength) {
      content = content.slice(0, req.maxLength);
    }

    return {
      type: req.type,
      content,
      language,
      generatedAt: new Date().toISOString(),
      provider: data.model || 'llm-hub',
    };
  } catch {
    // Fallback: return placeholder content
    const fallbacks: Record<ContentType, Record<string, string>> = {
      social_post: { es: '¡Nuevas oportunidades para tu negocio! Contáctanos.', en: 'New opportunities for your business! Contact us.' },
      email_subject: { es: 'Tu negocio merece crecer', en: 'Your business deserves to grow' },
      product_description: { es: 'Producto de alta calidad para tu negocio.', en: 'High quality product for your business.' },
      whatsapp_blast: { es: '¡Hola! Tenemos algo especial para ti.', en: 'Hi! We have something special for you.' },
      promo_offer: { es: '¡Oferta especial por tiempo limitado!', en: 'Special limited-time offer!' },
    };

    return {
      type: req.type,
      content: fallbacks[req.type][language] || fallbacks[req.type].es,
      language,
      generatedAt: new Date().toISOString(),
      provider: 'fallback',
    };
  }
}
