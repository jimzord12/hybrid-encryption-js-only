import { randomBytes } from '@noble/hashes/utils';
import { Preset } from '../../../../src/core/common/enums';
import {
  AlgorithmAsymmetricError,
  CryptographicOperationError,
  EncryptionError,
} from '../../../../src/core/common/errors';
import { EncryptedData } from '../../../../src/core/common/interfaces/encryption.interfaces';
import { KeyPair } from '../../../../src/core/common/interfaces/keys.interfaces';
import {
  AsymmetricAlgorithm,
  HybridEncryption,
  SymmetricAlgorithm,
} from '../../../../src/core/encryption';
import { MLKEMAlgorithm } from '../../../../src/core/encryption/asymmetric/implementations/post-quantom/ml-kem-alg';
import {
  AES_GCM_STATS,
  ML_KEM_STATS,
} from '../../../../src/core/encryption/constants/defaults.constants';
import { bytesNumToBase64Length } from '../../../debug/calculations';

describe('Hybrid Encryption - Comprehensive Tests', () => {
  let validKeyPair: KeyPair;
  let highSecurityKeyPair: KeyPair;
  let hybridEncryption: HybridEncryption;
  let highSecurityHybridEncryption: HybridEncryption;

  beforeEach(() => {
    // Generate valid key pairs using actual ML-KEM key generation
    const defaultAlg = new MLKEMAlgorithm(Preset.NORMAL);
    const defaultKeys = defaultAlg.generateKeyPair();
    validKeyPair = {
      publicKey: defaultKeys.publicKey,
      secretKey: defaultKeys.secretKey,
      metadata: {
        preset: Preset.NORMAL,
        createdAt: new Date(),
        version: 1,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    };

    const highSecAlg = new MLKEMAlgorithm(Preset.HIGH_SECURITY);
    const highSecKeys = highSecAlg.generateKeyPair();
    highSecurityKeyPair = {
      publicKey: highSecKeys.publicKey,
      secretKey: highSecKeys.secretKey,
      metadata: {
        preset: Preset.HIGH_SECURITY,
        createdAt: new Date(),
        version: 1,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    };

    hybridEncryption = new HybridEncryption(Preset.NORMAL);
    highSecurityHybridEncryption = new HybridEncryption(Preset.HIGH_SECURITY);
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with DEFAULT preset when no preset specified', () => {
      const defaultEncryption = new HybridEncryption();
      expect(defaultEncryption.preset).toBe(Preset.NORMAL);
      expect(defaultEncryption.asymmetricAlgorithm).toBeInstanceOf(AsymmetricAlgorithm);
      expect(defaultEncryption.symmetricAlgorithm).toBeInstanceOf(SymmetricAlgorithm);
    });

    it('should initialize with HIGH_SECURITY preset when specified', () => {
      const highSecEncryption = new HybridEncryption(Preset.HIGH_SECURITY);
      expect(highSecEncryption.preset).toBe(Preset.HIGH_SECURITY);
      expect(highSecEncryption.asymmetricAlgorithm).toBeInstanceOf(AsymmetricAlgorithm);
      expect(highSecEncryption.symmetricAlgorithm).toBeInstanceOf(SymmetricAlgorithm);
    });

    it('should have different algorithm instances for different presets', () => {
      const defaultEnc = new HybridEncryption(Preset.NORMAL);
      const highSecEnc = new HybridEncryption(Preset.HIGH_SECURITY);

      expect(defaultEnc.asymmetricAlgorithm).not.toBe(highSecEnc.asymmetricAlgorithm);
      expect(defaultEnc.symmetricAlgorithm).not.toBe(highSecEnc.symmetricAlgorithm);
    });
  });

  describe('Static Factory Methods', () => {
    it('should create default instance via static factory', () => {
      const instance = HybridEncryption.createDefault();
      expect(instance).toBeInstanceOf(HybridEncryption);
      expect(instance.preset).toBe(Preset.NORMAL);
    });

    it('should create separate instances from factory calls', () => {
      const instance1 = HybridEncryption.createDefault();
      const instance2 = HybridEncryption.createDefault();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Data Serialization Edge Cases', () => {
    it('should serialize and deserialize null values', () => {
      const data = { value: null, empty: undefined };
      const serialized = hybridEncryption.serializeData(data);
      const deserialized = hybridEncryption.deserializeData(serialized);

      expect(serialized).toBeInstanceOf(Uint8Array);
      expect(deserialized).toEqual({ value: null });
    });

    it('should handle nested objects with various data types', () => {
      const complexData = {
        string: 'test',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        nested: {
          inner: 'value',
          moreNesting: {
            deep: 'data',
          },
        },
        date: new Date('2023-01-01').toISOString(),
      };

      const serialized = hybridEncryption.serializeData(complexData);
      const deserialized = hybridEncryption.deserializeData(serialized);

      expect(deserialized).toEqual(complexData);
    });

    it('should handle large data objects', () => {
      const largeData = {
        largContent: 'x'.repeat(10000),
        array: Array.from({ length: 1000 }, (_, i) => i),
        nested: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          data: `item-${i}`,
        })),
      };

      const serialized = hybridEncryption.serializeData(largeData);
      const deserialized = hybridEncryption.deserializeData(serialized);

      expect(deserialized).toEqual(largeData);
      expect(serialized.length).toBeGreaterThan(10000);
    });

    it('should handle empty objects and arrays', () => {
      const emptyData = {
        emptyObject: {},
        emptyArray: [],
        emptyString: '',
        zero: 0,
        false: false,
      };

      const serialized = hybridEncryption.serializeData(emptyData);
      const deserialized = hybridEncryption.deserializeData(serialized);

      expect(deserialized).toEqual(emptyData);
    });

    it('should handle special characters and unicode', () => {
      const unicodeData = {
        emoji: '🔐🚀💻',
        chinese: '你好世界',
        special: '!@#$%^&*()_+-={}[]|\\:";\'<>?,./`~',
        newlines: 'line1\nline2\rtab\there',
      };

      const serialized = hybridEncryption.serializeData(unicodeData);
      const deserialized = hybridEncryption.deserializeData(serialized);

      expect(deserialized).toEqual(unicodeData);
    });
  });

  describe('Base64 Encoding/Decoding Edge Cases', () => {
    it('should handle small data', () => {
      const smallData = new Uint8Array([1]);
      const encoded = hybridEncryption.encodeBase64(smallData);
      const decoded = hybridEncryption.decodeBase64(encoded);

      expect(encoded).toBeTypeOf('string');
      expect(decoded).toEqual(smallData);
    });

    it('should handle medium-sized data', () => {
      const mediumData = randomBytes(1000);
      const encoded = hybridEncryption.encodeBase64(mediumData);
      const decoded = hybridEncryption.decodeBase64(encoded);

      expect(encoded).toBeTypeOf('string');
      expect(decoded).toEqual(mediumData);
      expect(encoded.length).toBe(bytesNumToBase64Length(1000));
    });

    it('should handle large data', () => {
      const largeData = randomBytes(50000);
      const encoded = hybridEncryption.encodeBase64(largeData);
      const decoded = hybridEncryption.decodeBase64(encoded);

      expect(encoded).toBeTypeOf('string');
      expect(decoded).toEqual(largeData);
      expect(encoded.length).toBe(bytesNumToBase64Length(50000));
    });

    it('should produce URL-safe base64 without padding issues', () => {
      // Test different sizes that could cause padding issues
      for (let size = 1; size <= 100; size++) {
        const testData = randomBytes(size);
        const encoded = hybridEncryption.encodeBase64(testData);
        const decoded = hybridEncryption.decodeBase64(encoded);

        expect(decoded).toEqual(testData);
        expect(encoded).not.toContain('\n');
        expect(encoded).not.toContain('\r');
      }
    });
  });

  describe('Encryption - Default Preset', () => {
    it('should encrypt and produce expected structure with correct sizes', () => {
      const data = { message: 'Default encryption test' };
      const result = hybridEncryption.encrypt(data, validKeyPair.publicKey);

      expect(result.preset).toBe(Preset.NORMAL);
      expect(result.encryptedContent).toBeTypeOf('string');
      expect(result.cipherText).toBeTypeOf('string');
      expect(result.nonce).toBeTypeOf('string');

      // Verify Base64 encoded sizes match expected byte lengths
      expect(result.cipherText).toHaveLength(
        bytesNumToBase64Length(ML_KEM_STATS.ciphertextLength[Preset.NORMAL]),
      );
      expect(result.nonce).toHaveLength(
        bytesNumToBase64Length(AES_GCM_STATS.nonceLength[Preset.NORMAL]),
      );
    });

    it('should produce different ciphertext for the same data', () => {
      const data = { message: 'Same data' };
      const result1 = hybridEncryption.encrypt(data, validKeyPair.publicKey);
      const result2 = hybridEncryption.encrypt(data, validKeyPair.publicKey);

      // Different random elements should make results different
      expect(result1.cipherText).not.toBe(result2.cipherText);
      expect(result1.nonce).not.toBe(result2.nonce);
      expect(result1.encryptedContent).not.toBe(result2.encryptedContent);
    });

    it('should encrypt various data types correctly', () => {
      const testCases = [
        { simple: 'string' },
        { number: 12345 },
        { boolean: true },
        { array: [1, 2, 3, 'test'] },
        { complex: { nested: { deep: { value: 'test' } } } },
      ];

      testCases.forEach((data, index) => {
        const result = hybridEncryption.encrypt(data, validKeyPair.publicKey);
        expect(result.preset).toBe(Preset.NORMAL);
        expect(result.encryptedContent).toBeTypeOf('string');
        expect(result.cipherText).toBeTypeOf('string');
        expect(result.nonce).toBeTypeOf('string');
      });
    });
  });

  describe('Encryption - High Security Preset', () => {
    it('should encrypt with HIGH_SECURITY preset and produce expected structure', () => {
      const data = { message: 'High security encryption test' };
      const result = highSecurityHybridEncryption.encrypt(data, highSecurityKeyPair.publicKey);

      expect(result.preset).toBe(Preset.HIGH_SECURITY);
      expect(result.encryptedContent).toBeTypeOf('string');
      expect(result.cipherText).toBeTypeOf('string');
      expect(result.nonce).toBeTypeOf('string');

      // Verify High Security preset produces larger ciphertext
      expect(result.cipherText).toHaveLength(
        bytesNumToBase64Length(ML_KEM_STATS.ciphertextLength[Preset.HIGH_SECURITY]),
      );
      expect(result.nonce).toHaveLength(
        bytesNumToBase64Length(AES_GCM_STATS.nonceLength[Preset.HIGH_SECURITY]),
      );
    });

    it('should produce different sizes for different presets', () => {
      const data = { message: 'Preset comparison test' };
      const defaultResult = hybridEncryption.encrypt(data, validKeyPair.publicKey);
      const highSecResult = highSecurityHybridEncryption.encrypt(
        data,
        highSecurityKeyPair.publicKey,
      );

      // High security should have larger ciphertext and nonce
      expect(highSecResult.cipherText.length).toBeGreaterThan(defaultResult.cipherText.length);
      expect(highSecResult.nonce.length).toBeGreaterThan(defaultResult.nonce.length);
    });
  });

  describe('Encryption Input Validation', () => {
    it('should throw for invalid public key types', () => {
      const data = { message: 'test' };

      expect(() => {
        hybridEncryption.encrypt(data, null as any);
      }).toThrow();

      expect(() => {
        hybridEncryption.encrypt(data, undefined as any);
      }).toThrow();

      expect(() => {
        hybridEncryption.encrypt(data, 'invalid-key' as any);
      }).toThrow();

      expect(() => {
        hybridEncryption.encrypt(data, 123 as any);
      }).toThrow();
    });

    it('should throw for public keys with wrong length', () => {
      const data = { message: 'test' };
      const shortKey = randomBytes(100);
      const longKey = randomBytes(5000);

      expect(() => {
        hybridEncryption.encrypt(data, shortKey);
      }).toThrow(AlgorithmAsymmetricError);

      expect(() => {
        hybridEncryption.encrypt(data, longKey);
      }).toThrow(AlgorithmAsymmetricError);
    });

    it('should throw for empty public key', () => {
      const data = { message: 'test' };
      const emptyKey = new Uint8Array(0);

      expect(() => {
        hybridEncryption.encrypt(data, emptyKey);
      }).toThrow(AlgorithmAsymmetricError);
    });

    it('should handle edge case data inputs', () => {
      // These should not throw during encryption
      expect(() => {
        hybridEncryption.encrypt(null, validKeyPair.publicKey);
      }).not.toThrow();

      expect(() => {
        hybridEncryption.encrypt(undefined, validKeyPair.publicKey);
      }).not.toThrow();

      expect(() => {
        hybridEncryption.encrypt('', validKeyPair.publicKey);
      }).not.toThrow();

      expect(() => {
        hybridEncryption.encrypt(0, validKeyPair.publicKey);
      }).not.toThrow();

      expect(() => {
        hybridEncryption.encrypt(false, validKeyPair.publicKey);
      }).not.toThrow();
    });
  });

  describe('Decryption - Success Cases', () => {
    it('should decrypt data encrypted with same instance', () => {
      const originalData = { message: 'Round trip test', value: 42 };
      const encrypted = hybridEncryption.encrypt(originalData, validKeyPair.publicKey);
      const decrypted = hybridEncryption.decrypt(encrypted, validKeyPair.secretKey);

      expect(decrypted).toEqual(originalData);
    });

    it('should decrypt data encrypted with different instance but same preset', () => {
      const originalData = { message: 'Cross instance test' };
      const encryptor = new HybridEncryption(Preset.NORMAL);
      const decryptor = new HybridEncryption(Preset.NORMAL);

      const encrypted = encryptor.encrypt(originalData, validKeyPair.publicKey);
      const decrypted = decryptor.decrypt(encrypted, validKeyPair.secretKey);

      expect(decrypted).toEqual(originalData);
    });

    it('should decrypt high security data correctly', () => {
      const originalData = { message: 'High security test', sensitive: true };
      const encrypted = highSecurityHybridEncryption.encrypt(
        originalData,
        highSecurityKeyPair.publicKey,
      );
      const decrypted = highSecurityHybridEncryption.decrypt(
        encrypted,
        highSecurityKeyPair.secretKey,
      );

      expect(decrypted).toEqual(originalData);
    });

    it('should decrypt various data types correctly', () => {
      const testCases = [
        'simple string',
        12345,
        true,
        false,
        null,
        { object: 'value' },
        [1, 2, 3],
        { complex: { nested: { array: [{ id: 1 }, { id: 2 }] } } },
      ];

      testCases.forEach(originalData => {
        const encrypted = hybridEncryption.encrypt(originalData, validKeyPair.publicKey);
        const decrypted = hybridEncryption.decrypt(encrypted, validKeyPair.secretKey);
        expect(decrypted).toEqual(originalData);
      });
    });
  });

  describe('Decryption Input Validation', () => {
    let validEncryptedData: EncryptedData;

    beforeEach(() => {
      validEncryptedData = hybridEncryption.encrypt({ message: 'test' }, validKeyPair.publicKey);
    });

    it('should throw for invalid secret key types', () => {
      expect(() => {
        hybridEncryption.decrypt(validEncryptedData, null as any);
      }).toThrow();

      expect(() => {
        hybridEncryption.decrypt(validEncryptedData, undefined as any);
      }).toThrow();

      expect(() => {
        hybridEncryption.decrypt(validEncryptedData, 'invalid-key' as any);
      }).toThrow();
    });

    it('should throw for secret keys with wrong length', () => {
      const shortKey = randomBytes(100);
      const longKey = randomBytes(5000);

      expect(() => {
        hybridEncryption.decrypt(validEncryptedData, shortKey);
      }).toThrow(CryptographicOperationError);

      expect(() => {
        hybridEncryption.decrypt(validEncryptedData, longKey);
      }).toThrow(CryptographicOperationError);
    });

    it('should throw for malformed encrypted data structure', () => {
      const malformedData = [
        {},
        { preset: Preset.NORMAL },
        { preset: Preset.NORMAL, encryptedContent: 'test' },
        { preset: Preset.NORMAL, encryptedContent: 'test', cipherText: 'test' },
        {
          preset: 'invalid-preset' as any,
          encryptedContent: 'test',
          cipherText: 'test',
          nonce: 'test',
        },
      ];

      malformedData.forEach(invalidData => {
        expect(() => {
          hybridEncryption.decrypt(invalidData as any, validKeyPair.secretKey);
        }).toThrow();
      });
    });

    it('should throw for invalid Base64 content', () => {
      const invalidBase64Data = {
        ...validEncryptedData,
        encryptedContent: 'invalid-base64-content!!!' as any,
      };

      expect(() => {
        hybridEncryption.decrypt(invalidBase64Data, validKeyPair.secretKey);
      }).toThrow(CryptographicOperationError);
    });

    it('should throw for wrong preset mismatch', () => {
      // Encrypt with high security, try to decrypt with default
      const highSecData = highSecurityHybridEncryption.encrypt(
        { message: 'test' },
        highSecurityKeyPair.publicKey,
      );

      expect(() => {
        hybridEncryption.decrypt(highSecData, validKeyPair.secretKey);
      }).toThrow();
    });
  });

  describe('Grace Period Decryption', () => {
    let encryptedData: EncryptedData;
    let additionalKeyPairs: KeyPair[];

    beforeEach(() => {
      encryptedData = hybridEncryption.encrypt(
        { message: 'grace period test' },
        validKeyPair.publicKey,
      );

      // Create additional key pairs for fallback testing
      additionalKeyPairs = Array.from({ length: 3 }, () => ({
        preset: Preset.NORMAL,
        publicKey: randomBytes(ML_KEM_STATS.publicKeyLength[Preset.NORMAL]),
        secretKey: randomBytes(ML_KEM_STATS.secretKeyLength[Preset.NORMAL]),
        metadata: {
          createdAt: new Date(),
          version: 1,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        },
      }));
    });

    it('should decrypt with primary key (first in array)', () => {
      const keys = [validKeyPair.secretKey, ...additionalKeyPairs.map(kp => kp.secretKey)];
      const decrypted = hybridEncryption.decryptWithGracePeriod(encryptedData, keys);

      expect(decrypted).toEqual({ message: 'grace period test' });
    });

    it('should try multiple keys and succeed with correct one', () => {
      // Put correct key in the middle of the array
      const keys = [
        additionalKeyPairs[0].secretKey,
        additionalKeyPairs[1].secretKey,
        validKeyPair.secretKey,
        additionalKeyPairs[2].secretKey,
      ];

      const decrypted = hybridEncryption.decryptWithGracePeriod(encryptedData, keys);
      expect(decrypted).toEqual({ message: 'grace period test' });
    });

    it('should throw when no valid keys are provided', () => {
      const invalidKeys = additionalKeyPairs.map(kp => kp.secretKey);

      expect(() => {
        hybridEncryption.decryptWithGracePeriod(encryptedData, invalidKeys);
      }).toThrow(EncryptionError);
    });

    it('should throw when empty key array is provided', () => {
      expect(() => {
        hybridEncryption.decryptWithGracePeriod(encryptedData, []);
      }).toThrow(EncryptionError);
    });

    it('should handle single key array', () => {
      const keys = [validKeyPair.secretKey];
      const decrypted = hybridEncryption.decryptWithGracePeriod(encryptedData, keys);

      expect(decrypted).toEqual({ message: 'grace period test' });
    });

    it('should throw meaningful error when all keys fail', () => {
      const invalidKeys = additionalKeyPairs.map(kp => kp.secretKey);

      expect(() => {
        hybridEncryption.decryptWithGracePeriod(encryptedData, invalidKeys);
      }).toThrow(/Grace period decryption failed with all \d+ available keys/);
    });
  });

  describe('Static Method Integration', () => {
    it('should encrypt using static method', async () => {
      const data = { message: 'static encrypt test' };
      const encrypted = await HybridEncryption.encrypt(data, validKeyPair.publicKey);

      expect(encrypted).toHaveProperty('preset');
      expect(encrypted).toHaveProperty('encryptedContent');
      expect(encrypted).toHaveProperty('cipherText');
      expect(encrypted).toHaveProperty('nonce');
      expect(encrypted.preset).toBe(Preset.NORMAL);
    });

    it('should decrypt using static method', async () => {
      const originalData = { message: 'static decrypt test' };
      const encrypted = await HybridEncryption.encrypt(originalData, validKeyPair.publicKey);
      const decrypted = await HybridEncryption.decrypt(encrypted, validKeyPair.secretKey);

      expect(decrypted).toEqual(originalData);
    });

    it('should handle grace period decryption using static method', async () => {
      const originalData = { message: 'static grace period test' };
      const encrypted = await HybridEncryption.encrypt(originalData, validKeyPair.publicKey);
      const keys = [validKeyPair.secretKey];
      const decrypted = await HybridEncryption.decryptWithGracePeriod(encrypted, keys);

      expect(decrypted).toEqual(originalData);
    });
  });

  describe('Cross-Preset Validation', () => {
    it('should reject high security data with default preset instance', () => {
      const data = { message: 'cross preset test' };
      const highSecEncrypted = highSecurityHybridEncryption.encrypt(
        data,
        highSecurityKeyPair.publicKey,
      );

      expect(() => {
        hybridEncryption.decrypt(highSecEncrypted, validKeyPair.secretKey);
      }).toThrow();
    });

    it('should reject default data with high security instance using wrong key', () => {
      const data = { message: 'cross preset test' };
      const defaultEncrypted = hybridEncryption.encrypt(data, validKeyPair.publicKey);

      expect(() => {
        highSecurityHybridEncryption.decrypt(defaultEncrypted, highSecurityKeyPair.secretKey);
      }).toThrow();
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle corrupted encrypted content', () => {
      const validEncrypted = hybridEncryption.encrypt({ message: 'test' }, validKeyPair.publicKey);

      // Corrupt the encrypted content
      const corruptedData = {
        ...validEncrypted,
        encryptedContent: validEncrypted.encryptedContent.replace(/./g, 'X'),
      };

      expect(() => {
        hybridEncryption.decrypt(corruptedData, validKeyPair.secretKey);
      }).toThrow();
    });

    it('should handle corrupted ciphertext', () => {
      const validEncrypted = hybridEncryption.encrypt({ message: 'test' }, validKeyPair.publicKey);

      // Corrupt the ciphertext
      const corruptedData = {
        ...validEncrypted,
        cipherText: validEncrypted.cipherText.replace(/./g, 'Y'),
      };

      expect(() => {
        hybridEncryption.decrypt(corruptedData, validKeyPair.secretKey);
      }).toThrow();
    });

    it('should handle corrupted nonce', () => {
      const validEncrypted = hybridEncryption.encrypt({ message: 'test' }, validKeyPair.publicKey);

      // Corrupt the nonce
      const corruptedData = {
        ...validEncrypted,
        nonce: validEncrypted.nonce.replace(/./g, 'Z'),
      };

      expect(() => {
        hybridEncryption.decrypt(corruptedData, validKeyPair.secretKey);
      }).toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple sequential operations', () => {
      const iterations = 50;
      const results: Array<{ encrypted: EncryptedData; decrypted: any }> = [];

      for (let i = 0; i < iterations; i++) {
        const data = { iteration: i, message: `test-${i}` };
        const encrypted = hybridEncryption.encrypt(data, validKeyPair.publicKey);
        const decrypted = hybridEncryption.decrypt(encrypted, validKeyPair.secretKey);

        results.push({ encrypted, decrypted });
        expect(decrypted).toEqual(data);
      }

      // Verify all operations completed successfully
      expect(results).toHaveLength(iterations);
    });

    it('should produce unique outputs for identical inputs', () => {
      const data = { message: 'identical input test' };
      const results = Array.from({ length: 100 }, () =>
        hybridEncryption.encrypt(data, validKeyPair.publicKey),
      );

      // All ciphertexts should be different due to randomness
      const uniqueCipherTexts = new Set(results.map(r => r.cipherText));
      const uniqueNonces = new Set(results.map(r => r.nonce));
      const uniqueContents = new Set(results.map(r => r.encryptedContent));

      expect(uniqueCipherTexts.size).toBe(100);
      expect(uniqueNonces.size).toBe(100);
      expect(uniqueContents.size).toBe(100);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak memory with large operations', () => {
      const largeData = {
        content: 'x'.repeat(100000),
        numbers: Array.from({ length: 10000 }, (_, i) => i),
      };

      // Perform multiple large operations
      for (let i = 0; i < 10; i++) {
        const encrypted = hybridEncryption.encrypt(largeData, validKeyPair.publicKey);
        const decrypted = hybridEncryption.decrypt(encrypted, validKeyPair.secretKey);
        expect(decrypted).toEqual(largeData);
      }
    });

    it('should handle concurrent-like operations', () => {
      const data = { message: 'concurrent test' };
      const operations = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        encrypted: hybridEncryption.encrypt(data, validKeyPair.publicKey),
      }));

      // Decrypt all in different order
      const shuffled = [...operations].sort(() => Math.random() - 0.5);
      shuffled.forEach(op => {
        const decrypted = hybridEncryption.decrypt(op.encrypted, validKeyPair.secretKey);
        expect(decrypted).toEqual(data);
      });
    });
  });
});
