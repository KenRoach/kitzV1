/**
 * Voice Tools — ElevenLabs TTS + Conversational AI for KITZ OS.
 *
 * 5 tools:
 *   - voice_speak           (DIRECT_EXECUTE, medium)  — Convert text to speech audio
 *   - voice_listVoices      (DIRECT_EXECUTE, low)     — List available ElevenLabs voices
 *   - voice_getConfig       (DIRECT_EXECUTE, low)     — Get current KITZ voice settings
 *   - voice_getWidget       (DIRECT_EXECUTE, low)     — Get embeddable widget HTML snippet
 *   - voice_getSignedUrl    (DIRECT_EXECUTE, low)     — Get signed URL for private agent widget
 *
 * KITZ Voice Identity:
 *   - Female, warm, professional, multilingual (Spanish-first)
 *   - Model: eleven_multilingual_v2
 *   - Used for: WhatsApp voice replies, dashboard voice assistant, website Call Assistant
 */

import {
  textToSpeech,
  listVoices,
  getKitzVoiceConfig,
  getWidgetSnippet,
  getSignedAgentUrl,
  isElevenLabsConfigured,
  estimateCreditCost,
} from '../llm/elevenLabsClient.js';
import type { ToolSchema } from './registry.js';

export function getAllVoiceTools(): ToolSchema[] {
  return [
    // ── 1. Text-to-Speech ──
    {
      name: 'voice_speak',
      description:
        'Convert text to speech audio using KITZ\'s female voice (ElevenLabs). Returns base64-encoded audio for WhatsApp voice messages or web playback. Use for: reading reports aloud, voice replies, audio summaries.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text to convert to speech (max 5000 characters)',
          },
          voice_id: {
            type: 'string',
            description: 'Optional voice ID override (default: KITZ female voice)',
          },
          output_format: {
            type: 'string',
            enum: ['mp3_44100_128', 'mp3_22050_32', 'pcm_16000', 'ulaw_8000'],
            description: 'Audio format (default: mp3_44100_128). Use ulaw_8000 for phone calls, pcm_16000 for processing.',
          },
          stability: {
            type: 'number',
            description: 'Voice stability 0.0-1.0 (default: 0.5). Higher = more consistent, lower = more expressive.',
          },
          similarity_boost: {
            type: 'number',
            description: 'Voice clarity 0.0-1.0 (default: 0.75). Higher = closer to original voice.',
          },
        },
        required: ['text'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        if (!isElevenLabsConfigured()) {
          return { error: 'ElevenLabs not configured. Set ELEVENLABS_API_KEY environment variable.' };
        }

        const text = String(args.text || '').trim();
        if (!text) {
          return { error: 'Text is required.' };
        }

        if (text.length > 5000) {
          return { error: `Text too long (${text.length} chars). Max 5000 characters per request.` };
        }

        const estimatedCredits = estimateCreditCost(text);

        try {
          const result = await textToSpeech({
            text,
            voiceId: args.voice_id as string | undefined,
            outputFormat: args.output_format as 'mp3_44100_128' | 'mp3_22050_32' | 'pcm_16000' | 'ulaw_8000' | undefined,
            stability: args.stability as number | undefined,
            similarityBoost: args.similarity_boost as number | undefined,
          });

          console.log(JSON.stringify({
            ts: new Date().toISOString(),
            module: 'voiceTools',
            action: 'voice_speak',
            char_count: result.characterCount,
            estimated_credits: estimatedCredits,
            voice_id: result.voiceId,
            trace_id: traceId,
          }));

          return {
            audio_base64: result.audioBase64,
            mime_type: result.mimeType,
            character_count: result.characterCount,
            estimated_credits: estimatedCredits,
            voice_id: result.voiceId,
            model_id: result.modelId,
          };
        } catch (err) {
          return { error: `Voice generation failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 2. List Voices ──
    {
      name: 'voice_listVoices',
      description:
        'List all available ElevenLabs voices. Returns voice IDs, names, categories, and labels. Use to find alternative voices for KITZ.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['premade', 'cloned', 'generated', 'professional'],
            description: 'Filter by voice category (optional)',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        if (!isElevenLabsConfigured()) {
          return { error: 'ElevenLabs not configured. Set ELEVENLABS_API_KEY environment variable.' };
        }

        try {
          let voices = await listVoices();

          // Filter by category if specified
          if (args.category) {
            voices = voices.filter(v => v.category === args.category);
          }

          return {
            count: voices.length,
            voices: voices.map(v => ({
              voice_id: v.voice_id,
              name: v.name,
              category: v.category,
              labels: v.labels,
              description: v.description || '',
              preview_url: v.preview_url || '',
            })),
          };
        } catch (err) {
          return { error: `Failed to list voices: ${(err as Error).message}` };
        }
      },
    },

    // ── 3. Get Voice Config ──
    {
      name: 'voice_getConfig',
      description:
        'Get the current KITZ voice configuration: active voice ID, model, agent ID, and whether ElevenLabs is configured.',
      parameters: {
        type: 'object',
        properties: {},
      },
      riskLevel: 'low',
      execute: async () => {
        const config = getKitzVoiceConfig();
        return {
          ...config,
          voice_name: 'KITZ (Female, Multilingual)',
          description: 'Warm, professional female voice. Spanish-first, English fluent. Uses eleven_multilingual_v2 model.',
          widget_available: config.agentId.length > 0,
        };
      },
    },

    // ── 4. Get Widget Snippet ──
    {
      name: 'voice_getWidget',
      description:
        'Get the HTML snippet to embed the KITZ Voice Assistant widget on a website. The widget provides a floating button that opens a voice conversation interface.',
      parameters: {
        type: 'object',
        properties: {
          agent_id: {
            type: 'string',
            description: 'Optional agent ID override (default: configured ELEVENLABS_AGENT_ID)',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args) => {
        const snippet = getWidgetSnippet(args.agent_id as string | undefined);
        return {
          html: snippet,
          instructions: 'Add this snippet before </body> in your HTML. The widget appears as a floating button in the bottom-right corner.',
          targets: [
            'kitz.io (xyz88-io)',
            'kitz.services',
            'admin.kitz.services',
          ],
        };
      },
    },

    // ── 5. Get Signed URL ──
    {
      name: 'voice_getSignedUrl',
      description:
        'Get a time-limited signed URL for the KITZ Voice Assistant. Use for private agents that shouldn\'t expose their agent-id publicly.',
      parameters: {
        type: 'object',
        properties: {
          agent_id: {
            type: 'string',
            description: 'Optional agent ID override',
          },
        },
      },
      riskLevel: 'low',
      execute: async (args) => {
        if (!isElevenLabsConfigured()) {
          return { error: 'ElevenLabs not configured. Set ELEVENLABS_API_KEY environment variable.' };
        }

        try {
          const signedUrl = await getSignedAgentUrl(args.agent_id as string | undefined);
          return {
            signed_url: signedUrl,
            note: 'Use this URL in the widget: <elevenlabs-convai signed-url="...">',
            expires: 'Time-limited — generate a new one for each session.',
          };
        } catch (err) {
          return { error: `Failed to get signed URL: ${(err as Error).message}` };
        }
      },
    },
  ];
}
