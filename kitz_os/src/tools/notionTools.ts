/**
 * Notion Tools — Search, read, create, update pages and databases via Notion API.
 *
 * Tools:
 *   1. notion_search           — Search across all pages and databases
 *   2. notion_get_page         — Get a page and its content
 *   3. notion_create_page      — Create a new page in a database or as child of a page
 *   4. notion_update_page      — Update page properties
 *   5. notion_query_database   — Query a Notion database with filters
 *   6. notion_append_blocks    — Append content blocks to a page
 *   7. notion_list_databases   — List all databases shared with the integration
 *
 * Requires: NOTION_API_KEY (internal integration token)
 */
import { createSubsystemLogger } from 'kitz-schemas';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('notionTools');

const API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function getToken(): string {
  return process.env.NOTION_API_KEY || '';
}

function notionHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken()}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

function isConfigured(): boolean {
  return !!getToken();
}

// ── Notion Block Helpers ──

interface NotionRichText {
  type: 'text';
  text: { content: string; link?: { url: string } | null };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
}

interface NotionBlock {
  object: 'block';
  type: string;
  [key: string]: unknown;
}

function richText(content: string): NotionRichText[] {
  return [{ type: 'text', text: { content } }];
}

/**
 * Convert simple markdown lines into Notion block objects.
 * Supports: headings (#, ##, ###), bulleted lists (- or *), to-do (- [ ] / - [x]), paragraphs.
 */
function markdownToBlocks(markdown: string): NotionBlock[] {
  const lines = markdown.split('\n');
  const blocks: NotionBlock[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Heading 1
    if (trimmed.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: { rich_text: richText(trimmed.slice(2).trim()) },
      });
    }
    // Heading 2
    else if (trimmed.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: richText(trimmed.slice(3).trim()) },
      });
    }
    // Heading 3
    else if (trimmed.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: richText(trimmed.slice(4).trim()) },
      });
    }
    // To-do (checked)
    else if (/^[-*]\s*\[x\]\s+/i.test(trimmed)) {
      const text = trimmed.replace(/^[-*]\s*\[x\]\s+/i, '');
      blocks.push({
        object: 'block',
        type: 'to_do',
        to_do: { rich_text: richText(text), checked: true },
      });
    }
    // To-do (unchecked)
    else if (/^[-*]\s*\[ ?\]\s+/.test(trimmed)) {
      const text = trimmed.replace(/^[-*]\s*\[ ?\]\s+/, '');
      blocks.push({
        object: 'block',
        type: 'to_do',
        to_do: { rich_text: richText(text), checked: false },
      });
    }
    // Bulleted list
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: richText(trimmed.slice(2).trim()) },
      });
    }
    // Paragraph (default)
    else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: richText(trimmed) },
      });
    }
  }

  return blocks;
}

/**
 * Extract a plain-text title from a Notion page/database object.
 */
function extractTitle(obj: Record<string, unknown>): string {
  // Database title
  const titleArr = obj.title as Array<{ plain_text?: string }> | undefined;
  if (Array.isArray(titleArr) && titleArr.length > 0) {
    return titleArr.map((t) => t.plain_text || '').join('');
  }

  // Page properties — find the title property
  const props = obj.properties as Record<string, { type?: string; title?: Array<{ plain_text?: string }> }> | undefined;
  if (props) {
    for (const prop of Object.values(props)) {
      if (prop.type === 'title' && Array.isArray(prop.title)) {
        return prop.title.map((t) => t.plain_text || '').join('');
      }
    }
  }

  return '(untitled)';
}

/**
 * Extract plain text from Notion block children response.
 */
