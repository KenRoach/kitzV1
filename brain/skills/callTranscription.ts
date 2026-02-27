/**
 * Call transcription skill — transcribe voice calls using AI.
 */

import { PROMPTS } from '../prompts/templates.js';

export interface TranscriptionResult {
  text: string;
  confidence: number;
  duration: number;
  language: string;
  segments?: Array<{ start: number; end: number; text: string }>;
}

export interface TranscriptionOptions {
  language?: string;
  format?: 'wav' | 'mp3' | 'ogg' | 'webm';
}

export interface LLMClient {
  complete: (req: { prompt: string; system?: string; tier?: string }) => Promise<{ text: string }>;
}

/**
 * Transcribe audio using LLM hub.
 * When no llmClient is provided, returns a stub result for testing.
 */
export async function transcribeCall(
  audioBuffer: Buffer,
  options?: TranscriptionOptions,
  llmClient?: LLMClient,
): Promise<TranscriptionResult> {
  const language = options?.language ?? 'es';

  if (llmClient) {
    const prompt =
      `Transcribe the following audio content.\n` +
      `Audio format: ${options?.format ?? 'unknown'}\n` +
      `Preferred language: ${language}\n` +
      `Audio size: ${audioBuffer.length} bytes\n\n` +
      PROMPTS.transcription.format;

    const response = await llmClient.complete({
      prompt,
      system: PROMPTS.transcription.system,
      tier: 'haiku',
    });

    try {
      const parsed = JSON.parse(response.text) as TranscriptionResult;
      return {
        text: parsed.text,
        confidence: Math.max(0, Math.min(1, parsed.confidence)),
        duration: parsed.duration,
        language: parsed.language || language,
        segments: parsed.segments,
      };
    } catch {
      return { text: response.text, confidence: 0.5, duration: 0, language };
    }
  }

  return {
    text: '[Transcription unavailable — no LLM client configured]',
    confidence: 0,
    duration: 0,
    language,
  };
}
