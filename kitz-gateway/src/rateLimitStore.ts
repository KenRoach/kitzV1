/**
 * File-backed Rate Limit Store for @fastify/rate-limit
 *
 * Persists rate limit counters to an NDJSON file so they survive
 * service restarts. On boot, replays the file to rebuild state.
 *
 * Why not Redis?
 *   - Kitz is single-instance on Railway (no multi-pod yet)
 *   - File-backed is zero-dependency and good enough for MVP
 *   - Easy migration path: swap this for Redis store when scaling
 *
 * File format (NDJSON):
 *   {"key":"1.2.3.4","ts":1708000000,"window":60000}
 *
 * Cleanup: entries older than 2x window are pruned on compaction.
 */

import { appendFile, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RouteOptions } from 'fastify';
import type { FastifyRateLimitOptions } from '@fastify/rate-limit';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const STORE_FILE = join(DATA_DIR, 'rate-limits.ndjson');

interface HitRecord {
  key: string;
  ts: number;
  window: number;
}

// Shared state across all store instances
const hits = new Map<string, number[]>();
let fileReady = false;
let compactionScheduled = false;

async function ensureDataDir(): Promise<void> {
  if (fileReady) return;
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch {
    // already exists
  }
  fileReady = true;
}

async function replayFromFile(windowMs: number): Promise<void> {
  await ensureDataDir();
  let raw: string;
  try {
    raw = await readFile(STORE_FILE, 'utf-8');
  } catch {
    return; // no file yet
  }

  const now = Date.now();
  const cutoff = now - windowMs;

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const record: HitRecord = JSON.parse(line);
      if (record.ts > cutoff) {
        const arr = hits.get(record.key) || [];
        arr.push(record.ts);
        hits.set(record.key, arr);
      }
    } catch {
      // skip malformed lines
    }
  }
}

async function appendHit(key: string, ts: number, windowMs: number): Promise<void> {
  await ensureDataDir();
  const record: HitRecord = { key, ts, window: windowMs };
  await appendFile(STORE_FILE, JSON.stringify(record) + '\n').catch(() => {});
}

async function compact(windowMs: number): Promise<void> {
  const now = Date.now();
  const cutoff = now - windowMs;

  for (const [key, timestamps] of hits) {
    const valid = timestamps.filter(t => t > cutoff);
    if (valid.length === 0) {
      hits.delete(key);
    } else {
      hits.set(key, valid);
    }
  }

  const lines: string[] = [];
  for (const [key, timestamps] of hits) {
    for (const ts of timestamps) {
      lines.push(JSON.stringify({ key, ts, window: windowMs }));
    }
  }
  await writeFile(STORE_FILE, lines.join('\n') + (lines.length ? '\n' : '')).catch(() => {});
}

/**
 * File-backed store class compatible with @fastify/rate-limit's StoreCtor interface.
 *
 * Usage in gateway:
 *   await app.register(rateLimit, { max: 120, timeWindow: '1 minute', store: FileBackedRateLimitStore });
 */
export class FileBackedRateLimitStore {
  private windowMs: number;
  private replayed = false;

  constructor(options: FastifyRateLimitOptions) {
    // Parse timeWindow to ms (FastifyRateLimitOptions is declaration-merged, cast to access runtime fields)
    const tw = (options as Record<string, unknown>).timeWindow as string | number | undefined;
    if (typeof tw === 'number') {
      this.windowMs = tw;
    } else if (typeof tw === 'string') {
      // Parse "1 minute", "60000", etc.
      const match = tw.match(/^(\d+)\s*(s|sec|second|m|min|minute|h|hour|ms)?s?$/i);
      if (match) {
        const val = Number(match[1]);
        const unit = (match[2] || 'ms').toLowerCase();
        const multipliers: Record<string, number> = { ms: 1, s: 1000, sec: 1000, second: 1000, m: 60000, min: 60000, minute: 60000, h: 3600000, hour: 3600000 };
        this.windowMs = val * (multipliers[unit] || 1);
      } else {
        this.windowMs = Number(tw) || 60000;
      }
    } else {
      this.windowMs = 60000; // default 1 minute
    }

    // Replay and schedule compaction
    this.init();
  }

  private async init(): Promise<void> {
    if (this.replayed) return;
    await replayFromFile(this.windowMs);
    this.replayed = true;

    if (!compactionScheduled) {
      compactionScheduled = true;
      setInterval(() => compact(this.windowMs), 5 * 60_000).unref();
    }
  }

  incr(
    key: string,
    callback: (error: Error | null, result?: { current: number; ttl: number }) => void,
  ): void {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    let arr = hits.get(key) || [];
    arr = arr.filter(t => t > cutoff);
    arr.push(now);
    hits.set(key, arr);

    // Fire-and-forget persist
    appendHit(key, now, this.windowMs).catch(() => {});

    const ttl = this.windowMs - (now - arr[0]);
    callback(null, { current: arr.length, ttl: Math.max(0, ttl) });
  }

  child(_routeOptions: RouteOptions & { path: string; prefix: string }): FileBackedRateLimitStore {
    // Same store for all routes (single global limit)
    return this;
  }
}
