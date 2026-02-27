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

import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

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

async function callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': CLAUDE_API_VERSION,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          temperature: 0.6,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.ok) {
        const data = await res.json() as { content: Array<{ type: string; text?: string }> };
        return data.content?.find(c => c.type === 'text')?.text || '';
      }
    } catch { /* fall through */ }
  }

  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 4096,
          temperature: 0.6,
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.ok) {
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        return data.choices?.[0]?.message?.content || '';
      }
    } catch { /* return error */ }
  }

  return JSON.stringify({ error: 'No AI available for content creation' });
}

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

        const raw = await callLLM(
          CONTENT_SYSTEM,
          `Create ${type} content for: ${platforms}\nTopic: ${topic}\nTone: ${tone}\n${extra}`,
        );

        let parsed;
        try {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { pieces: [{ platform: 'whatsapp', text: raw, type }] };
        } catch {
          parsed = { pieces: [{ platform: 'whatsapp', text: raw, type }] };
        }

        console.log(JSON.stringify({
          ts: new Date().toISOString(),
          module: 'contentCreationTools',
          action: 'content_create',
          topic: topic.slice(0, 50),
          platforms,
          piece_count: parsed.pieces?.length || 0,
          trace_id: traceId,
        }));

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

        const raw = await callLLM(
          CALENDAR_SYSTEM,
          `Business type: ${businessType}${focus}${platforms}`,
        );

        let parsed;
        try {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { week_theme: businessType, days: [], error: 'Failed to generate calendar' };
        } catch {
          parsed = { week_theme: businessType, days: [], error: 'Failed to generate calendar' };
        }

        console.log(JSON.stringify({
          ts: new Date().toISOString(),
          module: 'contentCreationTools',
          action: 'content_calendar',
          business_type: businessType,
          day_count: parsed.days?.length || 0,
          trace_id: traceId,
        }));

        return parsed;
      },
    },
  ];
}
