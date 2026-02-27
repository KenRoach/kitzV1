/**
 * Document scanner skill — extract structured data from images/PDFs.
 *
 * OCR + AI extraction for receipts, invoices, IDs, business cards, menus.
 */

import type { LLMClient } from './callTranscription.js';

export interface ScanResult {
  documentType: 'receipt' | 'invoice' | 'id' | 'business_card' | 'menu' | 'contract' | 'other';
  extractedFields: Record<string, string | number>;
  rawText: string;
  confidence: number;
}

export interface ScanOptions {
  imageBase64?: string;
  imageUrl?: string;
  documentHint?: string;
  language?: string;
}

const SCAN_SYSTEM =
  'You are a document scanner for small businesses in Latin America. ' +
  'Extract structured data from document images: receipts, invoices, IDs, business cards, menus. ' +
  'Return all extracted fields as key-value pairs. Default language: Spanish.';

export async function scanDocument(options: ScanOptions, llmClient?: LLMClient): Promise<ScanResult> {
  if (llmClient) {
    const prompt = `Scan and extract data from this document.\nType hint: ${options.documentHint ?? 'auto-detect'}\nLanguage: ${options.language ?? 'es'}`;
    const response = await llmClient.complete({ prompt, system: SCAN_SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as ScanResult; } catch { /* fall through */ }
  }
  return { documentType: 'other', extractedFields: {}, rawText: '[Scan unavailable — no LLM client]', confidence: 0 };
}
