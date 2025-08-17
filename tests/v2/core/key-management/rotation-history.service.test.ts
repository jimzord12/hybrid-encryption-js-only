import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RotationHistoryService } from '../../../../src/v2/core/key-management/rotation-history.service';
import { KeyLifecycleService } from '../../../../src/v2/core/key-management/key-lifecycle.service';
import { TEST_CONFIG_V2, TEST_CERT_PATH_V2, cleanTestDirectory } from './test-utils';
import { KeyPair } from '../../../../src/core/common/interfaces/keys.interfaces';
import fs from 'fs/promises';
import path from 'path';

describe('RotationHistoryService', () => {
  let historyService: RotationHistoryService;
  let lifecycleService: KeyLifecycleService;
  let testKeys: KeyPair;

  beforeEach(async () => {
    await cleanTestDirectory();
    historyService = new RotationHistoryService(TEST_CONFIG_V2);
    lifecycleService = new KeyLifecycleService(TEST_CONFIG_V2);
    testKeys = lifecycleService.createNewKeyPair();
  });

  afterEach(async () => {
    await cleanTestDirectory();
  });

  describe('getRotationHistory and updateRotationHistory', () => {
    it('should get an empty history if none exists', async () => {
      const history = await historyService.getRotationHistory();
      expect(history.totalRotations).toBe(0);
      expect(history.rotations).toHaveLength(0);
    });

    it('should update the history with a new rotation', async () => {
      await historyService.updateRotationHistory(testKeys);
      const history = await historyService.getRotationHistory();
      expect(history.totalRotations).toBe(1);
      expect(history.rotations).toHaveLength(1);
      expect(history.rotations[0].version).toBe(testKeys.metadata.version);
    });
  });

  describe('getNextVersionNumber', () => {
    it('should return undefined if history is empty', async () => {
      const version = await historyService.getNextVersionNumber();
      expect(version).toBeUndefined();
    });

    it('should return the next version number', async () => {
      await historyService.updateRotationHistory(testKeys);
      const version = await historyService.getNextVersionNumber();
      expect(version).toBe(testKeys.metadata.version + 1);
    });
  });

  describe('getRotationCache', () => {
    it('should cache the rotation history', async () => {
        await historyService.updateRotationHistory(testKeys);

        // First call, should read from file
        await historyService.getRotationHistory();

        // Corrupt the history file
        const historyPath = path.join(TEST_CERT_PATH_V2, 'rotation-history.json');
        await fs.writeFile(historyPath, 'invalid-json', 'utf8');

        // Second call, should read from cache
        const history = await historyService.getRotationHistory();
        expect(history.totalRotations).toBe(1);
    });
  });
});
