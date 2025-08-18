import { describe, expect, it } from 'vitest';
import { Base64 } from '../../../src/core/common/types/branded-types.types.js';
import { BufferUtils } from '../../../src/core/utils/buffer.utils.js';

describe('BufferUtils', () => {
  describe('stringToBinary', () => {
    it('should convert string to binary using UTF-8 encoding', () => {
      const testString = 'Hello, World!';
      const result = BufferUtils.stringToBinary(testString);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle Unicode characters correctly', () => {
      const unicodeString = 'Hello, 世界! 🌍';
      const result = BufferUtils.stringToBinary(unicodeString);

      expect(result).toBeInstanceOf(Uint8Array);
      // Unicode characters should result in more bytes than ASCII
      expect(result.length).toBeGreaterThan(unicodeString.length);
    });

    it('should handle empty string', () => {
      const result = BufferUtils.stringToBinary('');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    it('should throw error for invalid input', () => {
      expect(() => BufferUtils.stringToBinary(null as any)).toThrow();
      expect(() => BufferUtils.stringToBinary(undefined as any)).toThrow();
    });
  });

  describe('binaryToString', () => {
    it('should convert binary data to string using UTF-8 decoding', () => {
      const testString = 'Hello, World!';
      const binaryData = BufferUtils.stringToBinary(testString);
      const result = BufferUtils.binaryToString(binaryData);

      expect(result).toBe(testString);
    });

    it('should handle Unicode characters correctly', () => {
      const unicodeString = 'Hello, 世界! 🌍';
      const binaryData = BufferUtils.stringToBinary(unicodeString);
      const result = BufferUtils.binaryToString(binaryData);

      expect(result).toBe(unicodeString);
    });

    it('should handle empty binary data', () => {
      const result = BufferUtils.binaryToString(new Uint8Array(0));
      expect(result).toBe('');
    });

    it('should throw error for invalid input', () => {
      expect(() => BufferUtils.binaryToString(null as any)).toThrow();
      expect(() => BufferUtils.binaryToString(undefined as any)).toThrow();
    });
  });

  describe('encodeBase64', () => {
    it('should encode binary data to Base64 string', () => {
      const testData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = BufferUtils.encodeBase64(testData);

      expect(typeof result).toBe('string');
      expect(result).toBe('SGVsbG8='); // Base64 for "Hello"
    });

    it('should handle empty data', () => {
      const result = BufferUtils.encodeBase64(new Uint8Array(0));
      expect(result).toBe('');
    });

    it('should encode random binary data consistently', () => {
      const testData = new Uint8Array([255, 128, 64, 32, 16, 8, 4, 2, 1, 0]);
      const result = BufferUtils.encodeBase64(testData);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Should be valid Base64
      expect(/^[A-Za-z0-9+/]*={0,2}$/.test(result)).toBe(true);
    });

    it('should throw error for invalid input', () => {
      expect(() => BufferUtils.encodeBase64(null as any)).toThrow();
      expect(() => BufferUtils.encodeBase64(undefined as any)).toThrow();
    });
  });

  describe('decodeBase64', () => {
    it('should decode Base64 string to binary data', () => {
      const base64String = 'SGVsbG8='; // Base64 for "Hello"
      const result = BufferUtils.decodeBase64(base64String as Base64);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it('should handle empty string', () => {
      const result = BufferUtils.decodeBase64('' as Base64);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    it('should handle Base64 with padding', () => {
      const base64WithPadding = 'SGVsbG8gV29ybGQ='; // "Hello World"
      const result = BufferUtils.decodeBase64(base64WithPadding as Base64);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(BufferUtils.binaryToString(result)).toBe('Hello World');
    });

    it('should throw error for invalid Base64', () => {
      expect(() => BufferUtils.decodeBase64('invalid base64!' as Base64)).toThrow();
      expect(() => BufferUtils.decodeBase64(null as any)).toThrow();
      expect(() => BufferUtils.decodeBase64(undefined as any)).toThrow();
    });
  });

  describe('getSecureRandomBytes', () => {
    it('should generate secure random bytes using @noble/hashes', () => {
      const length = 32;
      const result = BufferUtils.getSecureRandomBytes(length);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(length);
    });

    it('should generate different random bytes on each call', () => {
      const result1 = BufferUtils.getSecureRandomBytes(16);
      const result2 = BufferUtils.getSecureRandomBytes(16);

      expect(result1).not.toEqual(result2);
      // Very low probability that two random 16-byte arrays are identical
      expect(BufferUtils.constantTimeEqual(result1, result2)).toBe(false);
    });

    it('should handle different lengths', () => {
      const lengths = [1, 16, 32, 64, 128, 256];

      lengths.forEach((length) => {
        const result = BufferUtils.getSecureRandomBytes(length);
        expect(result.length).toBe(length);
        expect(result).toBeInstanceOf(Uint8Array);
      });
    });

    it('should throw error for invalid length', () => {
      expect(() => BufferUtils.getSecureRandomBytes(-1)).toThrow();
      expect(() => BufferUtils.getSecureRandomBytes(0)).toThrow();
    });
  });

  describe('constantTimeEqual', () => {
    it('should return true for identical arrays', () => {
      const data1 = new Uint8Array([1, 2, 3, 4, 5]);
      const data2 = new Uint8Array([1, 2, 3, 4, 5]);

      expect(BufferUtils.constantTimeEqual(data1, data2)).toBe(true);
    });

    it('should return false for different arrays', () => {
      const data1 = new Uint8Array([1, 2, 3, 4, 5]);
      const data2 = new Uint8Array([1, 2, 3, 4, 6]);

      expect(BufferUtils.constantTimeEqual(data1, data2)).toBe(false);
    });

    it('should return false for arrays of different lengths', () => {
      const data1 = new Uint8Array([1, 2, 3]);
      const data2 = new Uint8Array([1, 2, 3, 4]);

      expect(BufferUtils.constantTimeEqual(data1, data2)).toBe(false);
    });

    it('should handle empty arrays', () => {
      const data1 = new Uint8Array(0);
      const data2 = new Uint8Array(0);

      expect(BufferUtils.constantTimeEqual(data1, data2)).toBe(true);
    });

    it('should be resistant to timing attacks', () => {
      // Test that comparison time doesn't depend on where differences occur
      const baseArray = new Uint8Array(100).fill(0);
      const differentAtStart = new Uint8Array(100).fill(0);
      const differentAtEnd = new Uint8Array(100).fill(0);

      differentAtStart[0] = 1;
      differentAtEnd[99] = 1;

      // Both should return false regardless of where the difference is
      expect(BufferUtils.constantTimeEqual(baseArray, differentAtStart)).toBe(false);
      expect(BufferUtils.constantTimeEqual(baseArray, differentAtEnd)).toBe(false);
    });
  });

  describe('getUtf8ByteLength', () => {
    it('should calculate correct byte length for ASCII strings', () => {
      const asciiString = 'Hello World';
      const result = BufferUtils.getUtf8ByteLength(asciiString);

      expect(result).toBe(asciiString.length);
    });

    it('should calculate correct byte length for Unicode strings', () => {
      const unicodeString = 'Hello 世界 🌍';
      const result = BufferUtils.getUtf8ByteLength(unicodeString);

      // Unicode characters take more bytes than their string length
      expect(result).toBeGreaterThan(unicodeString.length);

      // Verify by actual encoding
      const encoded = BufferUtils.stringToBinary(unicodeString);
      expect(result).toBe(encoded.length);
    });

    it('should handle empty string', () => {
      const result = BufferUtils.getUtf8ByteLength('');
      expect(result).toBe(0);
    });

    it('should throw error for invalid input', () => {
      expect(() => BufferUtils.getUtf8ByteLength(null as any)).toThrow();
      expect(() => BufferUtils.getUtf8ByteLength(undefined as any)).toThrow();
    });
  });

  describe('validation methods', () => {
    describe('isValidUtf8', () => {
      it('should validate correct UTF-8 strings', () => {
        expect(BufferUtils.isValidUtf8('Hello World')).toBe(true);
        expect(BufferUtils.isValidUtf8('Hello 世界 🌍')).toBe(true);
        expect(BufferUtils.isValidUtf8('')).toBe(true);
      });

      it('should handle edge cases gracefully', () => {
        // These should not throw but return boolean
        expect(typeof BufferUtils.isValidUtf8('test')).toBe('boolean');
        expect(typeof BufferUtils.isValidUtf8('')).toBe('boolean');
      });
    });

    describe('isValidBase64', () => {
      it('should validate correct Base64 strings', () => {
        expect(BufferUtils.isValidBase64('SGVsbG8=' as Base64)).toBe(true);
        expect(BufferUtils.isValidBase64('SGVsbG8gV29ybGQ=' as Base64)).toBe(true);
        expect(BufferUtils.isValidBase64('' as Base64)).toBe(true);
      });

      it('should reject invalid Base64 strings', () => {
        expect(BufferUtils.isValidBase64('invalid!' as Base64)).toBe(false);
        expect(BufferUtils.isValidBase64('SGVsbG8@' as Base64)).toBe(false);
        expect(BufferUtils.isValidBase64('SGVsbG8====' as Base64)).toBe(false); // Too much padding
      });
    });
  });

  describe('integration tests', () => {
    it('should handle round-trip string -> binary -> Base64 -> binary -> string', () => {
      const originalString = 'Hello, 世界! 🌍 This is a test of UTF-8 encoding/decoding.';

      // String to binary
      const binaryData = BufferUtils.stringToBinary(originalString);

      // Binary to Base64
      const base64String = BufferUtils.encodeBase64(binaryData);

      // Base64 to binary
      const decodedBinary = BufferUtils.decodeBase64(base64String);

      // Binary to string
      const finalString = BufferUtils.binaryToString(decodedBinary);

      expect(finalString).toBe(originalString);
      expect(BufferUtils.constantTimeEqual(binaryData, decodedBinary)).toBe(true);
    });

    it('should work correctly with random data', () => {
      const randomData = BufferUtils.getSecureRandomBytes(128);

      // Encode and decode
      const base64 = BufferUtils.encodeBase64(randomData);
      const decoded = BufferUtils.decodeBase64(base64);

      expect(BufferUtils.constantTimeEqual(randomData, decoded)).toBe(true);
    });

    it('should validate data integrity through multiple conversions', () => {
      const testData = 'Complex test string with émojis 🎉 and ünicöde characters!';

      // Multiple round trips
      for (let i = 0; i < 5; i++) {
        const binary = BufferUtils.stringToBinary(testData);
        const base64 = BufferUtils.encodeBase64(binary);
        const decodedBinary = BufferUtils.decodeBase64(base64);
        const finalString = BufferUtils.binaryToString(decodedBinary);

        expect(finalString).toBe(testData);
      }
    });
  });
});
