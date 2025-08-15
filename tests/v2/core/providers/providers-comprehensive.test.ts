import { beforeEach, describe, expect, it } from 'vitest';
import { Preset } from '../../../../src/core/common/enums';
import { KeyPair } from '../../../../src/core/common/interfaces/keys.interfaces';
import { ML_KEM_STATS } from '../../../../src/core/encryption/constants/defaults.constants';
import { MlKemKeyProvider } from '../../../../src/core/providers';
import { expected, keyPairsToTest } from './test-data';

describe('MlKemKeyProvider', () => {
  let provider: MlKemKeyProvider;

  beforeEach(() => {
    provider = new MlKemKeyProvider();
  });

  describe('generateKeyPair', () => {
    it('should generate a valid key pair with default preset', () => {
      const keyPair = MlKemKeyProvider.generateKeyPair();

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
      const keyPair = MlKemKeyProvider.generateKeyPair(Preset.HIGH_SECURITY);

      expect(keyPair.metadata.preset).toBe(Preset.HIGH_SECURITY);
      expect(keyPair.publicKey.length).toBe(1568);
      expect(keyPair.secretKey.length).toBe(3168);
    });

    it('should generate a valid key pair with NORMAL preset', () => {
      const keyPair = MlKemKeyProvider.generateKeyPair(Preset.NORMAL);

      expect(keyPair.metadata.preset).toBe(Preset.NORMAL);
      expect(keyPair.publicKey.length).toBe(1184);
      expect(keyPair.secretKey.length).toBe(2400);
    });

    it('should generate key pair with custom version', () => {
      const keyPair = MlKemKeyProvider.generateKeyPair(Preset.NORMAL, 5);

      expect(keyPair.metadata.version).toBe(5);
    });
  });

  describe('validateKeyPair', () => {
    let validKeyPair: KeyPair;

    beforeEach(() => {
      validKeyPair = MlKemKeyProvider.generateKeyPair(Preset.NORMAL);
    });

    it('should validate a valid key pair', () => {
      const result = provider.validateKeyPair(validKeyPair);

      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject key pair with missing public key', () => {
      const invalidKeyPair = {
        ...validKeyPair,
        publicKey: null as any,
      };

      const result = provider.validateKeyPair(invalidKeyPair);

      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Invalid Public Key, Uint8Array is expected');
    });

    it('should reject key pair with missing secret key', () => {
      const invalidKeyPair = {
        ...validKeyPair,
        secretKey: null as any,
      };

      const result = provider.validateKeyPair(invalidKeyPair);

      expect(result.errors).toContain('Invalid Secret Key, Uint8Array is expected');
    });

    it('should reject key pair with non-Uint8Array public key', () => {
      const invalidKeyPair = {
        ...validKeyPair,
        publicKey: 'not-a-uint8array' as any,
      };

      const result = provider.validateKeyPair(invalidKeyPair);

      expect(result.errors).toContain('Invalid Public Key, Uint8Array is expected');
    });

    it('should reject key pair with non-Uint8Array secret key', () => {
      const badSecretKey = Buffer.from('buffer-not-uint8array') as any;
      const invalidKeyPair = {
        ...validKeyPair,
        secretKey: badSecretKey,
      };

      // console.log(typeof Buffer.from('buffer-not-uint8array')); // object
      // console.log(Buffer.from('buffer-not-uint8array') instanceof Buffer); // true

      const result = provider.validateKeyPair(invalidKeyPair);

      // console.log(result.errors);
      // console.log(
      //   'Buffer == Uint8Array:',
      //   Buffer.from('buffer-not-uint8array') instanceof Uint8Array,
      // );

      expect(result.errors).toContain(
        `Secret Key Length is=${badSecretKey.length}, should be=${ML_KEM_STATS.secretKeyLength[validKeyPair.metadata.preset as Preset]}`,
      );
    });

    it('should reject NORMAL preset key pair with wrong public key size', () => {
      const invalidKeyPair = {
        ...validKeyPair,
        publicKey: new Uint8Array(1000), // Wrong size
      };

      const result = provider.validateKeyPair(invalidKeyPair);

      expect(result.ok).toBe(false);
      expect(result.errors).toContain(
        `Public Key Length is=${1000}, should be=${ML_KEM_STATS.publicKeyLength[Preset.NORMAL]}`,
      );
    });

    it('should reject NORMAL preset key pair with wrong secret key size', () => {
      const highSecurityKeyPair = MlKemKeyProvider.generateKeyPair(Preset.HIGH_SECURITY);
      const invalidKeyPair = {
        ...highSecurityKeyPair,
        secretKey: new Uint8Array(2400), // NORMAL size instead of HIGH_SECURITY
      };

      const result = provider.validateKeyPair(invalidKeyPair);

      // console.log('Errors: ', result.errors);

      expect(result.errors).toContain('Secret Key Length is=2400, should be=3168');
    });

    it('should reject HIGH_SECURITY preset key pair with wrong sizes', () => {
      const highSecurityKeyPair = MlKemKeyProvider.generateKeyPair(Preset.HIGH_SECURITY);
      const invalidKeyPair = {
        ...highSecurityKeyPair,
        publicKey: new Uint8Array(1184), // NORMAL size instead of HIGH_SECURITY
      };

      const result = provider.validateKeyPair(invalidKeyPair);

      // console.log('Errors: ', result.errors);

      expect(result.errors).toContain('Public Key Length is=1184, should be=1568');
    });

    it('should reject key pair with invalid createdAt date', () => {
      const invalidKeyPair = {
        ...validKeyPair,
        metadata: {
          ...validKeyPair.metadata,
          createdAt: null as any,
        },
      };

      const result = provider.validateKeyPair(invalidKeyPair);

      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Invalid createdAt date');
    });

    it('should reject key pair with invalid expiresAt date', () => {
      const invalidKeyPair = {
        ...validKeyPair,
        metadata: {
          ...validKeyPair.metadata,
          expiresAt: 'not-a-date' as any,
        },
      };

      const result = provider.validateKeyPair(invalidKeyPair);

      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Invalid expiresAt date');
    });

    it('should reject key pair with invalid version', () => {
      const invalidKeyPair = {
        ...validKeyPair,
        metadata: {
          ...validKeyPair.metadata,
          version: 'not-a-number' as any,
        },
      };

      const result = provider.validateKeyPair(invalidKeyPair);

      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Invalid version');
    });

    it('should accumulate multiple validation errors', () => {
      expect(keyPairsToTest).toHaveLength(expected.length);

      keyPairsToTest.forEach((kp, idx) => {
        const result = provider.validateKeyPair(kp);

        // console.log('');
        // console.log('---------------------------------------------------');

        // console.log(
        //   `#${idx} - ${kp.publicKey} (${typeof kp.publicKey}) | [Reality]:`,
        //   result.errors,
        // );

        const expectedErrors = expected[idx];
        // console.log(
        //   `#${idx} - ${kp.publicKey} (${typeof kp.publicKey}) | [Expected]:`,
        //   expectedErrors,
        // );

        expect(result.ok).toBe(false);
        expect(result.errors).toHaveLength(expectedErrors.length);

        expectedErrors.forEach(expectedError => {
          expect(result.errors.some(error => error.includes(expectedError))).toBe(true);
        });
      });
    });
  });

  describe('isKeyPairExpired', () => {
    it('should return false for non-expired key pair', () => {
      const keyPair = MlKemKeyProvider.generateKeyPair();

      const result = provider.isKeyPairExpired(keyPair);

      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return true for expired key pair', () => {
      const keyPair = MlKemKeyProvider.generateKeyPair();
      // Set expiry date to past
      keyPair.metadata.expiresAt = new Date(Date.now() - 1000);

      const result = provider.isKeyPairExpired(keyPair);

      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Keypair has expired');
    });

    it('should return error for key pair without expiry date', () => {
      const keyPair = MlKemKeyProvider.generateKeyPair();
      keyPair.metadata.expiresAt = null as any;

      const result = provider.isKeyPairExpired(keyPair);

      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Keypair does not have an expiry date set');
    });
  });

  describe('serializeKeyPair', () => {
    it('should serialize a valid key pair', () => {
      const keyPair = MlKemKeyProvider.generateKeyPair();

      const serialized = provider.serializeKeyPair(keyPair);

      expect(serialized.publicKey).toBeTypeOf('string');
      expect(serialized.secretKey).toBeTypeOf('string');
      expect(serialized.metadata.preset).toBe(keyPair.metadata.preset);
      expect(serialized.metadata.createdAt).toBe(keyPair.metadata.createdAt.toISOString());
      expect(serialized.metadata.expiresAt).toBe(keyPair.metadata.expiresAt.toISOString());
      expect(serialized.metadata.version).toBe(keyPair.metadata.version);
    });

    it('should throw error for non-binary keys', () => {
      const keyPair = MlKemKeyProvider.generateKeyPair();
      keyPair.publicKey = 'not-binary' as any;

      expect(() => provider.serializeKeyPair(keyPair)).toThrow(
        'Keys must be in binary format in order to be Serialized',
      );
    });
  });

  describe('deserializeKeyPair', () => {
    it('should deserialize a valid serialized key pair', () => {
      const originalKeyPair = MlKemKeyProvider.generateKeyPair();
      const serialized = provider.serializeKeyPair(originalKeyPair);

      const deserialized = provider.deserializeKeyPair(serialized);

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
      const originalKeyPair = MlKemKeyProvider.generateKeyPair(Preset.HIGH_SECURITY, 3);

      const serialized = provider.serializeKeyPair(originalKeyPair);
      const deserialized = provider.deserializeKeyPair(serialized);

      // Validate the deserialized key pair
      const validation = provider.validateKeyPair(deserialized);
      expect(validation.ok).toBe(true);
    });
  });

  describe('validateConfig', () => {
    it('should validate valid config', () => {
      const config = {
        preset: Preset.NORMAL,
        expiryMonths: 6,
      };

      const { errors } = provider.validateConfig(config);

      expect(errors).toHaveLength(0);
    });

    it('should reject config without preset', () => {
      const config = {
        expiryMonths: 6,
      } as any;

      const { errors } = provider.validateConfig(config);

      expect(errors).toContain('Invalid Key Generation Config, preset is required');
    });

    it('should reject config with invalid expiry months (too low)', () => {
      const config = {
        preset: Preset.NORMAL,
        expiryMonths: 0,
      };

      const { errors } = provider.validateConfig(config);

      expect(errors).toContain(
        'Invalid Key Generation Config, expiryMonths must be a number between 1 and 12',
      );
    });

    it('should reject config with invalid expiry months (too high)', () => {
      const config = {
        preset: Preset.NORMAL,
        expiryMonths: 15,
      };

      const { errors } = provider.validateConfig(config);

      expect(errors).toContain(
        'Invalid Key Generation Config, expiryMonths must be a number between 1 and 12',
      );
    });

    it('should reject config with non-numeric expiry months', () => {
      const config = {
        preset: Preset.NORMAL,
        expiryMonths: 'six' as any,
      };

      const { errors } = provider.validateConfig(config);

      console.log(errors);

      expect(errors).toContain('Invalid Key Generation Config, must be of type number');
    });

    it('should validate config with valid expiry months range', () => {
      for (let months = 1; months <= 12; months++) {
        const config = {
          preset: Preset.NORMAL,
          expiryMonths: months,
        };

        const { ok, errors } = provider.validateConfig(config);

        expect(ok).toBe(true);
        expect(errors).toHaveLength(0);
      }
    });

    it('should validate config without expiry months (optional)', () => {
      const config = {
        preset: Preset.HIGH_SECURITY,
      };

      const { ok, errors } = provider.validateConfig(config);

      expect(ok).toBe(true);
      expect(errors).toHaveLength(0);
    });
  });
});
