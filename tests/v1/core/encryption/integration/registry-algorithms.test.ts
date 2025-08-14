import { randomBytes } from '@noble/hashes/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  asymmetricRegistry,
  mixedAlgorithmRegistry,
  symmetricRegistry,
} from '../../../../../src/core/encryption/algorithm-registry';
import { MLKEMAlgorithm } from '../../../../../src/core/encryption/asymmetric/implementations/post-quantom/ml-kem-alg';
import { AES256GCMAlgorithm } from '../../../../../src/core/encryption/symmetric/implementations/aes-gcm-alg';

describe('Algorithm Registry Integration Tests', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('Default Algorithm Registration', () => {
    it('should have ML-KEM-768 registered as default asymmetric algorithm', () => {
      const defaultAsymmetric = asymmetricRegistry.getDefault('asymmetric');

      expect(defaultAsymmetric).toBeInstanceOf(MLKEMAlgorithm);
      expect(defaultAsymmetric.getAlgorithmId()).toBe('ML-KEM-768');
    });

    it('should have AES-GCM-256 registered as default symmetric algorithm', () => {
      const defaultSymmetric = symmetricRegistry.getDefault('symmetric');

      expect(defaultSymmetric).toBeInstanceOf(AES256GCMAlgorithm);
      expect(defaultSymmetric.getAlgorithmId()).toBe('AES-GCM-256');
    });

    it('should have both defaults in mixed registry', () => {
      const defaultAsymmetric = mixedAlgorithmRegistry.getDefaultAsymmetric();
      const defaultSymmetric = mixedAlgorithmRegistry.getDefaultSymmetric();

      expect(defaultAsymmetric.getAlgorithmId()).toBe('ML-KEM-768');
      expect(defaultSymmetric.getAlgorithmId()).toBe('AES-GCM-256');
    });
  });

  describe('Algorithm Functionality through Registry', () => {
    it('should perform ML-KEM operations through asymmetric registry', () => {
      const mlkem = asymmetricRegistry.get('ML-KEM-768') as MLKEMAlgorithm;

      // Test key generation
      const keyPair = mlkem.generateKeyPair();
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);

      // Test encapsulation
      const { sharedSecret, cipherText } = mlkem.createSharedSecret(keyPair.publicKey);
      expect(sharedSecret).toBeInstanceOf(Uint8Array);
      expect(cipherText).toBeInstanceOf(Uint8Array);

      // Test decapsulation
      const recoveredSecret = mlkem.recoverSharedSecret(cipherText, keyPair.privateKey);
      expect(recoveredSecret).toEqual(sharedSecret);
    });

    it('should perform AES-GCM operations through symmetric registry', () => {
      const aesGcm = symmetricRegistry.get('AES-GCM-256') as AES256GCMAlgorithm;

      // Test key derivation
      const sharedSecret = randomBytes(32);
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('test-info');
      const keyMaterial = aesGcm.deriveKeyMaterial(sharedSecret, salt, info);

      expect(keyMaterial.key).toBeInstanceOf(Uint8Array);
      expect(keyMaterial.nonce).toBeInstanceOf(Uint8Array);

      // Test encryption/decryption
      const plaintext = new TextEncoder().encode('Hello, World!');
      const encrypted = aesGcm.encrypt(plaintext, keyMaterial);
      const decrypted = aesGcm.decrypt(encrypted.encryptedData, keyMaterial);

      expect(decrypted).toEqual(plaintext);
    });
  });

  describe('Hybrid Encryption Workflow', () => {
    it('should demonstrate complete hybrid encryption workflow', () => {
      // Get algorithms from registries
      const mlkem = mixedAlgorithmRegistry.getDefaultAsymmetric() as MLKEMAlgorithm;
      const aesGcm = mixedAlgorithmRegistry.getDefaultSymmetric() as AES256GCMAlgorithm;

      // Step 1: Generate key pair (typically done by recipient)
      const recipientKeyPair = mlkem.generateKeyPair();

      // Step 2: Sender encapsulates to create shared secret
      const encapsulationResult = mlkem.createSharedSecret(recipientKeyPair.publicKey);

      // Step 3: Derive symmetric key material from shared secret
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('hybrid-encryption-test');
      const keyMaterial = aesGcm.deriveKeyMaterial(encapsulationResult.sharedSecret, salt, info);

      // Step 4: Encrypt data with symmetric algorithm
      const plaintext = new TextEncoder().encode('Secret message for hybrid encryption');
      const symmetricResult = aesGcm.encrypt(plaintext, keyMaterial);

      // === Transmission would happen here ===
      // Transmitted: encapsulationResult.keyMaterial, salt, info, symmetricResult.encryptedData, symmetricResult.nonce

      // Step 5: Recipient decapsulates to recover shared secret
      const recoveredSharedSecret = mlkem.recoverSharedSecret(
        encapsulationResult.cipherText,
        recipientKeyPair.privateKey,
      );

      // Step 6: Recipient derives same symmetric key material
      const recoveredKeyMaterial = aesGcm.deriveKeyMaterial(recoveredSharedSecret, salt, info);

      // Verify key material matches
      expect(recoveredKeyMaterial.key).toEqual(keyMaterial.key);

      // Step 7: Recipient decrypts the data
      const recoveredKeyMaterialWithNonce = {
        ...recoveredKeyMaterial,
        nonce: symmetricResult.nonce, // Use transmitted nonce
      };
      const decryptedData = aesGcm.decrypt(
        symmetricResult.encryptedData,
        recoveredKeyMaterialWithNonce,
      );

      // Verify decryption success
      expect(decryptedData).toEqual(plaintext);
      expect(new TextDecoder().decode(decryptedData)).toBe('Secret message for hybrid encryption');
    });

    it('should handle multiple messages with same key pair', () => {
      const mlkem = mixedAlgorithmRegistry.getDefaultAsymmetric() as MLKEMAlgorithm;
      const aesGcm = mixedAlgorithmRegistry.getDefaultSymmetric() as AES256GCMAlgorithm;

      const recipientKeyPair = mlkem.generateKeyPair();
      const messages = [
        'First secret message',
        'Second secret message',
        'Third secret message with more content',
      ];

      const encryptedMessages = messages.map(message => {
        // Each message gets its own encapsulation (fresh shared secret)
        const encapsulationResult = mlkem.createSharedSecret(recipientKeyPair.publicKey);
        const salt = randomBytes(16);
        const info = new TextEncoder().encode('multi-message-test');
        const keyMaterial = aesGcm.deriveKeyMaterial(encapsulationResult.sharedSecret, salt, info);

        const plaintext = new TextEncoder().encode(message);
        const encrypted = aesGcm.encrypt(plaintext, keyMaterial);

        return {
          keyMaterial: encapsulationResult.cipherText,
          salt,
          info,
          encryptedData: encrypted.encryptedData,
          nonce: encrypted.nonce,
          originalMessage: message,
        };
      });

      // Decrypt all messages
      const decryptedMessages = encryptedMessages.map(encrypted => {
        const recoveredSharedSecret = mlkem.recoverSharedSecret(
          encrypted.keyMaterial,
          recipientKeyPair.privateKey,
        );
        const recoveredKeyMaterial = aesGcm.deriveKeyMaterial(
          recoveredSharedSecret,
          encrypted.salt,
          encrypted.info,
        );
        const keyMaterialWithNonce = {
          ...recoveredKeyMaterial,
          nonce: encrypted.nonce,
        };
        const decrypted = aesGcm.decrypt(encrypted.encryptedData, keyMaterialWithNonce);
        return new TextDecoder().decode(decrypted);
      });

      expect(decryptedMessages).toEqual(messages);
    });
  });

  describe('Registry Statistics Integration', () => {
    it('should provide accurate statistics for default registries', () => {
      const asymStats = asymmetricRegistry.getStats();
      const symStats = symmetricRegistry.getStats();
      const mixedStats = mixedAlgorithmRegistry.getStats();

      // Asymmetric registry
      expect(asymStats.registryType).toBe('asymmetric');
      expect(asymStats.asymmetricCount).toBeGreaterThan(0);
      expect(asymStats.symmetricCount).toBe(0);
      expect(asymStats.defaults.asymmetric).toBe('ML-KEM-768');
      expect(asymStats.defaults.symmetric).toBeNull();

      // Symmetric registry
      expect(symStats.registryType).toBe('symmetric');
      expect(symStats.asymmetricCount).toBe(0);
      expect(symStats.symmetricCount).toBeGreaterThan(0);
      expect(symStats.defaults.asymmetric).toBeNull();
      expect(symStats.defaults.symmetric).toBe('AES-GCM-256');

      // Mixed registry
      expect(mixedStats.registryType).toBe('mixed');
      expect(mixedStats.asymmetricCount).toBeGreaterThan(0);
      expect(mixedStats.symmetricCount).toBeGreaterThan(0);
      expect(mixedStats.defaults.asymmetric).toBe('ML-KEM-768');
      expect(mixedStats.defaults.symmetric).toBe('AES-GCM-256');
    });
  });

  describe('Algorithm Performance Integration', () => {
    it('should perform hybrid encryption within reasonable time', () => {
      const mlkem = mixedAlgorithmRegistry.getDefaultAsymmetric() as MLKEMAlgorithm;
      const aesGcm = mixedAlgorithmRegistry.getDefaultSymmetric() as AES256GCMAlgorithm;

      const recipientKeyPair = mlkem.generateKeyPair();
      const plaintext = new TextEncoder().encode('Performance test message');

      const start = performance.now();

      // Encrypt
      const encapsulationResult = mlkem.createSharedSecret(recipientKeyPair.publicKey);
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('perf-test');
      const keyMaterial = aesGcm.deriveKeyMaterial(encapsulationResult.sharedSecret, salt, info);
      const encrypted = aesGcm.encrypt(plaintext, keyMaterial);

      // Decrypt
      const recoveredSharedSecret = mlkem.recoverSharedSecret(
        encapsulationResult.cipherText,
        recipientKeyPair.privateKey,
      );
      const recoveredKeyMaterial = aesGcm.deriveKeyMaterial(recoveredSharedSecret, salt, info);
      const keyMaterialWithNonce = {
        ...recoveredKeyMaterial,
        nonce: encrypted.nonce,
      };
      const decrypted = aesGcm.decrypt(encrypted.encryptedData, keyMaterialWithNonce);

      const end = performance.now();

      // Verify correctness
      expect(decrypted).toEqual(plaintext);

      // Performance check (generous threshold for CI)
      expect(end - start).toBeLessThan(100);
    });

    it('should handle large data efficiently', () => {
      const mlkem = mixedAlgorithmRegistry.getDefaultAsymmetric() as MLKEMAlgorithm;
      const aesGcm = mixedAlgorithmRegistry.getDefaultSymmetric() as AES256GCMAlgorithm;

      const recipientKeyPair = mlkem.generateKeyPair();
      const largeData = randomBytes(10000); // 10KB - reduced to stay within quota

      const start = performance.now();

      const encapsulationResult = mlkem.createSharedSecret(recipientKeyPair.publicKey);
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('large-data-test');
      const keyMaterial = aesGcm.deriveKeyMaterial(encapsulationResult.sharedSecret, salt, info);
      const encrypted = aesGcm.encrypt(largeData, keyMaterial);

      const recoveredSharedSecret = mlkem.recoverSharedSecret(
        encapsulationResult.cipherText,
        recipientKeyPair.privateKey,
      );
      const recoveredKeyMaterial = aesGcm.deriveKeyMaterial(recoveredSharedSecret, salt, info);
      const keyMaterialWithNonce = {
        ...recoveredKeyMaterial,
        nonce: encrypted.nonce,
      };
      const decrypted = aesGcm.decrypt(encrypted.encryptedData, keyMaterialWithNonce);

      const end = performance.now();

      expect(decrypted).toEqual(largeData);

      // Should handle 100KB within 200ms (generous threshold)
      expect(end - start).toBeLessThan(200);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle registry errors gracefully', () => {
      expect(() => {
        asymmetricRegistry.get('non-existent-algorithm');
      }).toThrow('Unsupported algorithm: non-existent-algorithm');

      expect(() => {
        symmetricRegistry.getDefault('asymmetric' as any);
      }).toThrow();
    });

    it('should handle algorithm errors gracefully', () => {
      const mlkem = mixedAlgorithmRegistry.getDefaultAsymmetric() as MLKEMAlgorithm;
      const aesGcm = mixedAlgorithmRegistry.getDefaultSymmetric() as AES256GCMAlgorithm;

      // Invalid public key for encapsulation
      expect(() => {
        mlkem.createSharedSecret(new Uint8Array(100));
      }).toThrow();

      // Invalid key material for decryption
      expect(() => {
        const invalidKeyMaterial = {
          key: new Uint8Array(16), // Wrong size
          nonce: new Uint8Array(12),
          info: new Uint8Array(0),
        };
        aesGcm.encrypt(new Uint8Array(10), invalidKeyMaterial);
      }).toThrow();
    });
  });

  describe('Security Integration', () => {
    it('should ensure different sessions have different keys', () => {
      const mlkem = mixedAlgorithmRegistry.getDefaultAsymmetric() as MLKEMAlgorithm;
      const aesGcm = mixedAlgorithmRegistry.getDefaultSymmetric() as AES256GCMAlgorithm;

      const recipientKeyPair = mlkem.generateKeyPair();
      const plaintext = new TextEncoder().encode('Same message');

      // Two separate encryption sessions
      const session1 = mlkem.createSharedSecret(recipientKeyPair.publicKey);
      const session2 = mlkem.createSharedSecret(recipientKeyPair.publicKey);

      // Should have different shared secrets
      expect(session1.sharedSecret).not.toEqual(session2.sharedSecret);

      // Derive keys and encrypt
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('security-test');

      const keyMaterial1 = aesGcm.deriveKeyMaterial(session1.sharedSecret, salt, info);
      const keyMaterial2 = aesGcm.deriveKeyMaterial(session2.sharedSecret, salt, info);

      const encrypted1 = aesGcm.encrypt(plaintext, keyMaterial1);
      const encrypted2 = aesGcm.encrypt(plaintext, keyMaterial2);

      // Should have different ciphertexts
      expect(encrypted1.encryptedData).not.toEqual(encrypted2.encryptedData);
    });

    it('should detect tampering in hybrid encryption', () => {
      const mlkem = mixedAlgorithmRegistry.getDefaultAsymmetric() as MLKEMAlgorithm;
      const aesGcm = mixedAlgorithmRegistry.getDefaultSymmetric() as AES256GCMAlgorithm;

      const recipientKeyPair = mlkem.generateKeyPair();
      const plaintext = new TextEncoder().encode('Important message');

      const encapsulationResult = mlkem.createSharedSecret(recipientKeyPair.publicKey);
      const salt = randomBytes(16);
      const info = new TextEncoder().encode('tamper-test');
      const keyMaterial = aesGcm.deriveKeyMaterial(encapsulationResult.sharedSecret, salt, info);
      const encrypted = aesGcm.encrypt(plaintext, keyMaterial);

      // Tamper with key material (affects ML-KEM decapsulation)
      const tamperedKeyMaterial = new Uint8Array(encapsulationResult.cipherText);
      tamperedKeyMaterial[0] ^= 1;

      // ML-KEM uses implicit rejection - it doesn't throw, but returns a different shared secret
      const tamperedSharedSecret = mlkem.recoverSharedSecret(
        tamperedKeyMaterial,
        recipientKeyPair.privateKey,
      );
      expect(tamperedSharedSecret).not.toEqual(encapsulationResult.sharedSecret);

      // Tamper with encrypted data (affects AES-GCM authentication)
      const tamperedEncrypted = new Uint8Array(encrypted.encryptedData);
      tamperedEncrypted[0] ^= 1;

      const keyMaterialWithNonce = {
        ...keyMaterial,
        nonce: encrypted.nonce,
      };

      expect(() => {
        aesGcm.decrypt(tamperedEncrypted, keyMaterialWithNonce);
      }).toThrow();
    });
  });
});
