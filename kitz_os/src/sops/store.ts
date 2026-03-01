/**
 * SOP Store — 3-Layer Persistence for Standard Operating Procedures
 *
 * Follows the same pattern as aiBattery.ts:
 *   1. In-memory Map (always available, keyed by slug -> version-ordered array)
 *   2. NDJSON append-only ledger (survives restarts)
 *   3. Latest JSON snapshot (quick restore on boot)
 *
 * Every SOP is content-hashed (sha256, first 16 chars) to detect duplicates.
 * Search scores SOPs by title, triggerKeywords, and summary relevance.
 */

import { createSubsystemLogger } from 'kitz-schemas';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import type { SOPEntry, SOPInput } from './types.js';

const log = createSubsystemLogger('store');

// ── Config ──────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data', 'sops');
const LEDGER_FILE = join(DATA_DIR, 'sop-ledger.ndjson');
const LATEST_FILE = join(DATA_DIR, 'sops-latest.json');

// ── In-Memory Store ─────────────────────────────────────

/** Keyed by slug, value is version-ordered array of SOPEntry */
const sopStore = new Map<string, SOPEntry[]>();

// ── Internal Helpers ────────────────────────────────────

async function ensureDataDir(): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory may already exist — that's fine
  }
}

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Get the latest active version for each slug.
 */
function getLatestActivePerSlug(): SOPEntry[] {
  const results: SOPEntry[] = [];
  for (const versions of sopStore.values()) {
    // Walk backwards (latest version first) to find the first active entry
    for (let i = versions.length - 1; i >= 0; i--) {
      if (versions[i].status === 'active') {
        results.push(versions[i]);
        break;
      }
    }
  }
  return results;
}

// ── Persistence ─────────────────────────────────────────

async function persistLatest(): Promise<void> {
  try {
    await ensureDataDir();
    const activeSOPs = getLatestActivePerSlug();
    await writeFile(LATEST_FILE, JSON.stringify(activeSOPs, null, 2), 'utf-8');
  } catch (err) {
    log.warn('persistLatest failed:', { detail: (err as Error).message });
  }
}

async function appendToLedger(entry: SOPEntry): Promise<void> {
  try {
    await ensureDataDir();
    const line = JSON.stringify(entry) + '\n';
    await appendFile(LEDGER_FILE, line, 'utf-8');
  } catch (err) {
    log.warn('appendToLedger failed:', { detail: (err as Error).message });
  }
}

// ── Boot Restore ────────────────────────────────────────

/**
 * Restore SOPs from the latest JSON snapshot on boot.
 * If the file doesn't exist, silently continue with an empty store.
 */
export async function initSOPStore(): Promise<void> {
  let count = 0;

  try {
    const raw = await readFile(LATEST_FILE, 'utf-8');
    const entries = JSON.parse(raw) as SOPEntry[];

    for (const entry of entries) {
      if (!entry.slug || !entry.id) continue;

      const existing = sopStore.get(entry.slug) ?? [];
      // Avoid duplicates on re-init
      if (!existing.some(e => e.id === entry.id)) {
        existing.push(entry);
        sopStore.set(entry.slug, existing);
        count++;
      }
    }
  } catch {
    // File doesn't exist yet or is malformed — silently continue
  }

  log.info(`${count} SOPs restored`);
}

// ── Core Functions ──────────────────────────────────────

/**
 * Upsert an SOP into the store.
 * If an entry with the same slug+version and identical content hash exists, returns existing (no-op).
 * Otherwise creates a new entry, appends to ledger, and persists latest snapshot.
 */
export async function upsertSOP(input: SOPInput): Promise<SOPEntry> {
  const hash = hashContent(input.content);
  const versions = sopStore.get(input.slug) ?? [];

  // Check for existing entry with same slug + version
  const existing = versions.find(e => e.version === input.version);
  if (existing && existing.hash === hash) {
    // Content unchanged — no-op
    return existing;
  }

  const now = Date.now();
  const entry: SOPEntry = {
    ...input,
    id: randomUUID(),
    hash,
    createdAt: now,
    updatedAt: now,
  };

  versions.push(entry);
  sopStore.set(input.slug, versions);

  // Fire-and-forget persistence
  appendToLedger(entry).catch(err => {
    log.warn('ledger append failed:', { detail: (err as Error).message });
  });
  persistLatest().catch(err => {
    log.warn('snapshot persist failed:', { detail: (err as Error).message });
  });

  return entry;
}

/**
 * Search SOPs by query string.
 * Scoring: title keyword match = 3 pts, triggerKeywords match = 2 pts, summary keyword match = 1 pt.
 * Returns top `limit` results sorted by score descending. Only returns results with score > 0.
 */
export function searchSOPs(query: string, limit = 3): SOPEntry[] {
  const activeSOPs = getLatestActivePerSlug();
  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);

  if (queryWords.length === 0) return [];

  const scored: Array<{ entry: SOPEntry; score: number }> = [];

  for (const entry of activeSOPs) {
    let score = 0;
    const titleLower = entry.title.toLowerCase();
    const summaryLower = entry.summary.toLowerCase();
    const keywordsLower = entry.triggerKeywords.map(k => k.toLowerCase());

    for (const word of queryWords) {
      // Title match: 3 points per matching word
      if (titleLower.includes(word)) {
        score += 3;
      }

      // Trigger keywords match: 2 points per matching keyword
      for (const keyword of keywordsLower) {
        if (keyword.includes(word)) {
          score += 2;
        }
      }

      // Summary match: 1 point per matching word
      if (summaryLower.includes(word)) {
        score += 1;
      }
    }

    if (score > 0) {
      scored.push({ entry, score });
    }
  }

  // Sort by score descending, take top `limit`
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.entry);
}

/**
 * Get an SOP by slug. If version is specified, return that version.
 * Otherwise return the latest active version.
 */
export function getSOPBySlug(slug: string, version?: number): SOPEntry | undefined {
  const versions = sopStore.get(slug);
  if (!versions || versions.length === 0) return undefined;

  if (version !== undefined) {
    return versions.find(e => e.version === version);
  }

  // Return latest active version
  for (let i = versions.length - 1; i >= 0; i--) {
    if (versions[i].status === 'active') {
      return versions[i];
    }
  }

  return undefined;
}

/**
 * Get all active SOPs applicable to a specific agent (and optionally a team).
 * Matches where applicableAgents includes agentName or '*',
 * or applicableTeams includes team.
 */
export function getSOPsForAgent(agentName: string, team?: string): SOPEntry[] {
  const activeSOPs = getLatestActivePerSlug();

  return activeSOPs.filter(sop => {
    const agentMatch =
      sop.applicableAgents.includes(agentName) ||
      sop.applicableAgents.includes('*');

    const teamMatch = team
      ? sop.applicableTeams.includes(team)
      : false;

    return agentMatch || teamMatch;
  });
}

/**
 * Get all active SOPs (latest active version per slug).
 */
export function getAllActiveSOPs(): SOPEntry[] {
  return getLatestActivePerSlug();
}

/**
 * Get count of unique active slugs.
 */
export function getSOPCount(): number {
  return getLatestActivePerSlug().length;
}
