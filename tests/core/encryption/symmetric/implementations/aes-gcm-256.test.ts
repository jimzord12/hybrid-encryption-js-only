import { randomBytes } from '@noble/hashes/utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { AES256GCMAlgorithm } from '../../../../../src/core/encryption/symmetric/implementations/aes-gcm-256-alg';

describe('AES256GCMAlgorithm', () => {
  let algorithm: AES256GCMAlgorithm;

  beforeEach(() => {
    algorithm = new AES256GCMAlgorithm();
  });

  describe('Algorithm Properties', () => {
    it('should have correct algorithm identifier', () => {
      expect(algorithm.getAlgorithmId()).toBe('AES-GCM-256');
    });

    it('should have correct algorithm name', () => {
      expect(algorithm.name).toBe('AES-GCM-256');
    });

    it('should have correct key size (256 bits = 32 bytes)', () => {
      expect(algorithm.keySize).toBe(32);
    });

    it('should have correct nonce size (96 bits = 12 bytes)', () => {
      expect(algorithm.nonceSize).toBe(12);
    });

    it('should be an AEAD algorithm', () => {
      expect(algorithm.isAEAD).toBe(true);
    });
  });

  describe('Key Material Derivation', () => {
    it('should derive key material from shared secret', () => {
      const sharedSecret = randomBytes(32);
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('test-info');

      const keyMaterial = algorithm.deriveKeyMaterial(sharedSecret, salt, info);

      expect(keyMaterial).toBeDefined();
      expect(keyMaterial.key).toBeInstanceOf(Uint8Array);
      expect(keyMaterial.nonce).toBeInstanceOf(Uint8Array);
      expect(keyMaterial.info).toBe(info);
      expect(keyMaterial.key.length).toBe(32); // 256-bit key
      expect(keyMaterial.nonce.length).toBe(12); // 96-bit nonce
    });

    it('should derive different keys for different shared secrets', () => {
      const sharedSecret1 = randomBytes(32);
      const sharedSecret2 = randomBytes(32);
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('test-info');

      const keyMaterial1 = algorithm.deriveKeyMaterial(sharedSecret1, salt, info);
      const keyMaterial2 = algorithm.deriveKeyMaterial(sharedSecret2, salt, info);

      expect(keyMaterial1.key).not.toEqual(keyMaterial2.key);
    });

    it('should derive different keys for different salts', () => {
      const sharedSecret = randomBytes(32);
      const salt1 = randomBytes(16);
      const salt2 = randomBytes(16);
      const info = new TextEncoder().encode('test-info');

      const keyMaterial1 = algorithm.deriveKeyMaterial(sharedSecret, salt1, info);
      const keyMaterial2 = algorithm.deriveKeyMaterial(sharedSecret, salt2, info);

      expect(keyMaterial1.key).not.toEqual(keyMaterial2.key);
    });

    it('should derive different keys for different info', () => {
      const sharedSecret = randomBytes(32);
      const salt = randomBytes(16);
      const info1 = new TextEncoder().encode('test-info-1');
      const info2 = new TextEncoder().encode('test-info-2');

      const keyMaterial1 = algorithm.deriveKeyMaterial(sharedSecret, salt, info1);
      const keyMaterial2 = algorithm.deriveKeyMaterial(sharedSecret, salt, info2);

      expect(keyMaterial1.key).not.toEqual(keyMaterial2.key);
    });

    it('should generate different nonces each time', () => {
      const sharedSecret = randomBytes(32);
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('test-info');

      const keyMaterial1 = algorithm.deriveKeyMaterial(sharedSecret, salt, info);
      const keyMaterial2 = algorithm.deriveKeyMaterial(sharedSecret, salt, info);

      expect(keyMaterial1.nonce).not.toEqual(keyMaterial2.nonce);
    });
  });

  describe('Encryption', () => {
    let keyMaterial: any;

    beforeEach(() => {
      const sharedSecret = randomBytes(32);
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('test-info');
      keyMaterial = algorithm.deriveKeyMaterial(sharedSecret, salt, info);
    });

    it('should encrypt data successfully', () => {
      const plaintext = new TextEncoder().encode('Hello, World!');

      const result = algorithm.encrypt(plaintext, keyMaterial);

      expect(result).toBeDefined();
      expect(result.encryptedData).toBeInstanceOf(Uint8Array);
      expect(result.nonce).toEqual(keyMaterial.nonce);
      expect(result.authData).toBeInstanceOf(Uint8Array);
      expect(result.encryptedData.length).toBeGreaterThan(plaintext.length); // Includes auth tag
    });

    it('should produce different ciphertext for same plaintext with different nonces', () => {
      const plaintext = new TextEncoder().encode('Hello, World!');

      // Create different key materials with different nonces
      const sharedSecret = randomBytes(32);
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('test-info');
      const keyMaterial1 = algorithm.deriveKeyMaterial(sharedSecret, salt, info);
      const keyMaterial2 = algorithm.deriveKeyMaterial(sharedSecret, salt, info);

      const result1 = algorithm.encrypt(plaintext, keyMaterial1);
      const result2 = algorithm.encrypt(plaintext, keyMaterial2);

      expect(result1.encryptedData).not.toEqual(result2.encryptedData);
      expect(result1.nonce).not.toEqual(result2.nonce);
    });

    it('should encrypt empty data', () => {
      const emptyData = new Uint8Array(0);

      const result = algorithm.encrypt(emptyData, keyMaterial);

      expect(result.encryptedData).toBeInstanceOf(Uint8Array);
      expect(result.encryptedData.length).toBe(16); // Only auth tag for empty data
    });

    it('should encrypt large data', () => {
      const largeData = randomBytes(10000); // 10KB of random data

      const result = algorithm.encrypt(largeData, keyMaterial);

      expect(result.encryptedData).toBeInstanceOf(Uint8Array);
      expect(result.encryptedData.length).toBe(largeData.length + 16); // Original + auth tag
    });

    it('should throw error for invalid key material', () => {
      const plaintext = new TextEncoder().encode('Hello, World!');
      const invalidKeyMaterial = {
        key: new Uint8Array(16), // Wrong key size
        nonce: keyMaterial.nonce,
        info: keyMaterial.info,
      };

      expect(() => {
        algorithm.encrypt(plaintext, invalidKeyMaterial);
      }).toThrow();
    });
  });

  describe('Decryption', () => {
    let keyMaterial: any;

    beforeEach(() => {
      const sharedSecret = randomBytes(32);
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('test-info');
      keyMaterial = algorithm.deriveKeyMaterial(sharedSecret, salt, info);
    });

    it('should decrypt data successfully', () => {
      const originalText = 'Hello, World!';
      const plaintext = new TextEncoder().encode(originalText);

      const encrypted = algorithm.encrypt(plaintext, keyMaterial);
      const decrypted = algorithm.decrypt(encrypted.encryptedData, keyMaterial);

      expect(decrypted).toEqual(plaintext);
      expect(new TextDecoder().decode(decrypted)).toBe(originalText);
    });

    it('should decrypt empty data', () => {
      const emptyData = new Uint8Array(0);

      const encrypted = algorithm.encrypt(emptyData, keyMaterial);
      const decrypted = algorithm.decrypt(encrypted.encryptedData, keyMaterial);

      expect(decrypted).toEqual(emptyData);
    });

    it('should decrypt large data', () => {
      const largeData = randomBytes(10000);

      const encrypted = algorithm.encrypt(largeData, keyMaterial);
      const decrypted = algorithm.decrypt(encrypted.encryptedData, keyMaterial);

      expect(decrypted).toEqual(largeData);
    });

    it('should fail with wrong key', () => {
      const plaintext = new TextEncoder().encode('Hello, World!');
      const encrypted = algorithm.encrypt(plaintext, keyMaterial);

      const wrongKeyMaterial = {
        key: randomBytes(32), // Different key
        nonce: keyMaterial.nonce,
        info: keyMaterial.info,
      };

      expect(() => {
        algorithm.decrypt(encrypted.encryptedData, wrongKeyMaterial);
      }).toThrow();
    });

    it('should fail with wrong nonce', () => {
      const plaintext = new TextEncoder().encode('Hello, World!');
      const encrypted = algorithm.encrypt(plaintext, keyMaterial);

      const wrongKeyMaterial = {
        key: keyMaterial.key,
        nonce: randomBytes(12), // Different nonce
        info: keyMaterial.info,
      };

      expect(() => {
        algorithm.decrypt(encrypted.encryptedData, wrongKeyMaterial);
      }).toThrow();
    });

    it('should fail with corrupted ciphertext', () => {
      const plaintext = new TextEncoder().encode('Hello, World!');
      const encrypted = algorithm.encrypt(plaintext, keyMaterial);

      // Corrupt the ciphertext
      const corruptedData = new Uint8Array(encrypted.encryptedData);
      corruptedData[0] ^= 1; // Flip one bit

      expect(() => {
        algorithm.decrypt(corruptedData, keyMaterial);
      }).toThrow();
    });

    it('should fail with truncated ciphertext', () => {
      const plaintext = new TextEncoder().encode('Hello, World!');
      const encrypted = algorithm.encrypt(plaintext, keyMaterial);

      // Truncate the ciphertext (remove auth tag)
      const truncatedData = encrypted.encryptedData.slice(0, -1);

      expect(() => {
        algorithm.decrypt(truncatedData, keyMaterial);
      }).toThrow();
    });
  });

  describe('Encryption/Decryption Round Trip', () => {
    it('should maintain data integrity through multiple round trips', () => {
      const testData = [
        'Simple text',
        'Text with special chars: áéíóú ñ çÇ',
        '{"json": "data", "number": 42, "array": [1,2,3]}',
        'Very long text '.repeat(100),
        '', // Empty string
      ];

      testData.forEach(text => {
        const sharedSecret = randomBytes(32);
        const salt = randomBytes(16);
        const info = new TextEncoder().encode('test-info');
        const keyMaterial = algorithm.deriveKeyMaterial(sharedSecret, salt, info);

        const plaintext = new TextEncoder().encode(text);
        const encrypted = algorithm.encrypt(plaintext, keyMaterial);
        const decrypted = algorithm.decrypt(encrypted.encryptedData, keyMaterial);

        expect(new TextDecoder().decode(decrypted)).toBe(text);
      });
    });

    it('should handle binary data correctly', () => {
      const binaryData = new Uint8Array([
        0x00, 0x01, 0x02, 0x03, 0xff, 0xfe, 0xfd, 0xfc, 0x80, 0x7f, 0x40, 0x3f, 0x20, 0x1f, 0x10,
        0x0f,
      ]);

      const sharedSecret = randomBytes(32);
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('test-info');
      const keyMaterial = algorithm.deriveKeyMaterial(sharedSecret, salt, info);

      const encrypted = algorithm.encrypt(binaryData, keyMaterial);
      const decrypted = algorithm.decrypt(encrypted.encryptedData, keyMaterial);

      expect(decrypted).toEqual(binaryData);
    });
  });

  describe('Nonce Generation', () => {
    it('should generate nonces of correct size', () => {
      const nonce = algorithm.generateNonce();
      expect(nonce).toBeInstanceOf(Uint8Array);
      expect(nonce.length).toBe(12);
    });

    it('should generate different nonces', () => {
      const nonces = Array.from({ length: 100 }, () => algorithm.generateNonce());
      const uniqueNonces = new Set(nonces.map(n => Array.from(n).join(',')));

      // All nonces should be unique (extremely high probability)
      expect(uniqueNonces.size).toBe(100);
    });

    it('should generate non-zero nonces', () => {
      const nonces = Array.from({ length: 10 }, () => algorithm.generateNonce());

      nonces.forEach(nonce => {
        expect(nonce.some(byte => byte !== 0)).toBe(true);
      });
    });
  });

  describe('Performance', () => {
    it('should encrypt data within reasonable time', () => {
      const data = randomBytes(1000); // 1KB
      const sharedSecret = randomBytes(32);
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('test-info');
      const keyMaterial = algorithm.deriveKeyMaterial(sharedSecret, salt, info);

      const start = performance.now();
      algorithm.encrypt(data, keyMaterial);
      const end = performance.now();

      // Should complete within 10ms (generous threshold)
      expect(end - start).toBeLessThan(10);
    });

    it('should decrypt data within reasonable time', () => {
      const data = randomBytes(1000); // 1KB
      const sharedSecret = randomBytes(32);
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('test-info');
      const keyMaterial = algorithm.deriveKeyMaterial(sharedSecret, salt, info);

      const encrypted = algorithm.encrypt(data, keyMaterial);

      const start = performance.now();
      algorithm.decrypt(encrypted.encryptedData, keyMaterial);
      const end = performance.now();

      // Should complete within 10ms (generous threshold)
      expect(end - start).toBeLessThan(10);
    });
  });

  describe('Security Properties', () => {
    it('should produce different ciphertext for same plaintext with different keys', () => {
      const plaintext = new TextEncoder().encode('Same message');

      const sharedSecret1 = randomBytes(32);
      const sharedSecret2 = randomBytes(32);
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('test-info');

      const keyMaterial1 = algorithm.deriveKeyMaterial(sharedSecret1, salt, info);
      const keyMaterial2 = algorithm.deriveKeyMaterial(sharedSecret2, salt, info);

      const encrypted1 = algorithm.encrypt(plaintext, keyMaterial1);
      const encrypted2 = algorithm.encrypt(plaintext, keyMaterial2);

      expect(encrypted1.encryptedData).not.toEqual(encrypted2.encryptedData);
    });

    it('should detect tampering with authentication', () => {
      const plaintext = new TextEncoder().encode('Important message');
      const sharedSecret = randomBytes(32);
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('test-info');
      const keyMaterial = algorithm.deriveKeyMaterial(sharedSecret, salt, info);

      const encrypted = algorithm.encrypt(plaintext, keyMaterial);

      // Tamper with different parts of the ciphertext
      for (let i = 0; i < encrypted.encryptedData.length; i++) {
        const tamperedData = new Uint8Array(encrypted.encryptedData);
        tamperedData[i] ^= 1; // Flip one bit

        expect(() => {
          algorithm.decrypt(tamperedData, keyMaterial);
        }).toThrow();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined gracefully', () => {
      const sharedSecret = randomBytes(32);
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('test-info');
      const keyMaterial = algorithm.deriveKeyMaterial(sharedSecret, salt, info);

      expect(() => {
        algorithm.encrypt(null as any, keyMaterial);
      }).toThrow();

      expect(() => {
        algorithm.decrypt(null as any, keyMaterial);
      }).toThrow();
    });

    it('should handle invalid key material gracefully', () => {
      const plaintext = new TextEncoder().encode('test');

      expect(() => {
        algorithm.encrypt(plaintext, null as any);
      }).toThrow();

      expect(() => {
        algorithm.encrypt(plaintext, {} as any);
      }).toThrow();
    });
  });
});
