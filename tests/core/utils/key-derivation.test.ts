import { beforeEach, describe, expect, it } from 'vitest';
import {
  KeyDerivation,
  type KeyDerivationConfig,
} from '../../../src/core/utils/key-derivation.util.js';

describe('KeyDerivation', () => {
  let testSharedSecret: Uint8Array;

  beforeEach(() => {
    // Create a test shared secret (32 bytes for testing)
    testSharedSecret = new Uint8Array(32);
    for (let i = 0; i < testSharedSecret.length; i++) {
      testSharedSecret[i] = i + 1; // 1, 2, 3, ..., 32
    }
  });

  describe('deriveKey', () => {
    it('should derive a key using HKDF-SHA256 by default', () => {
      const keySize = 32; // 256 bits
      const derivedKey = KeyDerivation.deriveKey(testSharedSecret, keySize);

      expect(derivedKey).toBeInstanceOf(Uint8Array);
      expect(derivedKey.length).toBe(keySize);
      expect(derivedKey).not.toEqual(testSharedSecret);
    });

    it('should derive a key using HKDF-SHA512', () => {
      const keySize = 32;
      const derivedKey = KeyDerivation.deriveKey(
        testSharedSecret,
        keySize,
        undefined,
        undefined,
        'HKDF-SHA512',
      );

      expect(derivedKey).toBeInstanceOf(Uint8Array);
      expect(derivedKey.length).toBe(keySize);
    });

    it('should produce different keys with different salts', () => {
      const keySize = 32;
      const salt1 = new Uint8Array(32).fill(1);
      const salt2 = new Uint8Array(32).fill(2);

      const key1 = KeyDerivation.deriveKey(testSharedSecret, keySize, salt1);
      const key2 = KeyDerivation.deriveKey(testSharedSecret, keySize, salt2);

      expect(key1).not.toEqual(key2);
    });

    it('should produce different keys with different info', () => {
      const keySize = 32;
      const info1 = new TextEncoder().encode('context1');
      const info2 = new TextEncoder().encode('context2');

      const key1 = KeyDerivation.deriveKey(testSharedSecret, keySize, undefined, info1);
      const key2 = KeyDerivation.deriveKey(testSharedSecret, keySize, undefined, info2);

      expect(key1).not.toEqual(key2);
    });

    it('should produce consistent results for same inputs', () => {
      const keySize = 32;
      const salt = new Uint8Array(32).fill(42);
      const info = new TextEncoder().encode('test-context');

      const key1 = KeyDerivation.deriveKey(testSharedSecret, keySize, salt, info, 'HKDF-SHA256');
      const key2 = KeyDerivation.deriveKey(testSharedSecret, keySize, salt, info, 'HKDF-SHA256');

      expect(key1).toEqual(key2);
    });

    it('should handle different key sizes', () => {
      const keySizes = [16, 24, 32, 48, 64];

      keySizes.forEach(keySize => {
        const derivedKey = KeyDerivation.deriveKey(testSharedSecret, keySize);
        expect(derivedKey.length).toBe(keySize);
      });
    });

    it('should throw error for invalid shared secret', () => {
      expect(() => {
        KeyDerivation.deriveKey(new Uint8Array(0), 32);
      }).toThrow('Shared secret cannot be empty');

      expect(() => {
        KeyDerivation.deriveKey(new Uint8Array(10), 32); // Too short
      }).toThrow('Shared secret too short');
    });

    it('should throw error for invalid key size', () => {
      expect(() => {
        KeyDerivation.deriveKey(testSharedSecret, 0);
      }).toThrow('Invalid key size');

      expect(() => {
        KeyDerivation.deriveKey(testSharedSecret, -1);
      }).toThrow('Invalid key size');

      expect(() => {
        KeyDerivation.deriveKey(testSharedSecret, 2048); // Too large
      }).toThrow('Invalid key size');
    });

    it('should throw error for unsupported algorithm', () => {
      expect(() => {
        KeyDerivation.deriveKey(testSharedSecret, 32, undefined, undefined, 'INVALID' as any);
      }).toThrow('Unsupported KDF algorithm');
    });
  });

  describe('deriveKeyWithConfig', () => {
    it('should derive key with complete configuration', () => {
      const config: KeyDerivationConfig = {
        algorithm: 'HKDF-SHA256',
        keyLength: 32,
        salt: new Uint8Array(32).fill(1),
        info: new TextEncoder().encode('test-info'),
      };

      const result = KeyDerivation.deriveKeyWithConfig(testSharedSecret, config);

      expect(result.key).toBeInstanceOf(Uint8Array);
      expect(result.key.length).toBe(32);
      expect(result.salt).toEqual(config.salt);
      expect(result.info).toEqual(config.info);
      expect(result.algorithm).toBe('HKDF-SHA256');
    });

    it('should generate salt and info when not provided', () => {
      const config: KeyDerivationConfig = {
        algorithm: 'HKDF-SHA512',
        keyLength: 24,
      };

      const result = KeyDerivation.deriveKeyWithConfig(testSharedSecret, config);

      expect(result.key.length).toBe(24);
      expect(result.salt.length).toBe(32); // Default salt size
      expect(result.info.length).toBeGreaterThan(0);
      expect(result.algorithm).toBe('HKDF-SHA512');
    });
  });

  describe('generateSalt', () => {
    it('should generate random salt of default size', () => {
      const salt1 = KeyDerivation.generateSalt();
      const salt2 = KeyDerivation.generateSalt();

      expect(salt1.length).toBe(32); // Default size
      expect(salt2.length).toBe(32);
      expect(salt1).not.toEqual(salt2); // Should be random
    });

    it('should generate salt of specified size', () => {
      const sizes = [16, 24, 32, 48, 64];

      sizes.forEach(size => {
        const salt = KeyDerivation.generateSalt(size);
        expect(salt.length).toBe(size);
      });
    });

    it('should throw error for invalid salt size', () => {
      expect(() => {
        KeyDerivation.generateSalt(0);
      }).toThrow('Invalid salt size');

      expect(() => {
        KeyDerivation.generateSalt(-1);
      }).toThrow('Invalid salt size');

      expect(() => {
        KeyDerivation.generateSalt(300); // Too large
      }).toThrow('Invalid salt size');
    });
  });

  describe('generateInfo', () => {
    it('should generate default info', () => {
      const info = KeyDerivation.generateInfo();
      const infoString = new TextDecoder().decode(info);

      expect(infoString).toContain('HybridEncryption-v2.0');
    });

    it('should generate info with custom context', () => {
      const context = 'custom-context';
      const info = KeyDerivation.generateInfo(context);
      const infoString = new TextDecoder().decode(info);

      expect(infoString).toContain('HybridEncryption-v2.0');
      expect(infoString).toContain(context);
    });

    it('should create info from multiple components', () => {
      const components = ['component1', 'component2', 'component3'];
      const info = KeyDerivation.createInfoFromComponents(components);
      const infoString = new TextDecoder().decode(info);

      expect(infoString).toContain('HybridEncryption-v2.0');
      expect(infoString).toContain('component1');
      expect(infoString).toContain('component2');
      expect(infoString).toContain('component3');
    });
  });

  describe('getRecommendedKeySize', () => {
    it('should return correct key sizes for known algorithms', () => {
      expect(KeyDerivation.getRecommendedKeySize('AES-GCM-128')).toBe(16);
      expect(KeyDerivation.getRecommendedKeySize('AES-GCM-192')).toBe(24);
      expect(KeyDerivation.getRecommendedKeySize('AES-GCM-256')).toBe(32);
      expect(KeyDerivation.getRecommendedKeySize('ChaCha20-Poly1305')).toBe(32);
    });

    it('should return default size for unknown algorithms', () => {
      expect(KeyDerivation.getRecommendedKeySize('unknown-algorithm')).toBe(32);
    });

    it('should be case insensitive', () => {
      expect(KeyDerivation.getRecommendedKeySize('aes-gcm-256')).toBe(32);
      expect(KeyDerivation.getRecommendedKeySize('CHACHA20-POLY1305')).toBe(32);
    });
  });

  describe('algorithm support', () => {
    it('should identify supported algorithms', () => {
      expect(KeyDerivation.isSupportedAlgorithm('HKDF-SHA256')).toBe(true);
      expect(KeyDerivation.isSupportedAlgorithm('HKDF-SHA512')).toBe(true);
      expect(KeyDerivation.isSupportedAlgorithm('INVALID')).toBe(false);
    });

    it('should return list of supported algorithms', () => {
      const algorithms = KeyDerivation.getSupportedAlgorithms();
      expect(algorithms).toContain('HKDF-SHA256');
      expect(algorithms).toContain('HKDF-SHA512');
      expect(algorithms.length).toBe(2);
    });
  });

  describe('performance', () => {
    it('should derive keys efficiently', () => {
      const startTime = Date.now();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        KeyDerivation.deriveKey(testSharedSecret, 32);
      }

      const duration = Date.now() - startTime;
      const averageTime = duration / iterations;

      // Should be fast (adjust threshold as needed)
      expect(averageTime).toBeLessThan(10); // Less than 10ms per derivation

      console.log(`Average key derivation time: ${averageTime.toFixed(2)}ms`);
    });

    it('should handle large key sizes efficiently', () => {
      const largeKeySize = 512; // 4096 bits

      const startTime = Date.now();
      const derivedKey = KeyDerivation.deriveKey(testSharedSecret, largeKeySize);
      const duration = Date.now() - startTime;

      expect(derivedKey.length).toBe(largeKeySize);
      expect(duration).toBeLessThan(100); // Should complete in reasonable time
    });
  });

  describe('security properties', () => {
    it('should produce different outputs for different algorithms', () => {
      const keySize = 32;
      const salt = new Uint8Array(32).fill(1);
      const info = new TextEncoder().encode('test');

      const key256 = KeyDerivation.deriveKey(testSharedSecret, keySize, salt, info, 'HKDF-SHA256');
      const key512 = KeyDerivation.deriveKey(testSharedSecret, keySize, salt, info, 'HKDF-SHA512');

      expect(key256).not.toEqual(key512);
    });

    it('should be deterministic for same inputs', () => {
      const keySize = 32;
      const salt = new Uint8Array(32).fill(42);
      const info = new TextEncoder().encode('deterministic-test');

      const results: Uint8Array[] = [];
      for (let i = 0; i < 5; i++) {
        const key = KeyDerivation.deriveKey(testSharedSecret, keySize, salt, info, 'HKDF-SHA256');
        results.push(key);
      }

      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(results[0]);
      }
    });

    it('should produce uniform distribution (basic check)', () => {
      const keySize = 32;
      const derivedKey = KeyDerivation.deriveKey(testSharedSecret, keySize);

      // Check that not all bytes are the same (basic randomness check)
      const firstByte = derivedKey[0];
      const allSame = derivedKey.every(byte => byte === firstByte);
      expect(allSame).toBe(false);

      // Check that we have some variation in byte values
      const uniqueBytes = new Set(derivedKey).size;
      expect(uniqueBytes).toBeGreaterThan(keySize / 4); // At least 25% unique values
    });
  });
});
