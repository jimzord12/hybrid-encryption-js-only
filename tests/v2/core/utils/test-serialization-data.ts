import { expect } from 'vitest';
import { Serialization } from '../../../../src/core/utils/serialization.utils.js';

export const edgeCasesTestCases = {
  date: {
    input: new Date(),
    expected: () => expect(Serialization.isSerializable(new Date())).toBe(true),
  },
  regex: {
    input: /regex/,
    expected: () => expect(Serialization.isSerializable(/regex/)).toBe(false),
  },
  error: {
    input: new Error('test error'),
    expected: () => expect(Serialization.isSerializable(new Error('test error'))).toBe(false),
  },
  set: {
    input: new Set([1, 2, 3]),
    expected: () => expect(Serialization.isSerializable(new Set([1, 2, 3]))).toBe(false),
  },
  map: {
    input: new Map([['key', 'value']]),
    expected: () => expect(Serialization.isSerializable(new Map([['key', 'value']]))).toBe(false),
  },
  bigint: {
    input: BigInt(123),
    expected: () => expect(Serialization.isSerializable(BigInt(123))).toBe(false),
  },
  symbol: {
    input: Symbol('test'),
    expected: () => expect(Serialization.isSerializable(Symbol('test'))).toBe(false),
  },
};

export const moreEdgeCasesTestCases = {
  sparseArray: {
    input: [1, , , 4],
    expected: () => expect(Serialization.isSerializable([1, , , 4])).toBe(true),
  },
  arrayWithCustomProps: {
    input: (() => {
      const arr = [1, 2] as any;
      arr.customProp = 'test';
      return arr;
    })(),
    expected: () =>
      expect(
        Serialization.isSerializable(
          (() => {
            const arr = [1, 2] as any;
            arr.customProp = 'test';
            return arr;
          })(),
        ),
      ).toBe(true),
  },
  uint8Array: {
    input: new Uint8Array([1, 2, 3]),
    expected: () => expect(Serialization.isSerializable(new Uint8Array([1, 2, 3]))).toBe(true),
  },
  arrayBuffer: {
    input: new ArrayBuffer(8),
    expected: () => expect(Serialization.isSerializable(new ArrayBuffer(8))).toBe(true),
  },
  namedFunction: {
    input: function namedFunc() {
      return 'test';
    },
    expected: () =>
      expect(
        Serialization.isSerializable(function namedFunc() {
          return 'test';
        }),
      ).toBe(false),
  },
  arrowFunction: {
    input: () => 'arrow function',
    expected: () => expect(Serialization.isSerializable(() => 'arrow function')).toBe(false),
  },
  asyncFunction: {
    input: async function asyncFunc() {
      return 'async';
    },
    expected: () =>
      expect(
        Serialization.isSerializable(async function asyncFunc() {
          return 'async';
        }),
      ).toBe(false),
  },
  generatorFunction: {
    input: function* generatorFunc() {
      yield 1;
    },
    expected: () =>
      expect(
        Serialization.isSerializable(function* generatorFunc() {
          yield 1;
        }),
      ).toBe(false),
  },
  objectWithoutPrototype: {
    input: Object.create(null),
    expected: () => expect(Serialization.isSerializable(Object.create(null))).toBe(true),
  },
  objectWithInheritedPrototype: {
    input: Object.create({ inherited: 'prop' }),
    expected: () =>
      expect(Serialization.isSerializable(Object.create({ inherited: 'prop' }))).toBe(true),
  },
  objectWithNonEnumerableProps: {
    input: (() => {
      const obj = { visible: 'yes' };
      Object.defineProperty(obj, 'hidden', { value: 'no', enumerable: false });
      return obj;
    })(),
    expected: () =>
      expect(
        Serialization.isSerializable(
          (() => {
            const obj = { visible: 'yes' };
            Object.defineProperty(obj, 'hidden', { value: 'no', enumerable: false });
            return obj;
          })(),
        ),
      ).toBe(true),
  },
  objectWithGettersSetters: {
    input: (() => {
      const obj = {} as any;
      Object.defineProperty(obj, 'computed', {
        get() {
          return 'getter value';
        },
        set(val) {
          this._val = val;
        },
      });
      return obj;
    })(),
    expected: () =>
      expect(
        Serialization.isSerializable(
          (() => {
            const obj = {} as any;
            Object.defineProperty(obj, 'computed', {
              get() {
                return 'getter value';
              },
              set(val) {
                this._val = val;
              },
            });
            return obj;
          })(),
        ),
      ).toBe(true),
  },
  circularReference: {
    input: (() => {
      const obj = { self: null } as any;
      obj.self = obj;
      return obj;
    })(),
    expected: () =>
      expect(
        Serialization.isSerializable(
          (() => {
            const obj = { self: null } as any;
            obj.self = obj;
            return obj;
          })(),
        ),
      ).toBe(false),
  },
  weakMap: {
    input: new WeakMap(),
    expected: () => expect(Serialization.isSerializable(new WeakMap())).toBe(false),
  },
  weakSet: {
    input: new WeakSet(),
    expected: () => expect(Serialization.isSerializable(new WeakSet())).toBe(false),
  },
  resolvedPromise: {
    input: Promise.resolve('resolved'),
    expected: () => expect(Serialization.isSerializable(Promise.resolve('resolved'))).toBe(false),
  },
  rejectedPromise: {
    input: (() => {
      const rejectedPromise = Promise.reject('rejected');
      // Attach a catch handler to prevent unhandled rejection
      rejectedPromise.catch(() => {
        /* Expected rejection */
      });
      return rejectedPromise;
    })(),
    expected: () => {
      const rejectedPromise = Promise.reject('rejected');
      // Attach a catch handler to prevent unhandled rejection
      rejectedPromise.catch(() => {
        /* Expected rejection */
      });
      return expect(Serialization.isSerializable(rejectedPromise)).toBe(false);
    },
  },
  nan: {
    input: NaN,
    expected: () => expect(Serialization.isSerializable(NaN)).toBe(true),
  },
  infinity: {
    input: Infinity,
    expected: () => expect(Serialization.isSerializable(Infinity)).toBe(true),
  },
  negativeInfinity: {
    input: -Infinity,
    expected: () => expect(Serialization.isSerializable(-Infinity)).toBe(true),
  },
  negativeZero: {
    input: -0,
    expected: () => expect(Serialization.isSerializable(-0)).toBe(true),
  },
  maxSafeIntegerPlusOne: {
    input: Number.MAX_SAFE_INTEGER + 1,
    expected: () => expect(Serialization.isSerializable(Number.MAX_SAFE_INTEGER + 1)).toBe(true),
  },
  minValue: {
    input: Number.MIN_VALUE,
    expected: () => expect(Serialization.isSerializable(Number.MIN_VALUE)).toBe(true),
  },
  nullCharacter: {
    input: String.fromCharCode(0),
    expected: () => expect(Serialization.isSerializable(String.fromCharCode(0))).toBe(true),
  },
  surrogatePair: {
    input: '\uD800\uDC00',
    expected: () => expect(Serialization.isSerializable('\uD800\uDC00')).toBe(true),
  },
  booleanObject: {
    input: new Boolean(true),
    expected: () => expect(Serialization.isSerializable(new Boolean(true))).toBe(true),
  },
  numberObject: {
    input: new Number(42),
    expected: () => expect(Serialization.isSerializable(new Number(42))).toBe(true),
  },
  stringObject: {
    input: new String('wrapped'),
    expected: () => expect(Serialization.isSerializable(new String('wrapped'))).toBe(true),
  },
  url: {
    input: new URL('https://example.com'),
    expected: () => expect(Serialization.isSerializable(new URL('https://example.com'))).toBe(true),
  },
  urlSearchParams: {
    input: new URLSearchParams('?a=1&b=2'),
    expected: () =>
      expect(Serialization.isSerializable(new URLSearchParams('?a=1&b=2'))).toBe(true),
  },
  classInstance: {
    input: new (class CustomClass {
      prop = 'value';
    })(),
    expected: () =>
      expect(
        Serialization.isSerializable(
          new (class CustomClass {
            prop = 'value';
          })(),
        ),
      ).toBe(true),
  },
  objectWithToStringValueOf: {
    input: {
      toString() {
        return 'custom toString';
      },
      valueOf() {
        return 42;
      },
    },
    expected: () =>
      expect(
        Serialization.isSerializable({
          toString() {
            return 'custom toString';
          },
          valueOf() {
            return 42;
          },
        }),
      ).toBe(true),
  },
  frozenObject: {
    input: Object.freeze({ frozen: true }),
    expected: () =>
      expect(Serialization.isSerializable(Object.freeze({ frozen: true }))).toBe(true),
  },
  sealedObject: {
    input: Object.seal({ sealed: true }),
    expected: () => expect(Serialization.isSerializable(Object.seal({ sealed: true }))).toBe(true),
  },
  deeplyNestedObject: {
    input: JSON.parse('{"a":'.repeat(1000) + '1' + '}'.repeat(1000)),
    expected: () =>
      expect(
        Serialization.isSerializable(JSON.parse('{"a":'.repeat(1000) + '1' + '}'.repeat(1000))),
      ).toBe(true),
  },
};
