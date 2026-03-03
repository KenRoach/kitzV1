/**
 * Video Creation Tools — Generate Remotion video specs + render to MP4.
 *
 * 3 tools:
 *   - video_createSpec     (medium) — Generate video spec + Remotion component code
 *   - video_render         (medium) — Render a Remotion spec to MP4/WebM/GIF
 *   - video_listPlatforms  (low)    — List supported platforms and their dimensions
 *
 * Uses Claude Sonnet for creative direction, falls back to OpenAI gpt-4o.
 * Output is a Remotion-compatible spec that can be rendered to MP4.
 *
 * Requires: ffmpeg installed for rendering
 */

import { createSubsystemLogger } from 'kitz-schemas';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const log = createSubsystemLogger('videoCreationTools');
import type { ToolSchema } from './registry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VIDEO_DIR = join(__dirname, '..', '..', 'data', 'videos');

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const PLATFORM_SPECS: Record<string, { width: number; height: number; maxSeconds: number; label: string }> = {
  whatsapp:        { width: 1080, height: 1920, maxSeconds: 30, label: 'WhatsApp Status' },
  'instagram-reel': { width: 1080, height: 1920, maxSeconds: 60, label: 'Instagram Reel' },
  'instagram-story': { width: 1080, height: 1920, maxSeconds: 15, label: 'Instagram Story' },
  tiktok:          { width: 1080, height: 1920, maxSeconds: 60, label: 'TikTok' },
  youtube:         { width: 1920, height: 1080, maxSeconds: 60, label: 'YouTube Short/Video' },
};

const SYSTEM_PROMPT = `You are a video content strategist for small businesses in Latin America.
Generate Remotion-compatible video specifications: scene-by-scene breakdown + React TSX component code.
Videos must be: short (15-60s), eye-catching, mobile-first, bold colors, clear text overlays.
Default language: Spanish. Think like a Gen Z content creator who understands small business hustle.

Respond with valid JSON:
{
  "title": "string",
  "scenes": [{
    "id": "string",
    "type": "intro" | "content" | "product" | "cta" | "outro",
    "duration_frames": number,
    "text": "string",
    "transition": "fade" | "slide" | "wipe" | "none",
    "background_color": "#hex",
    "text_color": "#hex",
    "notes": "string (visual direction)"
  }],
  "total_duration_seconds": number,
  "remotion_component": "string (complete React TSX code for Remotion)"
}`;

async function generateVideoSpec(purpose: string, content: string, platform: string, extra: string): Promise<string> {
  const spec = PLATFORM_SPECS[platform] || PLATFORM_SPECS['whatsapp'];
  const userMessage =
    `Create a ${purpose} video for ${spec.label}.\n` +
    `Dimensions: ${spec.width}x${spec.height}, max ${spec.maxSeconds}s, 30fps.\n` +
    `Content: ${content}\n${extra}`;

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
          temperature: 0.5,
          system: SYSTEM_PROMPT,
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
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 4096,
          temperature: 0.5,
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.ok) {
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        return data.choices?.[0]?.message?.content || '';
      }
    } catch { /* return error */ }
  }

  return JSON.stringify({ error: 'No AI available for video spec generation' });
}

