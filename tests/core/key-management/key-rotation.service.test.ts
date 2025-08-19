import { beforeEach, describe, expect, it } from 'vitest';
import { Preset } from '../../../src/core/common/enums';
import { KeyPair } from '../../../src/core/common/interfaces/keys.interfaces';

import { KeyManager } from '../../../src/core/key-management/key-manager';
import { KeyLifecycleService } from '../../../src/core/key-management/services/key-lifecycle.service';
import { KeyRotationService } from '../../../src/core/key-management/services/key-rotation.service';
import { KeyStorageService } from '../../../src/core/key-management/services/key-storage.service';
import { RotationHistoryService } from '../../../src/core/key-management/services/rotation-history.service';
import { waitFor } from '../utils/debug/async';
import { cleanTestDirectory, TEST_CERT_PATH, TEST_CONFIG } from './test-utils';

describe('KeyRotationService', () => {
  let rotationService: KeyRotationService;
  let lifecycleService: KeyLifecycleService;
  let storageService: KeyStorageService;
  let historyService: RotationHistoryService;

  beforeEach(() => {
    // Instantiate services with mocked dependencies
    lifecycleService = new KeyLifecycleService(TEST_CONFIG) as any;
    storageService = new KeyStorageService(TEST_CONFIG) as any;
    historyService = new RotationHistoryService(TEST_CONFIG) as any;
    rotationService = new KeyRotationService(TEST_CONFIG);
  });

  describe('needsRotation', () => {
    it('should return true if no keys are present', () => {
      expect(rotationService.needsRotation(null)).toBe(true);
    });

    it('should return true if keys are expired', () => {
      const expiredKeys: KeyPair = {
        publicKey: new Uint8Array(),
        secretKey: new Uint8Array(),
        metadata: {
          preset: Preset.NORMAL,
          version: 1,
          createdAt: new Date(),
          expiresAt: new Date('2020-01-01'),
        },
      };
      expect(rotationService.needsRotation(expiredKeys)).toBe(true);
    });
  });

  describe('performKeyRotation', () => {
    beforeEach(async () => {
      await cleanTestDirectory(TEST_CERT_PATH);
      await waitFor(300);
    });

    it('should perform a key rotation successfully', async () => {
      KeyManager.resetInstance();
      const keyManager = KeyManager.getInstance({ preset: Preset.NORMAL });
      await keyManager.initialize();

      const currentkeyPair = lifecycleService.createNewKeyPair();

      const { newKeys } = await rotationService.performKeyRotation(
        currentkeyPair,
        lifecycleService,
        storageService,
        historyService,
      );

      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

      expect(newKeys.metadata.version).toBe(1);

      await waitFor(5 * 1000); // Wait for the Grace Period to End

      const { newKeys: nk2, previousKeys: pk2 } = await rotationService.performKeyRotation(
        newKeys,
        lifecycleService,
        storageService,
        historyService,
      );

      expect(nk2.metadata.version).toBe(2);

      expect(nk2.metadata.createdAt.getTime()).toBeLessThanOrEqual(Date.now());

      // Test that new keys expire approximately 1 month from now (config.keyExpiryMonths = 1)
      // Note: The provider uses setMonth() which adds calendar months, not fixed 30-day periods
      const now = new Date();
      const expectedExpiryDate = new Date(now);
      expectedExpiryDate.setMonth(expectedExpiryDate.getMonth() + 1);

      const actualExpiryTime = nk2.metadata.expiresAt.getTime();

      // Allow some tolerance for timing differences (±5 minutes for test execution time)
      const timeDiff = Math.abs(actualExpiryTime - expectedExpiryDate.getTime());
      expect(timeDiff).toBeLessThan(5 * 60 * 1000); // Less than 5 minutes difference

      // Check object relationships correctly
      expect(nk2).not.toBe(newKeys); // nk2 should be a NEW key pair (different object)
      expect(pk2).toBe(newKeys); // previousKeys should be the old newKeys

      const history = await historyService.getRotationHistory();
      expect(history.totalRotations).toBe(2);
    });
  });
});
