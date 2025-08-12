// Global test setup for Vitest
// This file runs before all tests to ensure proper isolation

import { afterEach, beforeEach, vi } from 'vitest';
import { KeyManager } from '../../src/core/key-rotation';
import { cleanTestDirectory } from '../core/key-management/key-management.test';
import { waitFor } from '../debug/async';

// // Global setup to ensure test isolation
// beforeEach(() => {
//   // Clear all mocks before each test
//   vi.clearAllMocks();
//   vi.restoreAllMocks();

//   // Clear any module mocks
//   vi.resetModules();

//   // Clear any timers
//   vi.clearAllTimers();

//   // Use real timers by default
//   vi.useRealTimers();
// });

// afterEach(() => {
//   // Aggressive cleanup after each test
//   vi.clearAllMocks();
//   vi.restoreAllMocks();
//   vi.resetModules();
//   vi.clearAllTimers();
//   vi.useRealTimers();
// });

beforeEach(async () => {
  // Reset singleton FIRST before cleanup
  KeyManager.resetInstance();

  // Clean test directory with explicit wait
  await cleanTestDirectory();

  // Add small delay to ensure filesystem operations complete
  await waitFor(150);
});

afterEach(async () => {
  KeyManager.resetInstance();

  // Add small delay to ensure cleanup completes
  await waitFor(150);
});

// Ensure process doesn't exit during tests
process.exit = vi.fn() as any;
