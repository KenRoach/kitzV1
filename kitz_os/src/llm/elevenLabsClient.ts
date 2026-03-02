/**
 * ElevenLabs Client — Text-to-Speech + Conversational AI
 *
 * Gives KITZ OS a female voice and manages voice agent configuration.
 *
 * Capabilities:
 *   - Text-to-Speech (TTS): Convert any text response to audio (mp3/pcm)
 *   - Voice streaming: WebSocket-based real-time TTS
 *   - Conversational AI: Manage voice agents for website widget
 *   - Voice list: Browse available voices
 *
 * KITZ Voice Identity:
 *   - Gender: Female
 *   - Language: Multilingual (Spanish-first, English fluent)
 *   - Tone: Warm, professional, Gen-Z clarity
 *   - Model: eleven_multilingual_v2 (32+ languages)
 */

import { createSubsystemLogger } from 'kitz-schemas';
import { recordTTSSpend } from '../aiBattery.js';

const log = createSubsystemLogger('elevenLabsClient');

// ── Config ────────────────────────────────────────────────

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Default voice: "Rachel" — warm female, multilingual
// Can be overridden via ELEVENLABS_VOICE_ID env var
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
const DEFAULT_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

// Conversational AI agent (created via ElevenLabs dashboard or API)
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID || '';

// ── Types ─────────────────────────────────────────────────

export interface TTSOptions {
  /** Text to convert to speech */
  text: string;
  /** Voice ID (defaults to KITZ female voice) */
  voiceId?: string;
  /** Model ID (defaults to eleven_multilingual_v2) */
  modelId?: string;
  /** Output format */
  outputFormat?: 'mp3_44100_128' | 'mp3_22050_32' | 'pcm_16000' | 'pcm_24000' | 'ulaw_8000';
  /** Voice settings */
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface TTSResult {
  /** Audio as base64-encoded string */
  audioBase64: string;
  /** MIME type of the audio */
  mimeType: string;
  /** Character count (for credit tracking) */
  characterCount: number;
  /** Voice ID used */
  voiceId: string;
  /** Model used */
  modelId: string;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  description?: string;
  preview_url?: string;
}

export interface ConversationalAgentConfig {
  agentId: string;
  name: string;
  firstMessage: string;
  systemPrompt: string;
  language: string;
  voiceId: string;
  tools: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
}

// ── Text-to-Speech ────────────────────────────────────────

/**
 * Convert text to speech using ElevenLabs API.
 * Returns base64-encoded audio suitable for WhatsApp voice messages.
 */
export async function textToSpeech(options: TTSOptions): Promise<TTSResult> {
  const voiceId = options.voiceId || DEFAULT_VOICE_ID;
  const modelId = options.modelId || DEFAULT_MODEL_ID;
  const outputFormat = options.outputFormat || 'mp3_44100_128';

  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  const url = `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}?output_format=${outputFormat}`;

  const body = {
    text: options.text,
    model_id: modelId,
    voice_settings: {
      stability: options.stability ?? 0.5,
      similarity_boost: options.similarityBoost ?? 0.75,
      style: options.style ?? 0.0,
      use_speaker_boost: options.useSpeakerBoost ?? true,
    },
  };

  log.info('tts', {  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'unknown error');
    log.error(`ElevenLabs HTTP ${res.status}`, { detail: errorText.slice(0, 500) });
    throw new Error(`ElevenLabs TTS error: HTTP ${res.status} — ${errorText.slice(0, 200)}`);
  }

  // Get audio as ArrayBuffer → base64
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const audioBase64 = buffer.toString('base64');

  const mimeType = outputFormat.startsWith('mp3') ? 'audio/mpeg'
    : outputFormat.startsWith('pcm') ? 'audio/pcm'
    : outputFormat.startsWith('ulaw') ? 'audio/basic'
    : 'audio/mpeg';

  const ttsResult: TTSResult = {
    audioBase64,
    mimeType,
    characterCount: options.text.length,
    voiceId,
    modelId,
  };

  // ── Track ElevenLabs spend in AI Battery (only when enabled) ──
  if (process.env.AI_BATTERY_ENABLED === 'true') {
    recordTTSSpend({
      characterCount: ttsResult.characterCount,
      voiceId: ttsResult.voiceId,
      modelId: ttsResult.modelId,
      traceId: crypto.randomUUID(),
      toolContext: 'textToSpeech',
    }).catch(() => { /* non-blocking */ });
  }

  return ttsResult;
}

/**
 * Stream text-to-speech (returns audio chunks as they generate).
 * Useful for real-time voice responses.
 */
export async function textToSpeechStream(options: TTSOptions): Promise<ReadableStream<Uint8Array>> {
  const voiceId = options.voiceId || DEFAULT_VOICE_ID;
  const modelId = options.modelId || DEFAULT_MODEL_ID;
  const outputFormat = options.outputFormat || 'mp3_44100_128';

  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  const url = `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream?output_format=${outputFormat}`;

  const body = {
    text: options.text,
    model_id: modelId,
    voice_settings: {
      stability: options.stability ?? 0.5,
      similarity_boost: options.similarityBoost ?? 0.75,
      style: options.style ?? 0.0,
      use_speaker_boost: options.useSpeakerBoost ?? true,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'unknown');
    throw new Error(`ElevenLabs stream error: HTTP ${res.status} — ${errorText.slice(0, 200)}`);
  }

  if (!res.body) {
    throw new Error('No stream body in ElevenLabs response');
  }

  return res.body;
}

// ── Voice Management ──────────────────────────────────────

/**
 * List available voices from ElevenLabs.
 */
export async function listVoices(): Promise<ElevenLabsVoice[]> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  const res = await fetch(`${ELEVENLABS_API_URL}/voices`, {
    headers: { 'xi-api-key': ELEVENLABS_API_KEY },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`ElevenLabs voices error: HTTP ${res.status}`);
  }

