/**
 * Content Creation Tools — AI-generated marketing content for SMBs.
 *
 * 2 tools:
 *   - content_create    (medium) — Generate multi-platform marketing content
 *   - content_calendar  (medium) — Generate a weekly content calendar
 *
 * Uses Claude Sonnet for creative work, falls back to OpenAI gpt-4o.
 * Platforms: WhatsApp, Instagram, Facebook, TikTok, Email, Website.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('contentCreationTools');
import type { ToolSchema } from './registry.js';
import { callLLM } from './shared/callLLM.js';

const NOTIF_QUEUE_URL = process.env.NOTIF_QUEUE_URL || 'http://kitz-notifications-queue:3008';

async function enqueueContent(channel: 'whatsapp' | 'email', text: string, orgId: string, traceId: string): Promise<void> {
  try {
    await fetch(`${NOTIF_QUEUE_URL}/enqueue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-trace-id': traceId,
        'x-org-id': orgId,
        'x-service-secret': process.env.SERVICE_SECRET || '',
      },
      body: JSON.stringify({
        idempotencyKey: `content_${traceId}_${channel}`,
        channel,
        draftOnly: true,
        payload: { text },
      }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    log.warn('Failed to enqueue content for auto-send', { channel, traceId });
  }
}


const CONTENT_SYSTEM = `You are a social media content creator for small businesses in Latin America.
Create scroll-stopping, conversion-focused content for WhatsApp and Instagram.
Default language: Spanish. Tone: Gen Z energy + business credibility.

Platform rules:
- WhatsApp: 5-15 words, punchy, with emoji. For broadcasts and status updates.
- Instagram: Hook in first line, value in body, CTA at end. 5-10 relevant hashtags.
- Facebook: Slightly longer, community-focused, share-worthy.
- TikTok: Trendy, short caption, trending hashtags.
- Email: Subject line (5-8 words), preview text, body with CTA.
- Website: SEO-friendly, clear value proposition.

Always include: CTA (call-to-action) and image/visual direction.

Respond with valid JSON:
{
  "pieces": [{
    "platform": "string",
    "type": "string",
    "text": "string",
    "hashtags": ["string"] | null,
    "call_to_action": "string",
    "image_prompt": "string (describe ideal visual)",
    "character_count": number
  }]
}`;

const CALENDAR_SYSTEM = `You are a content strategist for small businesses in Latin America.
Create a 7-day content calendar with specific post ideas for each day.
Balance platforms, content types, and engagement tactics.
Default language: Spanish.

Respond with valid JSON:
{
  "week_theme": "string",
  "days": [{
    "day": "Lunes" | "Martes" | ... | "Domingo",
    "platform": "string",
    "type": "promo" | "product" | "testimonial" | "educational" | "engagement" | "story",
    "topic": "string",
    "hook": "string (first line of post)",
    "best_time": "string (e.g., '10:00 AM')"
  }],
  "tips": ["string"]
}`;



export function getAllContentCreationTools(): ToolSchema[] {
  return [
    {
      name: 'content_create',
      description:
        'Generate marketing content for one or more platforms: WhatsApp broadcasts, Instagram posts, ' +
        'Facebook updates, TikTok captions, email campaigns, or website copy. ' +
        'Returns platform-optimized text with hashtags, CTAs, and image direction.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'What the content should be about',
          },
          type: {
            type: 'string',
            enum: ['promo', 'product', 'announcement', 'testimonial', 'faq', 'greeting', 'story'],
            description: 'Content type (default: promo)',
          },
          platforms: {
            type: 'string',
            description: 'Comma-separated platforms: whatsapp, instagram, facebook, tiktok, email, website (default: whatsapp,instagram)',
          },
          business_name: {
            type: 'string',
            description: 'Business name for personalization',
          },
          product_name: {
            type: 'string',
            description: 'Product name (if product-focused content)',
          },
          product_price: {
            type: 'number',
            description: 'Product price (for promos)',
          },
          tone: {
            type: 'string',
            enum: ['casual', 'professional', 'urgent', 'playful', 'inspirational'],
            description: 'Content tone (default: casual)',
          },
          autoSend: {
            type: 'boolean',
            description: 'Queue generated content for delivery as draft (default: false)',
          },
        },
        required: ['topic'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const topic = String(args.topic || '').trim();
        if (!topic) return { error: 'Topic is required.' };

        const platforms = String(args.platforms || 'whatsapp,instagram');
        const type = String(args.type || 'promo');
        const tone = String(args.tone || 'casual');

        const extra = [
          args.business_name ? `Business: ${args.business_name}` : '',
          args.product_name ? `Product: ${args.product_name}` : '',
          args.product_price ? `Price: $${args.product_price}` : '',
        ].filter(Boolean).join('\n');

        const raw = await callLLM(CONTENT_SYSTEM,
          `Create ${type} content for: ${platforms}\nTopic: ${topic}\nTone: ${tone}\n${extra}`, { temperature: 0.6 });

        let parsed;
        try {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { pieces: [{ platform: 'whatsapp', text: raw, type }] };
        } catch {
          parsed = { pieces: [{ platform: 'whatsapp', text: raw, type }] };
        }

        // Auto-send to notification queue if requested (draft-first)
        if (args.autoSend && parsed.pieces) {
          const orgId = String(args._orgId || 'default');
          const tid = traceId || 'unknown';
          for (const piece of parsed.pieces as Array<{ platform: string; text: string }>) {
            if (piece.platform === 'whatsapp') {
              await enqueueContent('whatsapp', piece.text, orgId, tid);
            } else if (piece.platform === 'email') {
              await enqueueContent('email', piece.text, orgId, tid);
            }
          }
          parsed._autoSendQueued = true;
        }

        log.info('executed', { trace_id: traceId });

        return parsed;
      },
    },

    {
      name: 'content_calendar',
      description:
        'Generate a 7-day content calendar with daily post ideas, platforms, types, hooks, and optimal posting times. ' +
        'Helps business owners maintain consistent social media presence.',
      parameters: {
        type: 'object',
        properties: {
          business_type: {
            type: 'string',
            description: 'Type of business (e.g., "restaurant", "clothing store", "consulting")',
          },
          focus: {
            type: 'string',
            description: 'Weekly focus or goal (e.g., "launch new product", "holiday sale", "brand awareness")',
          },
          platforms: {
            type: 'string',
            description: 'Comma-separated platforms to include (default: whatsapp,instagram)',
          },
        },
        required: ['business_type'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const businessType = String(args.business_type || '').trim();
        if (!businessType) return { error: 'Business type is required.' };

        const focus = args.focus ? `\nWeekly focus: ${args.focus}` : '';
        const platforms = args.platforms ? `\nPlatforms: ${args.platforms}` : '\nPlatforms: whatsapp, instagram';

        const raw = await callLLM(CALENDAR_SYSTEM,
          `Business type: ${businessType}${focus}${platforms}`, { temperature: 0.6 });

        let parsed;
        try {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { week_theme: businessType, days: [], error: 'Failed to generate calendar' };
        } catch {
          parsed = { week_theme: businessType, days: [], error: 'Failed to generate calendar' };
        }

        log.info('executed', { trace_id: traceId });

        return parsed;
      },
    },
  ];
}
