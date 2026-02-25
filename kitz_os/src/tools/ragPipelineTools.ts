/**
 * RAG Pipeline Tools — Intelligence Document Search & Retrieval
 *
 * Indexes all /docs/intelligence/*.md files into an in-memory searchable store.
 * Agents query this to get relevant business intelligence context before responding.
 *
 * 3 tools:
 *   - rag_search     (low) — Search intelligence docs by keyword/topic
 *   - rag_index      (low) — Re-index all intelligence docs from disk
 *   - rag_listDocs   (low) — List all indexed intelligence documents
 *
 * Design:
 *   - Chunk-based: each doc is split into sections (## headers)
 *   - TF-IDF-lite: simple keyword frequency scoring (no vector DB needed)
 *   - Auto-indexes on first search if not already indexed
 *   - Re-index on demand when new docs are added
 */

import { readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';
import type { ToolSchema } from './registry.js';

// ── Types ──

interface DocChunk {
  docName: string;       // e.g. "PANAMA_INFRASTRUCTURE"
  fileName: string;      // e.g. "PANAMA_INFRASTRUCTURE.md"
  section: string;       // Section header text
  content: string;       // Section content
  keywords: string[];    // Extracted keywords for matching
  lineStart: number;     // Line number in original file
}

interface SearchResult {
  docName: string;
  section: string;
  content: string;
  score: number;
  fileName: string;
}

// ── In-Memory Index ──

const chunks: DocChunk[] = [];
let indexed = false;
let lastIndexTime = '';

// Intelligence docs directory (relative to project root)
const INTEL_DIR = join(process.cwd(), 'docs', 'intelligence');

// ── Indexing ──

/** Extract keywords from text — lowercase, deduplicated, stop words removed */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare',
    'this', 'that', 'these', 'those', 'it', 'its', 'not', 'no', 'nor',
    'as', 'if', 'then', 'than', 'too', 'very', 'just', 'about', 'above',
    'after', 'again', 'all', 'also', 'am', 'any', 'because', 'before',
    'between', 'both', 'each', 'few', 'get', 'got', 'here', 'how',
    'into', 'more', 'most', 'must', 'my', 'new', 'now', 'only', 'other',
    'our', 'out', 'over', 'own', 'same', 'so', 'some', 'such', 'up',
    'us', 'use', 'used', 'using', 'what', 'when', 'where', 'which',
    'while', 'who', 'whom', 'why', 'you', 'your',
    // Spanish stop words
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'del', 'al',
    'es', 'son', 'era', 'fue', 'ser', 'estar', 'hay', 'por', 'para',
    'con', 'sin', 'sobre', 'entre', 'pero', 'más', 'menos', 'como',
    'que', 'se', 'su', 'sus', 'le', 'les', 'lo', 'ya', 'si', 'no',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-záéíóúñü0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i); // deduplicate
}

