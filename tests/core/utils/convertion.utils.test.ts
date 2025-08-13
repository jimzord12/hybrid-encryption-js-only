import { describe, expect, it, test } from 'vitest';
import { fromBase64, toBase64 } from '../../../src/core/utils';

describe('Base64 Utilities', () => {
  describe('toBase64', () => {
    it('should convert string to base64', () => {
      const input = 'Hello, World!';
      const expected = 'SGVsbG8sIFdvcmxkIQ==';

      expect(toBase64(input)).toBe(expected);
    });

    it('should convert empty string to base64', () => {
      const input = '';
      const expected = '';

      expect(toBase64(input)).toBe(expected);
    });

    it('should convert Uint8Array to base64', () => {
      const input = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const expected = 'SGVsbG8=';

      expect(toBase64(input)).toBe(expected);
    });

    it('should convert empty Uint8Array to base64', () => {
      const input = new Uint8Array([]);
      const expected = '';

      expect(toBase64(input)).toBe(expected);
    });

    it('should handle Unicode strings correctly', () => {
      const input = 'Hello 世界! 🚀';
      const result = toBase64(input);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle binary data in Uint8Array', () => {
      const input = new Uint8Array([0, 255, 128, 64, 32, 16, 8, 4, 2, 1]);
      const result = toBase64(input);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should throw TypeError for invalid input types', () => {
      expect(() => toBase64(123 as any)).toThrow(TypeError);
      expect(() => toBase64(null as any)).toThrow(TypeError);
      expect(() => toBase64(undefined as any)).toThrow(TypeError);
      expect(() => toBase64({} as any)).toThrow(TypeError);
      expect(() => toBase64([] as any)).toThrow(TypeError);
    });

    it('should throw with specific error message', () => {
      expect(() => toBase64(123 as any)).toThrow(
        '[HybridEncryption/utils/toBase64]: Input must be a string or Uint8Array',
      );
    });
  });

  describe('fromBase64', () => {
    it('should convert base64 string to Uint8Array', () => {
      const input = 'SGVsbG8sIFdvcmxkIQ==';
      const expected = new Uint8Array([72, 101, 108, 108, 111, 44, 32, 87, 111, 114, 108, 100, 33]);

      const result = fromBase64(input);

      expect(result).toEqual(expected);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should handle empty base64 string', () => {
      const input = '';
      const expected = new Uint8Array([]);

      expect(fromBase64(input)).toEqual(expected);
    });

    it('should handle base64 without padding', () => {
      const input = 'SGVsbG8'; // "Hello" without padding
      const result = fromBase64(input);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle base64 with URL-safe characters', () => {
      // Base64 with + and / vs - and _
      const input = 'SGVsbG8tV29ybGQ_'; // URL-safe base64
      const result = fromBase64(input);

      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('Round-trip conversion tests', () => {
    const testCases = [
      {
        name: 'simple text',
        data: 'Hello, World!',
      },
      {
        name: 'empty string',
        data: '',
      },
      {
        name: 'Unicode text',
        data: 'Hello 世界! 🌍 café naïve résumé',
      },
      {
        name: 'special characters',
        data: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      },
      {
        name: 'newlines and whitespace',
        data: 'Line 1\nLine 2\r\nLine 3\t\tTabbed',
      },
      {
        name: 'long text',
        data: 'Lorem ipsum '.repeat(100),
      },
    ];

    test.each(testCases)('should round-trip convert $name', ({ data }) => {
      const base64 = toBase64(data);
      const decoded = fromBase64(base64);
      const backToString = new TextDecoder().decode(decoded);

      expect(backToString).toBe(data);
    });

    const binaryTestCases = [
      {
        name: 'simple bytes',
        data: new Uint8Array([72, 101, 108, 108, 111]),
      },
      {
        name: 'empty array',
        data: new Uint8Array([]),
      },
      {
        name: 'single byte',
        data: new Uint8Array([42]),
      },
      {
        name: 'full byte range',
        data: new Uint8Array(Array.from({ length: 256 }, (_, i) => i)),
      },
      {
        name: 'random bytes',
        data: new Uint8Array([255, 0, 128, 64, 32, 16, 8, 4, 2, 1]),
      },
      {
        name: 'large binary data',
        data: new Uint8Array(Array.from({ length: 1024 }, () => Math.floor(Math.random() * 256))),
      },
    ];

    test.each(binaryTestCases)('should round-trip convert $name', ({ data }) => {
      const base64 = toBase64(data);
      const decoded = fromBase64(base64);

      expect(decoded).toEqual(data);
      expect(decoded.length).toBe(data.length);
      expect(Array.from(decoded)).toEqual(Array.from(data));
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle very large strings efficiently', () => {
      const largeString = 'A'.repeat(10000);
      const start = performance.now();

      const base64 = toBase64(largeString);
      const decoded = fromBase64(base64);

      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(new TextDecoder().decode(decoded)).toBe(largeString);
    });

    it('should handle very large Uint8Arrays efficiently', () => {
      const largeArray = new Uint8Array(10000).fill(65); // Fill with 'A'
      const start = performance.now();

      const base64 = toBase64(largeArray);
      const decoded = fromBase64(base64);

      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(decoded).toEqual(largeArray);
    });

    it('should produce consistent results across multiple calls', () => {
      const input = 'Consistency test data 🔄';
      const results = Array.from({ length: 10 }, () => toBase64(input));

      // All results should be identical
      expect(new Set(results).size).toBe(1);
    });

    it('should handle malformed base64 gracefully', () => {
      // This test depends on your error handling strategy
      // Buffer.from() typically handles malformed base64 gracefully
      const malformed = 'SGVsbG8=!@#'; // Contains invalid base64 characters

      // Should either throw or handle gracefully - adjust based on your requirements
      expect(() => fromBase64(malformed)).not.toThrow();
    });
  });

  describe('Type safety tests', () => {
    it('should preserve Uint8Array type information', () => {
      const input = new Uint8Array([1, 2, 3]);
      const base64 = toBase64(input);
      const result = fromBase64(base64);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.constructor).toBe(Uint8Array);
      expect(typeof result).toBe('object');
    });

    it('should return string for toBase64', () => {
      expect(typeof toBase64('test')).toBe('string');
      expect(typeof toBase64(new Uint8Array([1, 2, 3]))).toBe('string');
    });

    it('should return Uint8Array for fromBase64', () => {
      const result = fromBase64('dGVzdA==');
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('Compatibility tests', () => {
    it('should produce same output as native btoa for ASCII strings', () => {
      const asciiString = 'Hello World 123!';
      const ourResult = toBase64(asciiString);
      const nativeResult = btoa(asciiString);

      expect(ourResult).toBe(nativeResult);
    });

    it('should decode base64 produced by native btoa', () => {
      const original = 'Test string for compatibility';
      const nativeBase64 = btoa(original);
      const decoded = fromBase64(nativeBase64);
      const backToString = new TextDecoder().decode(decoded);

      expect(backToString).toBe(original);
    });
  });
});
