/**
 * SOP Loader — Boot-time loader for starter SOPs from kitz-knowledge-base.
 *
 * Reads markdown files from kitz-knowledge-base/sops/ and kitz-knowledge-base/playbooks/,
 * parses metadata from filenames and content, and upserts into the SOP store.
 *
 * Never throws — this runs at boot and must not crash the kernel.
 */

import { createSubsystemLogger } from 'kitz-schemas';
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { upsertSOP } from './store.js';
import type { SOPType } from './types.js';

const log = createSubsystemLogger('loader');

// ── Constants ───────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const KB_BASE = join(__dirname, '..', '..', '..', 'kitz-knowledge-base');
const SOP_DIR = join(KB_BASE, 'sops');
const PLAYBOOK_DIR = join(KB_BASE, 'playbooks');

// ── Filename Regex ──────────────────────────────────────

const FILENAME_RE = /^(.+)-v(\d+)\.md$/;

// Agent-type keyword patterns in slug
const AGENT_KEYWORDS = ['whatsapp', 'response', 'sla', 'battery', 'agent'];

// ── Helpers ─────────────────────────────────────────────

/**
 * Extract title from the first `#` heading line.
 * Falls back to slug if no heading found.
 */
function extractTitle(content: string, slug: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^#+\s+(.+)$/);
    if (match) {
      return match[1].trim();
    }
  }
  return slug;
}

/**
 * Extract summary from the first non-header, non-empty line (first 150 chars + "...").
 */
function extractSummary(content: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines, headings, and horizontal rules
    if (!trimmed || trimmed.startsWith('#') || trimmed === '---') continue;
    const clean = trimmed.replace(/\*\*/g, '').replace(/\*/g, '');
    if (clean.length <= 150) return clean;
    return clean.slice(0, 150) + '...';
  }
  return '';
}

/**
 * Determine SOP type based on directory source and slug keywords.
 * - Files from playbooks/ -> 'business'
 * - Files from sops/ with agent-related keywords -> 'agent'
 * - Files from sops/ without agent keywords -> 'business'
 */
function determineSopType(slug: string, source: 'sops' | 'playbooks'): SOPType {
  if (source === 'playbooks') return 'business';
  const slugLower = slug.toLowerCase();
  for (const keyword of AGENT_KEYWORDS) {
    if (slugLower.includes(keyword)) return 'agent';
  }
  return 'business';
}

/**
 * Extract trigger keywords from:
 * 1. Slug split on hyphens
 * 2. Any **bold** words in the first 5 lines
 */
function extractTriggerKeywords(slug: string, content: string): string[] {
  const keywords = new Set<string>();

  // Split slug on hyphens
  for (const word of slug.split('-')) {
    if (word.length > 0) {
      keywords.add(word.toLowerCase());
    }
  }

  // Extract **bold** words from first 5 lines
  const lines = content.split('\n').slice(0, 5);
  const boldRe = /\*\*([^*]+)\*\*/g;
  for (const line of lines) {
    let match: RegExpExecArray | null;
    while ((match = boldRe.exec(line)) !== null) {
      // Split bold text into individual words and add each
      for (const word of match[1].split(/\s+/)) {
        const clean = word.replace(/[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ0-9-]/g, '').toLowerCase();
        if (clean.length > 0) {
          keywords.add(clean);
        }
      }
    }
  }

  return [...keywords];
}

/**
 * Extract applicable agents from **Owner:** line if present.
 * Falls back to ['*'] when no Owner line found.
 */
function extractApplicableAgents(content: string, _type: SOPType): string[] {
  const ownerAgents = parseOwnerLine(content);
  if (ownerAgents.length > 0) return ownerAgents;

  // Default: wildcard — applies to all agents
  return ['*'];
}

/**
 * Parse the **Owner:** line to extract agent names.
 * Example: "**Owner:** CMO Agent + HeadGrowth Agent" -> ['CMO', 'HeadGrowth']
 */
function parseOwnerLine(content: string): string[] {
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/\*\*Owner:\*\*\s*(.+)/i);
    if (match) {
      const ownerText = match[1];
      const agents: string[] = [];
      // Split on + or , and extract agent-like names
      const parts = ownerText.split(/[+,]/);
      for (const part of parts) {
        const trimmed = part.trim().replace(/\s*Agent\s*/gi, '').trim();
        if (trimmed.length > 0) {
          agents.push(trimmed);
        }
      }
      return agents;
    }
  }
  return [];
}

/**
 * Determine language from filename slug.
 * If the slug contains '-es', language is 'es'. Otherwise 'en'.
 */
function detectLanguage(slug: string): 'en' | 'es' {
  return slug.includes('-es') ? 'es' : 'en';
}

// ── Directory Loader ────────────────────────────────────

/**
 * Load all .md files from a single directory, parse them into SOPInput, and upsert.
 * Returns the number of successfully loaded SOPs.
 */
async function loadFromDirectory(
  dirPath: string,
  source: 'sops' | 'playbooks'
): Promise<number> {
  let count = 0;
  let files: string[];

  try {
    files = await readdir(dirPath);
  } catch {
    log.warn(`Directory not found, skipping: ${dirPath}`);
    return 0;
  }

  const mdFiles = files.filter(
    f => f.endsWith('.md') && f !== 'README.md'
  );

  for (const file of mdFiles) {
    try {
      // Parse filename
      const match = file.match(FILENAME_RE);
      if (!match) {
        log.warn(`Skipping file with unexpected name format: ${file}`);
        continue;
      }

      const slug = match[1];
      const version = parseInt(match[2], 10);

      // Read content
      const filePath = join(dirPath, file);
      const content = await readFile(filePath, 'utf-8');

      // Extract metadata
      const title = extractTitle(content, slug);
      const summary = extractSummary(content);
      const type = determineSopType(slug, source);
      const triggerKeywords = extractTriggerKeywords(slug, content);
      const applicableAgents = extractApplicableAgents(content, type);
      const language = detectLanguage(slug);

      await upsertSOP({
        slug,
        title,
        content,
        type,
        summary,
        version,
        status: 'active',
        language,
        triggerKeywords,
        applicableAgents,
        applicableTeams: [],
        createdBy: 'system',
      });

      count++;
    } catch (err) {
      log.warn(`Failed to parse ${file}`, { error: (err as Error).message });
    }
  }

  return count;
}

// ── Public API ──────────────────────────────────────────

/**
 * Load starter SOPs from kitz-knowledge-base/sops/ and kitz-knowledge-base/playbooks/.
 *
 * This function never throws — it logs warnings on errors and returns the count of
 * successfully loaded SOPs. Designed to be called during kernel boot.
 */
export async function loadStarterSOPs(): Promise<number> {
  let total = 0;

  try {
    const sopCount = await loadFromDirectory(SOP_DIR, 'sops');
    total += sopCount;
  } catch (err) {
    log.warn('Error loading sops directory:', { detail: (err as Error).message });
  }

  try {
    const playbookCount = await loadFromDirectory(PLAYBOOK_DIR, 'playbooks');
    total += playbookCount;
  } catch (err) {
    log.warn('Error loading playbooks directory:', { detail: (err as Error).message });
  }

  log.info(`${total} starter SOPs loaded from kitz-knowledge-base`);
  return total;
}
