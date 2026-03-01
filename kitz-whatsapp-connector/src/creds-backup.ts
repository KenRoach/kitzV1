/**
 * Credential Backup & Restore — ported from OpenClaw auth-store.ts
 *
 * Protects against credential corruption from crashes during save.
 * Before every save: back up creds.json → creds.json.bak (if valid).
 * On startup: if creds.json is missing/corrupt, restore from backup.
 */

import fsSync from 'node:fs';
import { join } from 'node:path';
import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('creds-backup');

function resolveCredsPath(authDir: string): string {
  return join(authDir, 'creds.json');
}

function resolveBackupPath(authDir: string): string {
  return join(authDir, 'creds.json.bak');
}

function readCredsJsonRaw(filePath: string): string | null {
  try {
    if (!fsSync.existsSync(filePath)) return null;
    const stats = fsSync.statSync(filePath);
    if (!stats.isFile() || stats.size <= 1) return null;
    return fsSync.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Back up creds.json before saving new state.
 * Only overwrites backup if current creds parse correctly.
 */
export function backupCredsBeforeSave(authDir: string): void {
  try {
    const credsPath = resolveCredsPath(authDir);
    const backupPath = resolveBackupPath(authDir);
    const raw = readCredsJsonRaw(credsPath);
    if (raw) {
      try {
        JSON.parse(raw);
        fsSync.copyFileSync(credsPath, backupPath);
      } catch {
        // Current creds are corrupt — don't overwrite a good backup
      }
    }
  } catch {
    // Ignore backup failures — best effort
  }
}

/**
 * Restore creds.json from backup if it's missing or corrupted.
 * Called on startup before loading auth state.
 */
export function maybeRestoreCredsFromBackup(authDir: string): void {
  try {
    const credsPath = resolveCredsPath(authDir);
    const backupPath = resolveBackupPath(authDir);
    const raw = readCredsJsonRaw(credsPath);
    if (raw) {
      JSON.parse(raw); // Validate — if this throws, creds are corrupt
      return; // Creds are fine, nothing to restore
    }

    const backupRaw = readCredsJsonRaw(backupPath);
    if (!backupRaw) return; // No backup either

    JSON.parse(backupRaw); // Validate backup
    fsSync.copyFileSync(backupPath, credsPath);
    log.info(`Restored corrupted creds.json from backup in ${authDir}`);
  } catch {
    // Ignore — both creds and backup are gone or corrupt
  }
}

/**
 * Get the age of the credentials file in milliseconds, or null if missing.
 */
export function getCredsAgeMs(authDir: string): number | null {
  try {
    const stats = fsSync.statSync(resolveCredsPath(authDir));
    return Date.now() - stats.mtimeMs;
  } catch {
    return null;
  }
}
