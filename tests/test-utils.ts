import { access, mkdir, readdir, rm, rmdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { deepEqual, type DeepComparisonOptions } from '../src/core/utils/comparison.utils';

/**
 * Test utilities for consistent testing across the hybrid encryption library
 */

/**
 * Enhanced assertion for deep equality with better error messages
 */
export function expectDeepEqual<T>(
  actual: T,
  expected: T,
  options?: DeepComparisonOptions,
  message?: string,
): void {
  const isEqual = deepEqual(actual, expected, options);

  if (!isEqual) {
    const errorMessage = message
      ? `${message}: Expected objects to be deeply equal`
      : 'Expected objects to be deeply equal';

    throw new Error(
      `${errorMessage}\nActual: ${JSON.stringify(actual, null, 2)}\nExpected: ${JSON.stringify(expected, null, 2)}`,
    );
  }
}

/**
 * Helper to create test data structures for comparison testing
 */
export class TestDataFactory {
  /**
   * Create a complex nested object for testing
   */
  static createComplexObject(depth: number = 3): any {
    if (depth <= 0) {
      return Math.random();
    }

    return {
      number: Math.floor(Math.random() * 100),
      string: `test-${Math.random().toString(36).substring(7)}`,
      array: Array.from({ length: 3 }, (_, i) =>
        i === 0 ? this.createComplexObject(depth - 1) : Math.random(),
      ),
      nested: this.createComplexObject(depth - 1),
      date: new Date(),
      regexp: /test-\d+/g,
    };
  }

  /**
   * Create a deep copy of an object for testing equality
   */
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}

/**
 * Assertion helpers for common test scenarios
 */
export class AssertionHelpers {
  /**
   * Assert that two arrays are deeply equal
   */
  static expectArraysEqual<T>(actual: T[], expected: T[], message?: string): void {
    expectDeepEqual(actual, expected, {}, message ?? 'Arrays should be deeply equal');
  }

  /**
   * Assert that two objects are deeply equal
   */
  static expectObjectsEqual(
    actual: Record<string, any>,
    expected: Record<string, any>,
    message?: string,
  ): void {
    expectDeepEqual(actual, expected, {}, message ?? 'Objects should be deeply equal');
  }

  /**
   * Assert that arrays have the same content regardless of order
   */
  static expectArraysEqualUnordered<T>(actual: T[], expected: T[]): void {
    if (actual.length !== expected.length) {
      throw new Error(`Arrays have different lengths: ${actual.length} vs ${expected.length}`);
    }

    const sortedActual = [...actual].sort();
    const sortedExpected = [...expected].sort();

    expectDeepEqual(sortedActual, sortedExpected, {}, 'Arrays should contain the same elements');
  }
}

export const getDirnameESM = (filePath: string): string => {
  const __dirname = new URL('.', import.meta.url).pathname;
  return resolve(__dirname, filePath);
};

/**
 * Clean test directory utility
 */
export async function cleanTestDirectory(dir: string, skipCreation = false): Promise<void> {
  try {
    // Check if directory exists
    try {
      await access(dir);
    } catch {
      if (!skipCreation) {
        // Directory doesn't exist, create it
        await mkdir(dir, { recursive: true });
      }
      return;
    }

    // If directory exists, read its contents
    const files = await readdir(dir);

    // Delete all files in the directory
    const deletePromises = files.map(async (file) => {
      const filePath = join(dir, file);
      const stats = await stat(filePath);

      if (stats.isDirectory()) {
        await rm(filePath, { recursive: true, force: true });
      } else {
        await rm(filePath, { force: true });
      }
    });

    await Promise.all(deletePromises);

    await deleteDirectoryIfEmpty(dir);
  } catch (error) {
    console.warn('Failed to clean test directory:', error);
  }
}

/**
 * Delete the directory at `dir` only if it exists and is empty.
 *
 * Returns `true` when the directory was removed, `false` otherwise.
 */
export async function deleteDirectoryIfEmpty(dir: string): Promise<boolean> {
  try {
    const stats = await stat(dir);

    if (!stats.isDirectory()) {
      // Not a directory — nothing to delete
      return false;
    }

    const entries = await readdir(dir);
    if (entries.length !== 0) {
      // Directory not empty
      return false;
    }

    // Directory exists and is empty — remove it
    await rmdir(dir);
    return true;
  } catch (error: any) {
    // If the directory doesn't exist, treat as not removed
    if (error && error.code === 'ENOENT') return false;
    console.warn('Failed to remove empty directory:', error);
    return false;
  }
}
