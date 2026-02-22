/**
 * Memory Schema — SQLite tables for conversation history and knowledge.
 *
 * Ported from OpenClaw memory/memory-schema.ts.
 * Uses Node.js built-in sqlite (Node 22+) with FTS5 for keyword search.
 *
 * Tables:
 *   - conversations: per-user chat history (WhatsApp, email)
 *   - knowledge: brand DNA, playbooks, templates
 *   - meta: key-value store for sync state
 */

export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    sender_jid TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    trace_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(user_id, sender_jid, id)
  );

  CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id, sender_jid, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_conv_time ON conversations(created_at DESC);

  CREATE TABLE IF NOT EXISTS knowledge (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    title TEXT,
    content TEXT NOT NULL,
    hash TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS idx_knowledge_cat ON knowledge(category);
`;

// FTS5 virtual tables (created separately — may not be available on all SQLite builds)
export const FTS_SQL = `
  CREATE VIRTUAL TABLE IF NOT EXISTS conversations_fts USING fts5(
    content,
    id UNINDEXED,
    user_id UNINDEXED,
    sender_jid UNINDEXED,
    content=conversations,
    content_rowid=rowid,
    tokenize='porter unicode61'
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
    content,
    title,
    id UNINDEXED,
    category UNINDEXED,
    content=knowledge,
    content_rowid=rowid,
    tokenize='porter unicode61'
  );
`;
