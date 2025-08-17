import { beforeEach, describe, expect, it } from 'vitest';

import { KeyPair } from '../../../src/core/common/interfaces/keys.interfaces';
import { KeyLifecycleService } from '../../../src/core/key-management/v2/key-lifecycle.service';
import { TEST_CONFIG_V2 } from './test-utils';

describe('KeyLifecycleService', () => {
  let lifecycleService: KeyLifecycleService;

  beforeEach(() => {
    lifecycleService = new KeyLifecycleService(TEST_CONFIG_V2);
  });

  describe('createNewKeyPair', () => {
    it('should create a new key pair with valid metadata', () => {
      const keyPair = lifecycleService.createNewKeyPair({ version: 1 });
      expect(keyPair).toBeDefined();
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.secretKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.metadata.version).toBe(1);
      expect(keyPair.metadata.preset).toBe(TEST_CONFIG_V2.preset);
    });
  });

  describe('validateKeys', () => {
    it('should validate a valid key pair successfully', async () => {
      const keyPair = lifecycleService.createNewKeyPair();
      const result = await lifecycleService.validateKeys(keyPair);
      expect(result.isValid).toBe(true);
    });

    it('should detect an invalid key pair', async () => {
      const invalidKeyPair: KeyPair = {
        publicKey: new Uint8Array([1, 2, 3]),
        secretKey: new Uint8Array([4, 5, 6]),
        metadata: {
          preset: 'ml-kem-768' as any,
          version: 1,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 100000),
        },
      };
      const result = await lifecycleService.validateKeys(invalidKeyPair);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Key pair mismatch - public and secret keys do not match');
    });
  });

  describe('securelyClearKeys', () => {
    it('should clear the key material from a key pair', () => {
      const keyPair = lifecycleService.createNewKeyPair();
      lifecycleService.securelyClearKey(keyPair);
      expect(keyPair.publicKey.every(b => b === 0)).toBe(true);
      expect(keyPair.secretKey.every(b => b === 0)).toBe(true);
    });
  });
});
