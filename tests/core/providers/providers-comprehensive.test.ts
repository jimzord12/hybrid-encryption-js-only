import { beforeEach, describe, expect, it } from 'vitest';
import { Preset } from '../../../src/core/common/enums';
import { KeyPair } from '../../../src/core/common/interfaces/keys.interfaces';
import { ML_KEM_STATS } from '../../../src/core/encryption/constants/encryption.constants';
import { MlKemKeyProvider } from '../../../src/core/providers';
import { expected, keyPairsToTest } from './test-data';

const mlkem_NORMAL = new MlKemKeyProvider(Preset.NORMAL);
const mlkem_HIGH_SECURITY = new MlKemKeyProvider(Preset.HIGH_SECURITY);

describe('MlKemKeyProvider', () => {
  let validKeyPair_NORMAL: KeyPair;
  let validKeyPair_HIGH_SECURITY: KeyPair;

  beforeEach(() => {
    validKeyPair_NORMAL = mlkem_NORMAL.generateKeyPair();
    validKeyPair_HIGH_SECURITY = mlkem_HIGH_SECURITY.generateKeyPair();
  });

  describe('generateKeyPair', () => {
    it('should generate a valid key pair with default preset', () => {
      const keyPair = mlkem_NORMAL.generateKeyPair();

      expect(keyPair).toBeDefined();
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.secretKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.publicKey).toHaveLength(ML_KEM_STATS.publicKeyLength[Preset.NORMAL]);
      expect(keyPair.secretKey).toHaveLength(ML_KEM_STATS.secretKeyLength[Preset.NORMAL]);
      expect(keyPair.metadata).toBeDefined();
      expect(keyPair.metadata.preset).toBe(Preset.NORMAL);
      expect(keyPair.metadata.version).toBe(1);
      expect(keyPair.metadata.createdAt).toBeInstanceOf(Date);
      expect(keyPair.metadata.expiresAt).toBeInstanceOf(Date);
    });

    it('should generate a valid key pair with HIGH_SECURITY preset', () => {
      const keyPair = mlkem_HIGH_SECURITY.generateKeyPair();

      expect(keyPair.publicKey.length).toBe(ML_KEM_STATS.publicKeyLength[Preset.HIGH_SECURITY]);
      expect(keyPair.secretKey.length).toBe(ML_KEM_STATS.secretKeyLength[Preset.HIGH_SECURITY]);
      expect(keyPair.metadata).toBeDefined();
      expect(keyPair.metadata.preset).toBe(Preset.HIGH_SECURITY);
      expect(keyPair.metadata.version).toBe(1);
      expect(keyPair.metadata.createdAt).toBeInstanceOf(Date);
      expect(keyPair.metadata.expiresAt).toBeInstanceOf(Date);
    });

    it('should generate a valid key pair with NORMAL preset', () => {
      const keyPair = mlkem_NORMAL.generateKeyPair();

      expect(keyPair.metadata.preset).toBe(Preset.NORMAL);
      expect(keyPair.publicKey.length).toBe(1184);
      expect(keyPair.secretKey.length).toBe(2400);
    });

    it('should generate key pair with custom version', () => {
      const keyPair = mlkem_NORMAL.generateKeyPair({ version: 15 });

      expect(keyPair.metadata.version).toBe(15);
    });
  });

  describe('validateKeyPair', () => {
    it('should validate a valid key pair (NORMAL)', () => {
      const result = mlkem_NORMAL.validateKeyPair(validKeyPair_NORMAL);

      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a valid key pair (HIGH_SECURITY)', () => {
      const result = mlkem_HIGH_SECURITY.validateKeyPair(validKeyPair_HIGH_SECURITY);

      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject key pair with missing public key', () => {
      const invalidKeyPair = {
        ...validKeyPair_NORMAL,
        publicKey: null as any,
      };

      const result = mlkem_NORMAL.validateKeyPair(invalidKeyPair);

      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Invalid Public Key, Uint8Array is expected');
    });

    it('should reject key pair with missing secret key', () => {
      const invalidKeyPair = {
        ...validKeyPair_NORMAL,
        secretKey: null as any,
      };

      const result = mlkem_NORMAL.validateKeyPair(invalidKeyPair);

      expect(result.errors).toContain('Invalid Secret Key, Uint8Array is expected');
    });

    it('should reject key pair with non-Uint8Array public key', () => {
      const invalidKeyPair = {
        ...validKeyPair_NORMAL,
        publicKey: 'not-a-uint8array' as any,
      };

      const result = mlkem_NORMAL.validateKeyPair(invalidKeyPair);

      expect(result.errors).toContain('Invalid Public Key, Uint8Array is expected');
    });

    it('should reject key pair with non-Uint8Array secret key', () => {
      const badSecretKey = Buffer.from('buffer-not-uint8array') as any;
      const invalidKeyPair = {
        ...validKeyPair_NORMAL,
        secretKey: badSecretKey,
      };

      const result = mlkem_NORMAL.validateKeyPair(invalidKeyPair);

      const correctSecretKeyLength =
        ML_KEM_STATS.secretKeyLength[validKeyPair_NORMAL.metadata.preset];

      expect(result.errors).toContain(
        `Secret Key Length is=${badSecretKey.length}, should be=${correctSecretKeyLength}`,
      );
    });

    it('should reject NORMAL preset key pair with wrong public key size (NORMAL)', () => {
      const invalidKeyPair = {
        ...validKeyPair_NORMAL,
        publicKey: new Uint8Array(1000), // Wrong size
      };

      const result = mlkem_NORMAL.validateKeyPair(invalidKeyPair);

      expect(result.ok).toBe(false);
      expect(result.errors).toContain(
        `Public Key Length is=${1000}, should be=${ML_KEM_STATS.publicKeyLength[Preset.NORMAL]}`,
      );
    });

    it('should reject NORMAL preset key pair with wrong secret key size (NORMAL)', () => {
      const badSecretKey = new Uint8Array(ML_KEM_STATS.secretKeyLength[Preset.HIGH_SECURITY]); // HIGH_SECURITY size instead of NORMAL
      const invalidKeyPair = {
        ...validKeyPair_NORMAL,
        secretKey: badSecretKey,
      };

      const result = mlkem_NORMAL.validateKeyPair(invalidKeyPair);

      // console.log('Errors: ', result.errors);
      const correctSecretKeyLength = ML_KEM_STATS.secretKeyLength[Preset.NORMAL];

      expect(result.errors).toContain(
        `Secret Key Length is=${badSecretKey.length}, should be=${correctSecretKeyLength}`,
      );
    });

    it('should reject HIGH_SECURITY preset key pair with wrong sizes (HIGH_SECURITY)', () => {
      const badPublicKey = new Uint8Array(ML_KEM_STATS.publicKeyLength[Preset.NORMAL]); // NORMAL size instead of HIGH_SECURITY
      const invalidKeyPair = {
        ...validKeyPair_HIGH_SECURITY,
        publicKey: badPublicKey,
      };

      const result = mlkem_HIGH_SECURITY.validateKeyPair(invalidKeyPair);
      const correctPublicKeyLength = ML_KEM_STATS.publicKeyLength[Preset.HIGH_SECURITY];

      expect(result.ok).toBe(false);
      expect(result.errors).toContain(
        `Public Key Length is=${badPublicKey.length}, should be=${correctPublicKeyLength}`,
      );
    });

    it('should reject key pair with invalid createdAt date', () => {
      const invalidKeyPair = {
        ...validKeyPair_NORMAL,
        metadata: {
          ...validKeyPair_NORMAL.metadata,
          createdAt: null as any,
        },
      };

      const result = mlkem_NORMAL.validateKeyPair(invalidKeyPair);

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

      const result = mlkem_NORMAL.validateKeyPair(invalidKeyPair);

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

      const result = mlkem_NORMAL.validateKeyPair(invalidKeyPair);

      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Invalid version');
    });

    it('should accumulate multiple validation errors', () => {
      expect(keyPairsToTest).toHaveLength(expected.length);

      keyPairsToTest.forEach((kp, idx) => {
        const result = mlkem_NORMAL.validateKeyPair(kp);

        const expectedErrors = expected[idx];

        expect(result.ok).toBe(false);
        expect(result.errors).toHaveLength(expectedErrors.length);

        expectedErrors.forEach((expectedError) => {
          expect(result.errors.some((error: string) => error.includes(expectedError))).toBe(true);
        });
      });
    });
  });

  describe('serializeKeyPair', () => {
    it('should serialize a valid key pair (NORMAL)', () => {
      const serialized = mlkem_NORMAL.serializeKeyPair(validKeyPair_NORMAL);

      expect(serialized.publicKey).toBeTypeOf('string');
      expect(serialized.secretKey).toBeTypeOf('string');
      expect(serialized.metadata.preset).toBe(validKeyPair_NORMAL.metadata.preset);
      expect(serialized.metadata.createdAt).toBe(
        validKeyPair_NORMAL.metadata.createdAt.toISOString(),
      );
      expect(serialized.metadata.expiresAt).toBe(
        validKeyPair_NORMAL.metadata.expiresAt.toISOString(),
      );
      expect(serialized.metadata.version).toBe(validKeyPair_NORMAL.metadata.version);
    });

    it('should serialize a valid key pair (HIGH_SECURITY)', () => {
      const serialized = mlkem_HIGH_SECURITY.serializeKeyPair(validKeyPair_HIGH_SECURITY);

      expect(serialized.publicKey).toBeTypeOf('string');
      expect(serialized.secretKey).toBeTypeOf('string');
      expect(serialized.metadata.preset).toBe(validKeyPair_HIGH_SECURITY.metadata.preset);
      expect(serialized.metadata.createdAt).toBe(
        validKeyPair_HIGH_SECURITY.metadata.createdAt.toISOString(),
      );
      expect(serialized.metadata.expiresAt).toBe(
        validKeyPair_HIGH_SECURITY.metadata.expiresAt.toISOString(),
      );
      expect(serialized.metadata.version).toBe(validKeyPair_HIGH_SECURITY.metadata.version);
    });

    it('should throw error for non-binary keys', () => {
      validKeyPair_NORMAL.publicKey = 'not-binary' as any;

      expect(() => mlkem_NORMAL.serializeKeyPair(validKeyPair_NORMAL)).toThrow(
        'Keys must be in binary format in order to be Serialized',
      );
    });
  });

  describe('deserializeKeyPair', () => {
    it('should deserialize a valid serialized key pair (NORMAL)', () => {
      const serialized = mlkem_NORMAL.serializeKeyPair(validKeyPair_NORMAL);

      const deserialized = mlkem_NORMAL.deserializeKeyPair(serialized);

      expect(deserialized.publicKey).toBeInstanceOf(Uint8Array);
      expect(deserialized.secretKey).toBeInstanceOf(Uint8Array);
      expect(deserialized.publicKey).toEqual(validKeyPair_NORMAL.publicKey);
      expect(deserialized.secretKey).toEqual(validKeyPair_NORMAL.secretKey);
      expect(deserialized.metadata.preset).toBe(validKeyPair_NORMAL.metadata.preset);
      expect(deserialized.metadata.createdAt).toEqual(validKeyPair_NORMAL.metadata.createdAt);
      expect(deserialized.metadata.expiresAt).toEqual(validKeyPair_NORMAL.metadata.expiresAt);
      expect(deserialized.metadata.version).toBe(validKeyPair_NORMAL.metadata.version);
    });

    it('should deserialize a valid serialized key pair (HIGH_SECURITY)', () => {
      const serialized = mlkem_HIGH_SECURITY.serializeKeyPair(validKeyPair_HIGH_SECURITY);

      const deserialized = mlkem_HIGH_SECURITY.deserializeKeyPair(serialized);

      expect(deserialized.publicKey).toBeInstanceOf(Uint8Array);
      expect(deserialized.secretKey).toBeInstanceOf(Uint8Array);
      expect(deserialized.publicKey).toEqual(validKeyPair_HIGH_SECURITY.publicKey);
      expect(deserialized.secretKey).toEqual(validKeyPair_HIGH_SECURITY.secretKey);
      expect(deserialized.metadata.preset).toBe(validKeyPair_HIGH_SECURITY.metadata.preset);
      expect(deserialized.metadata.createdAt).toEqual(
        validKeyPair_HIGH_SECURITY.metadata.createdAt,
      );
      expect(deserialized.metadata.expiresAt).toEqual(
        validKeyPair_HIGH_SECURITY.metadata.expiresAt,
      );
      expect(deserialized.metadata.version).toBe(validKeyPair_HIGH_SECURITY.metadata.version);
    });

    it('should handle round-trip serialization/deserialization (NORMAL)', () => {
      const serialized = mlkem_NORMAL.serializeKeyPair(validKeyPair_NORMAL);
      const deserialized = mlkem_NORMAL.deserializeKeyPair(serialized);

      // Validate the deserialized key pair
      const validation = mlkem_NORMAL.validateKeyPair(deserialized);
      expect(validation.ok).toBe(true);
    });

    it('should handle round-trip serialization/deserialization (HIGH_SECURITY)', () => {
      const serialized = mlkem_HIGH_SECURITY.serializeKeyPair(validKeyPair_HIGH_SECURITY);
      const deserialized = mlkem_HIGH_SECURITY.deserializeKeyPair(serialized);

      // Validate the deserialized key pair
      const validation = mlkem_HIGH_SECURITY.validateKeyPair(deserialized);
      expect(validation.ok).toBe(true);
    });
  });
});
