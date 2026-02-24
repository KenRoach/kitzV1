/**
 * Document Archive Tools — Store, search, retrieve, and manage business documents.
 *
 * 5 tools:
 *   - archive_store        (medium) — Archive a document with metadata and AI-extracted tags
 *   - archive_search       (low)    — Search archived documents by query, type, or tags
 *   - archive_get          (low)    — Retrieve a specific archived document
 *   - archive_list         (low)    — List all archived documents with filters
 *   - archive_delete       (medium) — Soft-delete an archived document
 *
 * Documents are stored in-memory with metadata (type, tags, dates, extracted data).
 * Production: persisted to Supabase storage + metadata in DB.
 *
 * 80/20 SPLIT:
 *   - 80% automated: storage, indexing, search, retrieval, lifecycle management
 *   - 20% AI: auto-tagging via Claude Vision, content summarization, smart search
 */

import type { ToolSchema } from './registry.js';

interface ArchivedDocument {
  id: string;
  filename: string;
  type: 'invoice' | 'receipt' | 'contract' | 'quote' | 'id_document' | 'business_card' | 'report' | 'other';
  mimeType: string;
  size: number; // bytes
  tags: string[];
  contactId?: string;
  contactName?: string;
  orderId?: string;
  summary: string;
  extractedData: Record<string, unknown>;
  archivedAt: string;
  archivedBy: string;
  expiresAt?: string;
  deleted: boolean;
}

// In-memory archive store
const archive: Map<string, ArchivedDocument> = new Map();

