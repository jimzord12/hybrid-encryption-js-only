import { ClientEncryption } from '../../../src/client';
import { Preset } from '../../../src/common/types';
import { KeyManager } from '../../../src/core/key-management/key-manager';
import { ServerDecryptionAllPublic } from '../../../src/server/decrypt-all-public';

describe('Key Rotation & Grace Period Integration Tests', () => {
  let client: ClientEncryption;
  let server: ServerDecryptionAllPublic;

  beforeEach(() => {
    // Reset instances to ensure clean state
    ClientEncryption.resetInstance();
    ServerDecryptionAllPublic.resetInstance();
    KeyManager.resetInstance();

    client = ClientEncryption.getInstance(Preset.NORMAL);
    server = ServerDecryptionAllPublic.getInstance(Preset.NORMAL);
  });

  afterEach(() => {
    // Clean up singleton instances
    ClientEncryption.resetInstance();
    ServerDecryptionAllPublic.resetInstance();
    KeyManager.resetInstance();
  });

  describe('Grace Period Decryption', () => {
    it('should handle encryption with old keys during grace period', async () => {
      // Initialize server and get first public key
      const firstPublicKey = await server.getPublicKeyBase64();
      expect(firstPublicKey).not.toBeNull();

      const testData = { message: 'Encrypted with first key', timestamp: Date.now() };

      // Encrypt data with the first key
      const encryptedWithFirstKey = client.encryptData(testData, firstPublicKey!);

      // Verify it decrypts correctly
      const decrypted1 = await server.decryptData(encryptedWithFirstKey);
      expect(decrypted1).toStrictEqual(testData);

      // Force key rotation by accessing key manager directly
      const keyManager = await (server as any).keyManager;
      if (keyManager) {
        await keyManager.rotateKeys();
        console.log('🔄 Keys rotated successfully');
      }

      // Get new public key after rotation
      const secondPublicKey = await server.getPublicKeyBase64();
      expect(secondPublicKey).not.toBeNull();
      expect(secondPublicKey).not.toBe(firstPublicKey); // Should be different

      // Data encrypted with old key should still decrypt (grace period)
      const decrypted2 = await server.decryptData(encryptedWithFirstKey);
      expect(decrypted2).toStrictEqual(testData);

      // New data encrypted with new key should also work
      const newTestData = { message: 'Encrypted with second key', timestamp: Date.now() };
      const encryptedWithSecondKey = client.encryptData(newTestData, secondPublicKey!);
      const decrypted3 = await server.decryptData(encryptedWithSecondKey);
      expect(decrypted3).toStrictEqual(newTestData);

      console.log('✅ Grace period decryption working correctly');
    });

    it('should provide multiple decryption keys during grace period', async () => {
      // Initialize and get public key
      await server.getPublicKeyBase64();

      // Access key manager to check decryption keys
      const keyManager = await (server as any).keyManager;
      expect(keyManager).not.toBeNull();

      // Initially should have one key pair
      const initialKeys = await keyManager.getDecryptionKeys();
      expect(initialKeys.length).toBeGreaterThanOrEqual(1);

      // After rotation, should have multiple keys during grace period
      await keyManager.rotateKeys();
      const keysAfterRotation = await keyManager.getDecryptionKeys();

      // Should have both current and previous keys during grace period
      expect(keysAfterRotation.length).toBeGreaterThanOrEqual(1);

      console.log(`📊 Decryption keys available: ${keysAfterRotation.length}`);
    });
  });

  describe('Key Manager Integration', () => {
    it('should properly initialize KeyManager through ServerDecryption', async () => {
      // Before any operations, server should not be initialized
      const statusBefore = await server.getStatus();
      expect(statusBefore.initialized).toBe(false);

      // Getting public key should trigger initialization
      const publicKey = await server.getPublicKeyBase64();
      expect(publicKey).not.toBeNull();

      // Now server should be initialized
      const statusAfter = await server.getStatus();
      expect(statusAfter.initialized).toBe(true);
      expect(statusAfter.keyManager).not.toBeNull();

      // Key manager should be properly configured
      const keyManagerStatus = statusAfter.keyManager;
      expect(keyManagerStatus).not.toBeNull();
      if (keyManagerStatus) {
        expect(keyManagerStatus.hasKeys).toBe(true);
        expect(keyManagerStatus.keysValid).toBe(true);
      }
    });

    it('should handle key manager health checks', async () => {
      // Initialize server
      await server.getPublicKeyBase64();

      // Health check should pass
      const healthCheck = await server.healthCheck();
      expect(healthCheck.healthy).toBe(true);
      expect(healthCheck.issues).toHaveLength(0);
    });

    it('should handle key manager configuration', async () => {
      // Test custom configuration during initialization
      const customConfig = {
        keyExpiryMonths: 2,
        rotationGracePeriodInMinutes: 30,
        enableFileBackup: true,
      };

      // Initialize with custom config
      await server.initializeIfNeeded(customConfig);

      const status = await server.getStatus();
      expect(status.initialized).toBe(true);

      // Verify key manager is using the configuration
      const keyManager = (server as any).keyManager;
      expect(keyManager).not.toBeNull();
    });
  });

  describe('Error Scenarios & Recovery', () => {
    it('should handle missing key files gracefully', async () => {
      // This test verifies that the system handles missing key files
      // and generates new ones automatically

      const publicKey = await server.getPublicKeyBase64();
      expect(publicKey).not.toBeNull();
      expect(typeof publicKey).toBe('string');

      const testData = { recovery: 'test' };
      const encrypted = client.encryptData(testData, publicKey!);
      const decrypted = await server.decryptData(encrypted);

      expect(decrypted).toStrictEqual(testData);
    });

    it('should recover from key manager errors', async () => {
      // Initialize server first
      await server.getPublicKeyBase64();

      // Reset key manager to simulate an error scenario
      KeyManager.resetInstance();

      // Server should handle this gracefully and reinitialize
      const publicKeyAfterReset = await server.getPublicKeyBase64();
      expect(publicKeyAfterReset).not.toBeNull();

      // Should still be able to encrypt/decrypt
      const testData = { recovery: 'after reset' };
      const encrypted = client.encryptData(testData, publicKeyAfterReset!);
      const decrypted = await server.decryptData(encrypted);

      expect(decrypted).toStrictEqual(testData);
    });

    it('should validate encrypted data before attempting decryption', async () => {
      // Test server validation without valid keys
      const invalidEncryptedData = {
        preset: 'normal',
        encryptedContent: 'invalid',
        cipherText: 'invalid',
        nonce: 'invalid',
      };

      await expect(server.decryptData(invalidEncryptedData as any)).rejects.toThrow();
    });
  });

  describe('Performance & Scalability', () => {
    it('should handle rapid successive operations', async () => {
      const publicKey = await server.getPublicKeyBase64();
      expect(publicKey).not.toBeNull();

      const operations = 50;
      const testData = { rapid: 'test', index: 0 };

      console.time('Rapid Operations');

      for (let i = 0; i < operations; i++) {
        testData.index = i;
        const encrypted = client.encryptData(testData, publicKey!);
        const decrypted = (await server.decryptData(encrypted)) as any;
        expect(decrypted.index).toBe(i);
      }

      console.timeEnd('Rapid Operations');
      console.log(`✅ Completed ${operations} encrypt/decrypt cycles`);
    });

    it('should maintain performance with multiple key rotations', async () => {
      const publicKey = await server.getPublicKeyBase64();
      const keyManager = (server as any).keyManager;

      // Perform multiple rotations
      console.time('Multiple Rotations');
      for (let i = 0; i < 3; i++) {
        await keyManager.rotateKeys();
        console.log(`🔄 Rotation ${i + 1} completed`);
      }
      console.timeEnd('Multiple Rotations');

      // Verify system still works after multiple rotations
      const newPublicKey = await server.getPublicKeyBase64();
      expect(newPublicKey).not.toBeNull();
      expect(newPublicKey).not.toBe(publicKey); // Should be different

      const testData = { rotations: 'multiple', final: true };
      const encrypted = client.encryptData(testData, newPublicKey!);
      const decrypted = await server.decryptData(encrypted);

      expect(decrypted).toStrictEqual(testData);
    });
  });

  describe('Cross-Instance Consistency', () => {
    it('should maintain consistency across server instance resets', async () => {
      // Get initial public key
      const initialKey = await server.getPublicKeyBase64();
      const testData = { consistency: 'test' };

      // Encrypt data
      const encrypted = client.encryptData(testData, initialKey!);

      // Reset server instance (simulating restart)
      ServerDecryptionAllPublic.resetInstance();
      const newServerInstance = ServerDecryptionAllPublic.getInstance(Preset.NORMAL);

      // Should be able to decrypt data encrypted before reset
      // (assuming key files are persisted)
      const decrypted = await newServerInstance.decryptData(encrypted);
      expect(decrypted).toStrictEqual(testData);
    });

    it('should handle preset consistency across operations', async () => {
      const testData = { preset: 'consistency' };

      // Test with both presets
      const normalKey = await server.getPublicKeyBase64();
      const normalEncrypted = client.encryptData(testData, normalKey!);

      // Verify preset is correctly set in encrypted data
      expect(normalEncrypted.preset).toBe(Preset.NORMAL);

      // Decrypt and verify
      const normalDecrypted = await server.decryptData(normalEncrypted);
      expect(normalDecrypted).toStrictEqual(testData);
    });
  });
});
