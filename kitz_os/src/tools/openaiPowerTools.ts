/**
 * OpenAI Power Tools — Whisper, TTS, Vision, Embeddings, Moderation.
 *
 * Multi-modal AI capabilities for LatAm small businesses.
 * Uses fetch() directly — no OpenAI SDK needed.
 */

import { createSubsystemLogger } from 'kitz-schemas';
import { writeFile } from 'node:fs/promises';

const log = createSubsystemLogger('openaiPower');
import type { ToolSchema } from './registry.js';

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

function getApiKey(): string {
  return process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
}

/** Parse OpenAI error JSON for a human-readable message. */
function parseOpenAIError(label: string, status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string; code?: string; type?: string } };
    const err = parsed.error;
    if (err?.message) {
      return `${label} error (${status}): ${err.message}`;
    }
  } catch {
    // not JSON
  }

  switch (status) {
    case 401:
      return `${label} auth failed (401): Your AI_API_KEY / OPENAI_API_KEY is invalid or expired. ` +
        'Verify the key in your Railway environment variables starts with "sk-" and is active in your OpenAI dashboard.';
    case 403:
      return `${label} forbidden (403): Your API key does not have permission for this API. ` +
        'Check that your OpenAI project/key has the required access enabled.';
    case 429:
      return `${label} rate limited (429): You have exceeded your OpenAI usage quota or rate limit. ` +
        'Check your OpenAI billing at https://platform.openai.com/account/billing';
    case 500:
    case 502:
    case 503:
      return `${label} server error (${status}): OpenAI is temporarily unavailable. Try again in a moment.`;
    default:
      return `${label} API error (${status}): ${body.slice(0, 300)}`;
  }
}

function missingKeyResponse() {
  return {
    error: 'No OpenAI API key configured.',
    fix: 'Set AI_API_KEY or OPENAI_API_KEY in your Railway environment variables. ' +
      'The key should start with "sk-" and come from https://platform.openai.com/api-keys',
  };
}

function invalidKeyResponse(apiKey: string) {
  return {
    error: 'Invalid OpenAI API key format.',
    fix: `Your key starts with "${apiKey.slice(0, 4)}..." but OpenAI keys should start with "sk-". ` +
      'Check your AI_API_KEY / OPENAI_API_KEY in Railway environment variables.',
  };
}

/* ------------------------------------------------------------------ */
/*  Tool definitions                                                   */
/* ------------------------------------------------------------------ */

