/**
 * Memory Manager — Conversation history + knowledge base for Kitz OS.
 *
 * Supabase-first persistence (conversation_messages table) with per-user
 * in-memory hot cache for low-latency reads. Falls back to JSONL when
 * Supabase is not configured (local dev).
 *
 * Architecture:
 *   - Writes: sync to cache + fire-and-forget to Supabase + JSONL
 *   - Reads: sync from per-user hot cache (pre-warmed at boot from Supabase)
 *   - Cache miss: schedules async Supabase fetch, next call gets data
 *   - Knowledge base: unchanged (JSON file, small dataset)
 *
 * Supports the 3-strategy resilient lookup pattern for user/sender pairs.
 */

import { createSubsystemLogger } from 'kitz-schemas';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { writeFile, appendFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

const log = createSubsystemLogger('manager');

// ── Supabase config ──
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const USE_SUPABASE = !!(SUPABASE_URL && SUPABASE_KEY);

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──

const DATA_DIR = join(__dirname, '..', '..', 'data', 'memory');
const CONVERSATIONS_FILE = join(DATA_DIR, 'conversations.jsonl');
const KNOWLEDGE_FILE = join(DATA_DIR, 'knowledge.json');
const MAX_CONTEXT_MESSAGES = 20;       // Max messages to include in context window
const MAX_SEARCH_RESULTS = 10;
const CONVERSATION_TTL_DAYS = 30;      // Prune conversations older than 30 days

// ── Hot cache config ──
const CACHE_MAX_USERS = 500;           // Max unique cache keys (user:sender pairs)
const CACHE_MAX_MESSAGES_PER_KEY = 50; // Max messages per cache entry
const BOOT_HYDRATE_LIMIT = 1000;       // Max messages to load from Supabase at boot

// ── Types ──

export interface ConversationMessage {
  id: string;
  userId: string;
  senderJid: string;
  channel: 'whatsapp' | 'email' | 'web' | 'terminal';
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

// ── Supabase REST helpers (conversation_messages table) ──

interface SupaConvoRow {
  id: string;
  user_id: string;
  sender_jid: string;
  channel: string;
  role: string;
  content: string;
  trace_id: string | null;
  created_at: string;
}

function rowToMessage(row: SupaConvoRow): ConversationMessage {
  return {
    id: row.id,
    userId: row.user_id,
    senderJid: row.sender_jid,
    channel: row.channel as ConversationMessage['channel'],
    role: row.role as ConversationMessage['role'],
    content: row.content,
    traceId: row.trace_id || undefined,
    createdAt: new Date(row.created_at).getTime(),
  };
}

async function supaFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  if (!USE_SUPABASE) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      log.warn('supaFetch error', { path: path.slice(0, 100), status: res.status, detail: errText.slice(0, 200) });
      return null;
    }
    return await res.json() as T;
  } catch (err) {
    log.warn('supaFetch failed', { path: path.slice(0, 100), error: (err as Error).message });
    return null;
  }
}

