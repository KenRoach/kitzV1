/**
 * Voice brain dump skill — capture voice memos and transform them into
 * structured notes, tasks, and ideas for business owners.
 *
 * Flow: WhatsApp audio → transcription → LLM structuring → CRM/tasks/notes
 *
 * Reference repos:
 *  - WhisperLive (github.com/collabora/WhisperLive) — real-time Whisper STT
 *  - Scriberr (github.com/rishikanthc/Scriberr) — self-hosted transcription
 *  - NotelyVoice (github.com/tosinonikute/NotelyVoice) — on-device voice notes
 *  - OpenWhispr (github.com/HeroTools/open-whispr) — local + cloud dictation
 */

import type { LLMClient } from './callTranscription.js';

export interface BrainDumpItem {
  type: 'task' | 'idea' | 'note' | 'followup' | 'decision';
  title: string;
  body: string;
  priority: 'low' | 'medium' | 'high';
  relatedContact?: string;
  dueDate?: string;
  tags: string[];
}

export interface BrainDumpResult {
  summary: string;
  items: BrainDumpItem[];
  rawTranscript: string;
  language: string;
  durationSeconds: number;
}

export interface BrainDumpOptions {
  transcript: string;
  language?: string;
  durationSeconds?: number;
  businessContext?: string;
}

const BRAIN_DUMP_SYSTEM =
  'You are a brain dump organizer for small business owners in Latin America. ' +
  'The user has just recorded a voice memo with their thoughts — messy, stream-of-consciousness. ' +
  'Your job: extract every actionable item, idea, and note from the transcript. ' +
  'Categorize each as task, idea, note, followup, or decision. ' +
  'Assign priority based on business impact and urgency. ' +
  'Default language is Spanish unless the transcript is in another language. ' +
  'Be thorough — capture everything, lose nothing. The user trusts you with their thoughts.';

const BRAIN_DUMP_FORMAT =
  'Respond with JSON: { "summary": string (2-3 sentence overview), ' +
  '"items": [{ "type": "task" | "idea" | "note" | "followup" | "decision", ' +
  '"title": string (short, actionable), "body": string (detail), ' +
  '"priority": "low" | "medium" | "high", ' +
  '"relatedContact": string | null, "dueDate": string | null (ISO 8601), ' +
  '"tags": string[] }] }';

/**
 * Process a voice brain dump transcript into structured items.
 * When no llmClient is provided, returns a stub result.
 */
export async function processVoiceBrainDump(
  options: BrainDumpOptions,
  llmClient?: LLMClient,
): Promise<BrainDumpResult> {
  const language = options.language ?? 'es';
  const duration = options.durationSeconds ?? 0;

  if (llmClient) {
    const contextLine = options.businessContext
      ? `\nBusiness context: ${options.businessContext}`
      : '';

    const prompt =
      `Process this voice brain dump transcript into structured items.${contextLine}\n\n` +
      `Transcript (${language}, ${duration}s):\n"${options.transcript}"\n\n` +
      BRAIN_DUMP_FORMAT;

    const response = await llmClient.complete({
      prompt,
      system: BRAIN_DUMP_SYSTEM,
      tier: 'sonnet',
    });

    try {
      const parsed = JSON.parse(response.text) as {
        summary: string;
        items: BrainDumpItem[];
      };
      return {
        summary: parsed.summary,
        items: parsed.items,
        rawTranscript: options.transcript,
        language,
        durationSeconds: duration,
      };
    } catch {
      return {
        summary: response.text.slice(0, 200),
        items: [{
          type: 'note',
          title: 'Raw brain dump',
          body: options.transcript,
          priority: 'medium',
          tags: ['brain-dump', 'unprocessed'],
        }],
        rawTranscript: options.transcript,
        language,
        durationSeconds: duration,
      };
    }
  }

  return {
    summary: '[Brain dump processing unavailable — no LLM client configured]',
    items: [{
      type: 'note',
      title: 'Raw brain dump',
      body: options.transcript,
      priority: 'medium',
      tags: ['brain-dump', 'unprocessed'],
    }],
    rawTranscript: options.transcript,
    language,
    durationSeconds: duration,
  };
}
