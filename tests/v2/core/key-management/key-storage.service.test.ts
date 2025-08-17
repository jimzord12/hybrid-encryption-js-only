import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KeyStorageService } from '../../../../src/v2/core/key-management/key-storage.service';
import { TEST_CONFIG_V2, TEST_CERT_PATH_V2, cleanTestDirectory } from './test-utils';
import fs from 'fs/promises';
import path from 'path';
import { KeyLifecycleService } from '../../../../src/v2/core/key-management/key-lifecycle.service';
import { KeyPair } from '../../../../src/core/common/interfaces/keys.interfaces';

describe('KeyStorageService', () => {
  let storageService: KeyStorageService;
  let lifecycleService: KeyLifecycleService;
  let testKeys: KeyPair;

  beforeEach(async () => {
    await cleanTestDirectory();
    storageService = new KeyStorageService(TEST_CONFIG_V2);
    lifecycleService = new KeyLifecycleService(TEST_CONFIG_V2);
    testKeys = lifecycleService.createNewKeyPair();
  });

  afterEach(async () => {
    await cleanTestDirectory();
  });

  describe('ensureCertDirectory', () => {
    it('should create the certificate directory if it does not exist', async () => {
      await storageService.ensureCertDirectory();
      const stats = await fs.stat(TEST_CERT_PATH_V2);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('saveKeysToFile and loadKeysFromFile', () => {
    it('should save and load a key pair successfully', async () => {
      await storageService.saveKeysToFile(testKeys);

      const loadedKeys = await storageService.loadKeysFromFile();
      expect(loadedKeys).not.toBeNull();
      expect(loadedKeys?.publicKey).toEqual(testKeys.publicKey);
      expect(loadedKeys?.secretKey).toEqual(testKeys.secretKey);
      expect(loadedKeys?.metadata.version).toEqual(testKeys.metadata.version);
    });

    it('should return null when loading non-existent keys', async () => {
      const loadedKeys = await storageService.loadKeysFromFile();
      expect(loadedKeys).toBeNull();
    });
  });

  describe('backupExpiredKeys', () => {
    it('should create a backup of the keys', async () => {
      await storageService.backupExpiredKeys(testKeys);
      const backupDir = path.join(TEST_CERT_PATH_V2, 'backup');
      const files = await fs.readdir(backupDir);
      expect(files.length).toBeGreaterThan(0);
      expect(files.some(f => f.includes('expired'))).toBe(true);
    });
  });

  describe('cleanupOldBackups', () => {
    it('should remove backup files older than 3 months', async () => {
      const backupDir = path.join(TEST_CERT_PATH_V2, 'backup');
      await fs.mkdir(backupDir, { recursive: true });
      const oldDate = '2020-01';
      await fs.writeFile(path.join(backupDir, `pub-key-expired-${oldDate}.pem`), 'old-key');

      await storageService.cleanupOldBackups();

      const files = await fs.readdir(backupDir);
      expect(files.some(f => f.includes(oldDate))).toBe(false);
    });
  });
});