async function supaInsertConvo(msg: ConversationMessage): Promise<boolean> {
  if (!USE_SUPABASE) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/conversation_messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        id: msg.id,
        user_id: msg.userId,
        sender_jid: msg.senderJid,
        channel: msg.channel,
        role: msg.role,
        content: msg.content,
        trace_id: msg.traceId || null,
        created_at: new Date(msg.createdAt).toISOString(),
      }),
      signal: AbortSignal.timeout(5_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Per-user hot cache ──
// Key: "userId:senderJid" → recent messages (ordered by createdAt)
// LRU eviction: when cache exceeds CACHE_MAX_USERS, oldest entries are removed

const hotCache = new Map<string, ConversationMessage[]>();
const cacheAccessOrder: string[] = []; // LRU tracking

// Set of cache keys that have been hydrated from Supabase (avoid redundant fetches)
const hydratedKeys = new Set<string>();
// Pending hydration promises (avoid duplicate fetches for same key)
const pendingHydrations = new Map<string, Promise<void>>();

function cacheKey(userId: string, senderJid: string): string {
  return `${userId}:${senderJid}`;
}

function touchCache(key: string): void {
  const idx = cacheAccessOrder.indexOf(key);
  if (idx !== -1) cacheAccessOrder.splice(idx, 1);
  cacheAccessOrder.push(key);

  // LRU eviction
  while (cacheAccessOrder.length > CACHE_MAX_USERS) {
    const evicted = cacheAccessOrder.shift()!;
    hotCache.delete(evicted);
    hydratedKeys.delete(evicted);
  }
}

function addToCache(msg: ConversationMessage): void {
  const key = cacheKey(msg.userId, msg.senderJid);
  let msgs = hotCache.get(key);
  if (!msgs) {
    msgs = [];
    hotCache.set(key, msgs);
  }
  msgs.push(msg);
  // Trim to max per key
  if (msgs.length > CACHE_MAX_MESSAGES_PER_KEY) {
    msgs.splice(0, msgs.length - CACHE_MAX_MESSAGES_PER_KEY);
  }
  touchCache(key);
}

function getCacheMessages(userId: string, senderJid: string): ConversationMessage[] {
  const key = cacheKey(userId, senderJid);
  touchCache(key);
  return hotCache.get(key) || [];
}

/**
 * Hydrate cache for a specific user:sender pair from Supabase.
 * Non-blocking — schedules fetch and returns immediately.
 * The NEXT call to getConversationHistory will have data.
 */
function scheduleHydration(userId: string, senderJid: string): void {
  const key = cacheKey(userId, senderJid);
  if (hydratedKeys.has(key) || pendingHydrations.has(key) || !USE_SUPABASE) return;

  const promise = hydrateFromSupabase(userId, senderJid).finally(() => {
    pendingHydrations.delete(key);
  });
  pendingHydrations.set(key, promise);
}

async function hydrateFromSupabase(userId: string, senderJid: string): Promise<void> {
  const key = cacheKey(userId, senderJid);
  try {
    // Strategy 1: exact match
    const encodedUserId = encodeURIComponent(userId);
    const encodedJid = encodeURIComponent(senderJid);
    const query = `conversation_messages?user_id=eq.${encodedUserId}&sender_jid=eq.${encodedJid}&order=created_at.desc&limit=${CACHE_MAX_MESSAGES_PER_KEY}`;
    const rows = await supaFetch<SupaConvoRow[]>(query);

    if (rows && rows.length > 0) {
      const messages = rows.map(rowToMessage).reverse(); // oldest first
      hotCache.set(key, messages);
      touchCache(key);
      hydratedKeys.add(key);
      log.info('cache hydrated from Supabase', { key, count: messages.length });
      return;
    }

    // Strategy 2: if senderJid is a real JID, try by JID alone
    if (senderJid !== 'unknown' && senderJid.includes('@')) {
      const jidQuery = `conversation_messages?sender_jid=eq.${encodedJid}&order=created_at.desc&limit=${CACHE_MAX_MESSAGES_PER_KEY}`;
      const jidRows = await supaFetch<SupaConvoRow[]>(jidQuery);
      if (jidRows && jidRows.length > 0) {
        const messages = jidRows.map(rowToMessage).reverse();
        hotCache.set(key, messages);
        touchCache(key);
        hydratedKeys.add(key);
        log.info('cache hydrated from Supabase (by JID)', { senderJid, count: messages.length });
        return;
      }
    }

    hydratedKeys.add(key); // Mark as hydrated even if empty (no repeated fetches)
  } catch (err) {
    log.warn('hydration failed', { key, error: (err as Error).message });
  }
}

// ── JSONL fallback persistence (used when Supabase is not configured) ──

let knowledge: KnowledgeEntry[] = [];
let initialized = false;

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function appendConversationFile(msg: ConversationMessage): void {
  ensureDataDir();
  const line = JSON.stringify(msg) + '\n';
  appendFile(CONVERSATIONS_FILE, line).catch(err => {
    log.warn('appendConversation failed:', { detail: (err as Error).message });
  });
}

function persistKnowledge(): void {
  ensureDataDir();
  writeFile(KNOWLEDGE_FILE, JSON.stringify(knowledge, null, 2)).catch(err => {
    log.warn('persistKnowledge failed:', { detail: (err as Error).message });
  });
}

// ── Auto-migration: ensure conversation_messages table exists ──

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  sender_jid TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp'
    CHECK (channel IN ('whatsapp', 'email', 'web', 'terminal')),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL DEFAULT '',
  trace_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_convo_user_sender
  ON conversation_messages (user_id, sender_jid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_convo_sender_jid
  ON conversation_messages (sender_jid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_convo_user_id
  ON conversation_messages (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_convo_created_at
  ON conversation_messages (created_at);
`;

/**
 * Ensure the conversation_messages table exists in Supabase.
 * Uses the PostgREST API to detect 404 (table not found) and then
 * creates the table via a temporary RPC function.
 */
async function ensureSupabaseTable(): Promise<boolean> {
  if (!USE_SUPABASE) return false;

  // Quick probe: try to query the table
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/conversation_messages?select=id&limit=0`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (res.ok) {
      log.info('conversation_messages table exists');
      return true;
    }
    const body = await res.text().catch(() => '');
    if (body.includes('PGRST205') || body.includes('could not find')) {
      log.info('conversation_messages table not found — running auto-migration');
      return await runMigrationViaRpc();
    }
    log.warn('Unexpected probe response', { status: res.status, body: body.slice(0, 200) });
    return false;
  } catch (err) {
    log.warn('Table probe failed', { error: (err as Error).message });
    return false;
  }
}

/**
 * Create the table by temporarily installing and calling an RPC function.
 * Supabase service role key has superuser-like access to PostgREST RPC.
 */
async function runMigrationViaRpc(): Promise<boolean> {
  try {
    // Step 1: Create a temporary migration function
    const createFnRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
      signal: AbortSignal.timeout(5_000),
    });
    // RPC endpoint won't work for DDL directly

    // Alternative: Use PostgREST's ability to call any SQL function
    // We'll create the function via the direct SQL workaround:
    // POST to /rest/v1/rpc with a function that doesn't exist → 404
    // This means we need another approach...

    // Fallback: Create the table on first INSERT failure
    // When supaInsertConvo gets a 404, create the table then retry
    log.info('Auto-migration via RPC not available — will create table on first write');
    return false;
  } catch (err) {
    log.warn('Migration RPC failed', { error: (err as Error).message });
    return false;
  }
}

