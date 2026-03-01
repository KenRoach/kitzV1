/**
 * Office Automation Tools — Generate business documents and spreadsheets.
 *
 * 2 tools:
 *   - office_generateDocument    (medium) — Invoices, contracts, reports, proposals, memos
 *   - office_generateSpreadsheet (medium) — CSV/JSON data reports with summaries
 *
 * Uses Claude Sonnet for document generation, falls back to OpenAI gpt-4o.
 * Panama-specific: ITBMS 7% tax on invoices, RUC fields, commercial law clauses.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('officeAutomationTools');
import { callWorkspaceMcp } from './mcpClient.js';
import type { ToolSchema } from './registry.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const DOC_SYSTEM = `You are a business document generator for small businesses in Latin America.
Generate professional documents in the requested format.
Default language: Spanish. Keep everything concise and practical.

Panama-specific rules:
- Invoices: Include ITBMS (7% tax) when applicable
- Include RUC number field on commercial documents
- Contracts: Include standard clauses for Panama commercial law

Document types: invoice, receipt, report, contract, proposal, agenda, memo.

Respond with valid JSON:
{
  "title": "string",
  "document_type": "string",
  "reference_number": "string (e.g., INV-2026-001)",
  "sections": [{
    "heading": "string",
    "content": "string",
    "type": "text" | "table" | "list" | "signature"
  }],
  "metadata": {
    "business_name": "string",
    "date": "string (ISO)",
    "language": "string"
  },
  "rendered_markdown": "string (complete document in markdown format)"
}`;

const SHEET_SYSTEM = `You are a business data analyst for small businesses in Latin America.
Generate structured spreadsheet data from the provided context.
Default language: Spanish. Include summary totals when applicable.

Respond with valid JSON:
{
  "title": "string",
  "headers": ["string"],
  "rows": [{"header_name": "value"}],
  "summary": [{"label": "string", "value": "string or number"}],
  "rendered_csv": "string (complete CSV content)"
}`;

async function callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': CLAUDE_API_VERSION,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          temperature: 0.2,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.ok) {
        const data = await res.json() as { content: Array<{ type: string; text?: string }> };
        return data.content?.find(c => c.type === 'text')?.text || '';
      }
    } catch { /* fall through */ }
  }

  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 4096,
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.ok) {
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        return data.choices?.[0]?.message?.content || '';
      }
    } catch { /* return error */ }
  }

  return JSON.stringify({ error: 'No AI available for document generation' });
}

export function getAllOfficeAutomationTools(): ToolSchema[] {
  return [
    {
      name: 'office_generateDocument',
      description:
        'Generate a business document: invoice, receipt, report, contract, proposal, agenda, or memo. ' +
        'Returns structured sections + full markdown rendition. ' +
        'Invoices include ITBMS 7% tax (Panama). Contracts include standard commercial clauses.',
      parameters: {
        type: 'object',
        properties: {
          document_type: {
            type: 'string',
            enum: ['invoice', 'receipt', 'report', 'contract', 'proposal', 'agenda', 'memo'],
            description: 'Type of document to generate',
          },
          context: {
            type: 'string',
            description: 'Document context: what it\'s for, key details, parties involved',
          },
          business_name: {
            type: 'string',
            description: 'Business name (issuer)',
          },
          recipient_name: {
            type: 'string',
            description: 'Recipient/client name',
          },
          items: {
            type: 'string',
            description: 'JSON array of line items for invoices: [{"description":"...", "quantity": 1, "unit_price": 10}]',
          },
          currency: {
            type: 'string',
            enum: ['USD', 'PAB', 'MXN', 'COP', 'BRL', 'ARS', 'CLP', 'PEN'],
            description: 'Currency code (default: USD)',
          },
          include_tax: {
            type: 'boolean',
            description: 'Include ITBMS 7% tax (default: true for invoices)',
          },
        },
        required: ['document_type', 'context'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const docType = String(args.document_type || 'memo');
        const context = String(args.context || '').trim();
        if (!context) return { error: 'Context is required.' };

        const extra = [
          args.business_name ? `Business: ${args.business_name}` : '',
          args.recipient_name ? `Recipient: ${args.recipient_name}` : '',
          args.items ? `Line items: ${args.items}` : '',
          args.currency ? `Currency: ${args.currency}` : 'Currency: USD',
          args.include_tax !== false && docType === 'invoice' ? 'Include ITBMS 7% tax' : '',
        ].filter(Boolean).join('\n');

        const raw = await callLLM(
          DOC_SYSTEM,
          `Generate a ${docType}.\nContext: ${context}\n${extra}`,
        );

        let parsed;
        try {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { title: docType, rendered_markdown: raw };
        } catch {
          parsed = { title: docType, rendered_markdown: raw };
        }

        // Save document to archive
        try {
          await callWorkspaceMcp('archive_document', {
            title: parsed.title || `${docType} — ${new Date().toISOString().split('T')[0]}`,
            type: docType,
            content: parsed.rendered_markdown || JSON.stringify(parsed),
            reference_number: parsed.reference_number,
          }, traceId);
          parsed.archived = true;
        } catch {
          parsed.archived = false;
        }

        log.info('executed', { trace_id: traceId });

        return parsed;
      },
    },

    {
      name: 'office_generateSpreadsheet',
      description:
        'Generate a structured spreadsheet report with headers, rows, and summary totals. ' +
        'For sales reports, inventory counts, expense tracking, revenue summaries. ' +
        'Returns structured data + rendered CSV.',
      parameters: {
        type: 'object',
        properties: {
          report_type: {
            type: 'string',
            description: 'Type of report (e.g., "sales this month", "inventory count", "expense breakdown")',
          },
          context: {
            type: 'string',
            description: 'Data context or description of what to include',
          },
          data: {
            type: 'string',
            description: 'Optional raw data as JSON string to structure into a report',
          },
          business_name: {
            type: 'string',
            description: 'Business name for the report header',
          },
        },
        required: ['report_type', 'context'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const reportType = String(args.report_type || '').trim();
        const context = String(args.context || '').trim();
        if (!reportType) return { error: 'Report type is required.' };
        if (!context) return { error: 'Context is required.' };

        const extra = [
          args.business_name ? `Business: ${args.business_name}` : '',
          args.data ? `Raw data: ${args.data}` : '',
        ].filter(Boolean).join('\n');

        const raw = await callLLM(
          SHEET_SYSTEM,
          `Generate a ${reportType} spreadsheet report.\nContext: ${context}\n${extra}`,
        );

        let parsed;
        try {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { title: reportType, headers: [], rows: [], rendered_csv: raw };
        } catch {
          parsed = { title: reportType, headers: [], rows: [], rendered_csv: raw };
        }

        log.info('executed', { trace_id: traceId });

        return parsed;
      },
    },
  ];
}
