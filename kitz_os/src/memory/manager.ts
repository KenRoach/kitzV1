/**
 * Memory Manager — Conversation history + knowledge base for Kitz OS.
 *
 * Ported from OpenClaw memory/manager.ts pattern.
 * Provides:
 *   - Store/retrieve conversation messages per user session
 *   - Full-text search across conversation history
 *   - Knowledge base (brand DNA, playbooks, templates)
 *   - Context window building for AI prompts
 *
 * Uses better-sqlite3 for sync performance (or falls back to JSON files).
 */

import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { writeFile, appendFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──

const DATA_DIR = join(__dirname, '..', '..', 'data', 'memory');
const CONVERSATIONS_FILE = join(DATA_DIR, 'conversations.jsonl');
const KNOWLEDGE_FILE = join(DATA_DIR, 'knowledge.json');
const MAX_CONTEXT_MESSAGES = 20;       // Max messages to include in context window
const MAX_SEARCH_RESULTS = 10;
const CONVERSATION_TTL_DAYS = 30;      // Prune conversations older than 30 days

// ── Types ──

export interface ConversationMessage {
  id: string;
  userId: string;
  senderJid: string;
  channel: 'whatsapp' | 'email';
  role: 'user' | 'assistant' | 'system';
  content: string;
  traceId?: string;
  createdAt: number;  // unix timestamp ms
}

export interface KnowledgeEntry {
  id: string;
  source: string;
  category: string;
  title?: string;
  content: string;
  hash: string;
  updatedAt: number;
}

export interface SearchResult {
  content: string;
  source: 'conversation' | 'knowledge';
  score: number;
  meta: Record<string, unknown>;
}

export interface ContextWindow {
  messages: ConversationMessage[];
  relevantKnowledge: string[];
}

// ── In-memory indexes ──

let conversations: ConversationMessage[] = [];
let knowledge: KnowledgeEntry[] = [];
let initialized = false;

// ── Initialization ──

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Initialize the memory manager — loads persisted data into memory.
 */
export function initMemory(): void {
  if (initialized) return;
  ensureDataDir();

  // Load conversations from JSONL
  if (existsSync(CONVERSATIONS_FILE)) {
    try {
      const lines = readFileSync(CONVERSATIONS_FILE, 'utf-8').trim().split('\n').filter(Boolean);
      conversations = lines.map(line => JSON.parse(line) as ConversationMessage);
    } catch {
      conversations = [];
    }
  }

  // Load knowledge base
  if (existsSync(KNOWLEDGE_FILE)) {
    try {
      knowledge = JSON.parse(readFileSync(KNOWLEDGE_FILE, 'utf-8')) as KnowledgeEntry[];
    } catch {
      knowledge = [];
    }
  }

  // Prune old conversations
  const cutoff = Date.now() - CONVERSATION_TTL_DAYS * 24 * 60 * 60 * 1000;
  const before = conversations.length;
  conversations = conversations.filter(m => m.createdAt > cutoff);
  if (before !== conversations.length) {
    persistConversations();
    console.log(`[memory] Pruned ${before - conversations.length} old messages`);
  }

  initialized = true;
  console.log(`[memory] Initialized: ${conversations.length} messages, ${knowledge.length} knowledge entries`);
}

// ── Persistence ──

function persistConversations(): void {
  ensureDataDir();
  const lines = conversations.map(m => JSON.stringify(m)).join('\n');
  writeFile(CONVERSATIONS_FILE, lines + '\n').catch(err => {
    console.warn('[memory] persistConversations failed:', (err as Error).message);
  });
}

function persistKnowledge(): void {
  ensureDataDir();
  writeFile(KNOWLEDGE_FILE, JSON.stringify(knowledge, null, 2)).catch(err => {
    console.warn('[memory] persistKnowledge failed:', (err as Error).message);
  });
}

function appendConversation(msg: ConversationMessage): void {
  ensureDataDir();
  const line = JSON.stringify(msg) + '\n';
  appendFile(CONVERSATIONS_FILE, line).catch(err => {
    console.warn('[memory] appendConversation failed:', (err as Error).message);
  });
}

// ── Conversation API ──

/**
 * Store a conversation message.
 */
export function storeMessage(msg: Omit<ConversationMessage, 'id' | 'createdAt'>): ConversationMessage {
  initMemory();
  const full: ConversationMessage = {
    ...msg,
    id: randomUUID(),
    createdAt: Date.now(),
  };
  conversations.push(full);
  appendConversation(full);
  return full;
}

/**
 * Get recent conversation history for a specific user+sender pair.
 */
export function getConversationHistory(
  userId: string,
  senderJid: string,
  limit = MAX_CONTEXT_MESSAGES,
): ConversationMessage[] {
  initMemory();
  return conversations
    .filter(m => m.userId === userId && m.senderJid === senderJid)
    .slice(-limit);
}

/**
 * Build a context window for AI — recent messages + relevant knowledge.
 */
export function buildContextWindow(
  userId: string,
  senderJid: string,
  currentMessage?: string,
): ContextWindow {
  initMemory();
  const messages = getConversationHistory(userId, senderJid);

  // Find relevant knowledge based on current message
  let relevantKnowledge: string[] = [];
  if (currentMessage) {
    const results = searchKnowledge(currentMessage, 3);
    relevantKnowledge = results.map(r => r.content);
  }

  return { messages, relevantKnowledge };
}

// ── Knowledge API ──

/**
 * Add or update a knowledge entry.
 */
export function upsertKnowledge(entry: Omit<KnowledgeEntry, 'id' | 'hash' | 'updatedAt'>): KnowledgeEntry {
  initMemory();
  const hash = createHash('sha256').update(entry.content).digest('hex').slice(0, 16);

  // Check if content already exists (by hash)
  const existing = knowledge.find(k => k.source === entry.source && k.category === entry.category);
  if (existing) {
    if (existing.hash === hash) return existing; // No change
    existing.content = entry.content;
    existing.title = entry.title;
    existing.hash = hash;
    existing.updatedAt = Date.now();
    persistKnowledge();
    return existing;
  }

  const full: KnowledgeEntry = {
    ...entry,
    id: randomUUID(),
    hash,
    updatedAt: Date.now(),
  };
  knowledge.push(full);
  persistKnowledge();
  return full;
}

/**
 * Get all knowledge entries, optionally filtered by category.
 */
export function getKnowledge(category?: string): KnowledgeEntry[] {
  initMemory();
  if (category) return knowledge.filter(k => k.category === category);
  return [...knowledge];
}

// ── Search ──

/**
 * Search conversations by keyword (basic substring + word boundary matching).
 */
export function searchConversations(
  query: string,
  userId?: string,
  limit = MAX_SEARCH_RESULTS,
): SearchResult[] {
  initMemory();
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (terms.length === 0) return [];

  const scored = conversations
    .filter(m => !userId || m.userId === userId)
    .map(m => {
      const text = m.content.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (text.includes(term)) score += 1;
        // Bonus for exact word match (escape regex chars to prevent ReDoS)
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp(`\\b${escaped}\\b`).test(text)) score += 0.5;
      }
      return { msg: m, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(r => ({
    content: r.msg.content,
    source: 'conversation' as const,
    score: r.score,
    meta: {
      userId: r.msg.userId,
      senderJid: r.msg.senderJid,
      role: r.msg.role,
      createdAt: r.msg.createdAt,
    },
  }));
}

/**
 * Search knowledge base by keyword.
 */
export function searchKnowledge(
  query: string,
  limit = MAX_SEARCH_RESULTS,
): SearchResult[] {
  initMemory();
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (terms.length === 0) return [];

  const scored = knowledge.map(k => {
    const text = `${k.title || ''} ${k.content}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (text.includes(term)) score += 1;
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`\\b${escaped}\\b`).test(text)) score += 0.5;
    }
    return { entry: k, score };
  })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(r => ({
    content: r.entry.content,
    source: 'knowledge' as const,
    score: r.score,
    meta: {
      category: r.entry.category,
      title: r.entry.title,
      source: r.entry.source,
    },
  }));
}

/**
 * Hybrid search across both conversations and knowledge.
 */
export function search(
  query: string,
  userId?: string,
  limit = MAX_SEARCH_RESULTS,
): SearchResult[] {
  const convResults = searchConversations(query, userId, limit);
  const knowledgeResults = searchKnowledge(query, limit);

  return [...convResults, ...knowledgeResults]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ── Stats ──

export function getMemoryStats(): {
  totalMessages: number;
  totalKnowledge: number;
  uniqueUsers: number;
  oldestMessageAge: number | null;
} {
  initMemory();
  const users = new Set(conversations.map(m => m.userId));
  const oldest = conversations.length > 0
    ? Date.now() - conversations[0].createdAt
    : null;

  return {
    totalMessages: conversations.length,
    totalKnowledge: knowledge.length,
    uniqueUsers: users.size,
    oldestMessageAge: oldest,
  };
}
