import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/test-setup.ts'],
    env: {
      NODE_ENV: 'test',
      DISABLE_KEY_ROTATION_CRON: 'true',
    },
    coverage: {
      provider: 'v8', // Required in newer versions
      reporter: ['text', 'html', 'json'],
      exclude: ['node_modules/', 'dist/', '*.config.*', 'tests/', '**/*.test.*', '**/*.spec.*'],
    },
    testTimeout: 30000, // 30 seconds for crypto operations
    hookTimeout: 10000, // 10 seconds for setup
    teardownTimeout: 10000,
    // Force sequential execution to prevent race conditions
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  define: {
    global: 'globalThis',
  },
});
