/**
 * Image Generation Tools — DALL-E 3 via OpenAI API.
 *
 * Generates images from text prompts. Returns a temporary URL
 * (expires ~1hr). Uses fetch() — no OpenAI SDK needed.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('imageGeneration');
import type { ToolSchema } from './registry.js';

const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations';

function getApiKey(): string {
  return process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
}

/** Parse OpenAI error JSON for a human-readable message. */
function parseOpenAIError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string; code?: string; type?: string } };
    const err = parsed.error;
    if (err?.message) {
      return `DALL-E error (${status}): ${err.message}`;
    }
  } catch {
    // not JSON
  }

  // Provide actionable guidance for common HTTP status codes
  switch (status) {
    case 401:
      return 'DALL-E auth failed (401): Your AI_API_KEY / OPENAI_API_KEY is invalid or expired. ' +
        'Verify the key in your Railway environment variables starts with "sk-" and is active in your OpenAI dashboard.';
    case 403:
      return 'DALL-E forbidden (403): Your API key does not have permission for the Images API. ' +
        'Check that your OpenAI project/key has DALL-E access enabled.';
    case 429:
      return 'DALL-E rate limited (429): You have exceeded your OpenAI usage quota or rate limit. ' +
        'Check your OpenAI billing at https://platform.openai.com/account/billing';
    case 500:
    case 502:
    case 503:
      return `DALL-E server error (${status}): OpenAI is temporarily unavailable. Try again in a moment.`;
    default:
      return `DALL-E API error (${status}): ${body.slice(0, 300)}`;
  }
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
          return {
            error: 'No OpenAI API key configured for image generation.',
            fix: 'Set AI_API_KEY or OPENAI_API_KEY in your Railway environment variables. ' +
              'The key should start with "sk-" and come from https://platform.openai.com/api-keys',
          };
        }

        // Validate key format before making the request
        if (!apiKey.startsWith('sk-')) {
          return {
            error: 'Invalid OpenAI API key format.',
            fix: `Your key starts with "${apiKey.slice(0, 4)}..." but OpenAI keys should start with "sk-". ` +
              'Check your AI_API_KEY / OPENAI_API_KEY in Railway environment variables.',
          };
        }

        const prompt = String(args.prompt || '').trim();
        if (!prompt) return { error: 'prompt is required.' };
        if (prompt.length > 4000) return { error: 'Prompt too long (max 4000 chars).' };

        const size = (args.size as string) || '1024x1024';
        const quality = (args.quality as string) || 'standard';

        log.info('request', { size, quality, prompt_length: prompt.length, trace_id: _traceId });

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
            signal: AbortSignal.timeout(90_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown error');
            const errorMessage = parseOpenAIError(res.status, errText);
            log.error(errorMessage, { status: res.status, trace_id: _traceId });
            return { error: errorMessage };
          }

          const data = (await res.json()) as {
            data: Array<{ url: string; revised_prompt?: string }>;
          };
          const imageData = data.data?.[0];

          if (!imageData?.url) {
            return { error: 'No image URL in DALL-E response' };
          }

          log.info('success', { trace_id: _traceId });

          return {
            success: true,
            imageUrl: imageData.url,
            revisedPrompt: imageData.revised_prompt || prompt,
          };
        } catch (err) {
          if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
            return { error: 'Image generation timed out (90s). Try a simpler prompt.' };
          }
          return { error: `Image generation failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
