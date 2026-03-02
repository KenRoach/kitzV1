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
  try {
    await kernel.boot();
    const status = kernel.getStatus();
    log.info('boot_complete', {
      status: status.status,
      tools: status.toolCount,
      port: process.env.PORT || '3012',
    });

    printBanner({
      tools: status.toolCount,
      agents: 33,
      port: process.env.PORT || '3012',
      version: '0.1.0',
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