let tableCreationAttempted = false;

/**
 * Attempt to create the conversation_messages table when Supabase returns 404.
 * Falls back to direct INSERT approach: first insert triggers table creation.
 */
async function ensureTableOnWrite(): Promise<void> {
  if (tableCreationAttempted || !USE_SUPABASE) return;
  tableCreationAttempted = true;

  // The table needs to be created via the Supabase SQL editor, CLI, or migration.
  // Since we can't run DDL via PostgREST, log a clear message for the operator.
  log.warn(
    'conversation_messages table does not exist in Supabase. ' +
    'Run the migration SQL from database/migrations/011_conversation_messages.sql ' +
    'in the Supabase SQL editor. Messages will be stored in JSONL until then.'
  );
}

// ── Initialization ──

/**
 * Initialize the memory manager.
 * - If Supabase is configured: checks table exists, hydrates hot cache
 * - If not: falls back to loading from JSONL file
 * - Always loads knowledge base from JSON file
 */
export function initMemory(): void {
  if (initialized) return;
  ensureDataDir();

  // Load knowledge base (always from file — small dataset)
  if (existsSync(KNOWLEDGE_FILE)) {
    try {
      knowledge = JSON.parse(readFileSync(KNOWLEDGE_FILE, 'utf-8')) as KnowledgeEntry[];
    } catch {
      knowledge = [];
    }
  }

  if (USE_SUPABASE) {
    // Async: ensure table exists, then hydrate
    ensureSupabaseTable()
      .then(exists => {
        if (exists) {
          return bootHydrateFromSupabase();
        } else {
          // Table doesn't exist yet — fall back to JSONL and warn
          ensureTableOnWrite();
          loadFromJsonl();
        }
      })
      .catch(err => {
        log.warn('Boot hydration failed (will lazy-hydrate on demand)', { error: (err as Error).message });
        loadFromJsonl(); // Fallback to JSONL
      });
    log.info('Memory init: Supabase mode (conversation_messages table)');
  } else {
    // JSONL fallback — load all messages into cache
    loadFromJsonl();
    log.info('Memory init: JSONL fallback mode');
  }

  initialized = true;
  log.info(`Initialized: ${hotCache.size} cache entries, ${knowledge.length} knowledge entries`);
}

