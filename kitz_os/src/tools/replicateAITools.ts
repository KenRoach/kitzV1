/**
 * Replicate AI Tools — Image generation, background removal, upscaling, captioning, video generation.
 *
 * Tools:
 *   1. replicate_generate_image   — Generate image using Flux (fast, cheap)
 *   2. replicate_remove_background — Remove image background
 *   3. replicate_upscale_image     — Upscale/enhance image quality
 *   4. replicate_image_to_text     — Describe an image (OCR/captioning)
 *   5. replicate_text_to_video     — Generate short video from text
 *
 * Requires: REPLICATE_API_TOKEN
 */
import { createSubsystemLogger } from 'kitz-schemas';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('replicateAITools');

const API_BASE = 'https://api.replicate.com/v1';
const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_MS = 120_000;

function getToken(): string {
  return process.env.REPLICATE_API_TOKEN || '';
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  };
}

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output: unknown;
  error: string | null;
  urls: { get: string };
}

/**
 * Create a prediction and poll until it completes or times out.
 */
async function runPrediction(
  model: string,
  input: Record<string, unknown>,
  traceId?: string,
): Promise<{ output: unknown; error?: string }> {
  const token = getToken();
  if (!token) {
    return { output: null, error: 'Replicate not configured. Set REPLICATE_API_TOKEN in env.' };
  }

  // Create prediction
  const createRes = await fetch(`${API_BASE}/predictions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      version: undefined, // not needed when using model shorthand
      model,
      input,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => 'unknown');
    return { output: null, error: `Replicate create failed (${createRes.status}): ${errText.slice(0, 300)}` };
  }

  const prediction = (await createRes.json()) as ReplicatePrediction;
  log.info('prediction_created', { id: prediction.id, model, trace_id: traceId });

  // Poll for completion
  const pollUrl = prediction.urls?.get || `${API_BASE}/predictions/${prediction.id}`;
  const deadline = Date.now() + MAX_POLL_MS;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const pollRes = await fetch(pollUrl, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(15_000),
    });

    if (!pollRes.ok) {
      const errText = await pollRes.text().catch(() => 'unknown');
      return { output: null, error: `Replicate poll failed (${pollRes.status}): ${errText.slice(0, 300)}` };
    }

    const current = (await pollRes.json()) as ReplicatePrediction;

    if (current.status === 'succeeded') {
      log.info('prediction_succeeded', { id: prediction.id, model, trace_id: traceId });
      return { output: current.output };
    }

    if (current.status === 'failed' || current.status === 'canceled') {
      return { output: null, error: `Replicate prediction ${current.status}: ${current.error || 'unknown error'}` };
    }
  }

  return { output: null, error: `Replicate prediction timed out after ${MAX_POLL_MS / 1000}s (id: ${prediction.id})` };
}

export function getAllReplicateAiTools(): ToolSchema[] {
  return [
    // ── 1. Generate Image (Flux Schnell) ──
    {
      name: 'replicate_generate_image',
      description:
        'Generate an image using Flux Schnell (fast, cheap). Provide a text prompt and optional dimensions. Returns up to 4 image URLs.',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Text description of the image to generate' },
          width: { type: 'number', description: 'Image width in pixels (default: 1024)' },
          height: { type: 'number', description: 'Image height in pixels (default: 1024)' },
          num_outputs: { type: 'number', description: 'Number of images to generate, 1-4 (default: 1)' },
        },
        required: ['prompt'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const prompt = String(args.prompt || '');
        if (!prompt) return { error: 'prompt is required' };

        const width = Math.max(256, Math.min(Number(args.width) || 1024, 2048));
        const height = Math.max(256, Math.min(Number(args.height) || 1024, 2048));
        const numOutputs = Math.max(1, Math.min(Number(args.num_outputs) || 1, 4));

        const result = await runPrediction(
          'black-forest-labs/flux-schnell',
          { prompt, width, height, num_outputs: numOutputs },
          traceId,
        );

        if (result.error) return { error: result.error };

        const imageUrls = Array.isArray(result.output) ? result.output : [result.output];
        log.info('image_generated', { count: imageUrls.length, model: 'flux-schnell', trace_id: traceId });
        return { imageUrls, model: 'black-forest-labs/flux-schnell', cost: 'pay-per-prediction' };
      },
    },

    // ── 2. Remove Background ──
    {
      name: 'replicate_remove_background',
      description: 'Remove the background from an image. Provide a public image URL. Returns a transparent-background image URL.',
      parameters: {
        type: 'object',
        properties: {
          imageUrl: { type: 'string', description: 'Public URL of the image to process' },
        },
        required: ['imageUrl'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const imageUrl = String(args.imageUrl || '');
        if (!imageUrl) return { error: 'imageUrl is required' };

        const result = await runPrediction(
          'cjwbw/rembg',
          { image: imageUrl },
          traceId,
        );

        if (result.error) return { error: result.error };

        const resultUrl = typeof result.output === 'string' ? result.output : String(result.output);
        log.info('background_removed', { model: 'cjwbw/rembg', trace_id: traceId });
        return { resultUrl, model: 'cjwbw/rembg' };
      },
    },

    // ── 3. Upscale Image ──
    {
      name: 'replicate_upscale_image',
      description:
        'Upscale and enhance image quality using Real-ESRGAN. Supports 2x or 4x upscaling.',
      parameters: {
        type: 'object',
        properties: {
          imageUrl: { type: 'string', description: 'Public URL of the image to upscale' },
          scale: { type: 'number', description: 'Upscale factor: 2 or 4 (default: 2)' },
        },
        required: ['imageUrl'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const imageUrl = String(args.imageUrl || '');
        if (!imageUrl) return { error: 'imageUrl is required' };

        const scale = [2, 4].includes(Number(args.scale)) ? Number(args.scale) : 2;

        const result = await runPrediction(
          'nightmareai/real-esrgan',
          { image: imageUrl, scale },
          traceId,
        );

        if (result.error) return { error: result.error };

        const resultUrl = typeof result.output === 'string' ? result.output : String(result.output);
        log.info('image_upscaled', { scale, model: 'nightmareai/real-esrgan', trace_id: traceId });
        return { resultUrl, scale, model: 'nightmareai/real-esrgan' };
      },
    },

    // ── 4. Image to Text (captioning / OCR) ──
    {
      name: 'replicate_image_to_text',
      description:
        'Describe an image or answer a question about it using BLIP captioning. Supports OCR-style tasks.',
      parameters: {
        type: 'object',
        properties: {
          imageUrl: { type: 'string', description: 'Public URL of the image to describe' },
          question: { type: 'string', description: 'Optional question to ask about the image (visual QA)' },
        },
        required: ['imageUrl'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        const imageUrl = String(args.imageUrl || '');
        if (!imageUrl) return { error: 'imageUrl is required' };

        const input: Record<string, unknown> = { image: imageUrl };
        if (args.question) {
          input.question = String(args.question);
          input.task = 'visual_question_answering';
        } else {
          input.task = 'image_captioning';
        }

        const result = await runPrediction(
          'salesforce/blip',
          input,
          traceId,
        );

        if (result.error) return { error: result.error };

        const description = typeof result.output === 'string'
          ? result.output
          : Array.isArray(result.output)
            ? (result.output as string[]).join(' ')
            : String(result.output);

        log.info('image_described', { model: 'salesforce/blip', trace_id: traceId });
        return { description, model: 'salesforce/blip' };
      },
    },

    // ── 5. Text to Video ──
    {
      name: 'replicate_text_to_video',
      description:
        'Generate a short video from a text prompt. Returns a video URL.',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Text description of the video to generate' },
          num_frames: { type: 'number', description: 'Number of frames (default: 16). More frames = longer video.' },
        },
        required: ['prompt'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const prompt = String(args.prompt || '');
        if (!prompt) return { error: 'prompt is required' };

        const numFrames = Math.max(8, Math.min(Number(args.num_frames) || 16, 64));

        const result = await runPrediction(
          'minimax/video-01',
          { prompt, num_frames: numFrames },
          traceId,
        );

        if (result.error) return { error: result.error };

        const videoUrl = typeof result.output === 'string'
          ? result.output
          : Array.isArray(result.output)
            ? (result.output as string[])[0]
            : String(result.output);

        log.info('video_generated', { frames: numFrames, model: 'minimax/video-01', trace_id: traceId });
        return { videoUrl, model: 'minimax/video-01', frames: numFrames };
      },
    },
  ];
}
