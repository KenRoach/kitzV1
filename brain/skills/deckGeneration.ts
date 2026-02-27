/**
 * Deck generation skill — create slide presentations from context.
 *
 * Use cases: investor decks, sales proposals, product presentations, reports.
 */

import type { LLMClient } from './callTranscription.js';

export interface Slide {
  slideNumber: number;
  title: string;
  bullets: string[];
  notes: string;
  layout: 'title' | 'bullets' | 'image' | 'chart' | 'comparison' | 'quote';
}

export interface DeckResult {
  title: string;
  slideCount: number;
  slides: Slide[];
  designNotes: string;
}

export interface DeckOptions {
  purpose: 'pitch' | 'sales' | 'report' | 'product' | 'training';
  topic: string;
  audience?: string;
  slideCount?: number;
  language?: string;
}

const DECK_SYSTEM =
  'You are a presentation designer for small businesses in Latin America. ' +
  'Create compelling slide decks: concise bullets, clear structure, strong narrative arc. ' +
  'Default language: Spanish. Max 10-15 slides. Every slide must earn its place.';

export async function generateDeck(options: DeckOptions, llmClient?: LLMClient): Promise<DeckResult> {
  if (llmClient) {
    const prompt = `Create a ${options.purpose} deck about: ${options.topic}\nAudience: ${options.audience ?? 'general'}\nSlides: ${options.slideCount ?? 10}\nLanguage: ${options.language ?? 'es'}`;
    const response = await llmClient.complete({ prompt, system: DECK_SYSTEM, tier: 'sonnet' });
    try { return JSON.parse(response.text) as DeckResult; } catch { return { title: options.topic, slideCount: 0, slides: [], designNotes: response.text }; }
  }
  return { title: options.topic, slideCount: 0, slides: [], designNotes: '[Deck generation unavailable — no LLM client]' };
}
