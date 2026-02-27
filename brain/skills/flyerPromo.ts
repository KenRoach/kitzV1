/**
 * Flyer/promo skill — generate promotional material specifications.
 *
 * Use cases: sale flyers, event posters, WhatsApp promo images, social banners.
 */

import type { LLMClient } from './callTranscription.js';

export interface FlyerResult {
  title: string;
  headline: string;
  subheadline: string;
  bodyText: string;
  ctaText: string;
  designSpec: {
    size: string;
    backgroundColor: string;
    textColor: string;
    layout: 'centered' | 'left-aligned' | 'split';
    imagePrompt: string;
  };
  platforms: string[];
}

export interface FlyerOptions {
  purpose: 'sale' | 'event' | 'launch' | 'holiday' | 'general';
  product?: string;
  discount?: string;
  eventDate?: string;
  businessName?: string;
  brandColor?: string;
  platforms?: string[];
  language?: string;
}

const FLYER_SYSTEM =
  'You are a promotional material designer for small businesses in Latin America. ' +
  'Create eye-catching flyer specs: bold headline, clear offer, strong CTA. ' +
  'Mobile-first (WhatsApp/Instagram dimensions). Default language: Spanish.';

export async function createFlyer(options: FlyerOptions, llmClient?: LLMClient): Promise<FlyerResult> {
  if (llmClient) {
    const prompt = `Create a ${options.purpose} flyer:\nProduct: ${options.product ?? 'general'}\n` +
      `Discount: ${options.discount ?? 'none'}\nBusiness: ${options.businessName ?? 'N/A'}\n` +
      `Color: ${options.brandColor ?? '#FF6B35'}\nPlatforms: ${(options.platforms ?? ['whatsapp', 'instagram']).join(', ')}\nLanguage: ${options.language ?? 'es'}`;
    const response = await llmClient.complete({ prompt, system: FLYER_SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as FlyerResult; } catch { /* fall through */ }
  }
  return {
    title: `${options.purpose} Flyer`, headline: options.product ?? 'Gran Oferta', subheadline: options.discount ?? '',
    bodyText: '[Flyer content unavailable]', ctaText: '¡Escríbenos!',
    designSpec: { size: '1080x1080', backgroundColor: options.brandColor ?? '#FF6B35', textColor: '#FFFFFF', layout: 'centered', imagePrompt: '[No LLM]' },
    platforms: options.platforms ?? ['whatsapp', 'instagram'],
  };
}
