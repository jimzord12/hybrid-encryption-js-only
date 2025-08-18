/**
 * Comprehensive deep comparison utilities for objects, arrays, and primitives
 * Provides strict equality checking for complex data structures
 */

/**
 * Deep comparison options
 */
export interface DeepComparisonOptions {
  /** Whether to ignore undefined properties in objects */
  ignoreUndefined?: boolean;
  /** Whether to treat null and undefined as equal */
  nullUndefinedEqual?: boolean;
  /** Whether to perform strict type checking (e.g., '1' !== 1) */
  strictTypes?: boolean;
  /** Maximum depth to prevent infinite recursion */
  maxDepth?: number;
  /** Custom comparison functions for specific types */
  customComparers?: Map<string, (a: any, b: any) => boolean>;
}

/**
 * Default options for deep comparison
 */
const DEFAULT_OPTIONS: DeepComparisonOptions = {
  ignoreUndefined: false,
  nullUndefinedEqual: false,
  strictTypes: true,
  maxDepth: 100,
  customComparers: new Map(),
};

/**
 * Performs a deep comparison between two values
 * @param a - First value to compare
 * @param b - Second value to compare
 * @param options - Comparison options
 * @returns True if values are deeply equal, false otherwise
 * @throws {Error} When maximum depth is exceeded
 *
 * @example
 * ```typescript
 * const obj1 = { a: 1, b: [2, 3, { c: 4 }] };
 * const obj2 = { a: 1, b: [2, 3, { c: 4 }] };
 *
 * console.log(deepEqual(obj1, obj2)); // true
 * console.log(obj1 === obj2); // false
 *
 * const arr1 = [1, 2, { a: 'test' }];
 * const arr2 = [1, 2, { a: 'test' }];
 * console.log(deepEqual(arr1, arr2)); // true
 * ```
 */
export function deepEqual(a: any, b: any, options: DeepComparisonOptions = {}): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return deepEqualInternal(a, b, opts, 0, new Set());
}

/**
 * Internal recursive deep comparison function
 */
function deepEqualInternal(
  a: any,
  b: any,
  options: DeepComparisonOptions,
  depth: number,
  visited: Set<any>,
): boolean {
  // Check maximum depth
  if (depth > (options.maxDepth || 100)) {
    throw new Error(`Maximum comparison depth of ${options.maxDepth} exceeded`);
  }

  // Null and undefined handling (check before same reference)
  if (a == null || b == null) {
    if (options.nullUndefinedEqual) {
      return (a == null) === (b == null);
    }
    return a === b;
  }

  // Type checking early
  const typeA = getType(a);
  const typeB = getType(b);

  if (options.strictTypes && typeA !== typeB) {
    return false;
  }

  // Custom comparers (check before default handling)
  if (options.customComparers?.has(typeA)) {
    const comparer = options.customComparers.get(typeA)!;
    return comparer(a, b);
  }

  // Handle special number cases before reference check (only if no custom comparer)
  if (typeA === 'number' && typeB === 'number') {
    return compareNumbers(a, b);
  }

  // Same reference check (after special handling)
  if (a === b) return true;

  // Handle circular references - create a unique key for the pair
  const pairKey = `${getObjectId(a)}-${getObjectId(b)}`;
  if (visited.has(pairKey)) {
    return true; // Already comparing this pair, assume equal to avoid infinite recursion
  }

  // Add to visited set for circular reference detection
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    visited.add(pairKey);
  }

  let result: boolean;

  try {
    // Type-specific comparisons
    switch (typeA) {
      case 'number':
        result = compareNumbers(a, b);
        break;
      case 'string':
      case 'boolean':
      case 'bigint':
      case 'symbol':
        result = a === b;
        break;
      case 'date':
        result = compareDates(a, b);
        break;
      case 'regexp':
        result = compareRegExp(a, b);
        break;
      case 'array':
        result = compareArrays(a, b, options, depth, visited);
        break;
      case 'object':
        result = compareObjects(a, b, options, depth, visited);
        break;
      case 'map':
        result = compareMaps(a, b, options, depth, visited);
        break;
      case 'set':
        result = compareSets(a, b, options, depth, visited);
        break;
      case 'arraybuffer':
        result = compareArrayBuffers(a, b);
        break;
      case 'uint8array':
      case 'uint16array':
      case 'uint32array':
      case 'int8array':
      case 'int16array':
      case 'int32array':
      case 'float32array':
      case 'float64array':
        result = compareTypedArrays(a, b);
        break;
      case 'function':
        result = compareFunctions(a, b);
        break;
      default:
        result = a === b;
    }
  } finally {
    // Clean up visited set
    if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
      visited.delete(pairKey);
    }
  }

  return result;
}

