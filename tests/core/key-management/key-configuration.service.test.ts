import { beforeEach, describe, expect, it } from 'vitest';

import { KeyConfigurationService } from '../../../src/core/key-management/services/key-configuration.service';
import { TEST_CONFIG } from './test-utils';

describe('KeyConfigurationService', () => {
  let configService: KeyConfigurationService;

  beforeEach(() => {
    configService = new KeyConfigurationService();
  });

  describe('validateConfig', () => {
    it('should not throw for a valid configuration', () => {
      expect(() => configService.validateConfig(TEST_CONFIG)).not.toThrow();
    });

    it('should throw for an invalid preset', () => {
      const invalidConfig = { ...TEST_CONFIG, preset: 'invalid-preset' as any };
      expect(() => configService.validateConfig(invalidConfig)).toThrow('Invalid preset');
    });

    it('should throw for non-positive key expiry months', () => {
      const invalidConfig = { ...TEST_CONFIG, keyExpiryMonths: 0 };
      expect(() => configService.validateConfig(invalidConfig)).toThrow(
        'Key expiry months must be positive',
      );
    });

    it('should throw for a negative rotation grace period', () => {
      const invalidConfig = { ...TEST_CONFIG, rotationGracePeriodInMinutes: -1 };
      expect(() => configService.validateConfig(invalidConfig)).toThrow(
        'Rotation grace period cannot be negative',
      );
    });

    it('should throw for an empty cert path', () => {
      const invalidConfig = { ...TEST_CONFIG, certPath: '' };
      expect(() => configService.validateConfig(invalidConfig)).toThrow(
        'Certificate path cannot be empty',
      );
    });

    it('should throw for a cert path with path traversal', () => {
      const invalidConfig = { ...TEST_CONFIG, certPath: '../unsafe' };
      expect(() => configService.validateConfig(invalidConfig as any)).toThrow(
        'Certificate path contains unsafe path traversal patterns',
      );
    });
  });
});
