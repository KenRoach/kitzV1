/**
 * Media Understanding Tools — AI-powered image/document analysis.
 *
 * Ported from OpenClaw media-understanding module.
 * Expands on docScanTools with specialized analysis modes:
 *   - Product photo analysis (for storefront listings)
 *   - Receipt/invoice OCR (for expense tracking)
 *   - General image description (for accessibility/context)
 *   - Document OCR (handwritten notes, screenshots)
 */

import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';

// ── Specialized Prompts ──

const PROMPTS: Record<string, string> = {
  product: `Analyze this product image for a small business storefront listing. Return valid JSON:
{
  "product_name": "descriptive product name in Spanish",
  "category": "food|clothing|beauty|crafts|electronics|services|other",
  "description_es": "2-3 sentence product description in Spanish for the storefront",
  "description_en": "same in English",
  "suggested_tags": ["tag1", "tag2"],
  "estimated_price_range": "$X - $Y USD",
  "quality_notes": "lighting, angle, background suggestions to improve the photo",
  "ready_for_storefront": true/false
}`,

  receipt: `Extract ALL financial data from this receipt/invoice. Return valid JSON:
{
  "vendor": "store/business name",
  "date": "YYYY-MM-DD",
  "items": [{"name": "item", "qty": 1, "price": 0.00}],
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "currency": "USD|PAB",
  "payment_method": "cash|card|transfer|other",
  "receipt_number": "if visible",
  "notes": "any other relevant info"
}`,

  describe: `Describe this image in detail. Consider context relevant to a small business owner in Latin America. Return valid JSON:
{
  "description": "detailed description",
  "objects": ["list of main objects/subjects"],
  "text_visible": "any text visible in the image",
  "mood": "professional|casual|artistic|informational",
  "suggested_use": "where this image could be used (social media, storefront, etc.)"
}`,

  ocr: `Extract ALL text from this document/screenshot. Preserve layout and formatting where possible. Return valid JSON:
{
  "full_text": "all extracted text preserving line breaks",
  "language": "detected language",
  "document_type": "handwritten|printed|screenshot|mixed",
  "key_data": {"any structured data found": "values"}
}`,
};

// ── Vision API call ──

async function callVision(base64: string, mimeType: string, prompt: string): Promise<Record<string, unknown>> {
  if (!CLAUDE_API_KEY) {
    return { error: 'No CLAUDE_API_KEY configured for vision analysis.' };
  }

  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': CLAUDE_API_VERSION,
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    return { error: `Vision API error: HTTP ${res.status}`, detail: errText.slice(0, 200) };
  }

  const data = await res.json() as { content: Array<{ type: string; text?: string }> };
  const text = data.content?.find(c => c.type === 'text')?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };
}

// ── Tool Definitions ──

export function getAllMediaUnderstandingTools(): ToolSchema[] {
  return [
    {
      name: 'media_analyze_product',
      description: 'Analyze a product photo for storefront listing — generates name, description, tags, and price estimate',
      parameters: {
        type: 'object',
        properties: {
          base64: { type: 'string', description: 'Base64-encoded image' },
          mime_type: { type: 'string', description: 'Image MIME type', enum: ['image/jpeg', 'image/png', 'image/webp'] },
        },
        required: ['base64', 'mime_type'],
      },
      riskLevel: 'medium',
      execute: async (args) => callVision(args.base64 as string, args.mime_type as string, PROMPTS.product),
    },

    {
      name: 'media_scan_receipt',
      description: 'OCR a receipt or invoice — extracts vendor, items, totals, and payment method',
      parameters: {
        type: 'object',
        properties: {
          base64: { type: 'string', description: 'Base64-encoded image of receipt/invoice' },
          mime_type: { type: 'string', description: 'Image MIME type', enum: ['image/jpeg', 'image/png', 'image/webp'] },
        },
        required: ['base64', 'mime_type'],
      },
      riskLevel: 'medium',
      execute: async (args) => callVision(args.base64 as string, args.mime_type as string, PROMPTS.receipt),
    },

    {
      name: 'media_describe',
      description: 'Describe any image in detail — useful for accessibility, social media captions, and context',
      parameters: {
        type: 'object',
        properties: {
          base64: { type: 'string', description: 'Base64-encoded image' },
          mime_type: { type: 'string', description: 'Image MIME type', enum: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] },
        },
        required: ['base64', 'mime_type'],
      },
      riskLevel: 'low',
      execute: async (args) => callVision(args.base64 as string, args.mime_type as string, PROMPTS.describe),
    },

    {
      name: 'media_ocr',
      description: 'Extract all text from a document, screenshot, or handwritten note via OCR',
      parameters: {
        type: 'object',
        properties: {
          base64: { type: 'string', description: 'Base64-encoded image or PDF' },
          mime_type: { type: 'string', description: 'MIME type', enum: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] },
        },
        required: ['base64', 'mime_type'],
      },
      riskLevel: 'low',
      execute: async (args) => callVision(args.base64 as string, args.mime_type as string, PROMPTS.ocr),
    },
  ];
}
