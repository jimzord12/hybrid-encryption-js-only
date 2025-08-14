import { afterEach, beforeEach } from 'vitest';
import { decrypt, encrypt, KeyManager, ModernHybridEncryption } from '../../../../src/core';
import { ModernEncryptedData } from '../../../../src/core/types/encryption.types';

describe('Core Tests | Error Handling', () => {
  let testCertPath: string;

  beforeEach(async () => {
    // Create unique test directory within the project
    testCertPath = `./test-certs/error-handling-${Date.now()}`;

    // Initialize KeyManager with test configuration
    const keyManager = KeyManager.getInstance({
      certPath: testCertPath,
      algorithm: 'ml-kem-768',
      keySize: 768,
      autoGenerate: true,
    });

    await keyManager.initialize();
  });

  afterEach(() => {
    // Reset KeyManager instance for clean state
    KeyManager.resetInstance();
  });

  describe('Modern Error Handling', () => {
    it('should throw structured error with invalid public key for encryption', async () => {
      const data = { test: 'data' };
      const invalidPublicKey = new Uint8Array([1, 2, 3]); // Invalid key format

      await expect(ModernHybridEncryption.encrypt(data, invalidPublicKey)).rejects.toThrow(
        'Encryption failed',
      );
    });

    it('should throw structured error with invalid private key for decryption', async () => {
      const data = { test: 'data' };
      const encrypted = await encrypt(data);
      const invalidPrivateKey = new Uint8Array([1, 2, 3]); // Invalid key format

      await expect(ModernHybridEncryption.decrypt(encrypted, invalidPrivateKey)).rejects.toThrow(
        'Decryption failed',
      );
    });

    it('should throw error with wrong private key', async () => {
      const data = { test: 'data' };
      const encrypted = await encrypt(data);

      // Generate a different key pair with a new KeyManager instance
      KeyManager.resetInstance();
      const wrongKeyManager = KeyManager.getInstance({
        certPath: `./test-certs/wrong-key-${Date.now()}`,
        algorithm: 'ml-kem-768',
        keySize: 768,
        autoGenerate: true,
      });

      await wrongKeyManager.initialize();
      const wrongKeyPair = await wrongKeyManager.getKeyPair();

      await expect(
        ModernHybridEncryption.decrypt(encrypted, wrongKeyPair.privateKey!),
      ).rejects.toThrow('Decryption failed');

      // Clean up and restore original KeyManager
      KeyManager.resetInstance();
      const keyManager = KeyManager.getInstance({
        certPath: testCertPath,
        algorithm: 'ml-kem-768',
        keySize: 768,
        autoGenerate: true,
      });
      await keyManager.initialize();
    });

    it('should throw structured error with corrupted encrypted data', async () => {
      const data = { test: 'data' };
      const encrypted = await encrypt(data);

      // Corrupt the encrypted content
      const corruptedData: ModernEncryptedData = {
        ...encrypted,
        encryptedContent: 'corrupted-base64-data!!!',
      };

      await expect(decrypt(corruptedData)).rejects.toThrow('Invalid encrypted data format');
    });

    it('should throw error with unsupported version', async () => {
      const data = { test: 'data' };
      const encrypted = await encrypt(data);

      const futureVersionData: ModernEncryptedData = {
        ...encrypted,
        version: '3.0.0', // Future version
      };

      await expect(decrypt(futureVersionData)).rejects.toThrow();
    });

    it('should throw error with missing required fields', async () => {
      const incompleteData = {
        version: '2.0.0',
        // Missing required fields
      } as ModernEncryptedData;

      await expect(decrypt(incompleteData)).rejects.toThrow('Invalid encrypted data format');
    });

    it('should handle KeyManager initialization errors gracefully', async () => {
      KeyManager.resetInstance();

      // Try to use KeyManager with invalid configuration
      const keyManager = KeyManager.getInstance({
        certPath: './nonexistent/deeply/nested/path/that/cannot/be/created',
        algorithm: 'ml-kem-768',
        autoGenerate: false, // Disable auto-generation
      });

      await expect(keyManager.initialize()).rejects.toThrow();
    });

    it('should handle algorithm configuration errors', async () => {
      KeyManager.resetInstance();

      // Test with invalid algorithm
      expect(() => {
        KeyManager.getInstance({
          certPath: testCertPath,
          algorithm: 'invalid-algorithm' as any,
        });
      }).toThrow();
    });

    it('should properly categorize different error types', async () => {
      const data = { test: 'data' };

      try {
        // This should fail with a structured error
        await ModernHybridEncryption.encrypt(data, new Uint8Array([1, 2, 3]));
      } catch (error: any) {
        expect(error.message).toContain('Encryption failed');
        // Could check for specific error properties if available
      }
    });

    it('should handle concurrent access errors during key operations', async () => {
      const data = { test: 'data' };

      // Start multiple concurrent operations
      const operations = Array.from({ length: 5 }, () => encrypt(data));

      // All should complete successfully or fail with appropriate errors
      const results = await Promise.allSettled(operations);

      // At least some should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);

      // Any failures should have structured error messages
      const failed = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
      failed.forEach(failure => {
        expect(failure.reason).toBeInstanceOf(Error);
        expect(failure.reason.message).toBeDefined();
      });
    });
  });
});
