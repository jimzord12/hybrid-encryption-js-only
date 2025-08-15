import { beforeEach, describe, expect, it } from 'vitest';
import { KeyDerivation } from '../../../../../src/core/utils/key-derivation.utils.js';

describe('KeyDerivation Integration with ModernHybridEncryption', () => {
  let testSharedSecret: Uint8Array;

  beforeEach(() => {
    // Create a realistic shared secret (32 bytes)
    testSharedSecret = new Uint8Array(32);
    for (let i = 0; i < testSharedSecret.length; i++) {
      testSharedSecret[i] = Math.floor(Math.random() * 256);
    }
  });

  describe('integration with encryption workflow', () => {
    it('should derive keys compatible with symmetric algorithms', () => {
      // Test key derivation for different symmetric algorithms
      const testCases = [
        { algorithm: 'AES-GCM-128', expectedKeySize: 16 },
        { algorithm: 'AES-GCM-192', expectedKeySize: 24 },
        { algorithm: 'AES-GCM-256', expectedKeySize: 32 },
        { algorithm: 'ChaCha20-Poly1305', expectedKeySize: 32 },
      ];

      testCases.forEach(({ algorithm, expectedKeySize }) => {
        const keySize = KeyDerivation.getRecommendedKeySize(algorithm);
        expect(keySize).toBe(expectedKeySize);

        const derivedKey = KeyDerivation.deriveKey(testSharedSecret, keySize);
        expect(derivedKey.length).toBe(expectedKeySize);
      });
    });

    it('should create proper KeyMaterial objects for symmetric encryption', () => {
      const keySize = 32; // AES-256
      const derivedKey = KeyDerivation.deriveKey(testSharedSecret, keySize);
      const nonce = KeyDerivation.generateSalt(12); // AES-GCM nonce size

      // This mimics what ModernHybridEncryption does internally
      const keyMaterial = {
        key: derivedKey,
        nonce: nonce,
      };

      expect(keyMaterial.key).toBeInstanceOf(Uint8Array);
      expect(keyMaterial.key.length).toBe(keySize);
      expect(keyMaterial.nonce).toBeInstanceOf(Uint8Array);
      expect(keyMaterial.nonce.length).toBe(12);
    });

    it('should provide context-aware key derivation', () => {
      const keySize = 32;
      const context1 = 'user-data-encryption';
      const context2 = 'file-encryption';

      const info1 = KeyDerivation.generateInfo(context1);
      const info2 = KeyDerivation.generateInfo(context2);

      const key1 = KeyDerivation.deriveKey(testSharedSecret, keySize, undefined, info1);
      const key2 = KeyDerivation.deriveKey(testSharedSecret, keySize, undefined, info2);

      // Keys should be different due to different contexts
      expect(key1).not.toEqual(key2);
    });

    it('should support the KDF algorithms used by ModernHybridEncryption', () => {
      const supportedAlgorithms = KeyDerivation.getSupportedAlgorithms();

      // Check that ModernHybridEncryption's default algorithms are supported
      expect(supportedAlgorithms).toContain('HKDF-SHA256');
      expect(supportedAlgorithms).toContain('HKDF-SHA512');

      // Test derivation with both algorithms
      const keySize = 32;
      const key256 = KeyDerivation.deriveKey(
        testSharedSecret,
        keySize,
        undefined,
        undefined,
        'HKDF-SHA256',
      );
      const key512 = KeyDerivation.deriveKey(
        testSharedSecret,
        keySize,
        undefined,
        undefined,
        'HKDF-SHA512',
      );

      expect(key256.length).toBe(keySize);
      expect(key512.length).toBe(keySize);
      expect(key256).not.toEqual(key512); // Different algorithms should produce different keys
    });
  });

  describe('performance compatibility', () => {
    it('should derive keys efficiently for encryption operations', () => {
      const iterations = 50;
      const keySize = 32;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        // Simulate the key derivation step in ModernHybridEncryption
        const salt = KeyDerivation.generateSalt(32);
        const info = KeyDerivation.generateInfo(`operation-${i}`);
        KeyDerivation.deriveKey(testSharedSecret, keySize, salt, info, 'HKDF-SHA256');
      }

      const duration = Date.now() - startTime;
      const averageTime = duration / iterations;

      // Should be fast enough for real-time encryption
      expect(averageTime).toBeLessThan(5); // Less than 5ms per operation

      console.log(
        `Average key derivation time in encryption workflow: ${averageTime.toFixed(2)}ms`,
      );
    });
  });

  describe('security properties in encryption context', () => {
    it('should produce different keys for each encryption operation', () => {
      const keySize = 32;
      const keys: Uint8Array[] = [];

      // Simulate multiple encryption operations
      for (let i = 0; i < 10; i++) {
        // Each operation uses a fresh salt (as ModernHybridEncryption does)
        const salt = KeyDerivation.generateSalt(32);
        const info = KeyDerivation.generateInfo(`message-${i}`);
        const key = KeyDerivation.deriveKey(testSharedSecret, keySize, salt, info);
        keys.push(key);
      }

      // All keys should be different
      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          expect(keys[i]).not.toEqual(keys[j]);
        }
      }
    });

    it('should maintain consistency for same derivation parameters', () => {
      const keySize = 32;
      const salt = new Uint8Array(32).fill(42);
      const info = KeyDerivation.generateInfo('test-consistency');

      // Multiple derivations with same parameters should yield same result
      const key1 = KeyDerivation.deriveKey(testSharedSecret, keySize, salt, info, 'HKDF-SHA256');
      const key2 = KeyDerivation.deriveKey(testSharedSecret, keySize, salt, info, 'HKDF-SHA256');
      const key3 = KeyDerivation.deriveKey(testSharedSecret, keySize, salt, info, 'HKDF-SHA256');

      expect(key1).toEqual(key2);
      expect(key2).toEqual(key3);
    });

    it('should handle different shared secret sizes', () => {
      const keySizes = [16, 24, 32];
      const sharedSecretSizes = [16, 32, 48, 64];

      sharedSecretSizes.forEach(secretSize => {
        const sharedSecret = new Uint8Array(secretSize);
        for (let i = 0; i < secretSize; i++) {
          sharedSecret[i] = i % 256;
        }

        keySizes.forEach(keySize => {
          // Should successfully derive keys regardless of input secret size
          expect(() => {
            const derivedKey = KeyDerivation.deriveKey(sharedSecret, keySize);
            expect(derivedKey.length).toBe(keySize);
          }).not.toThrow();
        });
      });
    });
  });

  describe('error handling integration', () => {
    it('should provide clear error messages for ModernHybridEncryption', () => {
      // Test various error conditions that might occur during encryption

      expect(() => {
        KeyDerivation.deriveKey(new Uint8Array(0), 32);
      }).toThrow('Shared secret cannot be empty');

      expect(() => {
        KeyDerivation.deriveKey(testSharedSecret, 0);
      }).toThrow('Invalid key size');

      expect(() => {
        KeyDerivation.deriveKey(testSharedSecret, 32, undefined, undefined, 'INVALID' as any);
      }).toThrow('Unsupported KDF algorithm');
    });

    it('should validate inputs before processing', () => {
      // Test input validation that would catch issues early in the encryption process

      const tinySecret = new Uint8Array(8); // Too small
      expect(() => {
        KeyDerivation.deriveKey(tinySecret, 32);
      }).toThrow('Shared secret too short');

      const hugeKeySize = 2048; // Too large
      expect(() => {
        KeyDerivation.deriveKey(testSharedSecret, hugeKeySize);
      }).toThrow('Invalid key size');
    });
  });

  describe('compatibility with encryption constants', () => {
    it('should work with standard encryption key sizes', () => {
      // Test with common encryption key sizes
      const standardKeySizes = [
        16, // AES-128
        24, // AES-192
        32, // AES-256, ChaCha20
        48, // Custom larger size
        64, // Large key size
      ];

      standardKeySizes.forEach(keySize => {
        expect(() => {
          const derivedKey = KeyDerivation.deriveKey(testSharedSecret, keySize);
          expect(derivedKey.length).toBe(keySize);
        }).not.toThrow();
      });
    });

    it('should support nonce generation for different algorithms', () => {
      // Test nonce generation for different symmetric algorithms
      const nonceSizes = [
        { algorithm: 'AES-GCM', size: 12 },
        { algorithm: 'ChaCha20-Poly1305', size: 12 },
        { algorithm: 'AES-CTR', size: 16 },
      ];

      nonceSizes.forEach(({ size }) => {
        const nonce = KeyDerivation.generateSalt(size);
        expect(nonce.length).toBe(size);

        // Nonces should be random
        const nonce2 = KeyDerivation.generateSalt(size);
        expect(nonce).not.toEqual(nonce2);
      });
    });
  });
});
