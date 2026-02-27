/**
 * Content creation skill — generate marketing content for SMBs.
 *
 * Creates social media posts, product descriptions, promo copy,
 * WhatsApp broadcast messages, and multi-platform content packages.
 *
 * Use cases for KITZ SMBs:
 *  - WhatsApp broadcast messages (promos, new products, holiday greetings)
 *  - Instagram captions + hashtag strategy
 *  - Product descriptions for catalogs / checkout links
 *  - Weekly content calendars
 *  - Customer testimonial posts
 *  - FAQ / auto-reply content
 *
 * Reference repos:
 *  - AI-Content-Studio (github.com/naqashafzal/AI-Content-Studio) — full pipeline
 *  - n8n (github.com/n8n-io/n8n) — workflow automation with AI
 *  - AutoWP — WordPress + social media content automation
 */

import type { LLMClient } from './callTranscription.js';

export type ContentPlatform = 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'email' | 'website';
export type ContentType = 'promo' | 'product' | 'announcement' | 'testimonial' | 'faq' | 'greeting' | 'story';

export interface ContentPiece {
  platform: ContentPlatform;
  type: ContentType;
  text: string;
  hashtags?: string[];
  callToAction?: string;
  imagePrompt?: string;
  characterCount: number;
}

export interface ContentCreationResult {
  pieces: ContentPiece[];
  contentCalendar?: Array<{ dayOfWeek: string; platform: ContentPlatform; type: ContentType; topic: string }>;
}

export interface ContentCreationOptions {
  purpose: ContentType;
  platforms: ContentPlatform[];
  topic: string;
  productInfo?: { name: string; price: number; description?: string };
  businessName?: string;
  tone?: 'casual' | 'professional' | 'urgent' | 'playful' | 'inspirational';
  includeCalendar?: boolean;
  language?: string;
}

const CONTENT_SYSTEM =
  'You are a social media content creator for small businesses in Latin America. ' +
  'You create scroll-stopping, conversion-focused content for WhatsApp and Instagram. ' +
  'Default language is Spanish. Tone: Gen Z energy + business credibility. ' +
  'WhatsApp messages: 5-15 words, punchy, with emoji. ' +
  'Instagram captions: hook in first line, value in body, CTA at end. ' +
  'Always include relevant hashtags for Instagram. ' +
  'Think like a hustler who knows their audience.';

const CONTENT_FORMAT =
  'Respond with JSON: { "pieces": [{ "platform": string, "type": string, ' +
  '"text": string, "hashtags": string[], "callToAction": string, ' +
  '"imagePrompt": string (describe ideal visual), "characterCount": number }], ' +
  '"contentCalendar": [{ "dayOfWeek": string, "platform": string, ' +
  '"type": string, "topic": string }] | null }';

/**
 * Generate content for one or more platforms.
 * When no llmClient is provided, returns template content.
 */
export async function createContent(
  options: ContentCreationOptions,
  llmClient?: LLMClient,
): Promise<ContentCreationResult> {
  const language = options.language ?? 'es';
  const tone = options.tone ?? 'casual';

  if (llmClient) {
    const productLine = options.productInfo
      ? `\nProduct: ${options.productInfo.name} — $${options.productInfo.price} — ${options.productInfo.description ?? ''}`
      : '';

    const prompt =
      `Create ${options.purpose} content for: ${options.platforms.join(', ')}\n` +
      `Topic: ${options.topic}${productLine}\n` +
      `Business: ${options.businessName ?? 'N/A'}\n` +
      `Tone: ${tone}\n` +
      `Language: ${language}\n` +
      `Include weekly calendar: ${options.includeCalendar ? 'yes' : 'no'}\n\n` +
      CONTENT_FORMAT;

    const response = await llmClient.complete({
      prompt,
      system: CONTENT_SYSTEM,
      tier: 'sonnet',
    });

    try {
      return JSON.parse(response.text) as ContentCreationResult;
    } catch {
      return buildDefaultContent(options);
    }
  }

  return buildDefaultContent(options);
}

function buildDefaultContent(options: ContentCreationOptions): ContentCreationResult {
  const pieces: ContentPiece[] = options.platforms.map(platform => {
    const isWhatsApp = platform === 'whatsapp';
    const text = isWhatsApp
      ? `🔥 ${options.topic} — ¡Escríbenos!`
      : `${options.topic}\n\n${options.productInfo ? `${options.productInfo.name} — $${options.productInfo.price}` : ''}\n\n¡Envíanos un mensaje para más info! 💬`;

    return {
      platform,
      type: options.purpose,
      text,
      hashtags: platform === 'instagram' ? ['#negocio', '#emprendedor', '#LatAm'] : undefined,
      callToAction: '¡Escríbenos por WhatsApp!',
      imagePrompt: `[Image prompt unavailable — no LLM client configured]`,
      characterCount: text.length,
    };
  });

  return { pieces };
}
