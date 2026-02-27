/**
 * Migration runner — executes SQL files from database/migrations/ in order.
 * Uses pg (node-postgres) to connect and run each file.
 * Tracks applied migrations in a `_migrations` table to avoid re-running.
 */

import { Client } from 'pg';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DATABASE_URL = process.env.DATABASE_URL;

async function runMigrations(): Promise<void> {
  console.log('[migrations] Starting migration runner...');

  if (!DATABASE_URL) {
    console.log('[migrations] No DATABASE_URL set — skipping migrations.');
    return;
  }

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('[migrations] Connected to database.');

    // Create tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Find migration SQL files
    const migrationsDir = resolve(import.meta.dirname ?? '.', '../../database/migrations');
    let files: string[];
    try {
      files = readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
    } catch {
      console.warn(`[migrations] Could not read ${migrationsDir} — no migrations to run.`);
      return;
    }

    if (files.length === 0) {
      console.log('[migrations] No .sql files found.');
      return;
    }

    // Get already-applied migrations
    const { rows: applied } = await client.query('SELECT filename FROM _migrations');
    const appliedSet = new Set(applied.map((r: { filename: string }) => r.filename));

    let count = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`[migrations] Skipping ${file} (already applied)`);
        continue;
      }

      const sql = readFileSync(join(migrationsDir, file), 'utf-8').trim();
      if (!sql || sql.startsWith('-- TODO')) {
        console.log(`[migrations] Skipping ${file} (empty/TODO)`);
        // Mark as applied so we don't check again
        await client.query('INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
        continue;
      }

      console.log(`[migrations] Applying ${file}...`);
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        console.log(`[migrations] ✓ ${file}`);
        count++;
      } catch (err) {
        console.error(`[migrations] ✗ ${file}:`, (err as Error).message);
        // Don't abort — IF NOT EXISTS means most failures are non-fatal
      }
    }

    console.log(`[migrations] Done. ${count} new migration(s) applied.`);
  } catch (err) {
    console.error('[migrations] Fatal:', (err as Error).message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

runMigrations().catch(err => {
  console.error('[migrations] Fatal:', err);
  process.exit(1);
});
