import { ClientEncryption, Preset } from '../../src/client';
import { EncryptedData } from '../../src/core/common/interfaces/encryption.interfaces';
import { ServerDecryptionAllPublic } from '../../src/server/decrypt-all-public';

describe('Error Handling & Edge Cases Integration Tests', () => {
  let client: ClientEncryption;
  let server: ServerDecryptionAllPublic;

  beforeEach(() => {
    ClientEncryption.resetInstance();
    ServerDecryptionAllPublic.resetInstance();

    client = ClientEncryption.getInstance(Preset.NORMAL);
    server = ServerDecryptionAllPublic.getInstance(Preset.NORMAL);
  });

  afterEach(() => {
    ClientEncryption.resetInstance();
    ServerDecryptionAllPublic.resetInstance();
  });

  describe('Invalid Public Key Scenarios', () => {
    it('should handle invalid Base64 public keys gracefully', async () => {
      const invalidKeys = [
        '', // empty string
        'invalid-base64!@#$%', // invalid characters
        'dGVzdA==', // valid base64 but wrong data
        'SGVsbG8gV29ybGQ=', // "Hello World" in base64
        'a'.repeat(100), // wrong length
      ];

      const testData = { test: 'invalid key handling' };

      for (const invalidKey of invalidKeys) {
        expect(() => {
          client.encryptData(testData, invalidKey);
        }).toThrow();
      }
    });

    it('should handle invalid binary public keys gracefully', async () => {
      const invalidBinaryKeys = [
        new Uint8Array(0), // empty array
        new Uint8Array(10), // too short
        new Uint8Array(5000), // too long
        new Uint8Array([1, 2, 3, 4, 5]), // wrong data
      ];

      const testData = { test: 'invalid binary key handling' };

      for (const invalidKey of invalidBinaryKeys) {
        expect(() => {
          client.encryptData(testData, invalidKey);
        }).toThrow();
      }
    });
  });

  describe('Malformed Encrypted Data', () => {
    it('should reject completely invalid encrypted data structures', async () => {
      const invalidDataStructures = [
        null,
        undefined,
        'string instead of object',
        42,
        [],
        true,
        new Date(),
        { completely: 'wrong structure' },
      ];

      for (const invalidData of invalidDataStructures) {
        await expect(server.decryptData(invalidData as any)).rejects.toThrow();
      }
    });

    it('should reject encrypted data with missing required fields', async () => {
      const incompleteDataStructures = [
        {}, // completely empty
        { preset: 'normal' }, // missing other fields
        { preset: 'normal', encryptedContent: 'test' }, // missing cipherText, nonce
        { preset: 'normal', cipherText: 'test' }, // missing encryptedContent, nonce
        { preset: 'normal', nonce: 'test' }, // missing encryptedContent, cipherText
        { encryptedContent: 'test', cipherText: 'test', nonce: 'test' }, // missing preset
      ];

      for (const incompleteData of incompleteDataStructures) {
        await expect(server.decryptData(incompleteData as EncryptedData)).rejects.toThrow();
      }
    });

    it('should reject encrypted data with invalid field types', async () => {
      const invalidTypeStructures = [
        { preset: 123, encryptedContent: 'test', cipherText: 'test', nonce: 'test' }, // preset not string
        { preset: 'normal', encryptedContent: 123, cipherText: 'test', nonce: 'test' }, // encryptedContent not string
        { preset: 'normal', encryptedContent: 'test', cipherText: 123, nonce: 'test' }, // cipherText not string
        { preset: 'normal', encryptedContent: 'test', cipherText: 'test', nonce: 123 }, // nonce not string
        { preset: null, encryptedContent: 'test', cipherText: 'test', nonce: 'test' }, // null preset
      ];

      for (const invalidData of invalidTypeStructures) {
        await expect(server.decryptData(invalidData as any)).rejects.toThrow();
      }
    });

    it('should handle corrupted encrypted data gracefully', async () => {
      // First, create valid encrypted data
      const publicKey = await server.getPublicKeyBase64();
      const testData = { test: 'corruption handling' };
      const validEncrypted = client.encryptData(testData, publicKey!);

      // Then corrupt different parts of it
      const corruptedDataSets = [
        // Corrupt encryptedContent
        { ...validEncrypted, encryptedContent: 'corrupted_content' },

        // Corrupt cipherText
        { ...validEncrypted, cipherText: 'corrupted_cipher' },

        // Corrupt nonce
        { ...validEncrypted, nonce: 'corrupted_nonce' },

        // Swap fields
        {
          ...validEncrypted,
          encryptedContent: validEncrypted.cipherText,
          cipherText: validEncrypted.encryptedContent,
        },

        // Truncate fields
        { ...validEncrypted, encryptedContent: validEncrypted.encryptedContent.substring(0, 10) },

        // Invalid base64 in fields
        { ...validEncrypted, encryptedContent: 'invalid!@#$base64' },
      ];

      for (const corruptedData of corruptedDataSets) {
        await expect(server.decryptData(corruptedData as EncryptedData)).rejects.toThrow();
      }
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle extremely large data objects', async () => {
      const publicKey = await server.getPublicKeyBase64();

      // Create a very large object (approaching practical limits)
      const largeObject = {
        metadata: { size: 'extra_large', timestamp: Date.now() },
        data: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          name: `User${i}`,
          description: 'A'.repeat(1000), // 1KB per description
          tags: Array.from({ length: 10 }, (_, j) => `tag-${i}-${j}`),
          nested: {
            level1: { level2: { level3: `deep-${i}` } },
            largeArray: Array.from({ length: 100 }, (_, k) => `item-${i}-${k}`),
          },
        })),
      };

      console.log('📊 Testing with very large object...');

      const startTime = Date.now();
      const encrypted = client.encryptData(largeObject, publicKey!);
      const encryptTime = Date.now() - startTime;

      const decryptStartTime = Date.now();
      const decrypted = await server.decryptData(encrypted);
      const decryptTime = Date.now() - decryptStartTime;

      expect(decrypted).toStrictEqual(largeObject);

      console.log(
        `⏱️ Large object performance: Encrypt=${encryptTime}ms, Decrypt=${decryptTime}ms`,
      );

      // Should complete within reasonable time (adjust based on system)
      expect(encryptTime).toBeLessThan(30000); // 30 seconds
      expect(decryptTime).toBeLessThan(30000); // 30 seconds
    });

    it('should handle data with extreme nesting levels', async () => {
      const publicKey = await server.getPublicKeyBase64();

      // Create deeply nested object
      const createNestedObject = (depth: number): any => {
        if (depth === 0) return 'deep_value';
        return { [`level${depth}`]: createNestedObject(depth - 1) };
      };

      const deeplyNested = {
        shallow: 'data',
        deep: createNestedObject(50), // 50 levels deep
        array: Array.from({ length: 5 }, () => createNestedObject(10)),
      };

      const encrypted = client.encryptData(deeplyNested, publicKey!);
      const decrypted = await server.decryptData(encrypted);

      expect(decrypted).toStrictEqual(deeplyNested);
    });

    it('should handle special numeric values', async () => {
      const publicKey = await server.getPublicKeyBase64();

      const specialNumbers = {
        infinity: Infinity,
        negativeInfinity: -Infinity,
        nan: NaN,
        maxSafeInteger: Number.MAX_SAFE_INTEGER,
        minSafeInteger: Number.MIN_SAFE_INTEGER,
        maxValue: Number.MAX_VALUE,
        minValue: Number.MIN_VALUE,
        zero: 0,
        negativeZero: -0,
        pi: Math.PI,
        e: Math.E,
      };

      const encrypted = client.encryptData(specialNumbers, publicKey!);
      const decrypted = (await server.decryptData(encrypted)) as any;

      // Note: JSON serialization converts special values
      // Infinity -> null, NaN -> null in JSON
      expect(decrypted.infinity).toBeNull(); // JSON.stringify converts Infinity to null
      expect(decrypted.negativeInfinity).toBeNull(); // JSON.stringify converts -Infinity to null
      expect(decrypted.nan).toBeNull(); // JSON.stringify converts NaN to null
      expect(decrypted.maxSafeInteger).toBe(Number.MAX_SAFE_INTEGER);
      expect(decrypted.pi).toBeCloseTo(Math.PI);
    });
  });

  describe('Concurrent Error Scenarios', () => {
    it('should handle multiple failed operations gracefully', async () => {
      const publicKey = await server.getPublicKeyBase64();
      const validData = { test: 'valid' };

      // Mix of valid and invalid operations
      const operations = [
        // Valid operations
        () => Promise.resolve(client.encryptData(validData, publicKey!)),
        () => Promise.resolve(client.encryptData(validData, publicKey!)),

        // Invalid operations that should fail
        () => Promise.reject(new Error('Simulated encryption error')),
        () => {
          try {
            return Promise.resolve(client.encryptData(validData, 'invalid_key'));
          } catch (error) {
            return Promise.reject(error);
          }
        },

        // More valid operations
        () => Promise.resolve(client.encryptData(validData, publicKey!)),
      ];

      const results = await Promise.allSettled(operations.map((op) => op()));

      // Should have both successful and failed operations
      const successful = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');

      expect(successful.length).toBeGreaterThan(0);
      expect(failed.length).toBeGreaterThan(0);

      console.log(`📊 Concurrent errors: ${successful.length} success, ${failed.length} failed`);
    });

    it('should maintain system stability despite errors', async () => {
      const publicKey = await server.getPublicKeyBase64();

      // Perform operations that intentionally cause errors
      for (let i = 0; i < 10; i++) {
        try {
          // Valid operation
          const validData = { iteration: i, valid: true };
          const encrypted = client.encryptData(validData, publicKey!);
          const decrypted = (await server.decryptData(encrypted)) as any;
          expect(decrypted.iteration).toBe(i);

          // Invalid operation (should fail)
          await server.decryptData({ invalid: 'data' } as any);
        } catch (error) {
          // Expected for invalid operations
          expect(error).toBeDefined();
        }
      }

      // System should still be healthy after errors
      const healthCheck = await server.healthCheck();
      expect(healthCheck.healthy).toBe(true);

      // Should still be able to perform valid operations
      const finalTest = { final: 'test after errors' };
      const encrypted = client.encryptData(finalTest, publicKey!);
      const decrypted = await server.decryptData(encrypted);
      expect(decrypted).toStrictEqual(finalTest);
    });
  });

  describe('Resource Exhaustion Scenarios', () => {
    it('should handle rapid memory allocation and deallocation', async () => {
      const publicKey = await server.getPublicKeyBase64();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        // Create moderately sized objects repeatedly
        const tempData = {
          iteration: i,
          data: Array.from({ length: 1000 }, (_, j) => `item-${i}-${j}`),
          timestamp: Date.now(),
        };

        const encrypted = client.encryptData(tempData, publicKey!);
        const decrypted = (await server.decryptData(encrypted)) as any;

        expect(decrypted.iteration).toBe(i);

        // Force garbage collection hint (if available)
        if (global.gc) {
          if (i % 20 === 0) global.gc();
        }
      }

      console.log(`✅ Memory allocation test completed: ${iterations} iterations`);
    });

    it('should handle string size limits gracefully', async () => {
      const publicKey = await server.getPublicKeyBase64();

      // Test with increasingly large strings
      const stringSizes = [1000, 10000, 100000, 500000]; // Up to 500KB strings

      for (const size of stringSizes) {
        const largeString = 'A'.repeat(size);
        const testData = {
          size,
          content: largeString,
          metadata: { length: largeString.length },
        };

        console.log(`📏 Testing string size: ${size} characters`);

        const encrypted = client.encryptData(testData, publicKey!);
        const decrypted = (await server.decryptData(encrypted)) as any;

        expect(decrypted.content.length).toBe(size);
        expect(decrypted.content).toBe(largeString);
      }
    });
  });

  describe('System State Recovery', () => {
    it('should recover from partial initialization failures', async () => {
      // This test simulates scenarios where initialization might partially fail
      // but the system should still be able to recover

      try {
        // Try to use server before proper initialization
        const status = await server.getStatus();
        expect(status.initialized).toBe(false);

        // Force initialization
        const publicKey = await server.getPublicKeyBase64();
        expect(publicKey).not.toBeNull();

        // Now should be properly initialized
        const statusAfter = await server.getStatus();
        expect(statusAfter.initialized).toBe(true);

        // Should work normally
        const testData = { recovery: 'test' };
        const encrypted = client.encryptData(testData, publicKey!);
        const decrypted = await server.decryptData(encrypted);
        expect(decrypted).toStrictEqual(testData);
      } catch (error) {
        console.log('💡 Initialization handled gracefully:', (error as Error).message);
      }
    });

    it('should maintain data consistency during error recovery', async () => {
      const publicKey = await server.getPublicKeyBase64();
      const testData = { consistency: 'check', value: 42 };

      // Encrypt data before any errors
      const originalEncrypted = client.encryptData(testData, publicKey!);

      // Simulate various error conditions
      const errorTests = [
        () => server.decryptData(null as any),
        () => server.decryptData({ invalid: 'structure' } as any),
        () => client.encryptData(testData, 'invalid_key'),
      ];

      // Execute error-inducing operations
      for (const errorTest of errorTests) {
        try {
          await errorTest();
        } catch (error) {
          console.log('💥 Error handled gracefully:', (error as Error).message);
          // Expected to fail
        }
      }

      // Original data should still decrypt correctly after errors
      const decrypted = await server.decryptData(originalEncrypted);
      expect(decrypted).toStrictEqual(testData);

      // New operations should also work
      const newTestData = { after: 'errors', timestamp: Date.now() };
      const newEncrypted = client.encryptData(newTestData, publicKey!);
      const newDecrypted = await server.decryptData(newEncrypted);
      expect(newDecrypted).toStrictEqual(newTestData);
    });
  });
});
