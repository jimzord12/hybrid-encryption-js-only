import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import fs from 'node:fs/promises';
import path from 'node:path';
import { KeyPair } from '../../../src/core/common/interfaces/keys.interfaces';
import { KeyLifecycleService } from '../../../src/core/key-management/services/key-lifecycle.service';
import { RotationHistoryService } from '../../../src/core/key-management/services/rotation-history.service';
import { cleanTestDirectory } from '../../test-utils';
import { TEST_CERT_PATH, TEST_CONFIG } from './test-utils';

describe('RotationHistoryService', () => {
  let historyService: RotationHistoryService;
  let lifecycleService: KeyLifecycleService;
  let testKeys: KeyPair;

  beforeEach(async () => {
    await cleanTestDirectory(TEST_CERT_PATH);
    // Ensure the test directory exists
    await fs.mkdir(TEST_CERT_PATH, { recursive: true });
    historyService = new RotationHistoryService(TEST_CONFIG);
    lifecycleService = new KeyLifecycleService(TEST_CONFIG);
    testKeys = lifecycleService.createNewKeyPair();
  });

  afterEach(async () => {
    await cleanTestDirectory(TEST_CERT_PATH);
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
      const historyPath = path.join(TEST_CERT_PATH, 'rotation-history.json');
      await fs.writeFile(historyPath, 'invalid-json', 'utf8');

      // Second call, should read from cache
      const history = await historyService.getRotationHistory();
      expect(history.totalRotations).toBe(1);
    });
  });
});
