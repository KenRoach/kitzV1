/**
 * Message Deduplication — ported from OpenClaw inbound-dedupe.ts
 *
 * TTL-based cache to prevent double-processing of the same message.
 * Baileys can emit the same message.upsert multiple times during sync.
 */

const TTL_MS = 20 * 60 * 1000;  // 20 minutes
const MAX_ENTRIES = 5000;
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

const cache = new Map<string, number>(); // key → expiresAt timestamp

/**
 * Check if a message was recently seen. If not, marks it as seen.
 * Returns true if the message is a DUPLICATE (already seen).
 */
export function isDuplicateMessage(key: string): boolean {
  const now = Date.now();
  const existing = cache.get(key);
  if (existing && existing > now) {
    return true; // Seen before and not expired
  }

  // Evict oldest if at capacity
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.entries().next().value;
    if (oldest) cache.delete(oldest[0]);
  }

  cache.set(key, now + TTL_MS);
  return false;
}

/**
 * Build the dedup key for a message.
 */
export function buildDedupeKey(userId: string, remoteJid: string, messageId: string): string {
  return `${userId}:${remoteJid}:${messageId}`;
}

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, expiresAt] of cache) {
    if (expiresAt <= now) cache.delete(key);
  }
}, CLEANUP_INTERVAL_MS).unref();
