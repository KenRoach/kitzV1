/**
 * KITZ OS — AI Business Operating System
 *
 * Entry point. Boots the kernel, starts the Fastify control plane,
 * wires all tools, and begins cadence scheduling.
 */

import 'dotenv/config';
import { createSubsystemLogger } from 'kitz-schemas';
import { KitzKernel } from './kernel.js';
import { printBanner } from './boot/banner.js';

const log = createSubsystemLogger('kitz-os');
const kernel = new KitzKernel();

async function main() {
  // Suppress noisy JSON logs during boot — only show the clean banner.
  // Use LOG_LEVEL=debug to see all boot logs for troubleshooting.
  const bootWarnings: string[] = [];
  const origLog = console.log;
  const origWarn = console.warn;
  const origErr = console.error;
  const debugBoot = ['trace', 'debug'].includes(process.env.LOG_LEVEL || '');

  if (!debugBoot) {
    console.log = () => {};
    console.warn = (...args: unknown[]) => { bootWarnings.push(String(args[0])); };
    console.error = (...args: unknown[]) => { bootWarnings.push(String(args[0])); };
  }

  try {
    await kernel.boot();
    const status = kernel.getStatus();

    // Restore console before banner so it renders
    if (!debugBoot) {
      console.log = origLog;
      console.warn = origWarn;
      console.error = origErr;
    }

    printBanner({
      tools: status.toolCount,
      agents: 33,
      port: process.env.PORT || '3012',
      version: '0.1.0',
    });

    // Clear "ready" line so operator knows server is up
    const port = process.env.PORT || '3012';
    process.stdout.write(`\n  \x1b[32m●\x1b[0m KITZ OS ready on http://localhost:${port}\n\n`);

    if (bootWarnings.length > 0) {
      log.warn(`${bootWarnings.length} warning(s) during boot — run with LOG_LEVEL=debug to see details`);
    }
  } catch (err) {
    // Restore console so fatal error is visible
    if (!debugBoot) {
      console.log = origLog;
      console.warn = origWarn;
      console.error = origErr;
    }
    log.fatal('boot failed', { error: (err as Error).message });
    process.exit(1);
  }
}

// ── Process-Level Self-Healing ──
// Stay alive through transient errors — Docker/Railway handles full restarts.
process.on('uncaughtException', (err) => {
  console.error('[SELF-HEAL] Uncaught exception (staying alive):', err.message);
  log.error('uncaughtException — process staying alive', { error: err.message, stack: err.stack });
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.error('[SELF-HEAL] Unhandled rejection (staying alive):', msg);
  log.error('unhandledRejection — process staying alive', { reason: msg });
});

// Graceful shutdown
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    log.info(`Received ${sig}, shutting down…`);
    await kernel.shutdown();
    process.exit(0);
  });
}

main();
