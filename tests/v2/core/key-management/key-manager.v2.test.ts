import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KeyManagerV2 } from '../../../../src/v2/core/key-management/key-manager.v2';
import { TEST_CONFIG_V2, cleanTestDirectory } from './test-utils';

describe('KeyManagerV2', () => {
  beforeEach(async () => {
    KeyManagerV2.resetInstance();
    await cleanTestDirectory();
  });

  afterEach(() => {
    KeyManagerV2.resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = KeyManagerV2.getInstance();
      const instance2 = KeyManagerV2.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully with default config', async () => {
      const manager = KeyManagerV2.getInstance(TEST_CONFIG_V2);
      await expect(manager.initialize()).resolves.not.toThrow();
      const status = await manager.getStatus();
      expect(status.hasKeys).toBe(true);
      expect(status.keysValid).toBe(true);
    });

    it('should fail when no keys exist and autoGenerate is false', async () => {
      const config = { ...TEST_CONFIG_V2, autoGenerate: false };
      const manager = KeyManagerV2.getInstance(config);
      await expect(manager.initialize()).rejects.toThrow('No keys found and auto-generation is disabled');
    });
  });

  describe('Key Access', () => {
    it('should get public and private keys', async () => {
      const manager = KeyManagerV2.getInstance(TEST_CONFIG_V2);
      await manager.initialize();
      const publicKey = await manager.getPublicKeyBase64();
      const privateKey = await manager.getPrivateKeyBase64();
      expect(publicKey).toBeTruthy();
      expect(privateKey).toBeTruthy();
    });
  });

  describe('Key Rotation', () => {
    it('should rotate keys when needed', async () => {
      const manager = KeyManagerV2.getInstance(TEST_CONFIG_V2);
      await manager.initialize();
      const initialKeys = await manager.getKeyPair();

      // Manually expire keys
      if (manager.currentKeys) {
        manager.currentKeys.metadata.expiresAt = new Date('2020-01-01');
      }

      await manager.rotateKeys();
      const newKeys = await manager.getKeyPair();

      expect(newKeys.metadata.version).toBe(initialKeys.metadata.version + 1);
    });
  });

  describe('Status and Health Check', () => {
    it('should return a healthy status', async () => {
      const manager = KeyManagerV2.getInstance(TEST_CONFIG_V2);
      await manager.initialize();
      const health = await manager.healthCheck();
      expect(health.healthy).toBe(true);
    });
  });
});
