// Global test setup for Vitest
// This file runs before all tests to ensure proper isolation

import fs from 'node:fs/promises';
import { afterEach, beforeEach, vi } from 'vitest';
import { waitFor } from '../core/utils/debug/async';

beforeEach(async () => {
  // Add small delay to prevent tests from stressing the computer
  await waitFor(50);
});

afterEach(async () => {
  // Add small delay to ensure cleanup completes
  await waitFor(50);
});

afterAll(async () => {
  // Add small delay to ensure all tests are complete
  await fs.rm('./config', { recursive: true, force: true }).catch(() => {});

  await waitFor(50);
});

// Ensure process doesn't exit during tests
process.exit = vi.fn() as any;
