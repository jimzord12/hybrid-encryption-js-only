import { beforeEach, describe, expect, it } from 'vitest';
import { Preset } from '../../../src/core/common/enums';
import { KeyPair } from '../../../src/core/common/interfaces/keys.interfaces';

import { KeyLifecycleService } from '../../../src/core/key-management/v2/key-lifecycle.service';
import { KeyManagerV2 } from '../../../src/core/key-management/v2/key-manager.v2';
import { KeyRotationService } from '../../../src/core/key-management/v2/key-rotation.service';
import { KeyStorageService } from '../../../src/core/key-management/v2/key-storage.service';
import { RotationHistoryService } from '../../../src/core/key-management/v2/rotation-history.service';
import { waitFor } from '../../debug/async';
import { cleanTestDirectory, TEST_CONFIG_V2 } from './test-utils';

describe('KeyRotationService', () => {
  let rotationService: KeyRotationService;
  let lifecycleService: KeyLifecycleService;
  let storageService: KeyStorageService;
  let historyService: RotationHistoryService;

  beforeEach(() => {
    // Instantiate services with mocked dependencies
    lifecycleService = new KeyLifecycleService(TEST_CONFIG_V2) as any;
    storageService = new KeyStorageService(TEST_CONFIG_V2) as any;
    historyService = new RotationHistoryService(TEST_CONFIG_V2) as any;
    rotationService = new KeyRotationService(TEST_CONFIG_V2);
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
      await cleanTestDirectory();
      await waitFor(300);
    });

    it('should perform a key rotation successfully', async () => {
      KeyManagerV2.resetInstance();
      const keyManager = KeyManagerV2.getInstance({ preset: Preset.NORMAL });
      keyManager.initialize();

      const CurrentkeyPair = lifecycleService.createNewKeyPair();

      const { newKeys, previousKeys } = await rotationService.performKeyRotation(
        CurrentkeyPair,
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

      console.log('********: ', nk2.metadata.expiresAt.getTime() - Date.now());

      expect(nk2.metadata.version).toBe(2);

      expect(nk2.metadata.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
      const aroundAMonthFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      expect(nk2.metadata.expiresAt.getTime() - Date.now()).toBeCloseTo(
        aroundAMonthFromNow.getTime() - Date.now(),
        -8,
      );
      expect(nk2).not.toBe(newKeys);
      expect(pk2).toBe(newKeys);

      const history = await historyService.getRotationHistory();
      expect(history.totalRotations).toBe(2);
    });
  });
});
