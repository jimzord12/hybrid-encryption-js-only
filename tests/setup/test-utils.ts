import { deepEqual, type DeepComparisonOptions } from '../../src/core/utils/comparison.utils';

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
    expectDeepEqual(actual, expected, {}, message || 'Arrays should be deeply equal');
  }

  /**
   * Assert that two objects are deeply equal
   */
  static expectObjectsEqual(
    actual: Record<string, any>,
    expected: Record<string, any>,
    message?: string,
  ): void {
    expectDeepEqual(actual, expected, {}, message || 'Objects should be deeply equal');
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
