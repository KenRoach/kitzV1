/**
 * Migration runner — executes SQL files from database/migrations/ in order.
 * Uses pg (node-postgres) to connect and run each file.
 * Tracks applied migrations in a `_migrations` table to avoid re-running.
 */

import { Client } from 'pg';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createSubsystemLogger } from '../src/logging.js';

const log = createSubsystemLogger('migrations');
const DATABASE_URL = process.env.DATABASE_URL;

async function runMigrations(): Promise<void> {
  log.info('Starting migration runner...');

  if (!DATABASE_URL) {
    log.info('No DATABASE_URL set — skipping migrations.');
    return;
  }

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    log.info('Connected to database.');

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
      log.warn(`Could not read ${migrationsDir} — no migrations to run.`);
      return;
    }

    if (files.length === 0) {
      log.info('No .sql files found.');
      return;
    }

    // Get already-applied migrations
    const { rows: applied } = await client.query('SELECT filename FROM _migrations');
    const appliedSet = new Set(applied.map((r: { filename: string }) => r.filename));

    let count = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        log.info(`Skipping ${file} (already applied)`);
        continue;
      }

      const sql = readFileSync(join(migrationsDir, file), 'utf-8').trim();
      if (!sql || sql.startsWith('-- TODO')) {
        log.info(`Skipping ${file} (empty/TODO)`);
        // Mark as applied so we don't check again
        await client.query('INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
        continue;
      }

      log.info(`Applying ${file}...`);
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        log.info(`Applied ${file}`);
        count++;
      } catch (err) {
        log.error(`Failed ${file}: ${(err as Error).message}`);
        // Don't abort — IF NOT EXISTS means most failures are non-fatal
      }
    }

    log.info(`Done. ${count} new migration(s) applied.`);
  } catch (err) {
    log.error(`Fatal: ${(err as Error).message}`);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

runMigrations().catch(err => {
  log.error(`Fatal: ${err}`);
  process.exit(1);
});