/** Split markdown into section chunks based on ## headers */
function chunkDocument(fileName: string, content: string): DocChunk[] {
  const docName = basename(fileName, '.md');
  const lines = content.split('\n');
  const result: DocChunk[] = [];

  let currentSection = 'Introduction';
  let currentContent: string[] = [];
  let sectionStart = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // New section on ## or # headers
    if (/^#{1,3}\s+/.test(line)) {
      // Save previous section if it has content
      if (currentContent.length > 0) {
        const text = currentContent.join('\n').trim();
        if (text.length > 20) { // Skip trivially short sections
          result.push({
            docName,
            fileName,
            section: currentSection,
            content: text,
            keywords: extractKeywords(text),
            lineStart: sectionStart,
          });
        }
      }
      currentSection = line.replace(/^#+\s+/, '').trim();
      currentContent = [];
      sectionStart = i + 1;
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentContent.length > 0) {
    const text = currentContent.join('\n').trim();
    if (text.length > 20) {
      result.push({
        docName,
        fileName,
        section: currentSection,
        content: text,
        keywords: extractKeywords(text),
        lineStart: sectionStart,
      });
    }
  }

  return result;
}

/** Index all intelligence docs from disk */
async function indexAllDocs(): Promise<{ docCount: number; chunkCount: number }> {
  chunks.length = 0; // Clear existing

  let files: string[];
  try {
    files = (await readdir(INTEL_DIR)).filter(f => f.endsWith('.md'));
  } catch {
    return { docCount: 0, chunkCount: 0 };
  }

  for (const file of files) {
    try {
      const content = await readFile(join(INTEL_DIR, file), 'utf-8');
      const docChunks = chunkDocument(file, content);
      chunks.push(...docChunks);
    } catch {
      // Skip unreadable files
    }
  }

  indexed = true;
  lastIndexTime = new Date().toISOString();
  return { docCount: files.length, chunkCount: chunks.length };
}

/** Search chunks by query — TF-IDF-lite scoring */
function searchChunks(query: string, maxResults = 5, docFilter?: string): SearchResult[] {
  const queryKeywords = extractKeywords(query);
  if (queryKeywords.length === 0) return [];

  const scored: SearchResult[] = [];

  for (const chunk of chunks) {
    // Apply doc filter if specified
    if (docFilter && !chunk.docName.toLowerCase().includes(docFilter.toLowerCase())) {
      continue;
    }

    // Score: count keyword matches weighted by keyword rarity
    let score = 0;
    for (const qk of queryKeywords) {
      // Exact keyword match
      if (chunk.keywords.includes(qk)) {
        score += 2;
      }
      // Partial match (substring)
      if (chunk.keywords.some(ck => ck.includes(qk) || qk.includes(ck))) {
        score += 1;
      }
      // Content contains query keyword
      if (chunk.content.toLowerCase().includes(qk)) {
        score += 0.5;
      }
    }

    // Boost for section header containing query terms
    const sectionLower = chunk.section.toLowerCase();
    for (const qk of queryKeywords) {
      if (sectionLower.includes(qk)) {
        score += 3;
      }
    }

    if (score > 0) {
      scored.push({
        docName: chunk.docName,
        section: chunk.section,
        content: chunk.content.slice(0, 2000), // Limit content size
        score,
        fileName: chunk.fileName,
      });
    }
  }

  // Sort by score descending, take top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults);
}

// ── Exported Helpers ──

/** Get intelligence context for a query — used by semantic router */
export async function getIntelligenceContext(query: string, maxResults = 3): Promise<string> {
  if (!indexed) await indexAllDocs();
  const results = searchChunks(query, maxResults);
  if (results.length === 0) return '';
  return results
    .map(r => `[${r.docName} > ${r.section}]\n${r.content.slice(0, 800)}`)
    .join('\n\n---\n\n');
}

// ── Tools ──

export function getAllRagPipelineTools(): ToolSchema[] {
  return [
    {
      name: 'rag_search',
      description:
        'Search the Kitz intelligence library for relevant business knowledge. ' +
        'Covers: country infrastructure (tax, payments, compliance), pricing strategies, ' +
        'employment law, digital marketing, supply chain, financial literacy, AI SEO, ' +
        'paid ads automation, content loops, cross-border e-commerce, YC/startup frameworks, ' +
        'video creation, and more. Returns the most relevant sections.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query — topic, question, or keywords' },
          max_results: { type: 'number', description: 'Max results to return (default: 5)' },
          doc_filter: { type: 'string', description: 'Filter by document name (e.g. "PANAMA", "PRICING")' },
        },
        required: ['query'],
      },
      riskLevel: 'low',
      execute: async (args) => {
        if (!indexed) await indexAllDocs();
        const query = String(args.query);
        const maxResults = (args.max_results as number) || 5;
        const docFilter = args.doc_filter as string | undefined;
        const results = searchChunks(query, maxResults, docFilter);
        if (results.length === 0) {
          return { results: [], message: `No intelligence found for "${query}". Try broader keywords.` };
        }
        return {
          results: results.map(r => ({
            document: r.docName,
            section: r.section,
            relevance: Math.round(r.score * 10) / 10,
            content: r.content,
          })),
          totalChunksSearched: chunks.length,
          query,
        };
      },
    },
    {
      name: 'rag_index',
      description:
        'Re-index all intelligence documents from disk. Use after adding new docs to /docs/intelligence/.',
      parameters: { type: 'object', properties: {} },
      riskLevel: 'low',
      execute: async () => {
        const result = await indexAllDocs();
        return {
          ...result,
          lastIndexTime,
          message: `Indexed ${result.docCount} documents into ${result.chunkCount} searchable chunks.`,
        };
      },
    },
    {
      name: 'rag_listDocs',
      description: 'List all indexed intelligence documents with chunk counts.',
      parameters: { type: 'object', properties: {} },
      riskLevel: 'low',
      execute: async () => {
        if (!indexed) await indexAllDocs();
        const docMap = new Map<string, number>();
        for (const chunk of chunks) {
          docMap.set(chunk.docName, (docMap.get(chunk.docName) || 0) + 1);
        }
        const docs = Array.from(docMap.entries())
          .map(([name, chunkCount]) => ({ name, chunkCount }))
          .sort((a, b) => a.name.localeCompare(b.name));
        return {
          documents: docs,
          totalDocs: docs.length,
          totalChunks: chunks.length,
          lastIndexTime: lastIndexTime || 'never',
        };
      },
    },
  ];
}