function blocksToText(blocks: Array<Record<string, unknown>>): string {
  const lines: string[] = [];
  for (const block of blocks) {
    const type = block.type as string;
    const content = block[type] as { rich_text?: Array<{ plain_text?: string }>; checked?: boolean } | undefined;
    if (!content?.rich_text) continue;
    const text = content.rich_text.map((t) => t.plain_text || '').join('');
    if (type === 'heading_1') lines.push(`# ${text}`);
    else if (type === 'heading_2') lines.push(`## ${text}`);
    else if (type === 'heading_3') lines.push(`### ${text}`);
    else if (type === 'bulleted_list_item') lines.push(`- ${text}`);
    else if (type === 'to_do') lines.push(`- [${content.checked ? 'x' : ' '}] ${text}`);
    else lines.push(text);
  }
  return lines.join('\n');
}

export function getAllNotionTools(): ToolSchema[] {
  return [
    // ── 1. Search ──
    {
      name: 'notion_search',
      description:
        'Search across all Notion pages and databases shared with the integration. Returns matching results with titles and URLs.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query text' },
          filter: {
            type: 'string',
            enum: ['page', 'database'],
            description: 'Filter results by object type: "page" or "database" (optional)',
          },
          sort: {
            type: 'string',
            enum: ['last_edited_time'],
            description: 'Sort by last_edited_time descending (optional)',
          },
        },
        required: ['query'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        if (!isConfigured()) {
          return { error: 'Notion not configured. Set NOTION_API_KEY in env.' };
        }

        try {
          const body: Record<string, unknown> = {
            query: String(args.query),
            page_size: 20,
          };

          if (args.filter) {
            body.filter = { value: String(args.filter), property: 'object' };
          }

          if (args.sort) {
            body.sort = { direction: 'descending', timestamp: 'last_edited_time' };
          }

          const res = await fetch(`${API_BASE}/search`, {
            method: 'POST',
            headers: notionHeaders(),
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Notion search failed (${res.status}): ${errText.slice(0, 300)}` };
          }

          const data = (await res.json()) as { results: Array<Record<string, unknown>> };
          const results = data.results.map((item) => ({
            id: item.id,
            title: extractTitle(item),
            type: item.object,
            url: item.url || null,
            lastEdited: (item as Record<string, unknown>).last_edited_time || null,
          }));

          log.info('notion_searched', { query: args.query, count: results.length, trace_id: traceId });
          return { results };
        } catch (err) {
          return { error: `Notion search failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 2. Get Page ──
    {
      name: 'notion_get_page',
      description:
        'Get a Notion page with its properties and text content. Provide the page ID.',
      parameters: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Notion page ID (UUID format, with or without dashes)' },
        },
        required: ['pageId'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        if (!isConfigured()) {
          return { error: 'Notion not configured. Set NOTION_API_KEY in env.' };
        }

        const pageId = String(args.pageId).trim();
        if (!pageId) return { error: 'pageId is required' };

        try {
          // Fetch page metadata
          const pageRes = await fetch(`${API_BASE}/pages/${pageId}`, {
            headers: notionHeaders(),
            signal: AbortSignal.timeout(15_000),
          });

          if (!pageRes.ok) {
            const errText = await pageRes.text().catch(() => 'unknown');
            return { error: `Notion get page failed (${pageRes.status}): ${errText.slice(0, 300)}` };
          }

          const page = (await pageRes.json()) as Record<string, unknown>;

          // Fetch block children (content)
          const blocksRes = await fetch(`${API_BASE}/blocks/${pageId}/children?page_size=100`, {
            headers: notionHeaders(),
            signal: AbortSignal.timeout(15_000),
          });

          let content = '';
          if (blocksRes.ok) {
            const blocksData = (await blocksRes.json()) as { results: Array<Record<string, unknown>> };
            content = blocksToText(blocksData.results);
          }

          log.info('notion_page_fetched', { pageId, trace_id: traceId });
          return {
            id: page.id,
            title: extractTitle(page),
            properties: page.properties,
            content,
            url: page.url || null,
          };
        } catch (err) {
          return { error: `Notion get page failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 3. Create Page ──
    {
      name: 'notion_create_page',
      description:
        'Create a new Notion page in a database or as a child of another page. Supports markdown content.',
      parameters: {
        type: 'object',
        properties: {
          parentId: { type: 'string', description: 'Parent database ID or page ID' },
          parentType: {
            type: 'string',
            enum: ['database', 'page'],
            description: 'Type of parent: "database" or "page"',
          },
          title: { type: 'string', description: 'Page title' },
          properties: {
            type: 'object',
            description: 'Additional page properties (for database parents). Object of property name -> value.',
          },
          content: {
            type: 'string',
            description: 'Page body content as markdown. Supports headings, lists, to-dos, paragraphs.',
          },
        },
        required: ['parentId', 'parentType', 'title'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        if (!isConfigured()) {
          return { error: 'Notion not configured. Set NOTION_API_KEY in env.' };
        }

        const parentId = String(args.parentId).trim();
        const parentType = String(args.parentType);
        const title = String(args.title || '');
        if (!parentId || !title) return { error: 'parentId and title are required' };

        try {
          const body: Record<string, unknown> = {};

          // Set parent
          if (parentType === 'database') {
            body.parent = { database_id: parentId };
            // For database parents, title goes in properties
            const extraProps = (args.properties || {}) as Record<string, unknown>;
            body.properties = {
              ...extraProps,
              Name: { title: richText(title) },
            };
            // Check if there's a different title property name — "Name" is the Notion default
          } else {
            body.parent = { page_id: parentId };
            body.properties = {
              title: { title: richText(title) },
            };
          }

          // Convert markdown content to blocks
          if (args.content) {
            body.children = markdownToBlocks(String(args.content));
          }

          const res = await fetch(`${API_BASE}/pages`, {
            method: 'POST',
            headers: notionHeaders(),
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Notion create page failed (${res.status}): ${errText.slice(0, 300)}` };
          }

          const created = (await res.json()) as { id: string; url: string };
          log.info('notion_page_created', { id: created.id, parentType, trace_id: traceId });
          return { id: created.id, url: created.url };
        } catch (err) {
          return { error: `Notion create page failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 4. Update Page ──
    {
      name: 'notion_update_page',
      description:
        'Update properties on a Notion page. Provide the page ID and a properties object with the updates.',
      parameters: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Notion page ID to update' },
          properties: {
            type: 'object',
            description: 'Object of property updates. Keys are property names, values are Notion property value objects.',
          },
        },
        required: ['pageId', 'properties'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        if (!isConfigured()) {
          return { error: 'Notion not configured. Set NOTION_API_KEY in env.' };
        }

        const pageId = String(args.pageId).trim();
        const properties = args.properties as Record<string, unknown>;
        if (!pageId) return { error: 'pageId is required' };
        if (!properties || typeof properties !== 'object') return { error: 'properties object is required' };

        try {
          const res = await fetch(`${API_BASE}/pages/${pageId}`, {
            method: 'PATCH',
            headers: notionHeaders(),
            body: JSON.stringify({ properties }),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Notion update page failed (${res.status}): ${errText.slice(0, 300)}` };
          }

          const updated = (await res.json()) as { id: string; url: string; last_edited_time: string };
          log.info('notion_page_updated', { pageId, trace_id: traceId });
          return { id: updated.id, url: updated.url, updated: updated.last_edited_time };
        } catch (err) {
          return { error: `Notion update page failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 5. Query Database ──
    {
      name: 'notion_query_database',
      description:
        'Query a Notion database with optional filters and sorts. Returns matching page entries with their properties.',
      parameters: {
        type: 'object',
        properties: {
          databaseId: { type: 'string', description: 'Notion database ID to query' },
          filter: {
            type: 'object',
            description: 'Notion filter object (see Notion API docs). Example: { "property": "Status", "select": { "equals": "Done" } }',
          },
          sorts: {
            type: 'array',
            description: 'Array of sort objects. Example: [{ "property": "Created", "direction": "descending" }]',
          },
          pageSize: { type: 'number', description: 'Number of results to return (default: 100, max: 100)' },
        },
        required: ['databaseId'],
      },
      riskLevel: 'low',
      execute: async (args, traceId) => {
        if (!isConfigured()) {
          return { error: 'Notion not configured. Set NOTION_API_KEY in env.' };
        }

        const databaseId = String(args.databaseId).trim();
        if (!databaseId) return { error: 'databaseId is required' };

        try {
          const body: Record<string, unknown> = {
            page_size: Math.min(Number(args.pageSize) || 100, 100),
          };

          if (args.filter) body.filter = args.filter;
          if (args.sorts) body.sorts = args.sorts;

          const res = await fetch(`${API_BASE}/databases/${databaseId}/query`, {
            method: 'POST',
            headers: notionHeaders(),
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Notion query database failed (${res.status}): ${errText.slice(0, 300)}` };
          }

          const data = (await res.json()) as {
            results: Array<Record<string, unknown>>;
            has_more: boolean;
            next_cursor: string | null;
          };

          const results = data.results.map((item) => ({
            id: item.id,
            properties: item.properties,
          }));

          log.info('notion_database_queried', { databaseId, count: results.length, trace_id: traceId });
          return { results, hasMore: data.has_more };
        } catch (err) {
          return { error: `Notion query database failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 6. Append Blocks ──
    {
      name: 'notion_append_blocks',
      description:
        'Append content blocks to a Notion page. Provide markdown text which will be converted to Notion blocks (paragraphs, headings, lists, to-dos).',
      parameters: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Notion page ID to append content to' },
          content: {
            type: 'string',
            description: 'Markdown text to append. Supports headings (#, ##, ###), bullet lists (- or *), to-dos (- [ ] / - [x]), and paragraphs.',
          },
        },
        required: ['pageId', 'content'],
      },
      riskLevel: 'medium',
      execute: async (args, traceId) => {
        if (!isConfigured()) {
          return { error: 'Notion not configured. Set NOTION_API_KEY in env.' };
        }

        const pageId = String(args.pageId).trim();
        const content = String(args.content || '');
        if (!pageId) return { error: 'pageId is required' };
        if (!content) return { error: 'content is required' };

        try {
          const children = markdownToBlocks(content);

          const res = await fetch(`${API_BASE}/blocks/${pageId}/children`, {
            method: 'PATCH',
            headers: notionHeaders(),
            body: JSON.stringify({ children }),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Notion append blocks failed (${res.status}): ${errText.slice(0, 300)}` };
          }

          const data = (await res.json()) as { results: Array<Record<string, unknown>> };
          log.info('notion_blocks_appended', { pageId, blockCount: data.results.length, trace_id: traceId });
          return { results: data.results.map((b) => ({ id: b.id, type: b.type })) };
        } catch (err) {
          return { error: `Notion append blocks failed: ${(err as Error).message}` };
        }
      },
    },

    // ── 7. List Databases ──
    {
      name: 'notion_list_databases',
      description:
        'List all Notion databases shared with the integration. Returns database IDs, titles, and URLs.',
      parameters: {
        type: 'object',
        properties: {},
      },
      riskLevel: 'low',
      execute: async (_args, traceId) => {
        if (!isConfigured()) {
          return { error: 'Notion not configured. Set NOTION_API_KEY in env.' };
        }

        try {
          const body = {
            filter: { value: 'database', property: 'object' },
            page_size: 100,
          };

          const res = await fetch(`${API_BASE}/search`, {
            method: 'POST',
            headers: notionHeaders(),
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: `Notion list databases failed (${res.status}): ${errText.slice(0, 300)}` };
          }

          const data = (await res.json()) as { results: Array<Record<string, unknown>> };
          const databases = data.results.map((db) => ({
            id: db.id,
            title: extractTitle(db),
            url: db.url || null,
          }));

          log.info('notion_databases_listed', { count: databases.length, trace_id: traceId });
          return { databases };
        } catch (err) {
          return { error: `Notion list databases failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
