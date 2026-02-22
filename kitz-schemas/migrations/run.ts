/**
 * Migration runner — MVP placeholder.
 * In production, replace with a real migration tool (e.g., prisma, drizzle, or raw SQL runner).
 * For now, ensures docker-compose `migrate` service exits successfully.
 */

const DATABASE_URL = process.env.DATABASE_URL;

async function runMigrations(): Promise<void> {
  console.log('[migrations] Starting migration runner...');

  if (!DATABASE_URL) {
    console.log('[migrations] No DATABASE_URL set — skipping migrations.');
    return;
  }

  console.log('[migrations] DATABASE_URL detected. Verifying connection...');

  // Basic connectivity check using built-in pg protocol
  // For MVP, we just verify the database is reachable
  try {
    const url = new URL(DATABASE_URL);
    const net = await import('node:net');
    await new Promise<void>((resolve, reject) => {
      const socket = net.createConnection(
        { host: url.hostname, port: Number(url.port) || 5432, timeout: 5000 },
        () => { socket.destroy(); resolve(); }
      );
      socket.on('error', reject);
      socket.on('timeout', () => { socket.destroy(); reject(new Error('Connection timeout')); });
    });
    console.log('[migrations] Database is reachable. Ready for migrations.');
  } catch (err) {
    console.warn('[migrations] Could not reach database:', (err as Error).message);
    console.warn('[migrations] Services will use in-memory stores as fallback.');
  }

  console.log('[migrations] Migration runner complete.');
}

runMigrations().catch(err => {
  console.error('[migrations] Fatal:', err);
  process.exit(1);
});
