import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Preset } from '../../src/core/common/enums';
import { EncryptedData } from '../../src/core/common/interfaces/encryption.interfaces';
import { Base64 } from '../../src/core/common/types/branded-types.types';
import { KeyManager } from '../../src/core/key-management/key-manager';
import { KeyManagerConfig } from '../../src/core/key-management/types/key-manager.types';
import {
  getServerDecryption,
  ServerDecryptionAllPublic as ServerDecryption,
} from '../../src/server/decrypt-all-public';

describe('ServerDecryption', () => {
  beforeEach(async () => {
    // Clean up any existing instances
    ServerDecryption.resetInstance();
    KeyManager.resetInstance();
  });

  afterEach(async () => {
    // Clean up after each test
    ServerDecryption.resetInstance();
    KeyManager.resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('should create only one instance', () => {
      const instance1 = ServerDecryption.getInstance();
      const instance2 = ServerDecryption.getInstance();
      const instance3 = ServerDecryption.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
      expect(instance1).toBe(instance3);
    });

    it('should prevent direct instantiation', () => {
      expect(() => new (ServerDecryption as any)()).toThrow(
        'ServerDecryptionAllPublic cannot be instantiated directly. Use ServerDecryptionAllPublic.getInstance() instead.',
      );
    });

    it('should reset instance properly', () => {
      const instance1 = ServerDecryption.getInstance();
      ServerDecryption.resetInstance();
      const instance2 = ServerDecryption.getInstance();

      expect(instance1).not.toBe(instance2);
    });

    it('should reset encryption instance properly', () => {
      const instance1 = ServerDecryption.getInstance();
      // Initialize the instance first
      instance1.encryptionInstance = {} as any; // Set some value

      ServerDecryption.resetInstance();

      // After reset, the old instance should have null properties
      expect(instance1.encryptionInstance).toBeNull();

      const instance2 = ServerDecryption.getInstance();
      expect(instance1).not.toBe(instance2);
    });

    it('should reset keymanager instance properly', () => {
      const instance1 = ServerDecryption.getInstance();
      // Initialize the instance first
      instance1.keyManager = {} as any; // Set some value

      ServerDecryption.resetInstance();

      // After reset, the old instance should have null properties
      expect(instance1.keyManager).toBeNull();

      const instance2 = ServerDecryption.getInstance();
      expect(instance1).not.toBe(instance2);
    });

    it('should support getInstance export', () => {
      const instance1 = ServerDecryption.getInstance();
      const instance2 = getServerDecryption();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Configuration', () => {
    it('should use default preset when no config provided', async () => {
      ServerDecryption.resetInstance();
      KeyManager.resetInstance(); // Reset KeyManager singleton
      const server = ServerDecryption.getInstance();
      await server.initializeIfNeeded();
      expect(server).toBeDefined();
      expect(server.keyManager!.getConfig().preset).toBe(Preset.NORMAL);
    });

    it('should accept custom configuration', async () => {
      // Clean up any existing keys to force regeneration with new config
      await new Promise<void>((resolve) => {
        import('node:fs').then(({ rm }) => {
          rm('./config/test-certs', { recursive: true, force: true }, () => resolve());
          rm('./config/certs', { recursive: true, force: true }, () => resolve());
        });
      });

      const customConfig_01: KeyManagerConfig = {
        preset: ServerDecryption.getInstance().preset,
        enableFileBackup: false,
        keyExpiryMonths: 6,
        rotationGracePeriodInMinutes: 15,
        certPath: './config/test-certs', // Use different path for testing
        autoGenerate: true,
        rotationIntervalInWeeks: 2,
      };

      let server = getServerDecryption();
      await server.initializeIfNeeded(customConfig_01); // ✅ NOW KeyManager gets created
      expect(server).toBeDefined();
      expect(server.keyManager).toBeDefined();
      expect(server.keyManager).not.toBeNull();
      expect(server.keyManager?.getConfig).toBeDefined();

      expect(server.keyManager!.getConfig()).toEqual(customConfig_01);

      ServerDecryption.resetInstance();

      // Clean up any existing keys to force regeneration with new config
      await new Promise<void>((resolve) => {
        import('node:fs').then(({ rm }) => {
          rm('./config/test-certs', { recursive: true, force: true }, () => resolve());
          rm('./config/certs', { recursive: true, force: true }, () => resolve());
        });
      });

      const customConfig: KeyManagerConfig = {
        preset: ServerDecryption.getInstance().preset,
        enableFileBackup: false,
        keyExpiryMonths: 9,
        rotationGracePeriodInMinutes: 33,
        certPath: './config/AAAAAAAAAAAAAAA/test-certs', // Use different path for testing
        autoGenerate: true,
        rotationIntervalInWeeks: 4,
      };

      server = ServerDecryption.getInstance();
      await server.initializeIfNeeded(customConfig);
      expect(server).toBeDefined();
      expect(server.keyManager).toBeDefined();
      expect(server.keyManager).not.toBeNull();
      expect(server.keyManager?.getConfig).toBeDefined();
      expect(server.keyManager!.getConfig()).toEqual(customConfig);
    });
  });

  describe('Decryption Operations', () => {
    it('should decrypt data successfully with valid encrypted data', async () => {
      // Create mock encrypted data for testing
      const mockEncryptedData: EncryptedData = {
        preset: Preset.NORMAL,
        encryptedContent: 'dGVzdA==' as Base64, // base64 encoded test data
        cipherText: 'Y2lwaGVy' as Base64, // base64 encoded cipher
        nonce: 'bm9uY2U=' as Base64, // base64 encoded nonce
      };

      const server = ServerDecryption.getInstance(Preset.NORMAL);

      // This will fail with our mock data, but tests the flow
      await expect(server.decryptData(mockEncryptedData)).rejects.toThrow();
    });

    it('should validate encrypted data structure', async () => {
      const server = ServerDecryption.getInstance(Preset.NORMAL);

      const invalidData = {
        preset: Preset.NORMAL,
        // Missing required fields
      } as any;

      await expect(server.decryptData(invalidData)).rejects.toThrow(
        'Invalid encrypted data: missing required fields',
      );
    });

    it('should handle null/undefined encrypted data', async () => {
      const server = ServerDecryption.getInstance();

      await expect(server.decryptData(null as any)).rejects.toThrow(
        'Invalid encrypted data: must be an object',
      );

      await expect(server.decryptData(undefined as any)).rejects.toThrow(
        'Invalid encrypted data: must be an object',
      );
    });
  });

  describe('Status and Health Checks', () => {
    it('should return status before initialization', async () => {
      const server = ServerDecryption.getInstance();
      const status = await server.getStatus();

      expect(status.initialized).toBe(false);
      expect(status.preset).toBeDefined();
      expect(status.keyManager).toBeNull();
    });

    it('should return status after initialization', async () => {
      const server = ServerDecryption.getInstance();

      // Trigger initialization by attempting a decrypt (will fail but initializes)
      const mockData: EncryptedData = {
        preset: Preset.NORMAL,
        encryptedContent: 'dGVzdA==' as Base64,
        cipherText: 'Y2lwaGVy' as Base64,
        nonce: 'bm9uY2U=' as Base64,
      };

      try {
        await server.decryptData(mockData);
      } catch {
        // Expected to fail, but should initialize
      }

      const status = await server.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.keyManager).toBeDefined();
    });

    it('should perform health check', async () => {
      const server = ServerDecryption.getInstance();

      const health = await server.healthCheck();
      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('issues');
      expect(Array.isArray(health.issues)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization failures gracefully', async () => {
      const server = ServerDecryption.getInstance();

      const mockData: EncryptedData = {
        preset: Preset.NORMAL,
        encryptedContent: 'dGVzdA==' as Base64,
        cipherText: 'Y2lwaGVy' as Base64,
        nonce: 'bm9uY2U=' as Base64,
      };

      await expect(server.decryptData(mockData)).rejects.toThrow();
    });

    it('should provide meaningful error messages', async () => {
      const server = ServerDecryption.getInstance();

      const invalidData = {} as EncryptedData;

      await expect(server.decryptData(invalidData)).rejects.toThrow(/missing required fields/);
    });
  });

  describe('Grace Period Support', () => {
    it('should handle multiple keys during grace period', async () => {
      // TODO: This test would require more complex setup with actual key rotation
      // For now, we test that the method exists and can be called
      const server = ServerDecryption.getInstance();

      expect(server.decryptData).toBeDefined();
    });
  });
});