export function getAllVideoCreationTools(): ToolSchema[] {
  return [
    {
      name: 'video_createSpec',
      description:
        'Generate a Remotion video specification with scenes, transitions, and React component code. ' +
        'For promo videos, product showcases, announcements, reports, and social content. ' +
        'Returns scene breakdown + renderable Remotion TSX code.',
      parameters: {
        type: 'object',
        properties: {
          purpose: {
            type: 'string',
            enum: ['promo', 'product', 'report', 'social', 'thankyou', 'announcement'],
            description: 'Video purpose/type',
          },
          content: {
            type: 'string',
            description: 'What the video should communicate (product info, message, data)',
          },
          platform: {
            type: 'string',
            enum: ['whatsapp', 'instagram-reel', 'instagram-story', 'tiktok', 'youtube'],
            description: 'Target platform (determines dimensions and max duration). Default: whatsapp',
          },
          business_name: {
            type: 'string',
            description: 'Business name for branding',
          },
          brand_color: {
            type: 'string',
            description: 'Primary brand color hex code (default: #FF6B35)',
          },
          products: {
            type: 'string',
            description: 'JSON array of products: [{"name":"...", "price": 10, "image_url":"..."}]',
          },
        },
        required: ['purpose', 'content'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const content = String(args.content || '').trim();
        if (!content) {
          return { error: 'Content description is required.' };
        }

        const purpose = String(args.purpose || 'promo');
        const platform = String(args.platform || 'whatsapp');
        const extra = [
          args.business_name ? `Business: ${args.business_name}` : '',
          args.brand_color ? `Brand color: ${args.brand_color}` : '',
          args.products ? `Products: ${args.products}` : '',
        ].filter(Boolean).join('\n');

        const raw = await generateVideoSpec(purpose, content, platform, extra);

        let parsed;
        try {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { title: 'Video', scenes: [], remotion_component: raw };
        } catch {
          parsed = { title: 'Video', scenes: [], remotion_component: raw };
        }

        const spec = PLATFORM_SPECS[platform] || PLATFORM_SPECS['whatsapp'];
        parsed.platform = { name: platform, ...spec };

        log.info('executed', { trace_id: traceId });

        return parsed;
      },
    },

    // ── 2. Render Video from Spec ──
    {
      name: 'video_render',
      description:
        'Render a Remotion video spec to MP4, WebM, or GIF. ' +
        'Provide TSX component code from video_createSpec, or use a saved spec. ' +
        'Returns the file path of the rendered video. Requires ffmpeg installed.',
      parameters: {
        type: 'object',
        properties: {
          component_code: {
            type: 'string',
            description: 'Remotion React TSX component code (from video_createSpec result)',
          },
          platform: {
            type: 'string',
            enum: ['whatsapp', 'instagram-reel', 'instagram-story', 'tiktok', 'youtube'],
            description: 'Target platform for dimensions (default: whatsapp)',
          },
          duration_seconds: {
            type: 'number',
            description: 'Video duration in seconds (default: 15)',
          },
          output_format: {
            type: 'string',
            enum: ['mp4', 'webm', 'gif'],
            description: 'Output format (default: mp4)',
          },
          title: {
            type: 'string',
            description: 'Video title for filename',
          },
        },
        required: ['component_code'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const componentCode = String(args.component_code || '').trim();
        if (!componentCode) {
          return { error: 'component_code is required. Use video_createSpec first to generate it.' };
        }

        const platform = String(args.platform || 'whatsapp');
        const spec = PLATFORM_SPECS[platform] || PLATFORM_SPECS['whatsapp'];
        const durationSeconds = Math.min(Number(args.duration_seconds) || 15, spec.maxSeconds);
        const fps = 30;
        const durationInFrames = durationSeconds * fps;
        const outputFormat = String(args.output_format || 'mp4');
        const title = String(args.title || 'kitz-video').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const outputFilename = `${title}-${timestamp}.${outputFormat}`;

        try {
          await mkdir(VIDEO_DIR, { recursive: true });

          // Write the component code to a temp file
          const componentPath = join(VIDEO_DIR, `${title}-${timestamp}.tsx`);
          const wrappedComponent = `
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from 'remotion';

${componentCode}
`;
          await writeFile(componentPath, wrappedComponent, 'utf-8');

          // Try to render using Remotion
          try {
            const { bundle } = await import('@remotion/bundler');
            const { renderMedia, selectComposition } = await import('@remotion/renderer');

            // Create an entry point that exports the composition
            const entryPath = join(VIDEO_DIR, `${title}-${timestamp}-entry.tsx`);
            const entryCode = `
import { registerRoot } from 'remotion';
import { Composition } from 'remotion';
import React from 'react';

// Import the component
${componentCode}

// Find the default export component name
const MainComponent = typeof VideoComponent !== 'undefined' ? VideoComponent :
                       typeof MyVideo !== 'undefined' ? MyVideo :
                       typeof Main !== 'undefined' ? Main :
                       () => React.createElement('div', {style:{background:'#A855F7',color:'white',display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',fontSize:48}}, 'KITZ Video');

export const RemotionRoot: React.FC = () => {
  return React.createElement(Composition, {
    id: 'KitzVideo',
    component: MainComponent,
    durationInFrames: ${durationInFrames},
    fps: ${fps},
    width: ${spec.width},
    height: ${spec.height},
  });
};

registerRoot(RemotionRoot);
`;
            await writeFile(entryPath, entryCode, 'utf-8');

            // Bundle the entry point
            const bundled = await bundle({
              entryPoint: entryPath,
              onProgress: (progress: number) => {
                if (progress % 25 === 0) log.info('bundling', { progress, trace_id: traceId });
              },
            });

            // Select the composition
            const composition = await selectComposition({
              serveUrl: bundled,
              id: 'KitzVideo',
            });

            // Render
            const outputPath = join(VIDEO_DIR, outputFilename);
            await renderMedia({
              composition,
              serveUrl: bundled,
              codec: outputFormat === 'gif' ? 'gif' : outputFormat === 'webm' ? 'vp8' : 'h264',
              outputLocation: outputPath,
              onProgress: ({ progress }: { progress: number }) => {
                if (Math.round(progress * 100) % 25 === 0) {
                  log.info('rendering', { progress: Math.round(progress * 100), trace_id: traceId });
                }
              },
            });

            log.info('video_rendered', { outputPath, format: outputFormat, trace_id: traceId });
            return {
              success: true,
              filePath: outputPath,
              filename: outputFilename,
              format: outputFormat,
              duration: durationSeconds,
              dimensions: { width: spec.width, height: spec.height },
              platform: spec.label,
              source: 'remotion',
            };
          } catch (renderErr) {
            // Remotion render failed — save spec for manual rendering
            log.warn('remotion_render_failed', { error: (renderErr as Error).message, trace_id: traceId });

            return {
              success: false,
              status: 'spec_saved',
              componentPath,
              filename: outputFilename,
              format: outputFormat,
              duration: durationSeconds,
              dimensions: { width: spec.width, height: spec.height },
              platform: spec.label,
              error: `Remotion render failed: ${(renderErr as Error).message}. Component code saved at ${componentPath}. You can render it manually with: npx remotion render ${componentPath}`,
              source: 'remotion_fallback',
            };
          }
        } catch (err) {
          return { error: `Video render failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 3. List Platforms ──
    {
      name: 'video_listPlatforms',
      description:
        'List all supported video platforms with their dimensions, max duration, and format details. ' +
        'Use to help user choose the right platform for their video.',
      parameters: {
        type: 'object',
        properties: {},
      },
      riskLevel: 'low',
      execute: async () => {
        return {
          platforms: Object.entries(PLATFORM_SPECS).map(([key, spec]) => ({
            id: key,
            label: spec.label,
            width: spec.width,
            height: spec.height,
            max_duration_seconds: spec.maxSeconds,
            fps: 30,
            aspect_ratio: spec.width > spec.height ? '16:9' : '9:16',
          })),
          rendering: {
            engine: 'Remotion',
            output_formats: ['mp4', 'webm', 'gif'],
            note: 'Video specs are generated as React TSX components rendered by Remotion.',
          },
        };
      },
    },
  ];
}
