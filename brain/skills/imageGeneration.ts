/**
 * Image generation skill — create marketing visuals via AI (DALL-E 3).
 *
 * Use cases: product photos, social media graphics, promo banners, logos.
 */

import type { LLMClient } from './callTranscription.js';

export interface ImageGenResult {
  prompt: string;
  revisedPrompt: string;
  imageUrl: string | null;
  style: string;
  size: string;
}

export interface ImageGenOptions {
  description: string;
  style?: 'vivid' | 'natural';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  purpose?: 'product' | 'social' | 'banner' | 'logo' | 'flyer';
  brandColor?: string;
}

const IMAGE_SYSTEM =
  'You are a visual marketing assistant for small businesses in Latin America. ' +
  'Create detailed DALL-E 3 prompts for marketing images. ' +
  'Style: modern, clean, mobile-friendly, bold colors. Default: vivid style.';

export async function generateImagePrompt(options: ImageGenOptions, llmClient?: LLMClient): Promise<ImageGenResult> {
  if (llmClient) {
    const prompt = `Create a DALL-E 3 prompt for: ${options.description}\nPurpose: ${options.purpose ?? 'social'}\nStyle: ${options.style ?? 'vivid'}\nBrand color: ${options.brandColor ?? 'auto'}`;
    const response = await llmClient.complete({ prompt, system: IMAGE_SYSTEM, tier: 'haiku' });
    return { prompt: options.description, revisedPrompt: response.text, imageUrl: null, style: options.style ?? 'vivid', size: options.size ?? '1024x1024' };
  }
  return { prompt: options.description, revisedPrompt: options.description, imageUrl: null, style: options.style ?? 'vivid', size: options.size ?? '1024x1024' };
}
