/**
 * Edge TTS — Free Microsoft Text-to-Speech fallback.
 *
 * Ported from OpenClaw tts/tts.ts edge provider.
 * Uses Microsoft Edge's cloud TTS service via node-edge-tts.
 * No API key required — ideal for low-priority audio and bootstrap.
 *
 * Spanish LatAm voices (Kitz primary market):
 *   - es-MX-DaliaNeural (female, warm)
 *   - es-CO-SalomeNeural (female, clear)
 *   - es-AR-ElenaNeural (female, expressive)
 *   - es-PA-MargaritaNeural (female, Panama)
 *   - es-MX-JorgeNeural (male)
 */

import type { TTSResult } from '../llm/elevenLabsClient.js';

// ── Config ──

const DEFAULT_VOICE = process.env.EDGE_TTS_VOICE || 'es-MX-DaliaNeural';
const DEFAULT_LANG = process.env.EDGE_TTS_LANG || 'es-MX';
const DEFAULT_OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';
const TIMEOUT_MS = 30_000;

// ── Types ──

export interface EdgeTTSOptions {
  text: string;
  voice?: string;
  lang?: string;
  rate?: string;   // e.g. "+20%" or "-10%"
  pitch?: string;  // e.g. "+5Hz" or "-10Hz"
}

// ── Core ──

let edgeTtsModule: any = null;

async function getEdgeTts(): Promise<any> {
  if (!edgeTtsModule) {
    try {
      // @ts-ignore — optional dependency, handled at runtime
      edgeTtsModule = await import('node-edge-tts');
    } catch {
      throw new Error('node-edge-tts not installed. Run: npm install node-edge-tts');
    }
  }
  return edgeTtsModule;
}

/**
 * Convert text to speech using Microsoft Edge TTS (free, no API key).
 * Returns base64 audio compatible with the same TTSResult interface as ElevenLabs.
 */
export async function edgeTextToSpeech(options: EdgeTTSOptions): Promise<TTSResult> {
  const mod = await getEdgeTts();
  const EdgeTTS = mod.default || mod.EdgeTTS || mod;

  const voice = options.voice || DEFAULT_VOICE;
  const text = options.text;

  if (!text || text.length === 0) {
    throw new Error('Edge TTS: empty text');
  }

  // Create TTS instance and generate audio
  const tts = new EdgeTTS();
  await tts.synthesize(text, voice, {
    rate: options.rate,
    pitch: options.pitch,
  });

  const audioBuffer = await tts.toBuffer();

  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('Edge TTS: empty audio buffer returned');
  }

  const audioBase64 = Buffer.from(audioBuffer).toString('base64');

  return {
    audioBase64,
    mimeType: 'audio/mpeg',
    characterCount: text.length,
    voiceId: voice,
    modelId: 'edge-tts',
  };
}

/**
 * List available Edge TTS voices (filtered by language if provided).
 */
export async function listEdgeVoices(lang?: string): Promise<Array<{ name: string; locale: string; gender: string }>> {
  const mod = await getEdgeTts();
  const EdgeTTS = mod.default || mod.EdgeTTS || mod;

  const tts = new EdgeTTS();
  const voices: Array<{ ShortName: string; Locale: string; Gender: string }> = await tts.getVoices();

  const mapped = voices.map(v => ({
    name: v.ShortName,
    locale: v.Locale,
    gender: v.Gender,
  }));

  if (lang) {
    return mapped.filter(v => v.locale.startsWith(lang));
  }
  return mapped;
}

/**
 * Check if Edge TTS is available (package installed).
 */
export async function isEdgeTtsAvailable(): Promise<boolean> {
  try {
    await getEdgeTts();
    return true;
  } catch {
    return false;
  }
}

/**
 * TTS with provider fallback: try ElevenLabs first, fall back to Edge TTS.
 * This is the recommended entry point for all TTS in Kitz OS.
 */
export async function textToSpeechWithFallback(
  options: { text: string; voiceId?: string; preferEdge?: boolean },
): Promise<TTSResult & { provider: 'elevenlabs' | 'edge' }> {
  // If preferEdge or ElevenLabs not configured, go straight to Edge
  if (options.preferEdge) {
    const result = await edgeTextToSpeech({ text: options.text });
    return { ...result, provider: 'edge' };
  }

  // Try ElevenLabs first
  try {
    const { textToSpeech, isElevenLabsConfigured } = await import('../llm/elevenLabsClient.js');
    if (isElevenLabsConfigured()) {
      const result = await textToSpeech({ text: options.text, voiceId: options.voiceId });
      return { ...result, provider: 'elevenlabs' };
    }
  } catch {
    // ElevenLabs failed — fall through to Edge
  }

  // Fallback to Edge TTS
  const result = await edgeTextToSpeech({ text: options.text });
  return { ...result, provider: 'edge' };
}