/**
 * Get a unique identifier for objects to track circular references
 */
let objectIdCounter = 0;
const objectIdMap = new WeakMap<any, number>();

function getObjectId(obj: any): number {
  if (typeof obj !== 'object' || obj === null) {
    return 0;
  }

  if (!objectIdMap.has(obj)) {
    objectIdMap.set(obj, ++objectIdCounter);
  }

  return objectIdMap.get(obj)!;
}

/**
 * Get detailed type of a value
 */
function getType(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  const type = typeof value;
  if (type !== 'object') return type;

  // Detailed object type detection
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  if (value instanceof RegExp) return 'regexp';
  if (value instanceof Map) return 'map';
  if (value instanceof Set) return 'set';
  if (value instanceof ArrayBuffer) return 'arraybuffer';
  if (value instanceof Uint8Array) return 'uint8array';
  if (value instanceof Uint16Array) return 'uint16array';
  if (value instanceof Uint32Array) return 'uint32array';
  if (value instanceof Int8Array) return 'int8array';
  if (value instanceof Int16Array) return 'int16array';
  if (value instanceof Int32Array) return 'int32array';
  if (value instanceof Float32Array) return 'float32array';
  if (value instanceof Float64Array) return 'float64array';

  return 'object';
}

/**
 * Compare two numbers, handling NaN and +0/-0
 */
function compareNumbers(a: number, b: number): boolean {
  if (Number.isNaN(a) && Number.isNaN(b)) return true;
  if (Number.isNaN(a) || Number.isNaN(b)) return false;

  // Handle +0 and -0 distinction
  if (a === 0 && b === 0) {
    // Use 1/x to distinguish +0 from -0
    // 1/+0 = +Infinity, 1/-0 = -Infinity
    return 1 / a === 1 / b;
  }

  return a === b;
}

/**
 * Compare two Date objects
 */
function compareDates(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

/**
 * Compare two RegExp objects
 */
function compareRegExp(a: RegExp, b: RegExp): boolean {
  return a.source === b.source && a.flags === b.flags;
}

/**
 * Compare two arrays
 */
function compareArrays(
  a: any[],
  b: any[],
  options: DeepComparisonOptions,
  depth: number,
  visited: Set<any>,
): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (!deepEqualInternal(a[i], b[i], options, depth + 1, visited)) {
      return false;
    }
  }

  return true;
}

/**
 * Compare two objects
 */
function compareObjects(
  a: Record<string, any>,
  b: Record<string, any>,
  options: DeepComparisonOptions,
  depth: number,
  visited: Set<any>,
): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  // Filter out undefined properties if option is set
  const filteredKeysA = options.ignoreUndefined
    ? keysA.filter((key) => a[key] !== undefined)
    : keysA;
  const filteredKeysB = options.ignoreUndefined
    ? keysB.filter((key) => b[key] !== undefined)
    : keysB;

  if (filteredKeysA.length !== filteredKeysB.length) return false;

  // Sort keys for consistent comparison
  filteredKeysA.sort();
  filteredKeysB.sort();

  // Check if keys are the same
  for (let i = 0; i < filteredKeysA.length; i++) {
    if (filteredKeysA[i] !== filteredKeysB[i]) return false;
  }

  // Compare values
  for (const key of filteredKeysA) {
    if (!deepEqualInternal(a[key], b[key], options, depth + 1, visited)) {
      return false;
    }
  }

  return true;
}

