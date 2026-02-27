/**
 * Image Generation Tools — DALL-E 3 via OpenAI API.
 *
 * Generates images from text prompts. Returns a temporary URL
 * (expires ~1hr). Uses fetch() — no OpenAI SDK needed.
 */

import type { ToolSchema } from './registry.js';

const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations';

function getApiKey(): string {
  return process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
}

export function getAllImageGenerationTools(): ToolSchema[] {
  return [
    {
      name: 'image_generate',
      description:
        'Generate an image using DALL-E 3 from a text prompt. Returns a URL to the generated image. ' +
        'Use for: product photos, social media graphics, flyer illustrations, marketing visuals, logos, mockups.',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Detailed text description of the image to generate',
          },
          size: {
            type: 'string',
            enum: ['1024x1024', '1792x1024', '1024x1792'],
            description: 'Image dimensions. 1024x1024 (square), 1792x1024 (landscape), 1024x1792 (portrait). Default: 1024x1024',
          },
          quality: {
            type: 'string',
            enum: ['standard', 'hd'],
            description: 'Image quality. HD has finer details but costs more. Default: standard',
          },
        },
        required: ['prompt'],
      },
      riskLevel: 'medium',
      execute: async (args, _traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) {
          return { error: 'No AI_API_KEY or OPENAI_API_KEY configured for image generation.' };
        }

        const prompt = String(args.prompt || '').trim();
        if (!prompt) return { error: 'prompt is required.' };
        if (prompt.length > 4000) return { error: 'Prompt too long (max 4000 chars).' };

        const size = (args.size as string) || '1024x1024';
        const quality = (args.quality as string) || 'standard';

        try {
          const res = await fetch(OPENAI_IMAGES_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'dall-e-3',
              prompt,
              n: 1,
              size,
              quality,
              response_format: 'url',
            }),
            signal: AbortSignal.timeout(60_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown error');
            return { error: `DALL-E API error: HTTP ${res.status}`, detail: errText.slice(0, 300) };
          }

          const data = (await res.json()) as {
            data: Array<{ url: string; revised_prompt?: string }>;
          };
          const imageData = data.data?.[0];

          if (!imageData?.url) {
            return { error: 'No image URL in DALL-E response' };
          }

          return {
            success: true,
            imageUrl: imageData.url,
            revisedPrompt: imageData.revised_prompt || prompt,
          };
        } catch (err) {
          if ((err as Error).name === 'AbortError') {
            return { error: 'Image generation timed out (60s). Try a simpler prompt.' };
          }
          return { error: `Image generation failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
