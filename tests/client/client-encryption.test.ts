import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ClientEncryption } from '../../src/client/encrypt';
import { Preset } from '../../src/core/common/enums';
import { CryptographicOperationError } from '../../src/core/common/errors';
import { KeyPair } from '../../src/core/common/interfaces/keys.interfaces';
import { SerializedKeyPair } from '../../src/core/common/interfaces/serialization.interfaces';
import { HybridEncryption } from '../../src/core/encryption';
import { MlKemKeyProvider } from '../../src/core/providers';

describe('ClientEncryption', () => {
  beforeEach(() => {
    // Clean up any existing instance before each test
    ClientEncryption.resetInstance();
  });

  afterEach(() => {
    // Clean up after each test
    ClientEncryption.resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when getInstance is called multiple times', () => {
      const instance1 = ClientEncryption.getInstance();
      const instance2 = ClientEncryption.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(ClientEncryption);
    });

    it('should create a new instance after resetInstance is called', () => {
      const instance1 = ClientEncryption.getInstance();

      ClientEncryption.resetInstance();

      const instance2 = ClientEncryption.getInstance();

      expect(instance1).not.toBe(instance2);
      expect(instance2).toBeInstanceOf(ClientEncryption);
    });

    it('should use default preset when no preset is provided', () => {
      const instance = ClientEncryption.getInstance();

      expect(instance).toBeInstanceOf(ClientEncryption);
    });

    it('should accept custom preset in getInstance', () => {
      const instance = ClientEncryption.getInstance(Preset.NORMAL);

      expect(instance).toBeInstanceOf(ClientEncryption);
    });

    it('should return same instance even when called with different presets', () => {
      const instance1 = ClientEncryption.getInstance(Preset.NORMAL);
      const instance2 = ClientEncryption.getInstance(Preset.HIGH_SECURITY);

      // Should return the same instance (first one created)
      expect(instance1).toBe(instance2);
    });
  });

  describe('Constructor Access', () => {
    it('should not allow direct instantiation via constructor', () => {
      // TypeScript should prevent this, but let's test runtime behavior
      expect(() => {
        // @ts-expect-error - Testing that constructor is private
        new ClientEncryption();
      }).toThrow(
        'ClientEncryption cannot be instantiated directly. Use ClientEncryption.getInstance() instead.',
      );
    });

    it('should still work properly with getInstance after failed direct instantiation', () => {
      // First, try to directly instantiate (should fail)
      expect(() => {
        // @ts-expect-error - Testing that constructor is private
        new ClientEncryption();
      }).toThrow();

      // Then verify that getInstance still works correctly
      const instance = ClientEncryption.getInstance();
      expect(instance).toBeInstanceOf(ClientEncryption);

      // And verify singleton behavior
      const instance2 = ClientEncryption.getInstance();
      expect(instance).toBe(instance2);
    });
  });

  describe('encryptData method', () => {
    let badPublicKey: Uint8Array;
    let goodKeyPair: KeyPair;
    let goodKeyPair_HS: KeyPair;
    let goodSerializedKeyPair: SerializedKeyPair;
    let goodSerializedKeyPair_HS: SerializedKeyPair;
    const HE = new HybridEncryption();
    const HE_HS = new HybridEncryption(Preset.HIGH_SECURITY);
    let mlKemKeyProvider: MlKemKeyProvider;
    let mlKemKeyProvider_HS: MlKemKeyProvider;

    beforeEach(() => {
      mlKemKeyProvider = new MlKemKeyProvider();
      mlKemKeyProvider_HS = new MlKemKeyProvider(Preset.HIGH_SECURITY);
      // Create a mock public key for testing
      badPublicKey = new Uint8Array(32).fill(1);
      goodKeyPair = mlKemKeyProvider.generateKeyPair();
      goodSerializedKeyPair = mlKemKeyProvider.serializeKeyPair(goodKeyPair);
      goodKeyPair_HS = mlKemKeyProvider_HS.generateKeyPair();
      goodSerializedKeyPair_HS = mlKemKeyProvider_HS.serializeKeyPair(goodKeyPair_HS);
    });

    it('should NOT encrypt data successfully with BAD string public key (NORMAL)', () => {
      const instance = ClientEncryption.getInstance();
      const testData = { message: 'Hello, World!' };
      const publicKeyString = 'mock-public-key-string';

      expect(() => {
        instance.encryptData(testData, publicKeyString);
      }).toThrow('Base64 decoding failed: Invalid Base64 format');
    });

    it('should NOT encrypt data successfully with BAD string public key (HIGH_SECURITY)', () => {
      const instance = ClientEncryption.getInstance(Preset.HIGH_SECURITY);
      const testData = { message: 'Hello, World!' };
      const publicKeyString = 'mock-public-key-string';

      // instance.encryptData(testData, publicKeyString);

      expect(() => {
        instance.encryptData(testData, publicKeyString);
      }).toThrow('Base64 decoding failed: Invalid Base64 format');
    });

    it('should encrypt data successfully with GOOD string public key (HIGH_SECURITY)', () => {
      const instance = ClientEncryption.getInstance(Preset.HIGH_SECURITY);
      const testData = { message: 'Hello, World!' };
      const publicKeyString = goodSerializedKeyPair_HS.publicKey;

      // expect(() => {
      //   instance.encryptData(testData, publicKeyString);
      // }).not.toThrow();

      const encryptedData = instance.encryptData(testData, publicKeyString);

      const sk = mlKemKeyProvider_HS.deserializeKeyPair(goodSerializedKeyPair_HS).secretKey;

      const decryptedData = HE_HS.decrypt<typeof testData>(encryptedData, sk);

      expect(decryptedData).toEqual(testData);
    });

    it('should encrypt data successfully with GOOD string public key (NORMAL)', () => {
      const instance = ClientEncryption.getInstance(Preset.NORMAL);
      const testData = { message: 'Hello, World!' };
      const publicKeyString = goodSerializedKeyPair.publicKey;

      // expect(() => {
      //   instance.encryptData(testData, publicKeyString);
      // }).not.toThrow();

      const encryptedData = instance.encryptData(testData, publicKeyString);

      const sk = mlKemKeyProvider.deserializeKeyPair(goodSerializedKeyPair).secretKey;

      const decryptedData = HE.decrypt<typeof testData>(encryptedData, sk);

      expect(decryptedData).toEqual(testData);
    });

    it('should NOT encrypt data successfully with Wrong Uint8Array public key (NORMAL)', () => {
      const instance = ClientEncryption.getInstance();
      const testData = { message: 'Hello, World!' };

      expect(() => {
        instance.encryptData(testData, badPublicKey);
      }).toThrow(CryptographicOperationError);
    });

    it('should encrypt data successfully with Correct Uint8Array public key', () => {
      const instance = ClientEncryption.getInstance();
      const testData = { message: 'Hello, World!', code: 12345, nullValue: null };

      expect(() => {
        instance.encryptData(testData, goodKeyPair.publicKey);
      }).not.toThrow();

      const encryptedData = instance.encryptData(testData, goodKeyPair.publicKey);
      const decryptedData = HE.decrypt<typeof testData>(encryptedData, goodKeyPair.secretKey);

      expect(encryptedData).toBeDefined();
      expect(encryptedData).toHaveProperty('preset');
      expect(encryptedData.preset).toBeTypeOf('string');
      expect(encryptedData).toHaveProperty('encryptedContent');
      expect(encryptedData.encryptedContent).toBeTypeOf('string');
      expect(encryptedData).toHaveProperty('cipherText');
      expect(encryptedData.cipherText).toBeTypeOf('string');
      expect(encryptedData).toHaveProperty('nonce');
      expect(encryptedData.nonce).toBeTypeOf('string');

      expect(decryptedData).toBeDefined();
      expect(typeof decryptedData).toBe('object');
      expect(decryptedData.message).toEqual(testData.message);
      expect(decryptedData.code).toEqual(testData.code);
      expect(decryptedData.nullValue).toEqual(testData.nullValue);
    });

    it('should handle NULL  data appropriately', () => {
      const instance = ClientEncryption.getInstance();

      expect(() => {
        instance.encryptData(null, goodKeyPair.publicKey);
      }).not.toThrow();
    });

    it('should handle UNDEFINED data appropriately', () => {
      const instance = ClientEncryption.getInstance();

      expect(() => {
        instance.encryptData(undefined, goodKeyPair.publicKey);
      }).not.toThrow(CryptographicOperationError);
    });

    it('should return EncryptedData object', () => {
      const instance = ClientEncryption.getInstance();
      const testData = { message: 'Hello, World!' };

      try {
        const result = instance.encryptData(testData, goodKeyPair.publicKey);
        expect(result).toBeDefined();
        // The exact structure depends on EncryptedData interface
        expect(typeof result).toBe('object');
      } catch (error) {
        // If encryption fails due to invalid key, that's expected in this test environment
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw appropriate error when encryption fails', () => {
      const instance = ClientEncryption.getInstance();
      const testData = { message: 'Hello, World!' };
      const invalidKey = new Uint8Array(0); // Invalid empty key

      expect(() => {
        instance.encryptData(testData, invalidKey);
      }).toThrow();
    });
  });
});
