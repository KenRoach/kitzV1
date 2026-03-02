/**
 * Embedding Client — OpenAI text-embedding-3-small for semantic memory.
 *
 * Generates vector embeddings for conversation summaries and knowledge entries.
 * Used by memory manager for semantic search (cosine similarity).
 *
 * Falls back gracefully when API key is missing — returns null (keyword search only).
 */

import { createSubsystemLogger } from 'kitz-schemas';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { writeFile, appendFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const log = createSubsystemLogger('embeddings');

const __dirname = dirname(fileURLToPath(import.meta.url));

const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_EMBEDDING_URL = 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

// ── Persistent vector store (JSONL) ──

const DATA_DIR = join(__dirname, '..', '..', 'data', 'memory');
const VECTORS_FILE = join(DATA_DIR, 'vectors.jsonl');

export interface StoredVector {
  id: string;
  text: string;
  embedding: number[];
  category: 'conversation' | 'knowledge';
  userId?: string;
  createdAt: number;
}

let vectors: StoredVector[] = [];
let vectorsLoaded = false;

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadVectors(): void {
  if (vectorsLoaded) return;
  ensureDir();

  if (existsSync(VECTORS_FILE)) {
    try {
      const lines = readFileSync(VECTORS_FILE, 'utf-8').trim().split('\n').filter(Boolean);
      vectors = lines.map(line => JSON.parse(line) as StoredVector);
    } catch {
      vectors = [];
    }
  }

  vectorsLoaded = true;
  log.info(`Loaded ${vectors.length} stored vectors`);
}

function appendVector(v: StoredVector): void {
  ensureDir();
  appendFile(VECTORS_FILE, JSON.stringify(v) + '\n').catch(err => {
    log.warn('appendVector failed', { detail: (err as Error).message });
  });
}

// ── OpenAI Embedding API ──

/**
 * Generate an embedding vector for a text string.
 * Returns null if API key is missing or call fails.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!OPENAI_API_KEY) {
    return null;
  }

  // Truncate long text (embedding model has 8192 token limit)
  const truncated = text.slice(0, 8000);

  try {
    const res = await fetch(OPENAI_EMBEDDING_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: truncated,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      log.warn('embedding_api_error', { status: res.status });
      return null;
    }

    const data = await res.json() as {
      data?: Array<{ embedding: number[] }>;
    };

    return data.data?.[0]?.embedding ?? null;
  } catch (err) {
    log.warn('embedding_fetch_failed', { error: (err as Error).message });
    return null;
  }
}

// ── Cosine Similarity ──

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// ── Semantic Search ──

/**
 * Search stored vectors by semantic similarity.
 * Returns top-k most similar entries.
 */
export async function semanticSearch(
  query: string,
  options?: {
    category?: 'conversation' | 'knowledge';
    userId?: string;
    limit?: number;
    minSimilarity?: number;
  },
): Promise<Array<{ text: string; similarity: number; category: string; userId?: string }>> {
  loadVectors();

  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding) {
    return []; // Embedding unavailable — caller should fall back to keyword search
  }

  const limit = options?.limit ?? 5;
  const minSimilarity = options?.minSimilarity ?? 0.3;

  let candidates = vectors;
  if (options?.category) {
    candidates = candidates.filter(v => v.category === options.category);
  }
  if (options?.userId) {
    candidates = candidates.filter(v => v.userId === options.userId);
  }

  const scored = candidates
    .map(v => ({
      text: v.text,
      similarity: cosineSimilarity(queryEmbedding, v.embedding),
      category: v.category,
      userId: v.userId,
    }))
    .filter(r => r.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return scored;
}

/**
 * Store a text with its embedding for future semantic search.
 */
export async function storeEmbedding(
  id: string,
  text: string,
  category: 'conversation' | 'knowledge',
  userId?: string,
): Promise<boolean> {
  const embedding = await generateEmbedding(text);
  if (!embedding) return false;

  loadVectors();

  const entry: StoredVector = {
    id,
    text: text.slice(0, 2000), // Store truncated text for retrieval
    embedding,
    category,
    userId,
    createdAt: Date.now(),
  };

  vectors.push(entry);
  appendVector(entry);
  return true;
}

/**
 * Get the count of stored vectors.
 */
export function getVectorCount(): number {
  loadVectors();
  return vectors.length;
}

export { EMBEDDING_DIMENSIONS };
