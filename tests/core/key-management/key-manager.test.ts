import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { KeyManager } from '../../../src/core/key-management/key-manager';
import { cleanTestDirectory, TEST_CERT_PATH, TEST_CONFIG } from './test-utils';

describe('KeyManager', () => {
  beforeEach(async () => {
    KeyManager.resetInstance();
    await cleanTestDirectory(TEST_CERT_PATH);
  });

  afterEach(() => {
    KeyManager.resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = KeyManager.getInstance();
      const instance2 = KeyManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully with default config', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await expect(manager.initialize()).resolves.not.toThrow();
      const status = await manager.getStatus();
      expect(status.hasKeys).toBe(true);
      expect(status.keysValid).toBe(true);
    });

    it('should fail when no keys exist and autoGenerate is false', async () => {
      const config = { ...TEST_CONFIG, autoGenerate: false };
      const manager = KeyManager.getInstance(config);
      await expect(manager.initialize()).rejects.toThrow(
        'No keys found and auto-generation is disabled',
      );
    });
  });

  describe('Key Access', () => {
    it('should get public and secret keys', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await manager.initialize();
      const publicKey = await manager.getPublicKeyBase64();
      const secretKey = await manager.getSecretKeyBase64();
      expect(publicKey).toBeTruthy();
      expect(secretKey).toBeTruthy();
    });
  });

  describe('Key Rotation', () => {
    it('should rotate keys when needed', async () => {
      const manager = KeyManager.getInstance(TEST_CONFIG);
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
      const manager = KeyManager.getInstance(TEST_CONFIG);
      await manager.initialize();
      const health = await manager.healthCheck();
      expect(health.healthy).toBe(true);
    });
  });
});
