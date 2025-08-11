// Global test setup for Vitest
// This file runs before all tests to ensure proper isolation

import { afterEach, beforeEach, vi } from 'vitest';

// Global setup to ensure test isolation
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  vi.restoreAllMocks();

  // Clear any module mocks
  vi.resetModules();

  // Clear any timers
  vi.clearAllTimers();

  // Use real timers by default
  vi.useRealTimers();
});

afterEach(() => {
  // Aggressive cleanup after each test
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.resetModules();
  vi.clearAllTimers();
  vi.useRealTimers();
});

// Ensure process doesn't exit during tests
process.exit = vi.fn() as any;