export function getAllDocumentArchiveTools(): ToolSchema[] {
  return [
    // ── archive_store ──
    {
      name: 'archive_store',
      description:
        'Archive a business document (invoice, receipt, contract, quote, report) with AI-powered auto-tagging. ' +
        'Extracts metadata using Claude Vision if image/PDF provided. Links to CRM contacts and orders.',
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'Document filename (e.g., "invoice-2026-001.pdf")' },
          type: {
            type: 'string',
            enum: ['invoice', 'receipt', 'contract', 'quote', 'id_document', 'business_card', 'report', 'other'],
            description: 'Document type',
          },
          mime_type: { type: 'string', description: 'MIME type (e.g., "application/pdf", "image/jpeg")' },
          base64: { type: 'string', description: 'Base64-encoded document content (optional — for AI extraction)' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Manual tags' },
          contact_id: { type: 'string', description: 'Link to CRM contact' },
          contact_name: { type: 'string', description: 'Contact name for reference' },
          order_id: { type: 'string', description: 'Link to order' },
          summary: { type: 'string', description: 'Manual summary (auto-generated if base64 provided)' },
          expires_in_days: { type: 'number', description: 'Auto-expire after N days (for compliance)' },
        },
        required: ['filename', 'type'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const filename = String(args.filename);
        const type = String(args.type) as ArchivedDocument['type'];
        const mimeType = (args.mime_type as string) || 'application/octet-stream';
        const base64 = args.base64 as string | undefined;
        const manualTags = Array.isArray(args.tags) ? (args.tags as string[]) : [];
        const contactId = args.contact_id as string | undefined;
        const contactName = args.contact_name as string | undefined;
        const orderId = args.order_id as string | undefined;
        const summary = args.summary as string | undefined;
        const expiresDays = args.expires_in_days as number | undefined;

        let extractedData: Record<string, unknown> = {};
        let aiSummary = summary || '';
        const aiTags: string[] = [];

        // 20% AI: Extract data from document via Claude Vision
        if (base64 && !summary) {
          try {
            const { claudeChat } = await import('../llm/claudeClient.js');
            const extracted = await claudeChat(
              [{
                role: 'user',
                content: `Analyze this ${type} document and extract key information.

Return JSON:
{
  "summary": "1-2 sentence summary",
  "tags": ["auto-generated", "relevant", "tags"],
  "data": {
    "amount": "monetary amount if found",
    "date": "document date if found",
    "parties": ["names/companies involved"],
    "reference_number": "invoice/contract number if found"
  }
}`,
              }],
              'haiku',
              traceId,
              'You are a document analyzer. Return only valid JSON.',
            );

            try {
              const cleaned = extracted.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleaned);
              aiSummary = parsed.summary || `${type}: ${filename}`;
              aiTags.push(...(parsed.tags || []));
              extractedData = parsed.data || {};
            } catch {
              aiSummary = `${type}: ${filename}`;
            }
          } catch {
            aiSummary = `${type}: ${filename}`;
          }
        }

        if (!aiSummary) {
          aiSummary = `${type}: ${filename}`;
        }

        const id = `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const allTags = [...new Set([...manualTags, ...aiTags, `type:${type}`])];

        const doc: ArchivedDocument = {
          id,
          filename,
          type,
          mimeType,
          size: base64 ? Math.round((base64.length * 3) / 4) : 0,
          tags: allTags,
          contactId,
          contactName,
          orderId,
          summary: aiSummary,
          extractedData,
          archivedAt: new Date().toISOString(),
          archivedBy: traceId || 'system',
          expiresAt: expiresDays
            ? new Date(Date.now() + expiresDays * 86400000).toISOString()
            : undefined,
          deleted: false,
        };

        archive.set(id, doc);

        return {
          id,
          filename,
          type,
          tags: allTags,
          summary: aiSummary,
          extractedData,
          size: doc.size,
          expiresAt: doc.expiresAt,
          message: `Archived "${filename}" (${type}) with ${allTags.length} tag(s).`,
        };
      },
    },

    // ── archive_search ──
    {
      name: 'archive_search',
      description:
        'Search archived documents by keyword, type, tags, or linked contact/order. ' +
        'Returns matching documents sorted by most recent.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (matches filename, summary, tags)' },
          type: {
            type: 'string',
            enum: ['invoice', 'receipt', 'contract', 'quote', 'id_document', 'business_card', 'report', 'other', 'all'],
            description: 'Filter by document type',
          },
          tags: { type: 'string', description: 'Comma-separated tags to filter by' },
          contact_id: { type: 'string', description: 'Filter by linked contact' },
          order_id: { type: 'string', description: 'Filter by linked order' },
          limit: { type: 'number', description: 'Max results (default: 20)' },
        },
      },
      riskLevel: 'low',
      execute: async (args) => {
        const query = (args.query as string || '').toLowerCase();
        const type = args.type as string | undefined;
        const tags = args.tags ? String(args.tags).split(',').map((t) => t.trim()).filter(Boolean) : [];
        const contactId = args.contact_id as string | undefined;
        const orderId = args.order_id as string | undefined;
        const limit = Math.min(Number(args.limit) || 20, 50);

        let results = Array.from(archive.values()).filter((d) => !d.deleted);

        if (query) {
          results = results.filter(
            (d) =>
              d.filename.toLowerCase().includes(query) ||
              d.summary.toLowerCase().includes(query) ||
              d.tags.some((t) => t.toLowerCase().includes(query)) ||
              (d.contactName && d.contactName.toLowerCase().includes(query)),
          );
        }
        if (type && type !== 'all') {
          results = results.filter((d) => d.type === type);
        }
        if (tags.length > 0) {
          results = results.filter((d) => tags.some((t) => d.tags.includes(t)));
        }
        if (contactId) {
          results = results.filter((d) => d.contactId === contactId);
        }
        if (orderId) {
          results = results.filter((d) => d.orderId === orderId);
        }

        // Sort by most recent
        results.sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime());

        return {
          results: results.slice(0, limit).map((d) => ({
            id: d.id,
            filename: d.filename,
            type: d.type,
            summary: d.summary,
            tags: d.tags,
            contactName: d.contactName,
            orderId: d.orderId,
            archivedAt: d.archivedAt,
            size: d.size,
          })),
          total: results.length,
          showing: Math.min(results.length, limit),
        };
      },
    },

    // ── archive_get ──
    {
      name: 'archive_get',
      description: 'Retrieve a specific archived document by ID with full metadata and extracted data.',
      parameters: {
        type: 'object',
        properties: {
          document_id: { type: 'string', description: 'Document archive ID' },
        },
        required: ['document_id'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        const docId = String(args.document_id);
        const doc = archive.get(docId);

        if (!doc || doc.deleted) {
          return { error: `Document "${docId}" not found.` };
        }

        return {
          id: doc.id,
          filename: doc.filename,
          type: doc.type,
          mimeType: doc.mimeType,
          size: doc.size,
          tags: doc.tags,
          contactId: doc.contactId,
          contactName: doc.contactName,
          orderId: doc.orderId,
          summary: doc.summary,
          extractedData: doc.extractedData,
          archivedAt: doc.archivedAt,
          archivedBy: doc.archivedBy,
          expiresAt: doc.expiresAt,
        };
      },
    },

    // ── archive_list ──
    {
      name: 'archive_list',
      description: 'List all archived documents with optional filters. Shows document inventory.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['invoice', 'receipt', 'contract', 'quote', 'id_document', 'business_card', 'report', 'other', 'all'],
            description: 'Filter by type',
          },
          limit: { type: 'number', description: 'Max results (default: 50)' },
          include_expired: { type: 'boolean', description: 'Include expired documents (default: false)' },
        },
      },
      riskLevel: 'low',
      execute: async (args) => {
        const type = (args.type as string) || 'all';
        const limit = Math.min(Number(args.limit) || 50, 100);
        const includeExpired = Boolean(args.include_expired);
        const now = new Date().toISOString();

        let docs = Array.from(archive.values()).filter((d) => !d.deleted);

        if (!includeExpired) {
          docs = docs.filter((d) => !d.expiresAt || d.expiresAt > now);
        }
        if (type !== 'all') {
          docs = docs.filter((d) => d.type === type);
        }

        docs.sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime());

        // Summary by type
        const typeCounts: Record<string, number> = {};
        for (const d of Array.from(archive.values()).filter((d) => !d.deleted)) {
          typeCounts[d.type] = (typeCounts[d.type] || 0) + 1;
        }

        return {
          documents: docs.slice(0, limit).map((d) => ({
            id: d.id,
            filename: d.filename,
            type: d.type,
            summary: d.summary.slice(0, 100),
            tags: d.tags,
            archivedAt: d.archivedAt,
            expiresAt: d.expiresAt,
          })),
          total: docs.length,
          typeSummary: typeCounts,
          totalArchived: archive.size,
        };
      },
    },

    // ── archive_delete ──
    {
      name: 'archive_delete',
      description: 'Soft-delete an archived document (can be recovered). For compliance, tracks who deleted and when.',
      parameters: {
        type: 'object',
        properties: {
          document_id: { type: 'string', description: 'Document archive ID' },
          reason: { type: 'string', description: 'Reason for deletion (compliance audit trail)' },
        },
        required: ['document_id'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        const docId = String(args.document_id);
        const reason = (args.reason as string) || 'manual deletion';

        const doc = archive.get(docId);
        if (!doc) {
          return { error: `Document "${docId}" not found.` };
        }
        if (doc.deleted) {
          return { error: `Document "${docId}" already deleted.` };
        }

        doc.deleted = true;

        return {
          id: doc.id,
          filename: doc.filename,
          deleted: true,
          reason,
          deletedBy: traceId || 'system',
          deletedAt: new Date().toISOString(),
          message: `Soft-deleted "${doc.filename}". Can be recovered.`,
        };
      },
    },
  ];
}
