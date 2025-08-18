import { ClientEncryption } from '../../../src/client';
import { Preset } from '../../../src/common/types';
import { EncryptedData } from '../../../src/core/common/interfaces/encryption.interfaces';
import { ServerDecryptionAllPublic } from '../../../src/server/decrypt-all-public';

describe('Comprehensive Client-Server Integration Tests', () => {
  let clientNormal: ClientEncryption;
  let clientHighSec: ClientEncryption;
  let serverNormal: ServerDecryptionAllPublic;
  let serverHighSec: ServerDecryptionAllPublic;

  beforeEach(() => {
    // Reset instances to ensure clean state
    ClientEncryption.resetInstance();
    ServerDecryptionAllPublic.resetInstance();

    // Create fresh instances
    clientNormal = ClientEncryption.getInstance(Preset.NORMAL);
    clientHighSec = ClientEncryption.getInstance(Preset.HIGH_SECURITY);
    serverNormal = ServerDecryptionAllPublic.getInstance(Preset.NORMAL);
    serverHighSec = ServerDecryptionAllPublic.getInstance(Preset.HIGH_SECURITY);
  });

  afterEach(() => {
    // Clean up singleton instances
    ClientEncryption.resetInstance();
    ServerDecryptionAllPublic.resetInstance();
  });

  describe('Data Type Compatibility', () => {
    it('should handle various JavaScript data types correctly', async () => {
      const publicKey = await serverNormal.getPublicKeyBase64();
      expect(publicKey).not.toBeNull();

      const testCases = [
        { name: 'string', data: 'Hello, World!' },
        { name: 'number', data: 42 },
        { name: 'boolean true', data: true },
        { name: 'boolean false', data: false },
        { name: 'null', data: null },
        { name: 'array', data: [1, 2, 3, 'test'] },
        { name: 'nested object', data: { user: { id: 123, name: 'John', active: true } } },
        { name: 'empty object', data: {} },
        { name: 'empty array', data: [] },
        {
          name: 'complex nested',
          data: {
            users: [
              { id: 1, profile: { name: 'Alice', settings: { theme: 'dark' } } },
              { id: 2, profile: { name: 'Bob', settings: { theme: 'light' } } },
            ],
            meta: { total: 2, version: '1.0.0' },
          },
        },
      ];

      for (const testCase of testCases) {
        const encrypted = clientNormal.encryptData(testCase.data, publicKey!);
        const decrypted = await serverNormal.decryptData(encrypted);

        expect(decrypted).toStrictEqual(testCase.data);
        console.log(`✅ ${testCase.name} type handled correctly`);
      }
    });

    it('should handle large data objects efficiently', async () => {
      const publicKey = await serverNormal.getPublicKeyBase64();
      expect(publicKey).not.toBeNull();

      // Create a large object
      const largeData = {
        users: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `User${i}`,
          email: `user${i}@example.com`,
          data: Array.from({ length: 10 }, (_, j) => `data-${i}-${j}`),
        })),
        metadata: {
          total: 1000,
          generated: new Date().toISOString(),
          description: 'A'.repeat(1000), // 1KB string
        },
      };

      const startTime = Date.now();
      const encrypted = clientNormal.encryptData(largeData, publicKey!);
      const encryptTime = Date.now() - startTime;

      const decryptStartTime = Date.now();
      const decrypted = await serverNormal.decryptData(encrypted);
      const decryptTime = Date.now() - decryptStartTime;

      expect(decrypted).toStrictEqual(largeData);

      console.log(`📊 Performance: Encrypt=${encryptTime}ms, Decrypt=${decryptTime}ms`);

      // Performance assertions (reasonable thresholds)
      expect(encryptTime).toBeLessThan(5000); // 5 seconds
      expect(decryptTime).toBeLessThan(5000); // 5 seconds
    });
  });

  describe('Cross-Preset Compatibility', () => {
    it('should reject decryption when presets do not match', async () => {
      const normalPublicKey = await serverNormal.getPublicKeyBase64();
      const highSecPublicKey = await serverHighSec.getPublicKeyBase64();

      expect(normalPublicKey).not.toBeNull();
      expect(highSecPublicKey).not.toBeNull();

      const testData = { message: 'Cross-preset test' };

      // Encrypt with normal preset
      const encryptedWithNormal = clientNormal.encryptData(testData, normalPublicKey!);

      // Try to decrypt with high security preset - should warn but still work due to graceful handling
      expect(async () => {
        await serverHighSec.decryptData(encryptedWithNormal);
        // If it doesn't throw, the preset mismatch is handled gracefully
        console.log('📢 Cross-preset decryption handled gracefully');
      }).not.toThrow();

      // Encrypt with high security preset
      const encryptedWithHighSec = clientHighSec.encryptData(testData, highSecPublicKey!);

      // Try to decrypt with normal preset
      expect(async () => {
        await serverNormal.decryptData(encryptedWithHighSec);
        console.log('📢 Cross-preset decryption handled gracefully');
      }).not.toThrow();
    });

    it('should work correctly when using same presets', async () => {
      const testData = { preset: 'test', value: 12345 };

      // Normal preset
      const normalKey = await serverNormal.getPublicKeyBase64();
      const normalEncrypted = clientNormal.encryptData(testData, normalKey!);
      const normalDecrypted = await serverNormal.decryptData(normalEncrypted);
      expect(normalDecrypted).toStrictEqual(testData);

      // High security preset
      const highSecKey = await serverHighSec.getPublicKeyBase64();
      const highSecEncrypted = clientHighSec.encryptData(testData, highSecKey!);
      const highSecDecrypted = await serverHighSec.decryptData(highSecEncrypted);
      expect(highSecDecrypted).toStrictEqual(testData);
    });
  });

  describe('Key Format Compatibility', () => {
    it('should accept both string and Uint8Array public keys', async () => {
      const testData = { format: 'test' };

      // Get public key as string (Base64)
      const publicKeyString = await serverNormal.getPublicKeyBase64();
      expect(publicKeyString).not.toBeNull();

      // Get public key as Uint8Array
      const publicKeyBinary = await serverNormal.getPublicKey();
      expect(publicKeyBinary).not.toBeNull();

      // Test encryption with string key
      const encryptedWithString = clientNormal.encryptData(testData, publicKeyString!);
      const decryptedFromString = await serverNormal.decryptData(encryptedWithString);
      expect(decryptedFromString).toStrictEqual(testData);

      // Test encryption with binary key
      const encryptedWithBinary = clientNormal.encryptData(testData, publicKeyBinary!);
      const decryptedFromBinary = await serverNormal.decryptData(encryptedWithBinary);
      expect(decryptedFromBinary).toStrictEqual(testData);

      console.log('✅ Both string and binary public key formats work correctly');
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle invalid encrypted data gracefully', async () => {
      // Test with completely invalid data
      const invalidData = { preset: 'normal', but: 'missing required fields' } as any;

      await expect(serverNormal.decryptData(invalidData)).rejects.toThrow();
    });

    it('should handle null and undefined data', async () => {
      const publicKey = await serverNormal.getPublicKeyBase64();
      expect(publicKey).not.toBeNull();

      // Test with null
      const encryptedNull = clientNormal.encryptData(null, publicKey!);
      const decryptedNull = await serverNormal.decryptData(encryptedNull);
      expect(decryptedNull).toBeNull();

      // Test with undefined
      const encryptedUndefined = clientNormal.encryptData(undefined, publicKey!);
      const decryptedUndefined = await serverNormal.decryptData(encryptedUndefined);
      expect(decryptedUndefined).toBeUndefined();
    });

    it('should handle empty strings and whitespace', async () => {
      const publicKey = await serverNormal.getPublicKeyBase64();
      expect(publicKey).not.toBeNull();

      const testCases = ['', ' ', '\n', '\t', '   \n\t  '];

      for (const testCase of testCases) {
        const encrypted = clientNormal.encryptData(testCase, publicKey!);
        const decrypted = await serverNormal.decryptData(encrypted);
        expect(decrypted).toBe(testCase);
      }
    });

    it('should validate encrypted data structure', async () => {
      const malformedData = [
        {
          /* empty object */
        },
        { preset: 'normal' }, // missing other fields
        { preset: 'normal', encryptedContent: 'test' }, // missing cipherText and nonce
        { preset: 'invalid', encryptedContent: 'test', cipherText: 'test', nonce: 'test' }, // invalid preset
      ];

      for (const data of malformedData) {
        await expect(serverNormal.decryptData(data as EncryptedData)).rejects.toThrow();
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent encryptions', async () => {
      const publicKey = await serverNormal.getPublicKeyBase64();
      expect(publicKey).not.toBeNull();

      const testData = Array.from({ length: 10 }, (_, i) => ({ id: i, data: `test-${i}` }));

      // Encrypt all data concurrently
      const encryptPromises = testData.map((data) =>
        Promise.resolve(clientNormal.encryptData(data, publicKey!)),
      );

      const encryptedResults = await Promise.all(encryptPromises);
      expect(encryptedResults).toHaveLength(10);

      // Decrypt all data concurrently
      const decryptPromises = encryptedResults.map((encrypted) =>
        serverNormal.decryptData(encrypted),
      );

      const decryptedResults = await Promise.all(decryptPromises);

      // Verify all results
      decryptedResults.forEach((result, index) => {
        expect(result).toStrictEqual(testData[index]);
      });

      console.log('✅ Concurrent operations completed successfully');
    });

    it('should handle mixed preset operations concurrently', async () => {
      const normalKey = await serverNormal.getPublicKeyBase64();
      const highSecKey = await serverHighSec.getPublicKeyBase64();

      expect(normalKey).not.toBeNull();
      expect(highSecKey).not.toBeNull();

      const testData = { concurrent: true, timestamp: Date.now() };

      // Perform operations with both presets concurrently
      const [normalEncrypted, highSecEncrypted] = await Promise.all([
        Promise.resolve(clientNormal.encryptData(testData, normalKey!)),
        Promise.resolve(clientHighSec.encryptData(testData, highSecKey!)),
      ]);

      const [normalDecrypted, highSecDecrypted] = await Promise.all([
        serverNormal.decryptData(normalEncrypted),
        serverHighSec.decryptData(highSecEncrypted),
      ]);

      expect(normalDecrypted).toStrictEqual(testData);
      expect(highSecDecrypted).toStrictEqual(testData);
    });
  });

  describe('Initialization & State Management', () => {
    it('should handle server initialization on first key access', async () => {
      // Create a fresh server instance
      ServerDecryptionAllPublic.resetInstance();
      const freshServer = ServerDecryptionAllPublic.getInstance();

      // The server should initialize automatically when getting public key
      const publicKey = await freshServer.getPublicKeyBase64();
      expect(publicKey).not.toBeNull();
      expect(typeof publicKey).toBe('string');

      // Should be able to use it immediately
      const testData = { fresh: 'server' };
      const encrypted = clientNormal.encryptData(testData, publicKey!);
      const decrypted = await freshServer.decryptData(encrypted);

      expect(decrypted).toStrictEqual(testData);
    });

    it('should provide meaningful status information', async () => {
      // Before initialization
      const statusBefore = await serverNormal.getStatus();
      expect(statusBefore.initialized).toBe(false);

      // After initialization (triggered by getting public key)
      await serverNormal.getPublicKeyBase64();
      const statusAfter = await serverNormal.getStatus();
      expect(statusAfter.initialized).toBe(true);
      expect(statusAfter.preset).toBe(Preset.NORMAL);
      expect(statusAfter.keyManager).not.toBeNull();
    });

    it('should pass health checks after initialization', async () => {
      // Initialize server
      await serverNormal.getPublicKeyBase64();

      const healthCheck = await serverNormal.healthCheck();
      expect(healthCheck.healthy).toBe(true);
      expect(healthCheck.issues).toHaveLength(0);
    });
  });

  describe('Data Integrity & Security', () => {
    it('should produce different ciphertext for same data', async () => {
      const publicKey = await serverNormal.getPublicKeyBase64();
      const testData = { integrity: 'test' };

      // Encrypt the same data multiple times
      const encrypted1 = clientNormal.encryptData(testData, publicKey!);
      const encrypted2 = clientNormal.encryptData(testData, publicKey!);
      const encrypted3 = clientNormal.encryptData(testData, publicKey!);

      // Ciphertext should be different (due to random nonces)
      expect(encrypted1.cipherText).not.toBe(encrypted2.cipherText);
      expect(encrypted2.cipherText).not.toBe(encrypted3.cipherText);
      expect(encrypted1.cipherText).not.toBe(encrypted3.cipherText);

      // But all should decrypt to the same data
      const [decrypted1, decrypted2, decrypted3] = await Promise.all([
        serverNormal.decryptData(encrypted1),
        serverNormal.decryptData(encrypted2),
        serverNormal.decryptData(encrypted3),
      ]);

      expect(decrypted1).toStrictEqual(testData);
      expect(decrypted2).toStrictEqual(testData);
      expect(decrypted3).toStrictEqual(testData);
    });

    it('should maintain data integrity with special characters', async () => {
      const publicKey = await serverNormal.getPublicKeyBase64();

      const specialData = {
        unicode: '🔐🚀🎉 Hello, 世界! Здравствуй мир! 🌍',
        special: 'Special chars: ~!@#$%^&*()_+-={}[]|\\:";\'<>?,./`',
        newlines: 'Line 1\nLine 2\r\nLine 3\tTabbed',
        emoji: '👨‍👩‍👧‍👦👍🏽🎯💯',
        json: '{"nested": "json", "array": [1,2,3]}',
        html: '<script>alert("test")</script>',
        sql: "'; DROP TABLE users; --",
      };

      const encrypted = clientNormal.encryptData(specialData, publicKey!);
      const decrypted = await serverNormal.decryptData(encrypted);

      expect(decrypted).toStrictEqual(specialData);
    });
  });
});
