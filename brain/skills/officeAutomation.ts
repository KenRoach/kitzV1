/**
 * Office automation skill — automate document, spreadsheet, and
 * administrative tasks for small businesses.
 *
 * Use cases for KITZ SMBs:
 *  - Generate invoices and receipts from order data
 *  - Create spreadsheet reports (sales, inventory, expenses)
 *  - Draft contracts and proposals from templates
 *  - Format and organize business documents
 *  - Generate meeting notes / agendas
 *  - Automate repetitive data entry tasks
 *
 * Reference repos:
 *  - OfficeAI (github.com/iOfficeAI/OfficeAI) — AI plugin for Office/WPS
 *  - sv-excel-agent (github.com/SylvianAI/sv-excel-agent) — Excel MCP agent
 *  - ONLYOFFICE — open-source office suite with AI agents
 *  - OpenAdapt (github.com/OpenAdaptAI/OpenAdapt) — generative RPA
 *  - RPA Framework (github.com/robocorp/rpaframework) — Python RPA tools
 */

import type { LLMClient } from './callTranscription.js';

export type DocumentType = 'invoice' | 'receipt' | 'report' | 'contract' | 'proposal' | 'agenda' | 'memo';
export type OutputFormat = 'markdown' | 'html' | 'csv' | 'json';

export interface DocumentSection {
  heading: string;
  content: string;
  type: 'text' | 'table' | 'list' | 'signature';
  tableData?: Array<Record<string, string | number>>;
}

export interface GeneratedDocument {
  title: string;
  documentType: DocumentType;
  sections: DocumentSection[];
  metadata: {
    createdAt: string;
    businessName: string;
    language: string;
    referenceNumber?: string;
  };
  outputFormat: OutputFormat;
  renderedContent: string;
}

export interface SpreadsheetReport {
  title: string;
  headers: string[];
  rows: Array<Record<string, string | number>>;
  summary?: { label: string; value: string | number }[];
  outputFormat: 'csv' | 'json';
  renderedContent: string;
}

export interface OfficeTaskResult {
  type: 'document' | 'spreadsheet';
  document?: GeneratedDocument;
  spreadsheet?: SpreadsheetReport;
}

export interface OfficeAutomationOptions {
  taskType: 'document' | 'spreadsheet';
  documentType?: DocumentType;
  context: string;
  data?: Record<string, unknown>;
  businessName?: string;
  outputFormat?: OutputFormat;
  template?: string;
  language?: string;
}

const OFFICE_SYSTEM =
  'You are a business document automation assistant for small businesses in Latin America. ' +
  'Generate professional documents, invoices, reports, and spreadsheets. ' +
  'Default language is Spanish. Use clear formatting and professional tone. ' +
  'For invoices: include ITBMS (7% Panama tax) when applicable. ' +
  'For contracts: include standard clauses for Panama commercial law. ' +
  'Keep everything concise and practical — SMB owners have no time for fluff.';

const DOCUMENT_FORMAT =
  'Respond with JSON: { "type": "document", "document": { "title": string, ' +
  '"documentType": string, "sections": [{ "heading": string, "content": string, ' +
  '"type": "text" | "table" | "list" | "signature", ' +
  '"tableData": [{ key: value }] | null }], ' +
  '"metadata": { "createdAt": string (ISO), "businessName": string, ' +
  '"language": string, "referenceNumber": string }, ' +
  '"outputFormat": string, "renderedContent": string (full markdown) } }';

const SPREADSHEET_FORMAT =
  'Respond with JSON: { "type": "spreadsheet", "spreadsheet": { "title": string, ' +
  '"headers": string[], "rows": [{ header: value }], ' +
  '"summary": [{ "label": string, "value": string | number }], ' +
  '"outputFormat": "csv" | "json", "renderedContent": string (CSV or JSON string) } }';

/**
 * Generate a business document or spreadsheet report.
 * When no llmClient is provided, returns a template.
 */
export async function automateOfficeTask(
  options: OfficeAutomationOptions,
  llmClient?: LLMClient,
): Promise<OfficeTaskResult> {
  const language = options.language ?? 'es';
  const businessName = options.businessName ?? 'Mi Negocio';

  if (llmClient) {
    const dataLine = options.data
      ? `\nData: ${JSON.stringify(options.data)}`
      : '';
    const templateLine = options.template
      ? `\nTemplate: ${options.template}`
      : '';

    const format = options.taskType === 'spreadsheet' ? SPREADSHEET_FORMAT : DOCUMENT_FORMAT;

    const prompt =
      `Generate a ${options.taskType} — ${options.documentType ?? 'general'}.\n` +
      `Context: ${options.context}${dataLine}${templateLine}\n` +
      `Business: ${businessName}\n` +
      `Language: ${language}\n` +
      `Output format: ${options.outputFormat ?? 'markdown'}\n\n` +
      format;

    const response = await llmClient.complete({
      prompt,
      system: OFFICE_SYSTEM,
      tier: 'sonnet',
    });

    try {
      return JSON.parse(response.text) as OfficeTaskResult;
    } catch {
      return buildDefaultDocument(options, businessName, language);
    }
  }

  return buildDefaultDocument(options, businessName, language);
}

function buildDefaultDocument(
  options: OfficeAutomationOptions,
  businessName: string,
  language: string,
): OfficeTaskResult {
  const now = new Date().toISOString();

  if (options.taskType === 'spreadsheet') {
    return {
      type: 'spreadsheet',
      spreadsheet: {
        title: `Reporte — ${businessName}`,
        headers: ['Item', 'Detalle', 'Valor'],
        rows: [{ Item: 'Ejemplo', Detalle: options.context.slice(0, 50), Valor: 0 }],
        summary: [{ label: 'Total', value: 0 }],
        outputFormat: 'csv',
        renderedContent: 'Item,Detalle,Valor\nEjemplo,' + options.context.slice(0, 50) + ',0',
      },
    };
  }

  const refNum = `DOC-${Date.now().toString(36).toUpperCase()}`;
  return {
    type: 'document',
    document: {
      title: `${options.documentType ?? 'Documento'} — ${businessName}`,
      documentType: options.documentType ?? 'memo',
      sections: [
        { heading: 'Contenido', content: options.context, type: 'text' },
      ],
      metadata: {
        createdAt: now,
        businessName,
        language,
        referenceNumber: refNum,
      },
      outputFormat: options.outputFormat ?? 'markdown',
      renderedContent: `# ${options.documentType ?? 'Documento'}\n\n**Ref:** ${refNum}\n**Negocio:** ${businessName}\n\n${options.context}`,
    },
  };
}
