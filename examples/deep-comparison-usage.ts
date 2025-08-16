/**
 * Example usage of the deep comparison utility
 * 
 * This example demonstrates how to use the deepEqual function and ComparisonUtils
 * to properly compare complex data structures like objects, arrays, and more.
 */

import {
  deepEqual,
  ComparisonUtils,
  arraysDeepEqual,
  objectsDeepEqual,
  type DeepComparisonOptions,
} from '../src/core/utils/comparison.utils.js';

console.log('🔧 Deep Comparison Utility Examples\n');

// ===== Basic Array Comparison =====
console.log('📋 Array Comparison:');
const arr1 = [1, 2, { a: 'test' }, [3, 4]];
const arr2 = [1, 2, { a: 'test' }, [3, 4]];
const arr3 = [1, 2, { a: 'different' }, [3, 4]];

console.log(`arr1 === arr2: ${arr1 === arr2}`); // false (reference comparison)
console.log(`deepEqual(arr1, arr2): ${deepEqual(arr1, arr2)}`); // true (deep comparison)
console.log(`deepEqual(arr1, arr3): ${deepEqual(arr1, arr3)}`); // false (different content)
console.log();

// ===== Object Comparison =====
console.log('📦 Object Comparison:');
const obj1 = {
  name: 'John',
  age: 30,
  address: {
    street: '123 Main St',
    city: 'New York',
    coordinates: [40.7128, -74.0060]
  },
  hobbies: ['reading', 'coding']
};

const obj2 = {
  name: 'John',
  age: 30,
  address: {
    street: '123 Main St',
    city: 'New York',
    coordinates: [40.7128, -74.0060]
  },
  hobbies: ['reading', 'coding']
};

const obj3 = {
  name: 'John',
  age: 31, // Different age
  address: {
    street: '123 Main St',
    city: 'New York',
    coordinates: [40.7128, -74.0060]
  },
  hobbies: ['reading', 'coding']
};

console.log(`obj1 === obj2: ${obj1 === obj2}`); // false
console.log(`objectsDeepEqual(obj1, obj2): ${objectsDeepEqual(obj1, obj2)}`); // true
console.log(`objectsDeepEqual(obj1, obj3): ${objectsDeepEqual(obj1, obj3)}`); // false
console.log();

// ===== Special Cases =====
console.log('⚡ Special Cases:');

// NaN comparison
console.log(`deepEqual(NaN, NaN): ${deepEqual(NaN, NaN)}`); // true

// +0 vs -0 comparison
console.log(`deepEqual(0, -0): ${deepEqual(0, -0)}`); // false (distinguishes +0 from -0)
console.log(`deepEqual(+0, +0): ${deepEqual(+0, +0)}`); // true

// Date comparison
const date1 = new Date('2023-01-01');
const date2 = new Date('2023-01-01');
console.log(`deepEqual(date1, date2): ${deepEqual(date1, date2)}`); // true

// RegExp comparison
console.log(`deepEqual(/abc/g, /abc/g): ${deepEqual(/abc/g, /abc/g)}`); // true
console.log(`deepEqual(/abc/g, /abc/i): ${deepEqual(/abc/g, /abc/i)}`); // false
console.log();

// ===== Maps and Sets =====
console.log('🗺️ Maps and Sets:');

const map1 = new Map([['key1', 'value1'], ['key2', { nested: 'data' }]]);
const map2 = new Map([['key1', 'value1'], ['key2', { nested: 'data' }]]);
console.log(`Maps equal: ${deepEqual(map1, map2)}`); // true

const set1 = new Set([1, 2, { a: 'test' }]);
const set2 = new Set([1, 2, { a: 'test' }]);
console.log(`Sets equal: ${deepEqual(set1, set2)}`); // true
console.log();

// ===== Custom Comparison Options =====
console.log('⚙️ Custom Options:');

// Ignore undefined properties
const objWithUndefined1 = { a: 1, b: undefined, c: 3 };
const objWithUndefined2 = { a: 1, c: 3 };

const ignoreUndefinedOption: DeepComparisonOptions = { ignoreUndefined: true };
console.log(`Objects equal (ignoring undefined): ${deepEqual(objWithUndefined1, objWithUndefined2, ignoreUndefinedOption)}`); // true

// Treat null and undefined as equal
console.log(`null == undefined (with option): ${deepEqual(null, undefined, { nullUndefinedEqual: true })}`); // true

// Custom comparers for specific types
const customOptions = ComparisonUtils.createCustomComparer(
  'number',
  (a: number, b: number) => Math.abs(a - b) < 0.001
);

console.log(`Float comparison (1.0001 vs 1.0002): ${deepEqual(1.0001, 1.0002, customOptions)}`); // true
console.log(`Float comparison (1.0001 vs 1.002): ${deepEqual(1.0001, 1.002, customOptions)}`); // false
console.log();

// ===== Circular References =====
console.log('🔄 Circular References:');

const circularObj1: any = { name: 'circular' };
circularObj1.self = circularObj1;

const circularObj2: any = { name: 'circular' };
circularObj2.self = circularObj2;

console.log(`Circular objects equal: ${deepEqual(circularObj1, circularObj2)}`); // true
console.log();

// ===== Performance with Large Structures =====
console.log('🚀 Performance Test:');

const largeArray1 = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  data: `item-${i}`,
  nested: { value: i * 2 }
}));

const largeArray2 = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  data: `item-${i}`,
  nested: { value: i * 2 }
}));

console.time('Large array comparison');
const isEqual = arraysDeepEqual(largeArray1, largeArray2);
console.timeEnd('Large array comparison');
console.log(`Large arrays equal: ${isEqual}`);
console.log();

// ===== ComparisonUtils Class Methods =====
console.log('🛠️ ComparisonUtils Class:');

// Shallow array comparison
console.log(`ComparisonUtils.arraysEqual([1,2,3], [1,2,3]): ${ComparisonUtils.arraysEqual([1, 2, 3], [1, 2, 3])}`);

// Check if objects have same keys
console.log(`ComparisonUtils.sameKeys({a:1, b:2}, {a:3, b:4}): ${ComparisonUtils.sameKeys({ a: 1, b: 2 }, { a: 3, b: 4 })}`);

console.log('\n✅ Deep comparison examples completed!');

export { deepEqual, ComparisonUtils, arraysDeepEqual, objectsDeepEqual };
