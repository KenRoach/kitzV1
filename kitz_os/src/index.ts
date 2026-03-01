/**
 * KITZ OS — AI Business Operating System
 *
 * Entry point. Boots the kernel, starts the Fastify control plane,
 * wires all tools, and begins cadence scheduling.
 */

import 'dotenv/config';
import { createSubsystemLogger } from 'kitz-schemas';
import { KitzKernel } from './kernel.js';

const log = createSubsystemLogger('kitz-os');
const kernel = new KitzKernel();

async function main() {
  try {
    await kernel.boot();
    log.info('boot_complete', {
      status: kernel.getStatus().status,
      tools: kernel.getStatus().toolCount,
      port: process.env.PORT || 3012,
    });
  } catch (err) {
    log.fatal('boot failed', { error: (err as Error).message });
    process.exit(1);
  }
}

// Graceful shutdown
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    log.info(`Received ${sig}, shutting down…`);
    await kernel.shutdown();
    process.exit(0);
  });
}

main();