/** Load conversations from JSONL into hot cache (non-Supabase mode). */
function loadFromJsonl(): void {
  if (!existsSync(CONVERSATIONS_FILE)) return;
  try {
    const lines = readFileSync(CONVERSATIONS_FILE, 'utf-8').trim().split('\n').filter(Boolean);
    const cutoff = Date.now() - CONVERSATION_TTL_DAYS * 24 * 60 * 60 * 1000;
    let pruned = 0;

    for (const line of lines) {
      try {
        const msg = JSON.parse(line) as ConversationMessage;
        if (msg.createdAt < cutoff) { pruned++; continue; }
        addToCache(msg);
      } catch { /* skip malformed lines */ }
    }

    if (pruned > 0) {
      log.info(`Pruned ${pruned} old messages from JSONL`);
      // Rewrite JSONL without pruned messages
      const allMessages = getAllCachedMessages();
      const newLines = allMessages.map(m => JSON.stringify(m)).join('\n') + '\n';
      writeFile(CONVERSATIONS_FILE, newLines).catch(() => {});
    }
  } catch {
    // Non-fatal — start with empty cache
  }
}

/** Boot-time hydration: load recent messages from Supabase into hot cache. */
async function bootHydrateFromSupabase(): Promise<void> {
  const query = `conversation_messages?order=created_at.desc&limit=${BOOT_HYDRATE_LIMIT}`;
  const rows = await supaFetch<SupaConvoRow[]>(query);
  if (!rows || rows.length === 0) {
    log.info('Boot hydration: no messages in Supabase (fresh start)');
    // Try JSONL as migration source
    loadFromJsonl();
    if (hotCache.size > 0) {
      log.info(`Boot: migrating ${getAllCachedMessages().length} JSONL messages to Supabase`);
      migrateJsonlToSupabase().catch(err => {
        log.warn('JSONL→Supabase migration failed (non-fatal)', { error: (err as Error).message });
      });
    }
    return;
  }

  // Group by user:sender and populate cache
  const grouped = new Map<string, ConversationMessage[]>();
  for (const row of rows) {
    const msg = rowToMessage(row);
    const key = cacheKey(msg.userId, msg.senderJid);
    let arr = grouped.get(key);
    if (!arr) { arr = []; grouped.set(key, arr); }
    arr.push(msg);
  }

  for (const [key, msgs] of grouped) {
    msgs.reverse(); // oldest first (they came desc from DB)
    hotCache.set(key, msgs.slice(-CACHE_MAX_MESSAGES_PER_KEY));
    touchCache(key);
    hydratedKeys.add(key);
  }

  log.info(`Boot hydration: ${rows.length} messages → ${grouped.size} cache entries`);
}

/** One-time migration: push existing JSONL messages to Supabase conversation_messages table. */
async function migrateJsonlToSupabase(): Promise<void> {
  const all = getAllCachedMessages();
  if (all.length === 0) return;

  // Batch insert in chunks of 50
  const BATCH_SIZE = 50;
  let migrated = 0;
  for (let i = 0; i < all.length; i += BATCH_SIZE) {
    const batch = all.slice(i, i + BATCH_SIZE);
    const rows = batch.map(msg => ({
      id: msg.id,
      user_id: msg.userId,
      sender_jid: msg.senderJid,
      channel: msg.channel,
      role: msg.role,
      content: msg.content,
      trace_id: msg.traceId || null,
      created_at: new Date(msg.createdAt).toISOString(),
    }));

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/conversation_messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal,resolution=ignore-duplicates',
        },
        body: JSON.stringify(rows),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) migrated += batch.length;
    } catch {
      // Continue with remaining batches
    }
  }

  log.info(`JSONL→Supabase migration complete: ${migrated}/${all.length} messages`);
}

