import nodeCron from 'node-cron';

// Add fetch polyfill for Node.js environment
import { fetch, Headers, Request, Response } from 'undici';

// Store the original fetch for restoration
const originalFetch = fetch;

Object.assign(globalThis, {
  fetch,
  Headers,
  Request,
  Response,
});

// Clean up any existing cron jobs before tests start
beforeAll(() => {
  // Destroy all existing cron tasks
  const tasks = nodeCron.getTasks();
  tasks.forEach((task) => {
    task.destroy();
  });
});

afterAll(() => {
  // Clean up all cron tasks after tests complete
  const tasks = nodeCron.getTasks();
  tasks.forEach((task) => {
    task.destroy();
  });
});

import { afterEach, beforeEach, vi } from 'vitest';
import { waitFor } from '../core/utils/debug/async';
import { cleanTestDirectory } from '../test-utils';

beforeEach(async () => {
  // Add small delay to prevent tests from stressing the computer
  await waitFor(50);
});

afterEach(async () => {
  // Ensure fetch is always restored to the original undici implementation
  // This is a safety net in case any test mocks fetch but forgets to restore it
  if (global.fetch !== originalFetch) {
    (global as any).fetch = originalFetch;
  }

  // Add small delay to ensure cleanup completes
  await waitFor(50);
});

afterAll(async () => {
  // Add small delay to ensure all tests are complete
  await cleanTestDirectory('./config');
  await cleanTestDirectory('./tests/core/key-management/test-certs');

  await waitFor(50);

  vi.restoreAllMocks();
});

// Ensure process doesn't exit during tests
process.exit = vi.fn() as any;
