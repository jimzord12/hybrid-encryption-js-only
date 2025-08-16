import { describe, expect, it } from 'vitest';
import {
  ComparisonUtils,
  arraysDeepEqual,
  deepEqual,
  objectsDeepEqual,
} from '../../../src/core/utils/comparison.utils';

describe('ComparisonUtils - Deep Comparison', () => {
  describe('deepEqual function', () => {
    it('should return true for identical primitive values', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual('test', 'test')).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
    });

    it('should return false for different primitive values', () => {
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual('test', 'different')).toBe(false);
      expect(deepEqual(true, false)).toBe(false);
      expect(deepEqual(null, undefined)).toBe(false);
    });

    it('should handle NaN correctly', () => {
      expect(deepEqual(NaN, NaN)).toBe(true);
      expect(deepEqual(NaN, 1)).toBe(false);
    });

    it('should handle +0 and -0 correctly', () => {
      expect(deepEqual(0, -0)).toBe(false);
      expect(deepEqual(+0, +0)).toBe(true);
      expect(deepEqual(-0, -0)).toBe(true);
    });

    it('should compare arrays correctly', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(deepEqual([], [])).toBe(true);
    });

    it('should compare nested arrays correctly', () => {
      expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
      expect(deepEqual([1, [2, 3]], [1, [2, 4]])).toBe(false);
      expect(
        deepEqual(
          [
            [1, 2],
            [3, 4],
          ],
          [
            [1, 2],
            [3, 4],
          ],
        ),
      ).toBe(true);
    });

    it('should compare objects correctly', () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(deepEqual({}, {})).toBe(true);
    });

    it('should compare nested objects correctly', () => {
      const obj1 = { a: 1, b: { c: 2, d: 3 } };
      const obj2 = { a: 1, b: { c: 2, d: 3 } };
      const obj3 = { a: 1, b: { c: 2, d: 4 } };

      expect(deepEqual(obj1, obj2)).toBe(true);
      expect(deepEqual(obj1, obj3)).toBe(false);
    });

    it('should compare mixed arrays and objects', () => {
      const obj1 = { a: [1, 2, { b: 3 }], c: { d: [4, 5] } };
      const obj2 = { a: [1, 2, { b: 3 }], c: { d: [4, 5] } };
      const obj3 = { a: [1, 2, { b: 4 }], c: { d: [4, 5] } };

      expect(deepEqual(obj1, obj2)).toBe(true);
      expect(deepEqual(obj1, obj3)).toBe(false);
    });

    it('should handle Date objects', () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-01-01');
      const date3 = new Date('2023-01-02');

      expect(deepEqual(date1, date2)).toBe(true);
      expect(deepEqual(date1, date3)).toBe(false);
    });

    it('should handle RegExp objects', () => {
      expect(deepEqual(/abc/g, /abc/g)).toBe(true);
      expect(deepEqual(/abc/g, /abc/i)).toBe(false);
      expect(deepEqual(/abc/, /def/)).toBe(false);
    });

    it('should handle Maps', () => {
      const map1 = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      const map2 = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      const map3 = new Map([
        ['a', 1],
        ['b', 3],
      ]);

      expect(deepEqual(map1, map2)).toBe(true);
      expect(deepEqual(map1, map3)).toBe(false);
    });

    it('should handle Sets', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 3]);
      const set3 = new Set([1, 2, 4]);

      expect(deepEqual(set1, set2)).toBe(true);
      expect(deepEqual(set1, set3)).toBe(false);
    });

    it('should handle TypedArrays', () => {
      const arr1 = new Uint8Array([1, 2, 3]);
      const arr2 = new Uint8Array([1, 2, 3]);
      const arr3 = new Uint8Array([1, 2, 4]);

      expect(deepEqual(arr1, arr2)).toBe(true);
      expect(deepEqual(arr1, arr3)).toBe(false);
    });

    it('should handle ArrayBuffers', () => {
      const buf1 = new ArrayBuffer(4);
      const buf2 = new ArrayBuffer(4);
      const buf3 = new ArrayBuffer(8);

      const view1 = new Uint8Array(buf1);
      const view2 = new Uint8Array(buf2);
      view1[0] = 1;
      view2[0] = 1;

      expect(deepEqual(buf1, buf2)).toBe(true);
      expect(deepEqual(buf1, buf3)).toBe(false);
    });

    it('should handle functions', () => {
      const fn1 = () => 'test';
      const fn2 = () => 'test';
      const fn3 = () => 'different';

      expect(deepEqual(fn1, fn1)).toBe(true); // Same reference
      expect(deepEqual(fn1, fn2)).toBe(true); // Same string representation
      expect(deepEqual(fn1, fn3)).toBe(false);
    });
  });

  describe('deepEqual with options', () => {
    it('should ignore undefined properties when specified', () => {
      const obj1 = { a: 1, b: undefined };
      const obj2 = { a: 1 };

      expect(deepEqual(obj1, obj2, { ignoreUndefined: true })).toBe(true);
      expect(deepEqual(obj1, obj2, { ignoreUndefined: false })).toBe(false);
    });

    it('should treat null and undefined as equal when specified', () => {
      expect(deepEqual(null, undefined, { nullUndefinedEqual: true })).toBe(true);
      expect(deepEqual(null, undefined, { nullUndefinedEqual: false })).toBe(false);
    });

    it('should handle strict type checking', () => {
      expect(deepEqual('1', 1, { strictTypes: true })).toBe(false);
      expect(deepEqual('1', 1, { strictTypes: false })).toBe(false); // Still false due to === comparison
    });

    it('should respect maximum depth limit', () => {
      // Create two deeply nested structures that are equal but not the same reference
      function createDeepStructure(depth: number): any {
        if (depth <= 0) return { value: 'end' };
        return { nested: createDeepStructure(depth - 1), level: depth };
      }

      const deep1 = createDeepStructure(10);
      const deep2 = createDeepStructure(10);

      expect(() => deepEqual(deep1, deep2, { maxDepth: 5 })).toThrow();
    });

    it('should use custom comparers', () => {
      const customComparers = new Map();
      customComparers.set('string', (a: string, b: string) => a.toLowerCase() === b.toLowerCase());

      expect(deepEqual('Hello', 'HELLO', { customComparers })).toBe(true);
      expect(deepEqual('Hello', 'World', { customComparers })).toBe(false);
    });
  });

  describe('ComparisonUtils class', () => {
    it('should compare arrays (shallow)', () => {
      expect(ComparisonUtils.arraysEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(ComparisonUtils.arraysEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    it('should compare arrays (deep)', () => {
      const arr1 = [1, { a: 2 }, [3, 4]];
      const arr2 = [1, { a: 2 }, [3, 4]];
      const arr3 = [1, { a: 3 }, [3, 4]];

      expect(ComparisonUtils.arraysDeepEqual(arr1, arr2)).toBe(true);
      expect(ComparisonUtils.arraysDeepEqual(arr1, arr3)).toBe(false);
    });

    it('should check if objects have same keys', () => {
      expect(ComparisonUtils.sameKeys({ a: 1, b: 2 }, { a: 3, b: 4 })).toBe(true);
      expect(ComparisonUtils.sameKeys({ a: 1, b: 2 }, { a: 3, c: 4 })).toBe(false);
    });

    it('should compare objects deeply', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 2 } };
      const obj3 = { a: 1, b: { c: 3 } };

      expect(ComparisonUtils.objectsEqual(obj1, obj2)).toBe(true);
      expect(ComparisonUtils.objectsEqual(obj1, obj3)).toBe(false);
    });

    it('should create custom comparers', () => {
      const options = ComparisonUtils.createCustomComparer(
        'number',
        (a: number, b: number) => Math.abs(a - b) < 0.001,
      );

      expect(deepEqual(1.0001, 1.0002, options)).toBe(true);
      expect(deepEqual(1.0001, 1.002, options)).toBe(false);
    });
  });

  describe('convenience functions', () => {
    it('arraysDeepEqual should work correctly', () => {
      const arr1 = [1, { a: 2 }, [3, 4]];
      const arr2 = [1, { a: 2 }, [3, 4]];

      expect(arraysDeepEqual(arr1, arr2)).toBe(true);
      expect(arr1 === arr2).toBe(false); // Reference comparison should be false
    });

    it('objectsDeepEqual should work correctly', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 2 } };

      expect(objectsDeepEqual(obj1, obj2)).toBe(true);
      expect(obj1 === obj2).toBe(false); // Reference comparison should be false
    });
  });

  describe('edge cases', () => {
    it('should handle circular references', () => {
      const obj1: any = { a: 1 };
      obj1.self = obj1;

      const obj2: any = { a: 1 };
      obj2.self = obj2;

      expect(deepEqual(obj1, obj2)).toBe(true);
    });

    it('should handle very deep nesting', () => {
      let deep1: any = {};
      let deep2: any = {};
      let current1 = deep1;
      let current2 = deep2;

      for (let i = 0; i < 50; i++) {
        current1.next = { value: i };
        current2.next = { value: i };
        current1 = current1.next;
        current2 = current2.next;
      }

      expect(deepEqual(deep1, deep2)).toBe(true);
    });

    it('should handle Sets with objects', () => {
      const set1 = new Set([{ a: 1 }, { b: 2 }]);
      const set2 = new Set([{ a: 1 }, { b: 2 }]);

      expect(deepEqual(set1, set2)).toBe(true);
    });

    it('should handle Maps with complex keys and values', () => {
      const map1 = new Map();
      map1.set({ key: 'a' }, { value: 1 });
      map1.set({ key: 'b' }, { value: 2 });

      const map2 = new Map();
      map2.set({ key: 'a' }, { value: 1 });
      map2.set({ key: 'b' }, { value: 2 });

      expect(deepEqual(map1, map2)).toBe(true);
    });

    it('should handle mixed types in arrays', () => {
      const arr1 = [1, 'test', { a: 1 }, [2, 3], new Date('2023-01-01'), /abc/];
      const arr2 = [1, 'test', { a: 1 }, [2, 3], new Date('2023-01-01'), /abc/];

      expect(deepEqual(arr1, arr2)).toBe(true);
    });
  });

  describe('performance and reliability', () => {
    it('should handle large arrays efficiently', () => {
      const largeArray1 = Array.from({ length: 1000 }, (_, i) => i);
      const largeArray2 = Array.from({ length: 1000 }, (_, i) => i);
      const largeArray3 = Array.from({ length: 1000 }, (_, i) => i + 1);

      expect(deepEqual(largeArray1, largeArray2)).toBe(true);
      expect(deepEqual(largeArray1, largeArray3)).toBe(false);
    });

    it('should handle large objects efficiently', () => {
      const largeObj1: Record<string, number> = {};
      const largeObj2: Record<string, number> = {};

      for (let i = 0; i < 1000; i++) {
        largeObj1[`key${i}`] = i;
        largeObj2[`key${i}`] = i;
      }

      expect(deepEqual(largeObj1, largeObj2)).toBe(true);
    });
  });
});