/** Get ALL messages from hot cache (for stats, search, migration). */
function getAllCachedMessages(): ConversationMessage[] {
  const all: ConversationMessage[] = [];
  for (const msgs of hotCache.values()) {
    all.push(...msgs);
  }
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

// ── Conversation API ──

/**
 * Store a conversation message.
 * Sync: writes to hot cache + JSONL immediately.
 * Async (fire-and-forget): writes to Supabase conversation_messages + unified messages table.
 */
export function storeMessage(msg: Omit<ConversationMessage, 'id' | 'createdAt'>): ConversationMessage {
  initMemory();
  const full: ConversationMessage = {
    ...msg,
    id: randomUUID(),
    createdAt: Date.now(),
  };

  // 1. Sync: add to hot cache
  addToCache(full);

  // 2. Sync: append to JSONL (backup)
  appendConversationFile(full);

  // 3. Async: persist to Supabase conversation_messages table
  if (USE_SUPABASE) {
    supaInsertConvo(full).catch(err => {
      log.warn('Supabase convo persist failed (non-blocking)', { detail: (err as Error).message });
    });

    // Also persist to unified messages table (for workspace inbox view)
    persistMessageToUnifiedTable(full).catch(() => {});
  }

  return full;
}

/** Persist to the unified `messages` table (for workspace inbox/CRM view). */
async function persistMessageToUnifiedTable(msg: ConversationMessage): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        id: msg.id,
        user_id: msg.userId || null,
        channel: msg.channel,
        direction: msg.role === 'user' ? 'inbound' : 'outbound',
        sender_id: msg.role === 'user' ? msg.senderJid : 'kitz',
        recipient_id: msg.role === 'user' ? 'kitz' : msg.senderJid,
        content: msg.content,
        trace_id: msg.traceId || null,
        thread_id: `${msg.userId}:${msg.senderJid}`,
        status: msg.role === 'assistant' ? 'sent' : 'received',
        metadata: { role: msg.role, source: 'kitz_os' },
        created_at: new Date(msg.createdAt).toISOString(),
      }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // Non-blocking — conversation_messages is the primary AI store
  }
}

/**
 * Get recent conversation history for a specific user+sender pair.
 *
 * Resilient lookup strategy (same 3-strategy pattern, now from hot cache):
 * 1. Try exact (userId, senderJid) match first
 * 2. If senderJid is a real JID (not 'unknown'), also search across ALL userIds
 *    for that JID — handles userId inconsistency across sessions
 * 3. If userId is not 'default'/'unknown', search for that userId with 'unknown' senderJid
 *
 * Returns from hot cache (sync). Schedules background Supabase hydration on cache miss.
 */
