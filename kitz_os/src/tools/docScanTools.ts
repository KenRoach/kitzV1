/**
 * Document Scan Tools — Extract info from images/PDFs using Claude Vision.
 * Falls back to OpenAI Vision if Claude unavailable.
 */
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SCAN_PROMPT = `Scan this document/image and extract ALL relevant information. Return valid JSON:
{
  "type": "business_card|invoice|receipt|contract|id_document|other",
  "name": "person or business name",
  "email": "if found",
  "phone": "if found",
  "company": "if found",
  "title": "job title if found",
  "address": "if found",
  "amount": "monetary amount if found",
  "date": "date if found",
  "notes": "any other relevant extracted text"
}`;

export function getAllDocScanTools(): ToolSchema[] {
  return [
    {
      name: 'doc_scan',
      description: 'Scan an image or document (business card, invoice, receipt) and extract structured data using AI vision',
      parameters: {
        type: 'object',
        properties: {
          base64: { type: 'string', description: 'Base64-encoded image data' },
          mime_type: { type: 'string', description: 'MIME type (image/jpeg, image/png, application/pdf)', enum: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'] },
        },
        required: ['base64', 'mime_type'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const base64 = args.base64 as string;
        const mimeType = args.mime_type as string;

        // Try Claude Vision first
        if (CLAUDE_API_KEY) {
          try {
            const claudeMediaType = mimeType === 'application/pdf' ? 'application/pdf' : mimeType;
            const res = await fetch(CLAUDE_API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': CLAUDE_API_VERSION,
              },
              body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 1024,
                messages: [{
                  role: 'user',
                  content: [
                    { type: 'image', source: { type: 'base64', media_type: claudeMediaType, data: base64 } },
                    { type: 'text', text: SCAN_PROMPT },
                  ],
                }],
              }),
              signal: AbortSignal.timeout(30_000),
            });

            if (res.ok) {
              const data = await res.json() as { content: Array<{ type: string; text?: string }> };
              const text = data.content?.find(c => c.type === 'text')?.text || '';
              const jsonMatch = text.match(/\{[\s\S]*\}/);
              return jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };
            }
          } catch { /* fall through */ }
        }

        // Fallback to OpenAI Vision
        if (OPENAI_API_KEY) {
          try {
            const res = await fetch(OPENAI_API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{
                  role: 'user',
                  content: [
                    { type: 'text', text: SCAN_PROMPT },
                    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
                  ],
                }],
                max_tokens: 1024,
              }),
              signal: AbortSignal.timeout(30_000),
            });

            if (res.ok) {
              const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
              const text = data.choices?.[0]?.message?.content || '';
              const jsonMatch = text.match(/\{[\s\S]*\}/);
              return jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };
            }
          } catch { /* return error */ }
        }

        return { error: 'No AI vision available. Set CLAUDE_API_KEY or AI_API_KEY.' };
      },
    },
  ];
}