  const data = await res.json() as { voices: ElevenLabsVoice[] };
  return data.voices || [];
}

/**
 * Get the current KITZ voice settings.
 */
export function getKitzVoiceConfig(): {
  voiceId: string;
  modelId: string;
  agentId: string;
  isConfigured: boolean;
} {
  return {
    voiceId: DEFAULT_VOICE_ID,
    modelId: DEFAULT_MODEL_ID,
    agentId: ELEVENLABS_AGENT_ID,
    isConfigured: ELEVENLABS_API_KEY.length > 0,
  };
}

// ── Conversational AI Agent ───────────────────────────────

/**
 * Get the widget configuration for embedding the KITZ voice agent.
 * Returns the HTML snippet to embed on websites.
 */
export function getWidgetSnippet(agentId?: string): string {
  const id = agentId || ELEVENLABS_AGENT_ID;
  if (!id) {
    return '<!-- KITZ Voice Widget: ELEVENLABS_AGENT_ID not configured -->';
  }

  return `<!-- KITZ Voice Assistant Widget -->
<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
<elevenlabs-convai agent-id="${id}"></elevenlabs-convai>`;
}

/**
 * Create a signed URL for the conversational AI agent.
 * Used for private agents that shouldn't expose their agent-id publicly.
 */
export async function getSignedAgentUrl(agentId?: string): Promise<string> {
  const id = agentId || ELEVENLABS_AGENT_ID;
  if (!ELEVENLABS_API_KEY || !id) {
    throw new Error('ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID required');
  }

  const res = await fetch(
    `${ELEVENLABS_API_URL}/convai/conversation/get_signed_url?agent_id=${id}`,
    {
      method: 'GET',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!res.ok) {
    throw new Error(`ElevenLabs signed URL error: HTTP ${res.status}`);
  }

  const data = await res.json() as { signed_url: string };
  return data.signed_url;
}

// ── Utility ───────────────────────────────────────────────

/**
 * Check if ElevenLabs is configured and available.
 */
export function isElevenLabsConfigured(): boolean {
  return ELEVENLABS_API_KEY.length > 0;
}

/**
 * Get estimated credit cost for a text.
 * ElevenLabs charges ~1 credit per character for multilingual_v2.
 */
export function estimateCreditCost(text: string): number {
  return text.length;
}
