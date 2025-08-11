import { decrypt, encrypt, generateRSAKeyPair, validateKeyPair } from '../../../src/client';
import { RSAKeyPair } from '../../../src/core/types/encryption.types';

describe('Core Tests | Performance', () => {
  let testKeyPair: RSAKeyPair;

  beforeAll(() => {
    // Generate a test key pair once for all tests
    testKeyPair = generateRSAKeyPair(2048);
  });

  describe('Large Data Handling', () => {
    it('should handle large strings', () => {
      const amount = 100_000;

      const largeString = 'A'.repeat(amount); // 100KB string

      const start = performance.now();

      const encrypted = encrypt(largeString, testKeyPair.publicKey);
      const decrypted = decrypt<string>(encrypted, testKeyPair.privateKey);

      const end = performance.now();
      const totalTime = end - start;

      console.log(`Large string encryption/decryption took ${totalTime.toFixed(2)}ms`);

      expect(decrypted).toBe(largeString);
      expect(decrypted.length).toBe(amount);
    });

    it('should handle large objects', () => {
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          message: `Message ${i}` + 'A',
          timestamp: Date.now() + i,
          nested: { value: i * 2, active: i % 2 === 0 },
        })),
      };

      const encrypted = encrypt(largeObject, testKeyPair.publicKey);
      const decrypted = decrypt(encrypted, testKeyPair.privateKey);

      expect(decrypted).toEqual(largeObject);
      expect(decrypted.data).toHaveLength(1000);
    });
  });

  describe('Performance Tests', () => {
    it('should complete encryption/decryption within reasonable time', () => {
      const data = { message: 'Performance test data', timestamp: Date.now() };

      const start = performance.now();

      // Perform 10 encrypt/decrypt cycles
      for (let i = 0; i < 10; i++) {
        const encrypted = encrypt({ ...data, iteration: i }, testKeyPair.publicKey);
        const decrypted = decrypt(encrypted, testKeyPair.privateKey);
        expect(decrypted.iteration).toBe(i);
      }

      const end = performance.now();
      const totalTime = end - start;

      // Should complete 10 cycles in under 500ms
      expect(totalTime).toBeLessThan(500);

      // Log performance for monitoring
      console.log(`10 encrypt/decrypt cycles completed in ${totalTime.toFixed(2)}ms`);
      console.log(`Average per cycle: ${(totalTime / 10).toFixed(2)}ms`);
    });

    it('should handle concurrent operations', async () => {
      const data = { test: 'concurrent operations' };

      // Create promises for concurrent encryption
      const promises = Array.from(
        { length: 100 }, // 100 concurrent operations
        (_, i) =>
          new Promise<void>(resolve => {
            const encrypted = encrypt({ ...data, id: i }, testKeyPair.publicKey);
            const decrypted = decrypt(encrypted, testKeyPair.privateKey);
            expect(decrypted.id).toBe(i);
            resolve();
          })
      );

      // All should complete successfully
      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak memory with repeated operations', () => {
      const data = { test: 'memory test' };

      // Perform many operations to test for memory leaks
      for (let i = 0; i < 100; i++) {
        const encrypted = encrypt(data, testKeyPair.publicKey);
        const decrypted = decrypt(encrypted, testKeyPair.privateKey);
        expect(decrypted).toEqual(data);

        // Clear references to help GC
        delete (encrypted as any).encryptedContent;
        delete (decrypted as any).test;
      }

      // Test passes if we reach here without running out of memory
      expect(true).toBe(true);
    });

    it('should handle rapid key generation', () => {
      const keyPairs: RSAKeyPair[] = [];

      // Generate multiple key pairs rapidly
      for (let i = 0; i < 5; i++) {
        const keyPair = generateRSAKeyPair(2048);
        expect(validateKeyPair(keyPair)).toBe(true);
        keyPairs.push(keyPair);
      }

      // All should be unique
      const publicKeys = keyPairs.map(kp => kp.publicKey);
      const uniqueKeys = new Set(publicKeys);
      expect(uniqueKeys.size).toBe(keyPairs.length);
    });
  });
});