/**
 * Compare two Maps
 */
function compareMaps(
  a: Map<any, any>,
  b: Map<any, any>,
  options: DeepComparisonOptions,
  depth: number,
  visited: Set<any>,
): boolean {
  if (a.size !== b.size) return false;

  // Convert to arrays for deep comparison of keys/values
  const aEntries = Array.from(a.entries());
  const bEntries = Array.from(b.entries());

  // For each entry in a, find a matching entry in b
  for (const [aKey, aValue] of aEntries) {
    let found = false;
    for (const [bKey, bValue] of bEntries) {
      if (
        deepEqualInternal(aKey, bKey, options, depth + 1, visited) &&
        deepEqualInternal(aValue, bValue, options, depth + 1, visited)
      ) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }

  return true;
}

/**
 * Compare two Sets
 */
function compareSets(
  a: Set<any>,
  b: Set<any>,
  options: DeepComparisonOptions,
  depth: number,
  visited: Set<any>,
): boolean {
  if (a.size !== b.size) return false;

  const aArray = Array.from(a);
  const bArray = Array.from(b);

  // For each element in a, find a matching element in b
  for (const aItem of aArray) {
    let found = false;
    for (const bItem of bArray) {
      if (deepEqualInternal(aItem, bItem, options, depth + 1, visited)) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }

  return true;
}

/**
 * Compare two ArrayBuffers
 */
function compareArrayBuffers(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) return false;

  const viewA = new Uint8Array(a);
  const viewB = new Uint8Array(b);

  for (let i = 0; i < viewA.length; i++) {
    if (viewA[i] !== viewB[i]) return false;
  }

  return true;
}

/**
 * Compare two TypedArrays
 */
function compareTypedArrays(a: any, b: any): boolean {
  if (a.constructor !== b.constructor) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

/**
 * Compare two functions
 */
function compareFunctions(a: Function, b: Function): boolean {
  // Functions are compared by reference or string representation
  return a === b || a.toString() === b.toString();
}

/**
 * Utility class for comparison operations
 */
export class ComparisonUtils {
  /**
   * Check if two arrays are equal (shallow comparison)
   */
  static arraysEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  /**
   * Check if two arrays are deeply equal
   */
  static arraysDeepEqual<T>(a: T[], b: T[], options?: DeepComparisonOptions): boolean {
    return deepEqual(a, b, options);
  }

  /**
   * Check if two objects have the same keys (shallow)
   */
  static sameKeys(a: Record<string, any>, b: Record<string, any>): boolean {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    return this.arraysEqual(keysA, keysB);
  }

  /**
   * Check if two objects are structurally equal (deep comparison)
   */
  static objectsEqual(
    a: Record<string, any>,
    b: Record<string, any>,
    options?: DeepComparisonOptions,
  ): boolean {
    return deepEqual(a, b, options);
  }

  /**
   * Create a custom comparer for specific types
   */
  static createCustomComparer<T>(
    typeName: string,
    comparer: (a: T, b: T) => boolean,
  ): DeepComparisonOptions {
    const customComparers = new Map<string, (a: any, b: any) => boolean>();
    customComparers.set(typeName, comparer);
    return { customComparers };
  }
}

/**
 * Convenience function for array deep comparison
 */
export function arraysDeepEqual<T>(a: T[], b: T[], options?: DeepComparisonOptions): boolean {
  return deepEqual(a, b, options);
}

/**
 * Convenience function for object deep comparison
 */
export function objectsDeepEqual(
  a: Record<string, any>,
  b: Record<string, any>,
  options?: DeepComparisonOptions,
): boolean {
  return deepEqual(a, b, options);
}
