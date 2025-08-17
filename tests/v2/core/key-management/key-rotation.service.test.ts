import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KeyRotationService } from '../../../../src/v2/core/key-management/key-rotation.service';
import { KeyLifecycleService } from '../../../../src/v2/core/key-management/key-lifecycle.service';
import { KeyStorageService } from '../../../../src/v2/core/key-management/key-storage.service';
import { RotationHistoryService } from '../../../../src/v2/core/key-management/rotation-history.service';
import { TEST_CONFIG_V2 } from './test-utils';
import { KeyPair } from '../../../../src/core/common/interfaces/keys.interfaces';

// Mock the services
vi.mock('../../../../src/v2/core/key-management/key-lifecycle.service');
vi.mock('../../../../src/v2/core/key-management/key-storage.service');
vi.mock('../../../../src/v2/core/key-management/rotation-history.service');


describe('KeyRotationService', () => {
  let rotationService: KeyRotationService;
  let lifecycleService: KeyLifecycleService;
  let storageService: KeyStorageService;
  let historyService: RotationHistoryService;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

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
          preset: 'ml-kem-768',
          version: 1,
          createdAt: new Date(),
          expiresAt: new Date('2020-01-01'),
        },
      };
      expect(rotationService.needsRotation(expiredKeys)).toBe(true);
    });
  });

  describe('performKeyRotation', () => {
    it('should perform a key rotation successfully', async () => {
      const currentKeys: KeyPair = {
        publicKey: new Uint8Array([1]),
        secretKey: new Uint8Array([1]),
        metadata: { preset: 'ml-kem-768', version: 1, createdAt: new Date(), expiresAt: new Date() },
      };
      const newKeys: KeyPair = {
        publicKey: new Uint8Array([2]),
        secretKey: new Uint8Array([2]),
        metadata: { preset: 'ml-kem-768', version: 2, createdAt: new Date(), expiresAt: new Date() },
      };

      // Setup mocks
      vi.mocked(historyService).getNextVersionNumber.mockResolvedValue(2);
      vi.mocked(lifecycleService).createNewKeyPair.mockReturnValue(newKeys);

      const result = await rotationService.performKeyRotation(
        currentKeys,
        lifecycleService,
        storageService,
        historyService
      );

      expect(historyService.getNextVersionNumber).toHaveBeenCalledOnce();
      expect(lifecycleService.createNewKeyPair).toHaveBeenCalledWith({ version: 2 });
      expect(storageService.backupExpiredKeys).toHaveBeenCalledWith(currentKeys);
      expect(storageService.saveKeysToFile).toHaveBeenCalledWith(newKeys);
      expect(historyService.updateRotationHistory).toHaveBeenCalledWith(newKeys);
      expect(result.newKeys).toBe(newKeys);
      expect(result.previousKeys).toBe(currentKeys);
    });
  });
});