export function getAllOpenaiPowerTools(): ToolSchema[] {
  return [
    /* ============================================================== */
    /*  1. Whisper — Speech-to-Text Transcription                      */
    /* ============================================================== */
    {
      name: 'openai_whisper_transcribe',
      description:
        'Transcribe audio to text using OpenAI Whisper. Supports mp3, mp4, mpeg, mpga, m4a, wav, webm. ' +
        'Use for: transcribing WhatsApp voice notes from customers, meeting recordings, ' +
        'podcast episodes for LatAm content creators, customer support calls, ' +
        'converting Spanish/Portuguese voice messages into actionable text.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Public URL of the audio file to transcribe (mp3, wav, m4a, webm, etc.)',
          },
          language: {
            type: 'string',
            description: 'ISO 639-1 language code (e.g. "es" for Spanish, "pt" for Portuguese, "en" for English). ' +
              'Providing the language improves accuracy and speed.',
          },
        },
        required: ['url'],
      },
      riskLevel: 'low',
      execute: async (args, _traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) return missingKeyResponse();
        if (!apiKey.startsWith('sk-')) return invalidKeyResponse(apiKey);

        const url = String(args.url || '').trim();
        if (!url) return { error: 'url is required. Provide a public URL to an audio file.' };

        const language = args.language ? String(args.language).trim() : undefined;

        log.info('whisper_request', { url: url.slice(0, 80), language, trace_id: _traceId });

        try {
          // Download the audio file first
          const audioRes = await fetch(url, {
            signal: AbortSignal.timeout(30_000),
          });
          if (!audioRes.ok) {
            return { error: `Failed to download audio file (${audioRes.status}): ${url.slice(0, 100)}` };
          }

          const audioBuffer = await audioRes.arrayBuffer();
          const contentType = audioRes.headers.get('content-type') || 'audio/mpeg';

          // Determine file extension from content type
          const extMap: Record<string, string> = {
            'audio/mpeg': 'mp3',
            'audio/mp3': 'mp3',
            'audio/mp4': 'mp4',
            'audio/m4a': 'm4a',
            'audio/x-m4a': 'm4a',
            'audio/wav': 'wav',
            'audio/x-wav': 'wav',
            'audio/webm': 'webm',
            'audio/ogg': 'ogg',
            'video/mp4': 'mp4',
          };
          const ext = extMap[contentType] || 'mp3';

          // Build multipart form data
          const formData = new FormData();
          formData.append('file', new Blob([audioBuffer], { type: contentType }), `audio.${ext}`);
          formData.append('model', 'whisper-1');
          formData.append('response_format', 'verbose_json');
          if (language) formData.append('language', language);

          const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
            signal: AbortSignal.timeout(30_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown error');
            const errorMessage = parseOpenAIError('Whisper', res.status, errText);
            log.error(errorMessage, { status: res.status, trace_id: _traceId });
            return { error: errorMessage };
          }

          const data = (await res.json()) as {
            text: string;
            language?: string;
            duration?: number;
          };

          log.info('whisper_success', { language: data.language, duration: data.duration, trace_id: _traceId });

          return {
            success: true,
            text: data.text,
            language: data.language || language || 'unknown',
            duration: data.duration || null,
          };
        } catch (err) {
          if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
            return { error: 'Whisper transcription timed out (30s). The audio file may be too large or the URL too slow.' };
          }
          return { error: `Whisper transcription failed: ${(err as Error).message}` };
        }
      },
    },

    /* ============================================================== */
    /*  2. TTS — Text-to-Speech                                        */
    /* ============================================================== */
    {
      name: 'openai_tts_speak',
      description:
        'Convert text to spoken audio using OpenAI TTS. Returns an MP3 file path. ' +
        'Use for: generating voice replies for WhatsApp customers, creating audio product descriptions, ' +
        'narrating LatAm marketing content in Spanish/Portuguese, accessibility features, ' +
        'producing audio announcements for promotions and sales.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text to convert to speech (max 4096 characters)',
          },
          voice: {
            type: 'string',
            enum: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
            description: 'Voice to use. alloy=neutral, echo=male, fable=expressive, onyx=deep male, ' +
              'nova=female, shimmer=warm female. Default: nova',
          },
          model: {
            type: 'string',
            enum: ['tts-1', 'tts-1-hd'],
            description: 'TTS model. tts-1 is faster/cheaper, tts-1-hd has higher quality. Default: tts-1',
          },
        },
        required: ['text'],
      },
      riskLevel: 'medium',
      execute: async (args, _traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) return missingKeyResponse();
        if (!apiKey.startsWith('sk-')) return invalidKeyResponse(apiKey);

        const text = String(args.text || '').trim();
        if (!text) return { error: 'text is required.' };
        if (text.length > 4096) return { error: 'Text too long (max 4096 characters).' };

        const voice = (args.voice as string) || 'nova';
        const model = (args.model as string) || 'tts-1';

        log.info('tts_request', { voice, model, text_length: text.length, trace_id: _traceId });

        try {
          const res = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              input: text,
              voice,
              response_format: 'mp3',
            }),
            signal: AbortSignal.timeout(30_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown error');
            const errorMessage = parseOpenAIError('TTS', res.status, errText);
            log.error(errorMessage, { status: res.status, trace_id: _traceId });
            return { error: errorMessage };
          }

          const audioBuffer = Buffer.from(await res.arrayBuffer());
          const timestamp = Date.now();
          const filePath = `/tmp/kitz-tts-${timestamp}.mp3`;

          await writeFile(filePath, audioBuffer);

          log.info('tts_success', { voice, filePath, bytes: audioBuffer.length, trace_id: _traceId });

          return {
            success: true,
            audioUrl: filePath,
            format: 'mp3',
            voice,
            model,
            bytes: audioBuffer.length,
          };
        } catch (err) {
          if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
            return { error: 'TTS generation timed out (30s). Try shorter text.' };
          }
          return { error: `TTS generation failed: ${(err as Error).message}` };
        }
      },
    },

    /* ============================================================== */
    /*  3. Vision — Image Analysis with GPT-4o                         */
    /* ============================================================== */
    {
      name: 'openai_vision_analyze',
      description:
        'Analyze an image using GPT-4o vision capabilities. Understands photos, screenshots, documents, receipts. ' +
        'Use for: reading product labels for LatAm e-commerce listings, extracting text from receipts, ' +
        'analyzing competitor social media posts, describing product photos for SEO, ' +
        'reviewing storefront images, translating text in images (Spanish/Portuguese/English).',
      parameters: {
        type: 'object',
        properties: {
          imageUrl: {
            type: 'string',
            description: 'Public URL of the image to analyze (JPEG, PNG, GIF, WebP)',
          },
          question: {
            type: 'string',
            description: 'What to analyze or ask about the image (e.g. "What products are shown?", "Extract all text from this receipt")',
          },
        },
        required: ['imageUrl', 'question'],
      },
      riskLevel: 'low',
      execute: async (args, _traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) return missingKeyResponse();
        if (!apiKey.startsWith('sk-')) return invalidKeyResponse(apiKey);

        const imageUrl = String(args.imageUrl || '').trim();
        if (!imageUrl) return { error: 'imageUrl is required. Provide a public URL to an image.' };

        const question = String(args.question || '').trim();
        if (!question) return { error: 'question is required. Describe what you want to know about the image.' };

        log.info('vision_request', { imageUrl: imageUrl.slice(0, 80), question: question.slice(0, 60), trace_id: _traceId });

        try {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: question,
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: imageUrl,
                        detail: 'auto',
                      },
                    },
                  ],
                },
              ],
              max_tokens: 1024,
            }),
            signal: AbortSignal.timeout(30_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown error');
            const errorMessage = parseOpenAIError('Vision', res.status, errText);
            log.error(errorMessage, { status: res.status, trace_id: _traceId });
            return { error: errorMessage };
          }

          const data = (await res.json()) as {
            choices: Array<{ message: { content: string } }>;
            model: string;
            usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
          };

          const analysis = data.choices?.[0]?.message?.content;
          if (!analysis) {
            return { error: 'No analysis content in GPT-4o Vision response.' };
          }

          log.info('vision_success', { model: data.model, tokens: data.usage?.total_tokens, trace_id: _traceId });

          return {
            success: true,
            analysis,
            model: data.model || 'gpt-4o',
            tokens: data.usage?.total_tokens || null,
          };
        } catch (err) {
          if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
            return { error: 'Vision analysis timed out (30s). The image may be too large or the URL too slow.' };
          }
          return { error: `Vision analysis failed: ${(err as Error).message}` };
        }
      },
    },

    /* ============================================================== */
    /*  4. Embeddings — Semantic Search Vectors                        */
    /* ============================================================== */
    {
      name: 'openai_embedding',
      description:
        'Generate text embeddings for semantic search and similarity matching using text-embedding-3-small. ' +
        'Use for: building product search for LatAm e-commerce, matching customer inquiries to FAQ answers, ' +
        'clustering Spanish/Portuguese customer feedback, finding similar products across catalogs, ' +
        'powering RAG knowledge base retrieval for business playbooks.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: ['string', 'array'],
            description: 'Text to embed. Can be a single string or an array of strings (max 8192 tokens per string, max 100 strings).',
          },
        },
        required: ['text'],
      },
      riskLevel: 'low',
      execute: async (args, _traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) return missingKeyResponse();
        if (!apiKey.startsWith('sk-')) return invalidKeyResponse(apiKey);

        // Normalize input to an array of strings
        let input: string[];
        if (Array.isArray(args.text)) {
          input = (args.text as unknown[]).map(t => String(t).trim()).filter(Boolean);
        } else {
          const single = String(args.text || '').trim();
          if (!single) return { error: 'text is required. Provide a string or array of strings to embed.' };
          input = [single];
        }

        if (input.length === 0) return { error: 'text is required. Provide at least one non-empty string.' };
        if (input.length > 100) return { error: 'Too many strings (max 100). Batch your input.' };

        log.info('embedding_request', { count: input.length, trace_id: _traceId });

        try {
          const res = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'text-embedding-3-small',
              input,
            }),
            signal: AbortSignal.timeout(30_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown error');
            const errorMessage = parseOpenAIError('Embedding', res.status, errText);
            log.error(errorMessage, { status: res.status, trace_id: _traceId });
            return { error: errorMessage };
          }

          const data = (await res.json()) as {
            data: Array<{ embedding: number[]; index: number }>;
            model: string;
            usage?: { prompt_tokens: number; total_tokens: number };
          };

          if (!data.data || data.data.length === 0) {
            return { error: 'No embeddings returned from OpenAI.' };
          }

          // Sort by index to preserve input order
          const sorted = data.data.sort((a, b) => a.index - b.index);
          const embeddings = sorted.map(d => d.embedding);
          const dimensions = embeddings[0]?.length || 0;

          log.info('embedding_success', {
            count: embeddings.length,
            dimensions,
            model: data.model,
            tokens: data.usage?.total_tokens,
            trace_id: _traceId,
          });

          return {
            success: true,
            embeddings,
            model: data.model || 'text-embedding-3-small',
            dimensions,
            count: embeddings.length,
            tokens: data.usage?.total_tokens || null,
          };
        } catch (err) {
          if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
            return { error: 'Embedding generation timed out (30s). Try fewer or shorter strings.' };
          }
          return { error: `Embedding generation failed: ${(err as Error).message}` };
        }
      },
    },

    /* ============================================================== */
    /*  5. Moderation — Content Safety Check                           */
    /* ============================================================== */
    {
      name: 'openai_moderation',
      description:
        'Check text for harmful content using OpenAI Moderation API. Detects hate, violence, self-harm, sexual content, etc. ' +
        'Use for: screening user-generated product reviews before publishing, moderating community messages, ' +
        'validating LatAm marketplace listing descriptions, checking WhatsApp broadcast content for compliance, ' +
        'pre-screening social media posts before publishing to Meta/Instagram.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text content to check for policy violations (max 32768 characters)',
          },
        },
        required: ['text'],
      },
      riskLevel: 'low',
      execute: async (args, _traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) return missingKeyResponse();
        if (!apiKey.startsWith('sk-')) return invalidKeyResponse(apiKey);

        const text = String(args.text || '').trim();
        if (!text) return { error: 'text is required. Provide text content to moderate.' };
        if (text.length > 32768) return { error: 'Text too long (max 32768 characters).' };

        log.info('moderation_request', { text_length: text.length, trace_id: _traceId });

        try {
          const res = await fetch('https://api.openai.com/v1/moderations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              input: text,
            }),
            signal: AbortSignal.timeout(30_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown error');
            const errorMessage = parseOpenAIError('Moderation', res.status, errText);
            log.error(errorMessage, { status: res.status, trace_id: _traceId });
            return { error: errorMessage };
          }

          const data = (await res.json()) as {
            results: Array<{
              flagged: boolean;
              categories: Record<string, boolean>;
              category_scores: Record<string, number>;
            }>;
          };

          const result = data.results?.[0];
          if (!result) {
            return { error: 'No moderation result returned from OpenAI.' };
          }

          // Collect only the flagged categories for cleaner output
          const flaggedCategories: Record<string, boolean> = {};
          const flaggedScores: Record<string, number> = {};
          for (const [category, isFlagged] of Object.entries(result.categories)) {
            if (isFlagged) {
              flaggedCategories[category] = true;
              flaggedScores[category] = result.category_scores[category] || 0;
            }
          }

          log.info('moderation_success', { flagged: result.flagged, trace_id: _traceId });

          return {
            success: true,
            flagged: result.flagged,
            categories: result.categories,
            scores: result.category_scores,
            ...(result.flagged
              ? { flaggedCategories, flaggedScores, warning: 'Content was flagged. Review before publishing.' }
              : { note: 'Content passed moderation. Safe to publish.' }),
          };
        } catch (err) {
          if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
            return { error: 'Moderation check timed out (30s). Try shorter text.' };
          }
          return { error: `Moderation check failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
