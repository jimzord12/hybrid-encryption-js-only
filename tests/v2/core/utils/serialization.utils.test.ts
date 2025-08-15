import { describe, expect, it } from 'vitest';
import { FormatConversionError } from '../../../../src/core/common/errors/encryption.errors.js';
import { Base64 } from '../../../../src/core/common/types/branded-types.types.js';
import { BufferUtils } from '../../../../src/core/utils/buffer.utils.js';
import { Serialization } from '../../../../src/core/utils/serialization.utils.js';

describe('Serialization', () => {
  describe('serializeForEncryption', () => {
    it('should serialize string data', () => {
      const testString = 'Hello, World!';
      const result = Serialization.serializeForEncryption(testString);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize number data', () => {
      const testNumber = 42;
      const result = Serialization.serializeForEncryption(testNumber);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize boolean data', () => {
      const testBoolean = true;
      const result = Serialization.serializeForEncryption(testBoolean);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize object data', () => {
      const testObject = { name: 'John', age: 30, active: true };
      const result = Serialization.serializeForEncryption(testObject);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize array data', () => {
      const testArray = [1, 'hello', true, { nested: 'object' }];
      const result = Serialization.serializeForEncryption(testArray);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize null data', () => {
      const result = Serialization.serializeForEncryption(null);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize undefined data', () => {
      const result = Serialization.serializeForEncryption(undefined);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should pass through Uint8Array data as-is', () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      const result = Serialization.serializeForEncryption(testData);

      expect(result).toBe(testData); // Should be the exact same reference
      expect(BufferUtils.constantTimeEqual(result, testData)).toBe(true);
    });

    it('should serialize complex nested objects', () => {
      const complexObject = {
        user: {
          id: 123,
          profile: {
            name: 'John Doe',
            preferences: {
              theme: 'dark',
              notifications: true,
              settings: [1, 2, 3],
            },
          },
        },
        metadata: {
          created: '2023-01-01',
          version: 1.5,
        },
      };

      const result = Serialization.serializeForEncryption(complexObject);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle Unicode characters correctly', () => {
      const unicodeData = {
        message: 'Hello, 世界! 🌍',
        emoji: '🎉✨🚀',
        special: 'café naïve résumé',
      };

      const result = Serialization.serializeForEncryption(unicodeData);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty objects and arrays', () => {
      const emptyObject = {};
      const emptyArray: any[] = [];

      const objectResult = Serialization.serializeForEncryption(emptyObject);
      const arrayResult = Serialization.serializeForEncryption(emptyArray);

      expect(objectResult).toBeInstanceOf(Uint8Array);
      expect(arrayResult).toBeInstanceOf(Uint8Array);
      expect(objectResult.length).toBeGreaterThan(0);
      expect(arrayResult.length).toBeGreaterThan(0);
    });

    it('should throw error for circular references', () => {
      const circularObject: any = { name: 'test' };
      circularObject.self = circularObject;

      expect(() => {
        Serialization.serializeForEncryption(circularObject);
      }).toThrow('Serialization failed');
    });

    it('should handle special number values', () => {
      const specialNumbers = {
        infinity: Infinity,
        negativeInfinity: -Infinity,
        nan: NaN,
        zero: 0,
        negativeZero: -0,
      };

      const result = Serialization.serializeForEncryption(specialNumbers);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('deserializeFromDecryption', () => {
    it('should deserialize string data', () => {
      const originalString = 'Hello, World!';
      const serialized = Serialization.serializeForEncryption(originalString);
      const deserialized = Serialization.deserializeFromDecryption<string>(serialized);

      expect(deserialized).toBe(originalString);
    });

    it('should deserialize number data', () => {
      const originalNumber = 42;
      const serialized = Serialization.serializeForEncryption(originalNumber);
      const deserialized = Serialization.deserializeFromDecryption<number>(serialized);

      expect(deserialized).toBe(originalNumber);
    });

    it('should deserialize boolean data', () => {
      const originalBoolean = true;
      const serialized = Serialization.serializeForEncryption(originalBoolean);
      const deserialized = Serialization.deserializeFromDecryption<boolean>(serialized);

      expect(deserialized).toBe(originalBoolean);
    });

    it('should deserialize object data', () => {
      const originalObject = { name: 'John', age: 30, active: true };
      const serialized = Serialization.serializeForEncryption(originalObject);
      const deserialized =
        Serialization.deserializeFromDecryption<typeof originalObject>(serialized);

      expect(deserialized).toEqual(originalObject);
    });

    it('should deserialize array data', () => {
      const originalArray = [1, 'hello', true, { nested: 'object' }];
      const serialized = Serialization.serializeForEncryption(originalArray);
      const deserialized =
        Serialization.deserializeFromDecryption<typeof originalArray>(serialized);

      expect(deserialized).toEqual(originalArray);
    });

    it('should deserialize null data', () => {
      const serialized = Serialization.serializeForEncryption(null);
      const deserialized = Serialization.deserializeFromDecryption(serialized);

      expect(deserialized).toBe(null);
    });

    it('should deserialize undefined data', () => {
      const serialized = Serialization.serializeForEncryption(undefined);
      const deserialized = Serialization.deserializeFromDecryption(serialized);

      expect(deserialized).toBe(undefined);
    });

    it('should deserialize complex nested objects', () => {
      const complexObject = {
        user: {
          id: 123,
          profile: {
            name: 'John Doe',
            preferences: {
              theme: 'dark',
              notifications: true,
              settings: [1, 2, 3],
            },
          },
        },
        metadata: {
          created: '2023-01-01',
          version: 1.5,
        },
      };

      const serialized = Serialization.serializeForEncryption(complexObject);
      const deserialized =
        Serialization.deserializeFromDecryption<typeof complexObject>(serialized);

      expect(deserialized).toEqual(complexObject);
    });

    it('should handle Unicode characters correctly', () => {
      const unicodeData = {
        message: 'Hello, 世界! 🌍',
        emoji: '🎉✨🚀',
        special: 'café naïve résumé',
      };

      const serialized = Serialization.serializeForEncryption(unicodeData);
      const deserialized = Serialization.deserializeFromDecryption<typeof unicodeData>(serialized);

      expect(deserialized).toEqual(unicodeData);
    });

    it('should throw error for empty data', () => {
      const emptyData = new Uint8Array(0);

      expect(() => {
        Serialization.deserializeFromDecryption(emptyData);
      }).toThrow('Cannot deserialize empty data');
    });

    it('should throw error for null data', () => {
      expect(() => {
        Serialization.deserializeFromDecryption(null as any);
      }).toThrow('Cannot deserialize empty data');
    });

    it('should throw error for undefined data', () => {
      expect(() => {
        Serialization.deserializeFromDecryption(undefined as any);
      }).toThrow('Cannot deserialize empty data');
    });

    it('should throw error for invalid binary data', () => {
      const invalidData = new Uint8Array([255, 254, 253]); // Invalid UTF-8

      expect(() => {
        Serialization.deserializeFromDecryption(invalidData);
      }).toThrow('Deserialization failed');
    });

    it('should handle special number values', () => {
      const specialNumbers = {
        infinity: Infinity,
        negativeInfinity: -Infinity,
        nan: NaN,
        zero: 0,
        negativeZero: -0,
      };

      const serialized = Serialization.serializeForEncryption(specialNumbers);
      const deserialized =
        Serialization.deserializeFromDecryption<typeof specialNumbers>(serialized);

      expect(deserialized.infinity).toBe(Infinity);
      expect(deserialized.negativeInfinity).toBe(-Infinity);
      expect(deserialized.nan).toBeNaN();
      expect(deserialized.zero).toBe(0);
      expect(deserialized.negativeZero).toBe(-0);
    });
  });

  describe('encodeBase64', () => {
    it('should encode binary data to Base64', () => {
      const testData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = Serialization.encodeBase64(testData);

      expect(typeof result).toBe('string');
      expect(result).toBe('SGVsbG8=');
    });

    it('should handle empty data', () => {
      const emptyData = new Uint8Array(0);
      const result = Serialization.encodeBase64(emptyData);

      expect(result).toBe('');
    });

    it('should encode random data correctly', () => {
      const randomData = BufferUtils.getSecureRandomBytes(32);
      const result = Serialization.encodeBase64(randomData);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(/^[A-Za-z0-9+/]*={0,2}$/.test(result)).toBe(true);
    });

    it('should handle null data', () => {
      expect(() => {
        Serialization.encodeBase64(null as any);
      }).toThrow('Base64 encoding failed');
    });

    it('should handle undefined data', () => {
      expect(() => {
        Serialization.encodeBase64(undefined as any);
      }).toThrow('Base64 encoding failed');
    });
  });

  describe('decodeBase64', () => {
    it('should decode Base64 string to binary data', () => {
      const base64String = 'SGVsbG8=' as Base64;
      const result = Serialization.decodeBase64(base64String);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it('should handle empty string', () => {
      const result = Serialization.decodeBase64('' as Base64);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    it('should handle Base64 with padding', () => {
      const base64WithPadding = 'SGVsbG8gV29ybGQ=' as Base64;
      const result = Serialization.decodeBase64(base64WithPadding);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(BufferUtils.binaryToString(result)).toBe('Hello World');
    });

    it('should throw error for invalid Base64', () => {
      expect(() => {
        Serialization.decodeBase64('invalid base64!' as Base64);
      }).toThrow('Base64 decoding failed');
    });

    it('should throw error for null data', () => {
      expect(() => {
        Serialization.decodeBase64(null as any);
      }).toThrow('Base64 decoding failed');
    });

    it('should throw error for undefined data', () => {
      expect(() => {
        Serialization.decodeBase64(undefined as any);
      }).toThrow('Base64 decoding failed');
    });
  });

  describe('isSerializable', () => {
    it('should return true for serializable data types', () => {
      const serializableData = [
        'string',
        42,
        true,
        null,
        { key: 'value' },
        [1, 2, 3],
        { nested: { object: true } },
      ];

      serializableData.forEach(data => {
        expect(Serialization.isSerializable(data)).toBe(true);
      });
    });

    it('should return false for circular references', () => {
      const circularObject: any = { name: 'test' };
      circularObject.self = circularObject;

      expect(Serialization.isSerializable(circularObject)).toBe(false);
    });

    it('should return true for undefined', () => {
      expect(Serialization.isSerializable(undefined)).toBe(true);
    });

    it('should return true for functions (JSON.stringify converts them to undefined)', () => {
      const objectWithFunction = {
        name: 'test',
        func: () => 'hello',
      };

      expect(Serialization.isSerializable(objectWithFunction)).toBe(true);
    });

    it('should return true for symbols (JSON.stringify ignores them)', () => {
      const objectWithSymbol = {
        name: 'test',
        [Symbol('key')]: 'value',
      };

      expect(Serialization.isSerializable(objectWithSymbol)).toBe(true);
    });
  });

  describe('estimateSerializedSize', () => {
    it('should estimate size for string data', () => {
      const testString = 'Hello, World!';
      const size = Serialization.estimateSerializedSize(testString);

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');

      // Verify accuracy by actual serialization
      const actualSerialized = Serialization.serializeForEncryption(testString);
      const actualSize = actualSerialized.length;
      expect(size).toBeCloseTo(actualSize, -1); // Allow some variance due to type metadata
    });

    it('should estimate size for object data', () => {
      const testObject = { name: 'John', age: 30 };
      const size = Serialization.estimateSerializedSize(testObject);

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should return exact size for Uint8Array', () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      const size = Serialization.estimateSerializedSize(testData);

      expect(size).toBe(testData.length);
    });

    it('should handle Unicode strings correctly', () => {
      const unicodeString = 'Hello, 世界! 🌍';
      const size = Serialization.estimateSerializedSize(unicodeString);

      expect(size).toBeGreaterThan(unicodeString.length); // Unicode takes more bytes
    });

    it('should return 0 for unserializable data', () => {
      const circularObject: any = { name: 'test' };
      circularObject.self = circularObject;

      const size = Serialization.estimateSerializedSize(circularObject);
      expect(size).toBe(0);
    });

    it('should handle empty objects and arrays', () => {
      const emptyObject = {};
      const emptyArray: any[] = [];

      const objectSize = Serialization.estimateSerializedSize(emptyObject);
      const arraySize = Serialization.estimateSerializedSize(emptyArray);

      expect(objectSize).toBeGreaterThan(0);
      expect(arraySize).toBeGreaterThan(0);
    });
  });

  describe('integration tests', () => {
    it('should handle complete round-trip serialization/deserialization', () => {
      const testData = {
        string: 'Hello, World!',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 'two', true],
        nested: {
          deep: {
            value: 'nested',
          },
        },
      };

      const serialized = Serialization.serializeForEncryption(testData);
      const deserialized = Serialization.deserializeFromDecryption<typeof testData>(serialized);

      expect(deserialized).toEqual(testData);
    });

    it('should handle Base64 round-trip encoding/decoding', () => {
      const originalData = BufferUtils.getSecureRandomBytes(100);

      const base64 = Serialization.encodeBase64(originalData);
      const decoded = Serialization.decodeBase64(base64);

      expect(BufferUtils.constantTimeEqual(originalData, decoded)).toBe(true);
    });

    it('should preserve data types correctly', () => {
      const testCases = [
        { data: 'string', type: 'string' },
        { data: 42, type: 'number' },
        { data: true, type: 'boolean' },
        { data: null, type: 'object' }, // null is typeof 'object' in JS
        { data: [1, 2, 3], type: 'object' }, // arrays are typeof 'object'
        { data: { key: 'value' }, type: 'object' },
      ];

      testCases.forEach(({ data, type }) => {
        const serialized = Serialization.serializeForEncryption(data);
        const deserialized = Serialization.deserializeFromDecryption(serialized);

        expect(typeof deserialized).toBe(type);
        expect(deserialized).toEqual(data);
      });
    });

    it('should handle large data efficiently', () => {
      const largeObject = {
        users: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          active: i % 2 === 0,
        })),
      };

      const startTime = Date.now();
      const serialized = Serialization.serializeForEncryption(largeObject);
      const deserialized = Serialization.deserializeFromDecryption<typeof largeObject>(serialized);
      const endTime = Date.now();

      expect(deserialized).toEqual(largeObject);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should maintain consistency across multiple serializations', () => {
      const testData = { value: 'consistent', timestamp: 1234567890 };

      const results = [];
      for (let i = 0; i < 5; i++) {
        const serialized = Serialization.serializeForEncryption(testData);
        const deserialized = Serialization.deserializeFromDecryption<typeof testData>(serialized);
        results.push(deserialized);
      }

      // All results should be identical
      results.forEach(result => {
        expect(result).toEqual(testData);
      });
    });

    it('should work with complex real-world data structures', () => {
      const realWorldData = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            preferences: {
              theme: 'dark',
              language: 'en-US',
              notifications: {
                email: true,
                push: false,
                sms: true,
              },
            },
          },
          metadata: {
            createdAt: '2023-01-01T00:00:00.000Z',
            lastLogin: '2023-12-25T12:00:00.000Z',
            version: 2.1,
            tags: ['premium', 'beta-tester'],
            settings: {
              privacy: {
                profileVisible: true,
                dataSharing: false,
              },
            },
          },
        },
        session: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          expiresAt: 1703520000000,
          permissions: ['read', 'write', 'admin'],
        },
      };

      const serialized = Serialization.serializeForEncryption(realWorldData);
      const deserialized =
        Serialization.deserializeFromDecryption<typeof realWorldData>(serialized);

      expect(deserialized).toEqual(realWorldData);
      expect(deserialized.user.profile.email).toBe('john.doe@example.com');
      expect(deserialized.session.permissions).toHaveLength(3);
    });
  });

  describe('error handling and edge cases', () => {
    it('should provide meaningful error messages', () => {
      const emptyData = new Uint8Array(0);

      try {
        Serialization.deserializeFromDecryption(emptyData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Cannot deserialize empty data');
      }
    });

    it('should handle corrupted data gracefully', () => {
      // Create data that looks like valid UTF-8 but isn't valid JSON
      const corruptedData = BufferUtils.stringToBinary('{ invalid json }');

      expect(() => {
        Serialization.deserializeFromDecryption(corruptedData);
      }).toThrow('Deserialization failed');
    });

    it.only('should handle edge case data types', () => {
      const edgeCases = [
        new Date(),
        /regex/,
        new Error('test error'),
        new Set([1, 2, 3]),
        new Map([['key', 'value']]),
        BigInt(123),
        Symbol('test'),
      ];

      edgeCases.forEach((data, idx) => {
        // Most of these will be converted to {} or null by JSON.stringify

        try {
          console.log('');
          console.log('-'.repeat(25), `| ${idx} | `, '-'.repeat(25));
          console.log('1 | Incoming Data: ', data);
          console.log('1.1 | Typeof Data: ', typeof data);
          const serialized = Serialization.serializeForEncryption(data);
          console.log('2 | Serialized Data: ', serialized);
          const deserialized = Serialization.deserializeFromDecryption(serialized);
          console.log('3 | Deserialized Data: ', deserialized);

          expect(serialized).toBeInstanceOf(Uint8Array);
          expect(deserialized).toBeDefined(); // Just verify it doesn't throw
        } catch (error) {
          console.log(error);
          if (error instanceof FormatConversionError) console.log('Error Cause:', error.cause);
          throw error;
        }

        // Don't expect exact equality since JSON.stringify transforms these types
      });
    });
  });
});
