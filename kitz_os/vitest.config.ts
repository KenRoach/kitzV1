import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      'node_modules/**',
      'dist/**',
      // These files use node:test, not vitest
      'src/aiBattery.test.ts',
      'src/integration-mvp.test.ts',
      'src/simulation-10users.test.ts',
    ],
  },
});
