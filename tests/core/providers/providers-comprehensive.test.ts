import { beforeEach, describe, expect, it } from 'vitest';
import { Preset } from '../../../src/core/common/enums';
import { KeyPair } from '../../../src/core/common/interfaces/keys.interfaces';
import { ML_KEM_STATS } from '../../../src/core/encryption/constants/defaults.constants';
import { KeyManagerV2 } from '../../../src/core/key-management/v2/key-manager.v2';
import { MlKemKeyProvider } from '../../../src/core/providers';
import { expected, keyPairsToTest } from './test-data';

describe('MlKemKeyProvider', () => {
  beforeEach(() => {
    KeyManagerV2.resetInstance();
  });

  describe('generateKeyPair', () => {
    it('should generate a valid key pair with default preset', () => {
      const keyManager = KeyManagerV2.getInstance();
      keyManager.initialize();
      const keys = new MlKemKeyProvider().generateKeyPair();
      const keyPair = keyManager.lifecycleService.addMetaDataToKeys(keys);

      expect(keyPair).toBeDefined();
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.secretKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.metadata).toBeDefined();
      expect(keyPair.metadata.preset).toBe(Preset.NORMAL);
      expect(keyPair.metadata.version).toBe(1);
      expect(keyPair.metadata.createdAt).toBeInstanceOf(Date);
      expect(keyPair.metadata.expiresAt).toBeInstanceOf(Date);
    });

    it('should generate a valid key pair with HIGH_SECURITY preset', () => {
      const keyManager = KeyManagerV2.getInstance({ preset: Preset.HIGH_SECURITY });
      keyManager.initialize();

      const keys = new MlKemKeyProvider(Preset.HIGH_SECURITY).generateKeyPair();
      const keyPair = keyManager.lifecycleService.addMetaDataToKeys(keys);

      expect(keyPair.metadata.preset).toBe(Preset.HIGH_SECURITY);
      expect(keyPair.publicKey.length).toBe(1568);
      expect(keyPair.secretKey.length).toBe(3168);
    });

    it('should generate a valid key pair with NORMAL preset', () => {
      const keyManager = KeyManagerV2.getInstance({ preset: Preset.NORMAL });
      keyManager.initialize();

      const keys = new MlKemKeyProvider(Preset.NORMAL).generateKeyPair();
      const keyPair = keyManager.lifecycleService.addMetaDataToKeys(keys);

      expect(keyPair.metadata.preset).toBe(Preset.NORMAL);
      expect(keyPair.publicKey.length).toBe(1184);
      expect(keyPair.secretKey.length).toBe(2400);
    });

    it('should generate key pair with custom version', () => {
      const keyManager = KeyManagerV2.getInstance({ preset: Preset.NORMAL });
      keyManager.initialize();

      const keys = new MlKemKeyProvider(Preset.NORMAL).generateKeyPair();
      const keyPair = keyManager.lifecycleService.addMetaDataToKeys(keys, { version: 5 });

      expect(keyPair.metadata.version).toBe(5);
    });
  });

  describe('validateKeyPair', () => {
    let validKeyPair_NORMAL: KeyPair;
    let validKeyPair_HIGH_SECURITY: KeyPair;

    beforeEach(() => {
      const keysNormal = new MlKemKeyProvider(Preset.NORMAL).generateKeyPair();
      const keysHighSecurity = new MlKemKeyProvider(Preset.HIGH_SECURITY).generateKeyPair();
      let keyManager = KeyManagerV2.getInstance({ preset: Preset.NORMAL });
      validKeyPair_NORMAL = keyManager.lifecycleService.addMetaDataToKeys(keysNormal);
      KeyManagerV2.resetInstance();
      keyManager = KeyManagerV2.getInstance({ preset: Preset.HIGH_SECURITY });
      validKeyPair_HIGH_SECURITY = keyManager.lifecycleService.addMetaDataToKeys(keysHighSecurity);
      KeyManagerV2.resetInstance();
    });

    it('should validate a valid key pair', () => {
      const result = new MlKemKeyProvider().validateKeyPair(validKeyPair_NORMAL);

      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject key pair with missing public key', () => {
      const invalidKeyPair = {
        ...validKeyPair_NORMAL,
        publicKey: null as any,
      };

      const result = new MlKemKeyProvider().validateKeyPair(invalidKeyPair);

      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Invalid Public Key, Uint8Array is expected');
    });

    it('should reject key pair with missing secret key', () => {
      const invalidKeyPair = {
        ...validKeyPair_NORMAL,
        secretKey: null as any,
      };

      const result = new MlKemKeyProvider().validateKeyPair(invalidKeyPair);

      expect(result.errors).toContain('Invalid Secret Key, Uint8Array is expected');
    });

    it('should reject key pair with non-Uint8Array public key', () => {
      const invalidKeyPair = {
        ...validKeyPair_NORMAL,
        publicKey: 'not-a-uint8array' as any,
      };

      const result = new MlKemKeyProvider().validateKeyPair(invalidKeyPair);

      expect(result.errors).toContain('Invalid Public Key, Uint8Array is expected');
    });

    it('should reject key pair with non-Uint8Array secret key', () => {
      const badSecretKey = Buffer.from('buffer-not-uint8array') as any;
      const invalidKeyPair = {
        ...validKeyPair_NORMAL,
        secretKey: badSecretKey,
      };

      // console.log(typeof Buffer.from('buffer-not-uint8array')); // object
      // console.log(Buffer.from('buffer-not-uint8array') instanceof Buffer); // true

      const result = new MlKemKeyProvider().validateKeyPair(invalidKeyPair);

      // console.log(result.errors);
      // console.log(
      //   'Buffer == Uint8Array:',
      //   Buffer.from('buffer-not-uint8array') instanceof Uint8Array,
      // );

      expect(result.errors).toContain(
        `Secret Key Length is=${badSecretKey.length}, should be=${ML_KEM_STATS.secretKeyLength[validKeyPair_NORMAL.metadata.preset as Preset]}`,
      );
    });

    it('should reject NORMAL preset key pair with wrong public key size', () => {
      const invalidKeyPair = {
        ...validKeyPair_NORMAL,
        publicKey: new Uint8Array(1000), // Wrong size
      };

      const result = new MlKemKeyProvider().validateKeyPair(invalidKeyPair);

      expect(result.ok).toBe(false);
      expect(result.errors).toContain(
        `Public Key Length is=${1000}, should be=${ML_KEM_STATS.publicKeyLength[Preset.NORMAL]}`,
      );
    });

    it('should reject NORMAL preset key pair with wrong secret key size', () => {
      const keyManager = KeyManagerV2.getInstance({ preset: Preset.HIGH_SECURITY });
      keyManager.initialize();

      const highSecurityKeyPair = new MlKemKeyProvider(Preset.HIGH_SECURITY).generateKeyPair();
      let invalidKeyPair = keyManager.lifecycleService.addMetaDataToKeys(highSecurityKeyPair);

      invalidKeyPair = {
        ...invalidKeyPair,
        secretKey: new Uint8Array(2400), // NORMAL size instead of HIGH_SECURITY
      };

      const result = new MlKemKeyProvider().validateKeyPair(invalidKeyPair);

      // console.log('Errors: ', result.errors);

      expect(result.errors).toContain('Secret Key Length is=2400, should be=3168');
    });

    ///////////////// I HAVE NOT FIXED BELOW THIS POINT /////////////////

    it('should reject HIGH_SECURITY preset key pair with wrong sizes', () => {
      const keyManager = KeyManagerV2.getInstance({ preset: Preset.HIGH_SECURITY });
      keyManager.initialize();

      const highSecurityKeys = new MlKemKeyProvider(Preset.HIGH_SECURITY).generateKeyPair();
      const highSecurityKeyPair = keyManager.lifecycleService.addMetaDataToKeys(highSecurityKeys);

      const invalidKeyPair = {
        ...highSecurityKeyPair,
        publicKey: new Uint8Array(1184), // NORMAL size instead of HIGH_SECURITY
      };

      const result = new MlKemKeyProvider().validateKeyPair(invalidKeyPair);

      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Public Key Length is=1184, should be=1568');
    });

    it('should reject key pair with invalid createdAt date', () => {
      const invalidKeyPair = {
        ...validKeyPair_NORMAL,
        metadata: {
          ...validKeyPair_NORMAL.metadata,
          createdAt: null as any,
        },
      };

      const result = new MlKemKeyProvider().validateKeyPair(invalidKeyPair);

      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Invalid createdAt date');
    });

    it('should reject key pair with invalid expiresAt date', () => {
      const invalidKeyPair = {
        ...validKeyPair_NORMAL,
        metadata: {
          ...validKeyPair_NORMAL.metadata,
          expiresAt: 'not-a-date' as any,
        },
      };

      const result = new MlKemKeyProvider().validateKeyPair(invalidKeyPair);

      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Invalid expiresAt date');
    });

    it('should reject key pair with invalid version', () => {
      const invalidKeyPair = {
        ...validKeyPair_NORMAL,
        metadata: {
          ...validKeyPair_NORMAL.metadata,
          version: 'not-a-number' as any,
        },
      };

      const result = new MlKemKeyProvider().validateKeyPair(invalidKeyPair);

      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Invalid version');
    });

    it('should accumulate multiple validation errors', () => {
      expect(keyPairsToTest).toHaveLength(expected.length);

      keyPairsToTest.forEach((kp, idx) => {
        const result = new MlKemKeyProvider().validateKeyPair(kp);

        const expectedErrors = expected[idx];

        expect(result.ok).toBe(false);
        expect(result.errors).toHaveLength(expectedErrors.length);

        expectedErrors.forEach(expectedError => {
          expect(result.errors.some((error: string) => error.includes(expectedError))).toBe(true);
        });
      });
    });
  });

  describe('serializeKeyPair', () => {
    it('should serialize a valid key pair', () => {
      const keys = new MlKemKeyProvider().generateKeyPair();

      KeyManagerV2.resetInstance();
      const keyManager = KeyManagerV2.getInstance({ preset: Preset.NORMAL });
      keyManager.initialize();

      const keyPair = keyManager.lifecycleService.addMetaDataToKeys(keys);

      const serialized = new MlKemKeyProvider().serializeKeyPair(keyPair);

      expect(serialized.publicKey).toBeTypeOf('string');
      expect(serialized.secretKey).toBeTypeOf('string');
      expect(serialized.metadata.preset).toBe(keyPair.metadata.preset);
      expect(serialized.metadata.createdAt).toBe(keyPair.metadata.createdAt.toISOString());
      expect(serialized.metadata.expiresAt).toBe(keyPair.metadata.expiresAt.toISOString());
      expect(serialized.metadata.version).toBe(keyPair.metadata.version);
    });

    it('should throw error for non-binary keys', () => {
      const keys = new MlKemKeyProvider().generateKeyPair();

      KeyManagerV2.resetInstance();
      const keyManager = KeyManagerV2.getInstance({ preset: Preset.NORMAL });
      keyManager.initialize();

      const keyPair = keyManager.lifecycleService.addMetaDataToKeys(keys);
      keyPair.publicKey = 'not-binary' as any;

      expect(() => new MlKemKeyProvider().serializeKeyPair(keyPair)).toThrow(
        'Keys must be in binary format in order to be Serialized',
      );
    });
  });

  describe('deserializeKeyPair', () => {
    it('should deserialize a valid serialized key pair', () => {
      const keys = new MlKemKeyProvider().generateKeyPair();

      KeyManagerV2.resetInstance();
      const keyManager = KeyManagerV2.getInstance({ preset: Preset.NORMAL });
      keyManager.initialize();

      const originalKeyPair = keyManager.lifecycleService.addMetaDataToKeys(keys);
      const serialized = new MlKemKeyProvider().serializeKeyPair(originalKeyPair);

      const deserialized = new MlKemKeyProvider().deserializeKeyPair(serialized);

      expect(deserialized.publicKey).toBeInstanceOf(Uint8Array);
      expect(deserialized.secretKey).toBeInstanceOf(Uint8Array);
      expect(deserialized.publicKey).toEqual(originalKeyPair.publicKey);
      expect(deserialized.secretKey).toEqual(originalKeyPair.secretKey);
      expect(deserialized.metadata.preset).toBe(originalKeyPair.metadata.preset);
      expect(deserialized.metadata.createdAt).toEqual(originalKeyPair.metadata.createdAt);
      expect(deserialized.metadata.expiresAt).toEqual(originalKeyPair.metadata.expiresAt);
      expect(deserialized.metadata.version).toBe(originalKeyPair.metadata.version);
    });

    it('should handle round-trip serialization/deserialization', () => {
      const keys = new MlKemKeyProvider(Preset.HIGH_SECURITY).generateKeyPair();

      KeyManagerV2.resetInstance();
      const keyManager = KeyManagerV2.getInstance({ preset: Preset.HIGH_SECURITY });
      keyManager.initialize();

      const originalKeyPair = keyManager.lifecycleService.addMetaDataToKeys(keys, { version: 3 });

      const serialized = new MlKemKeyProvider().serializeKeyPair(originalKeyPair);
      const deserialized = new MlKemKeyProvider().deserializeKeyPair(serialized);

      // Validate the deserialized key pair
      const validation = new MlKemKeyProvider().validateKeyPair(deserialized);
      expect(validation.ok).toBe(true);
    });
  });
});
