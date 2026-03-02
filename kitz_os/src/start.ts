#!/usr/bin/env tsx
/**
 * KITZ One-Command Launcher
 *
 * Starts kitz_os server in the background, waits for it to be ready,
 * then launches the CLI — all in one terminal.
 *
 * Usage: npm start (from repo root)
 */

import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KITZ_OS_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(KITZ_OS_DIR, '..');
const PORT = process.env.PORT || '3012';
const HEALTH_URL = `http://localhost:${PORT}/health`;

async function waitForServer(maxWaitMs = 15000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(1000) });
      if (res.ok) return true;
    } catch { /* not ready yet */ }
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function isServerRunning(): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch { return false; }
}

async function main() {
  // Clear screen + scrollback immediately so npm header disappears
  process.stdout.write('\x1b[2J\x1b[3J\x1b[H');

  const alreadyRunning = await isServerRunning();
  let serverProc: ReturnType<typeof spawn> | null = null;

  if (!alreadyRunning) {
    serverProc = spawn('npx', ['tsx', 'src/index.ts'], {
      cwd: KITZ_OS_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
      detached: false,
    });

    // Suppress server output (the CLI shows status in its boot screen)
    serverProc.stdout?.resume();
    serverProc.stderr?.resume();

    serverProc.on('error', (err) => {
      process.stderr.write(`\x1b[31m  Failed to start kitz_os: ${err.message}\x1b[0m\n`);
      process.exit(1);
    });

    const ready = await waitForServer();
    if (!ready) {
      process.stderr.write('\x1b[31m  kitz_os failed to start within 15s\x1b[0m\n');
      serverProc.kill();
      process.exit(1);
    }
  }

  // Launch the CLI (replaces this process's stdio)
  const cli = spawn('npx', ['tsx', 'kitz_os/src/cli.ts'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: { ...process.env },
  });

  cli.on('exit', (code) => {
    if (serverProc) {
      serverProc.kill('SIGTERM');
    }
    process.exit(code ?? 0);
  });

  // Forward signals to CLI
  for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.on(sig, () => {
      cli.kill(sig);
      if (serverProc) serverProc.kill(sig);
    });
  }
}

main().catch((err) => {
  process.stderr.write(`\x1b[31m  Start failed: ${err.message}\x1b[0m\n`);
  process.exit(1);
});
