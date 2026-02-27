/**
 * Video creation skill — generate programmatic videos using Remotion.
 *
 * Remotion lets you make videos with React code. This skill generates
 * video specifications (scene configs, text overlays, data-driven content)
 * that Remotion renders into MP4 files.
 *
 * Use cases for KITZ SMBs:
 *  - Product showcase videos from catalog data
 *  - Promo/sale announcement videos for WhatsApp/Instagram
 *  - Order confirmation / thank-you videos
 *  - Weekly business report animations
 *  - Social media content (Reels, Stories, TikToks)
 *
 * Reference:
 *  - Remotion (github.com/remotion-dev/remotion) — React video framework
 *  - Remotion Skills (remotion.dev/docs/ai/skills) — AI agent integration
 *  - AI-Content-Studio (github.com/naqashafzal/AI-Content-Studio) — full pipeline
 *  - Open-Sora (github.com/hpcaitech/Open-Sora) — open-source AI video gen
 */

import type { LLMClient } from './callTranscription.js';

export interface VideoScene {
  id: string;
  type: 'intro' | 'content' | 'product' | 'cta' | 'outro';
  durationFrames: number;
  text?: string;
  imageUrl?: string;
  data?: Record<string, unknown>;
  transition?: 'fade' | 'slide' | 'wipe' | 'none';
  backgroundColor?: string;
  textColor?: string;
}

export interface VideoSpec {
  title: string;
  fps: number;
  width: number;
  height: number;
  scenes: VideoScene[];
  music?: { url: string; volume: number };
  branding?: { logoUrl: string; primaryColor: string; fontFamily: string };
  outputFormat: 'mp4' | 'webm' | 'gif';
}

export interface VideoCreationResult {
  spec: VideoSpec;
  estimatedDurationSeconds: number;
  remotionComponentCode: string;
}

export interface VideoCreationOptions {
  purpose: 'promo' | 'product' | 'report' | 'social' | 'thankyou' | 'announcement';
  content: string;
  platform?: 'whatsapp' | 'instagram-reel' | 'instagram-story' | 'tiktok' | 'youtube';
  products?: Array<{ name: string; price: number; imageUrl?: string }>;
  businessName?: string;
  brandColor?: string;
  language?: string;
}

const VIDEO_SYSTEM =
  'You are a video content strategist for small businesses in Latin America. ' +
  'Generate video specifications optimized for social commerce on WhatsApp and Instagram. ' +
  'Videos must be short (15-60 seconds), eye-catching, and mobile-first. ' +
  'Default language is Spanish. Use bold colors and clear text overlays. ' +
  'Think like a Gen Z content creator who understands small business hustle.';

const PLATFORM_SPECS: Record<string, { width: number; height: number; maxSeconds: number }> = {
  'whatsapp': { width: 1080, height: 1920, maxSeconds: 30 },
  'instagram-reel': { width: 1080, height: 1920, maxSeconds: 60 },
  'instagram-story': { width: 1080, height: 1920, maxSeconds: 15 },
  'tiktok': { width: 1080, height: 1920, maxSeconds: 60 },
  'youtube': { width: 1920, height: 1080, maxSeconds: 60 },
};

const VIDEO_FORMAT =
  'Respond with JSON: { "spec": { "title": string, "fps": 30, ' +
  '"width": number, "height": number, ' +
  '"scenes": [{ "id": string, "type": "intro" | "content" | "product" | "cta" | "outro", ' +
  '"durationFrames": number, "text": string, "transition": string, ' +
  '"backgroundColor": string, "textColor": string }], ' +
  '"outputFormat": "mp4" }, ' +
  '"estimatedDurationSeconds": number, ' +
  '"remotionComponentCode": string (React/TSX component code for Remotion) }';

/**
 * Generate a video spec and Remotion component code.
 * When no llmClient is provided, returns a template spec.
 */
export async function createVideoSpec(
  options: VideoCreationOptions,
  llmClient?: LLMClient,
): Promise<VideoCreationResult> {
  const platform = options.platform ?? 'whatsapp';
  const platformSpec = PLATFORM_SPECS[platform] ?? PLATFORM_SPECS['whatsapp'];
  const language = options.language ?? 'es';

  if (llmClient) {
    const productInfo = options.products
      ? `\nProducts: ${JSON.stringify(options.products)}`
      : '';

    const prompt =
      `Create a ${options.purpose} video for ${platform}.\n` +
      `Content: ${options.content}${productInfo}\n` +
      `Business: ${options.businessName ?? 'N/A'}\n` +
      `Brand color: ${options.brandColor ?? '#FF6B35'}\n` +
      `Language: ${language}\n` +
      `Dimensions: ${platformSpec.width}x${platformSpec.height}\n` +
      `Max duration: ${platformSpec.maxSeconds}s\n\n` +
      VIDEO_FORMAT;

    const response = await llmClient.complete({
      prompt,
      system: VIDEO_SYSTEM,
      tier: 'sonnet',
    });

    try {
      return JSON.parse(response.text) as VideoCreationResult;
    } catch {
      return buildDefaultSpec(options, platformSpec);
    }
  }

  return buildDefaultSpec(options, platformSpec);
}

function buildDefaultSpec(
  options: VideoCreationOptions,
  platformSpec: { width: number; height: number; maxSeconds: number },
): VideoCreationResult {
  const fps = 30;
  const totalFrames = Math.min(platformSpec.maxSeconds, 15) * fps;
  const sceneFrames = Math.floor(totalFrames / 3);

  return {
    spec: {
      title: `${options.purpose} — ${options.businessName ?? 'KITZ'}`,
      fps,
      width: platformSpec.width,
      height: platformSpec.height,
      scenes: [
        { id: 'intro', type: 'intro', durationFrames: sceneFrames, text: options.businessName ?? 'Tu Negocio', transition: 'fade', backgroundColor: options.brandColor ?? '#FF6B35', textColor: '#FFFFFF' },
        { id: 'main', type: 'content', durationFrames: sceneFrames, text: options.content.slice(0, 100), transition: 'slide', backgroundColor: '#FFFFFF', textColor: '#1A1A1A' },
        { id: 'cta', type: 'cta', durationFrames: sceneFrames, text: '¡Escríbenos por WhatsApp!', transition: 'fade', backgroundColor: options.brandColor ?? '#FF6B35', textColor: '#FFFFFF' },
      ],
      outputFormat: 'mp4',
    },
    estimatedDurationSeconds: Math.min(platformSpec.maxSeconds, 15),
    remotionComponentCode: '[Video component unavailable — no LLM client configured]',
  };
}