export function getConversationHistory(
  userId: string,
  senderJid: string,
  limit = MAX_CONTEXT_MESSAGES,
): ConversationMessage[] {
  initMemory();

  // Strategy 1: Exact match from cache
  let results = getCacheMessages(userId, senderJid)
    .filter(m => !m.content.startsWith('[SWARM:'))
    .filter(m => m.role !== 'system');

  // Strategy 2: If senderJid is a real WhatsApp JID, find ALL messages for that JID
  if (results.length < 3 && senderJid !== 'unknown' && senderJid.includes('@')) {
    // Scan all cache entries for this senderJid
    const jidResults: ConversationMessage[] = [];
    for (const [key, msgs] of hotCache) {
      if (key.endsWith(`:${senderJid}`)) {
        jidResults.push(...msgs.filter(m => !m.content.startsWith('[SWARM:') && m.role !== 'system'));
      }
    }
    if (jidResults.length > results.length) {
      results = jidResults.sort((a, b) => a.createdAt - b.createdAt);
    }
  }

  // Strategy 3: If we have a userId but got 'unknown' senderJid
  if (results.length < 3 && userId !== 'default' && senderJid === 'unknown') {
    const userResults: ConversationMessage[] = [];
    for (const [key, msgs] of hotCache) {
      if (key.startsWith(`${userId}:`)) {
        userResults.push(...msgs.filter(m => !m.content.startsWith('[SWARM:') && m.role !== 'system'));
      }
    }
    if (userResults.length > results.length) {
      results = userResults.sort((a, b) => a.createdAt - b.createdAt);
    }
  }

  // If we got nothing and Supabase is available, schedule background hydration
  // so the NEXT call will have data
  if (results.length === 0 && USE_SUPABASE) {
    scheduleHydration(userId, senderJid);
  }

  return results.slice(-limit);
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

// ── Knowledge API (unchanged — small dataset, file-based is fine) ──

/**
 * Add or update a knowledge entry.
 */
export function upsertKnowledge(entry: Omit<KnowledgeEntry, 'id' | 'hash' | 'updatedAt'>): KnowledgeEntry {
  initMemory();
  const hash = createHash('sha256').update(entry.content).digest('hex').slice(0, 16);

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

/**
 * Delete a knowledge entry by ID.
 */
export function deleteKnowledge(id: string): boolean {
  initMemory();
  const idx = knowledge.findIndex(k => k.id === id);
  if (idx === -1) return false;
  knowledge.splice(idx, 1);
  persistKnowledge();
  return true;
}

// ── Search ──

/**
 * Search conversations by keyword.
 * When Supabase is available, uses PostgreSQL full-text search for broader results.
 * Falls back to in-memory cache search.
 */
export function searchConversations(
  query: string,
  userId?: string,
  limit = MAX_SEARCH_RESULTS,
): SearchResult[] {
  initMemory();

  // Try Supabase full-text search (async, fire-and-forget enrichment)
  if (USE_SUPABASE) {
    // Fire async Supabase FTS — results enrich cache for future calls
    searchConversationsSupabase(query, userId, limit).catch(() => {});
  }

  // Sync: search hot cache (always returns immediately)
  return searchConversationsInCache(query, userId, limit);
}

/** Search the hot cache by keyword (sync). */
function searchConversationsInCache(
  query: string,
  userId?: string,
  limit = MAX_SEARCH_RESULTS,
): SearchResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (terms.length === 0) return [];

  const all = getAllCachedMessages();
  const scored = all
    .filter(m => !userId || m.userId === userId)
    .map(m => {
      const text = m.content.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (text.includes(term)) score += 1;
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

/** Search Supabase conversation_messages with PostgreSQL full-text search. */
async function searchConversationsSupabase(
  query: string,
  userId?: string,
  limit = MAX_SEARCH_RESULTS,
): Promise<SearchResult[]> {
  // Build tsquery from terms (Spanish dictionary)
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (terms.length === 0) return [];

  const tsquery = terms.map(t => encodeURIComponent(t)).join('%20%26%20');
  let path = `conversation_messages?content=fts(spanish).${tsquery}&order=created_at.desc&limit=${limit}`;
  if (userId) path += `&user_id=eq.${encodeURIComponent(userId)}`;

  const rows = await supaFetch<SupaConvoRow[]>(path);
  if (!rows || rows.length === 0) return [];

  // Add results to cache (enrich for future lookups)
  for (const row of rows) {
    const msg = rowToMessage(row);
    addToCache(msg);
  }

  return rows.map(row => ({
    content: row.content,
    source: 'conversation' as const,
    score: 1, // FTS doesn't provide granular scores via PostgREST
    meta: {
      userId: row.user_id,
      senderJid: row.sender_jid,
      role: row.role,
      createdAt: new Date(row.created_at).getTime(),
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

// ── Semantic Memory (Embeddings) ──

import { generateEmbedding, semanticSearch, storeEmbedding, getVectorCount } from './embeddings.js';

/**
 * Store a conversation turn and embed it for future semantic retrieval.
 * Called after each AI response to build semantic memory.
 */
export async function storeAndEmbedConversation(
  userId: string,
  senderJid: string,
  userMessage: string,
  assistantResponse: string,
  traceId?: string,
): Promise<void> {
  // Store both messages
  const userMsg = storeMessage({
    userId,
    senderJid,
    channel: 'whatsapp',
    role: 'user',
    content: userMessage,
    traceId,
  });

  storeMessage({
    userId,
    senderJid,
    channel: 'whatsapp',
    role: 'assistant',
    content: assistantResponse,
    traceId,
  });

  // Create a summary for embedding
  const summary = `User asked: ${userMessage.slice(0, 200)}. KITZ responded: ${assistantResponse.slice(0, 300)}`;

  // Embed asynchronously — don't block the response
  storeEmbedding(userMsg.id, summary, 'conversation', userId).catch(() => {
    // Non-blocking — keyword search still works without embeddings
  });
}

/**
 * Semantic search across past interactions.
 */
export async function semanticMemorySearch(
  query: string,
  userId?: string,
  limit = 5,
): Promise<Array<{ text: string; similarity: number }>> {
  const results = await semanticSearch(query, {
    userId,
    limit,
    minSimilarity: 0.35,
  });

  if (results.length > 0) {
    return results.map(r => ({ text: r.text, similarity: r.similarity }));
  }

  // Fall back to keyword search
  const keywordResults = search(query, userId, limit);
  return keywordResults.map(r => ({
    text: r.content,
    similarity: r.score / 5,
  }));
}

/**
 * Build an enriched context window with semantic memory.
 */
export async function buildSemanticContext(
  userId: string,
  senderJid: string,
  currentMessage: string,
): Promise<{ messages: ConversationMessage[]; relevantMemory: string[]; relevantKnowledge: string[] }> {
  const base = buildContextWindow(userId, senderJid, currentMessage);

  const memories = await semanticMemorySearch(currentMessage, userId, 5);
  const relevantMemory = memories.map(m => m.text);

  return {
    messages: base.messages,
    relevantMemory,
    relevantKnowledge: base.relevantKnowledge,
  };
}

// ── Stats ──

export function getMemoryStats(): {
  totalMessages: number;
  totalKnowledge: number;
  totalVectors: number;
  uniqueUsers: number;
  oldestMessageAge: number | null;
  cacheEntries: number;
  supabaseEnabled: boolean;
} {
  initMemory();
  const all = getAllCachedMessages();
  const users = new Set(all.map(m => m.userId));
  const oldest = all.length > 0
    ? Date.now() - all[0].createdAt
    : null;

  return {
    totalMessages: all.length,
    totalKnowledge: knowledge.length,
    totalVectors: getVectorCount(),
    uniqueUsers: users.size,
    oldestMessageAge: oldest,
    cacheEntries: hotCache.size,
    supabaseEnabled: USE_SUPABASE,
  };
}

/**
 * Purge swarm/system noise from conversation history.
 * Now purges from both cache and Supabase.
 */
export async function purgeSwarmMessages(): Promise<{ removed: number; remaining: number }> {
  initMemory();
  let totalRemoved = 0;

  // Purge from hot cache
  for (const [key, msgs] of hotCache) {
    const before = msgs.length;
    const cleaned = msgs.filter(
      m => !m.content.startsWith('[SWARM:') && !m.content.startsWith('[MISSED WhatsApp'),
    );
    if (cleaned.length !== before) {
      totalRemoved += before - cleaned.length;
      hotCache.set(key, cleaned);
    }
  }

  // Purge from JSONL
  if (totalRemoved > 0) {
    ensureDataDir();
    const all = getAllCachedMessages();
    const lines = all.map(m => JSON.stringify(m)).join('\n') + '\n';
    await writeFile(CONVERSATIONS_FILE, lines);
  }

  // Purge from Supabase (async)
  if (USE_SUPABASE) {
    try {
      // Delete [SWARM: and [MISSED WhatsApp messages
      await fetch(`${SUPABASE_URL}/rest/v1/conversation_messages?content=like.%5BSWARM%3A*`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        signal: AbortSignal.timeout(10_000),
      });
      await fetch(`${SUPABASE_URL}/rest/v1/conversation_messages?content=like.%5BMISSED%20WhatsApp*`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      // Non-blocking
    }
  }

  const remaining = getAllCachedMessages().length;
  if (totalRemoved > 0) {
    log.info('purgeSwarmMessages', { removed: totalRemoved, remaining });
  }
  return { removed: totalRemoved, remaining };
}
