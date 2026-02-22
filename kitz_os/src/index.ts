/**
 * KITZ OS — AI Business Operating System
 *
 * Entry point. Boots the kernel, starts the Fastify control plane,
 * wires all tools, and begins cadence scheduling.
 */

import 'dotenv/config';
import { KitzKernel } from './kernel.js';

const kernel = new KitzKernel();

async function main() {
  try {
    await kernel.boot();
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      module: 'kitz-os',
      event: 'boot_complete',
      status: kernel.getStatus().status,
      tools: kernel.getStatus().toolCount,
      port: process.env.PORT || 3012,
    }));
  } catch (err) {
    console.error('KITZ OS boot failed:', err);
    process.exit(1);
  }
}

// Graceful shutdown
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    console.log(`\n[kitz-os] Received ${sig}, shutting down…`);
    await kernel.shutdown();
    process.exit(0);
  });
}

main();
