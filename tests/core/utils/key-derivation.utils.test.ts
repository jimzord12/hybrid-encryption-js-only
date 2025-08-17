import { describe, expect, it } from 'vitest';
import { Preset } from '../../../src/core/common/enums/index.js';
import { BufferUtils } from '../../../src/core/utils/buffer.utils.js';
import { KeyDerivation } from '../../../src/core/utils/key-derivation.utils.js';

describe('KeyDerivation', () => {
  describe('deriveKey', () => {
    it('should derive key from shared secret with NORMAL preset', () => {
      const sharedSecret = BufferUtils.getSecureRandomBytes(32);
      const derivedKey = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret);

      expect(derivedKey).toBeInstanceOf(Uint8Array);
      expect(derivedKey.length).toBe(32); // 256 bits
    });

    it('should derive key from shared secret with HIGH_SECURITY preset', () => {
      const sharedSecret = BufferUtils.getSecureRandomBytes(32);
      const derivedKey = KeyDerivation.deriveKey(Preset.HIGH_SECURITY, sharedSecret);

      expect(derivedKey).toBeInstanceOf(Uint8Array);
      expect(derivedKey.length).toBe(32); // Still 256 bits by default
    });

    it('should produce deterministic output for same inputs', () => {
      const sharedSecret = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

      const key1 = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret);
      const key2 = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret);

      expect(BufferUtils.constantTimeEqual(key1, key2)).toBe(true);
    });

    it('should produce different keys for different presets', () => {
      const sharedSecret = BufferUtils.getSecureRandomBytes(32);

      const normalKey = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret);
      const highSecKey = KeyDerivation.deriveKey(Preset.HIGH_SECURITY, sharedSecret);

      expect(BufferUtils.constantTimeEqual(normalKey, highSecKey)).toBe(false);
    });

    it('should produce different keys for different shared secrets', () => {
      const sharedSecret1 = BufferUtils.getSecureRandomBytes(32);
      const sharedSecret2 = BufferUtils.getSecureRandomBytes(32);

      const key1 = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret1);
      const key2 = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret2);

      expect(BufferUtils.constantTimeEqual(key1, key2)).toBe(false);
    });

    it('should handle minimum size shared secret (16 bytes)', () => {
      const sharedSecret = BufferUtils.getSecureRandomBytes(16);
      const derivedKey = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret);

      expect(derivedKey).toBeInstanceOf(Uint8Array);
      expect(derivedKey.length).toBe(32);
    });

    it('should handle large shared secrets', () => {
      const sharedSecret = BufferUtils.getSecureRandomBytes(128);
      const derivedKey = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret);

      expect(derivedKey).toBeInstanceOf(Uint8Array);
      expect(derivedKey.length).toBe(32);
    });

    it('should throw error for empty shared secret', () => {
      const emptySecret = new Uint8Array(0);

      expect(() => {
        KeyDerivation.deriveKey(Preset.NORMAL, emptySecret);
      }).toThrow('Shared secret cannot be empty');
    });

    it('should throw error for null shared secret', () => {
      expect(() => {
        KeyDerivation.deriveKey(Preset.NORMAL, null as any);
      }).toThrow('Shared secret cannot be empty');
    });

    it('should throw error for undefined shared secret', () => {
      expect(() => {
        KeyDerivation.deriveKey(Preset.NORMAL, undefined as any);
      }).toThrow('Shared secret cannot be empty');
    });

    it('should throw error for shared secret that is too short', () => {
      const shortSecret = new Uint8Array([1, 2, 3, 4, 5]); // Only 5 bytes

      expect(() => {
        KeyDerivation.deriveKey(Preset.NORMAL, shortSecret);
      }).toThrow('Shared secret too short: 5 bytes. Minimum 16 bytes required.');
    });

    it('should throw error for invalid preset', () => {
      const sharedSecret = BufferUtils.getSecureRandomBytes(32);

      expect(() => {
        KeyDerivation.deriveKey('INVALID_PRESET' as any, sharedSecret);
      }).toThrow('Unsupported Preset: INVALID_PRESET');
    });

    it('should use different hash functions for different presets', () => {
      // This test verifies that different presets use different hash algorithms
      const sharedSecret = new Uint8Array(32).fill(42); // Fixed value for reproducibility

      const normalKey = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret);
      const highSecKey = KeyDerivation.deriveKey(Preset.HIGH_SECURITY, sharedSecret);

      // Keys should be different due to different hash functions (SHA-256 vs SHA-512)
      expect(BufferUtils.constantTimeEqual(normalKey, highSecKey)).toBe(false);
    });

    it('should work with edge case shared secret sizes', () => {
      const sizes = [16, 17, 31, 32, 33, 63, 64, 65, 127, 128];

      sizes.forEach(size => {
        const sharedSecret = BufferUtils.getSecureRandomBytes(size);
        const derivedKey = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret);

        expect(derivedKey).toBeInstanceOf(Uint8Array);
        expect(derivedKey.length).toBe(32);
      });
    });
  });

  describe('generateSalt', () => {
    it('should generate salt for NORMAL preset', () => {
      const salt = KeyDerivation.generateSalt(Preset.NORMAL);

      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(32); // 256 bits for NORMAL
    });

    it('should generate salt for HIGH_SECURITY preset', () => {
      const salt = KeyDerivation.generateSalt(Preset.HIGH_SECURITY);

      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(64); // 512 bits for HIGH_SECURITY
    });

    it('should generate different salts on each call', () => {
      const salt1 = KeyDerivation.generateSalt(Preset.NORMAL);
      const salt2 = KeyDerivation.generateSalt(Preset.NORMAL);

      expect(BufferUtils.constantTimeEqual(salt1, salt2)).toBe(false);
    });

    it('should generate cryptographically secure random salts', () => {
      const salts = [];
      for (let i = 0; i < 10; i++) {
        salts.push(KeyDerivation.generateSalt(Preset.NORMAL));
      }

      // All salts should be different
      for (let i = 0; i < salts.length; i++) {
        for (let j = i + 1; j < salts.length; j++) {
          expect(BufferUtils.constantTimeEqual(salts[i], salts[j])).toBe(false);
        }
      }
    });
  });

  describe('generateSaltForSharedSecretSalt', () => {
    it('should generate deterministic salt from shared secret with NORMAL preset', () => {
      const sharedSecret = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

      const salt1 = KeyDerivation.generateSaltForSharedSecretSalt(Preset.NORMAL, sharedSecret);
      const salt2 = KeyDerivation.generateSaltForSharedSecretSalt(Preset.NORMAL, sharedSecret);

      expect(BufferUtils.constantTimeEqual(salt1, salt2)).toBe(true);
      expect(salt1.length).toBe(32);
    });

    it('should generate deterministic salt from shared secret with HIGH_SECURITY preset', () => {
      const sharedSecret = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

      const salt1 = KeyDerivation.generateSaltForSharedSecretSalt(
        Preset.HIGH_SECURITY,
        sharedSecret,
      );
      const salt2 = KeyDerivation.generateSaltForSharedSecretSalt(
        Preset.HIGH_SECURITY,
        sharedSecret,
      );

      expect(BufferUtils.constantTimeEqual(salt1, salt2)).toBe(true);
      expect(salt1.length).toBe(64);
    });

    it('should generate different salts for different shared secrets', () => {
      const sharedSecret1 = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      const sharedSecret2 = new Uint8Array([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);

      const salt1 = KeyDerivation.generateSaltForSharedSecretSalt(Preset.NORMAL, sharedSecret1);
      const salt2 = KeyDerivation.generateSaltForSharedSecretSalt(Preset.NORMAL, sharedSecret2);

      expect(BufferUtils.constantTimeEqual(salt1, salt2)).toBe(false);
    });

    it('should generate different salts for different presets with same shared secret', () => {
      const sharedSecret = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

      const normalSalt = KeyDerivation.generateSaltForSharedSecretSalt(Preset.NORMAL, sharedSecret);
      const highSecSalt = KeyDerivation.generateSaltForSharedSecretSalt(
        Preset.HIGH_SECURITY,
        sharedSecret,
      );

      expect(normalSalt.length).toBe(32);
      expect(highSecSalt.length).toBe(64);
      // Can't directly compare different lengths, but they should be derived differently
    });
  });

  describe('getInfo', () => {
    it('should return consistent info bytes', () => {
      const info1 = KeyDerivation.getInfo();
      const info2 = KeyDerivation.getInfo();

      expect(BufferUtils.constantTimeEqual(info1, info2)).toBe(true);
    });

    it('should return UTF-8 encoded info string', () => {
      const info = KeyDerivation.getInfo();
      const infoString = BufferUtils.binaryToString(info);

      expect(infoString).toBe('HybridEncryption-v2.0');
    });

    it('should return Uint8Array', () => {
      const info = KeyDerivation.getInfo();
      expect(info).toBeInstanceOf(Uint8Array);
      expect(info.length).toBeGreaterThan(0);
    });
  });

  describe('validateInputs (internal validation)', () => {
    it('should validate through deriveKey method - valid inputs', () => {
      const validSecret = BufferUtils.getSecureRandomBytes(32);

      // Should not throw
      expect(() => {
        KeyDerivation.deriveKey(Preset.NORMAL, validSecret);
      }).not.toThrow();
    });

    it('should validate through deriveKey method - invalid preset', () => {
      const validSecret = BufferUtils.getSecureRandomBytes(32);

      expect(() => {
        KeyDerivation.deriveKey('INVALID' as any, validSecret);
      }).toThrow('Unsupported Preset: INVALID');
    });

    it('should validate through deriveKey method - short shared secret', () => {
      const shortSecret = new Uint8Array([1, 2, 3]); // Too short

      expect(() => {
        KeyDerivation.deriveKey(Preset.NORMAL, shortSecret);
      }).toThrow('Shared secret too short: 3 bytes. Minimum 16 bytes required.');
    });
  });

  describe('integration tests', () => {
    it('should work in complete key derivation workflow', () => {
      // Simulate a complete key derivation workflow
      const sharedSecret = BufferUtils.getSecureRandomBytes(32);

      // Derive symmetric key
      const symmetricKey = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret);

      // Generate additional salt for other purposes
      const additionalSalt = KeyDerivation.generateSalt(Preset.NORMAL);

      // Get context info
      const info = KeyDerivation.getInfo();

      expect(symmetricKey).toBeInstanceOf(Uint8Array);
      expect(symmetricKey.length).toBe(32);
      expect(additionalSalt).toBeInstanceOf(Uint8Array);
      expect(additionalSalt.length).toBe(32);
      expect(info).toBeInstanceOf(Uint8Array);
      expect(info.length).toBeGreaterThan(0);
    });

    it('should be consistent across multiple derivations with same input', () => {
      const sharedSecret = new Uint8Array(32).fill(123);

      const keys = [];
      for (let i = 0; i < 5; i++) {
        keys.push(KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret));
      }

      // All keys should be identical
      for (let i = 1; i < keys.length; i++) {
        expect(BufferUtils.constantTimeEqual(keys[0], keys[i])).toBe(true);
      }
    });

    it('should produce high entropy keys', () => {
      const sharedSecret = BufferUtils.getSecureRandomBytes(32);
      const derivedKey = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret);

      // Check that the key doesn't have obvious patterns
      let allSame = true;
      let allZero = true;
      let allMax = true;

      for (let i = 1; i < derivedKey.length; i++) {
        if (derivedKey[i] !== derivedKey[0]) allSame = false;
        if (derivedKey[i] !== 0) allZero = false;
        if (derivedKey[i] !== 255) allMax = false;
      }

      expect(allSame).toBe(false);
      expect(allZero).toBe(false);
      expect(allMax).toBe(false);
    });

    it('should handle stress test with many derivations', () => {
      const iterations = 100;
      const results = new Set();

      for (let i = 0; i < iterations; i++) {
        const sharedSecret = BufferUtils.getSecureRandomBytes(32);
        const derivedKey = KeyDerivation.deriveKey(Preset.NORMAL, sharedSecret);
        const keyString = Array.from(derivedKey).join(',');

        expect(derivedKey.length).toBe(32);
        expect(results.has(keyString)).toBe(false); // Each key should be unique
        results.add(keyString);
      }

      expect(results.size).toBe(iterations);
    });
  });

  describe('error handling', () => {
    it('should provide meaningful error messages', () => {
      const shortSecret = new Uint8Array([1, 2, 3]);

      try {
        KeyDerivation.deriveKey(Preset.NORMAL, shortSecret);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Shared secret too short');
        expect((error as Error).message).toContain('3 bytes');
        expect((error as Error).message).toContain('Minimum 16 bytes required');
      }
    });

    it('should handle edge cases gracefully', () => {
      // Test with various invalid inputs
      const testCases = [
        { input: null, expectedError: 'Shared secret cannot be empty' },
        { input: undefined, expectedError: 'Shared secret cannot be empty' },
        { input: new Uint8Array(0), expectedError: 'Shared secret cannot be empty' },
        { input: new Uint8Array([1, 2, 3, 4, 5]), expectedError: 'Shared secret too short' },
      ];

      testCases.forEach(({ input, expectedError }) => {
        expect(() => {
          KeyDerivation.deriveKey(Preset.NORMAL, input as any);
        }).toThrow(expectedError);
      });
    });
  });
});
