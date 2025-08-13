import { beforeEach, describe, expect, it } from 'vitest';
import { MLKEMAlgorithm } from '../../../../../src/core/encryption/asymmetric/implementations/post-quantom/ml-kem768-alg';

describe('MLKEMAlgorithm', () => {
  let algorithm: MLKEMAlgorithm;

  beforeEach(() => {
    algorithm = new MLKEMAlgorithm();
  });

  describe('Algorithm Properties', () => {
    it('should have correct algorithm identifier', () => {
      expect(algorithm.getAlgorithmId()).toBe('ML-KEM-768');
    });

    it('should have correct algorithm version', () => {
      const lastHyphenIdx = algorithm.getAlgorithmId().lastIndexOf('-');
      const name = algorithm.getAlgorithmId().slice(0, lastHyphenIdx);
      const version = algorithm.getAlgorithmId().slice(lastHyphenIdx + 1);
      expect(name).toBe('ML-KEM');
      expect(version).toBe('768');
    });
  });

  describe('Key Generation', () => {
    it('should generate key pairs', () => {
      const keyPair = algorithm.generateKeyPair();

      expect(keyPair).toBeDefined();
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.publicKey.length).toBeGreaterThan(0);
      expect(keyPair.privateKey.length).toBeGreaterThan(0);
    });

    it('should generate different key pairs on multiple calls', () => {
      const keyPair1 = algorithm.generateKeyPair();
      const keyPair2 = algorithm.generateKeyPair();

      // Keys should be different (very low probability of collision)
      expect(keyPair1.publicKey).not.toEqual(keyPair2.publicKey);
      expect(keyPair1.privateKey).not.toEqual(keyPair2.privateKey);
    });

    it('should generate keys with expected ML-KEM-768 sizes', () => {
      const keyPair = algorithm.generateKeyPair();

      // ML-KEM-768 specific sizes
      expect(keyPair.publicKey.length).toBe(1184); // 1184 bytes for ML-KEM-768 public key
      expect(keyPair.privateKey.length).toBe(2400); // 2400 bytes for ML-KEM-768 private key
    });
  });

  describe('Key Encapsulation', () => {
    it('should create shared secret with key encapsulation', () => {
      const keyPair = algorithm.generateKeyPair();
      const result = algorithm.createSharedSecret(keyPair.publicKey);

      expect(result).toBeDefined();
      expect(result.sharedSecret).toBeInstanceOf(Uint8Array);
      expect(result.cipherText).toBeInstanceOf(Uint8Array);
      expect(result.sharedSecret.length).toBe(32); // 32 bytes shared secret for ML-KEM-768
      expect(result.cipherText.length).toBe(1088); // 1088 bytes ciphertext for ML-KEM-768
    });

    it('should generate different shared secrets for same public key', () => {
      const keyPair = algorithm.generateKeyPair();
      const result1 = algorithm.createSharedSecret(keyPair.publicKey);
      const result2 = algorithm.createSharedSecret(keyPair.publicKey);

      // Should generate different shared secrets due to randomness
      expect(result1.sharedSecret).not.toEqual(result2.sharedSecret);
      expect(result1.cipherText).not.toEqual(result2.cipherText);
    });

    it('should throw error for invalid public key', () => {
      const invalidPublicKey = new Uint8Array(100); // Wrong size

      expect(() => {
        algorithm.createSharedSecret(invalidPublicKey);
      }).toThrow();
    });
  });

  describe('Key Decapsulation', () => {
    it('should recover shared secret with decapsulation', () => {
      const keyPair = algorithm.generateKeyPair();
      const encapsulationResult = algorithm.createSharedSecret(keyPair.publicKey);

      const recoveredSecret = algorithm.recoverSharedSecret(
        encapsulationResult.cipherText,
        keyPair.privateKey,
      );

      expect(recoveredSecret).toBeInstanceOf(Uint8Array);
      expect(recoveredSecret).toEqual(encapsulationResult.sharedSecret);
    });

    it('should return different shared secret with wrong private key', () => {
      const keyPair1 = algorithm.generateKeyPair();
      const keyPair2 = algorithm.generateKeyPair();
      const encapsulationResult = algorithm.createSharedSecret(keyPair1.publicKey);

      // ML-KEM uses implicit rejection - wrong private key returns different secret (no error)
      const correctSecret = algorithm.recoverSharedSecret(
        encapsulationResult.cipherText,
        keyPair1.privateKey,
      );
      const wrongSecret = algorithm.recoverSharedSecret(
        encapsulationResult.cipherText,
        keyPair2.privateKey, // Wrong private key
      );

      // Should not throw, but should return different secrets
      expect(correctSecret).toHaveLength(32);
      expect(wrongSecret).toHaveLength(32);
      expect(correctSecret).not.toEqual(wrongSecret);
    });

    it('should fail with invalid key material', () => {
      const keyPair = algorithm.generateKeyPair();
      const invalidKeyMaterial = new Uint8Array(100); // Wrong size

      expect(() => {
        algorithm.recoverSharedSecret(invalidKeyMaterial, keyPair.privateKey);
      }).toThrow();
    });

    it('should fail with invalid private key', () => {
      const keyPair = algorithm.generateKeyPair();
      const encapsulationResult = algorithm.createSharedSecret(keyPair.publicKey);
      const invalidPrivateKey = new Uint8Array(100); // Wrong size

      expect(() => {
        algorithm.recoverSharedSecret(encapsulationResult.cipherText, invalidPrivateKey);
      }).toThrow();
    });
  });

  describe('Key Encapsulation Mechanism (KEM) Properties', () => {
    it('should demonstrate KEM correctness', () => {
      // Generate key pair
      const keyPair = algorithm.generateKeyPair();

      // Encapsulate to get shared secret and ciphertext
      const { sharedSecret, cipherText } = algorithm.createSharedSecret(keyPair.publicKey);

      // Decapsulate to recover the same shared secret
      const recoveredSecret = algorithm.recoverSharedSecret(cipherText, keyPair.privateKey);

      // Verify correctness
      expect(recoveredSecret).toEqual(sharedSecret);
    });

    it('should work with multiple encapsulations', () => {
      const keyPair = algorithm.generateKeyPair();
      const encapsulations = [];

      // Perform multiple encapsulations
      for (let i = 0; i < 5; i++) {
        encapsulations.push(algorithm.createSharedSecret(keyPair.publicKey));
      }

      // Verify each can be decapsulated correctly
      encapsulations.forEach(({ sharedSecret, cipherText }) => {
        const recovered = algorithm.recoverSharedSecret(cipherText, keyPair.privateKey);
        expect(recovered).toEqual(sharedSecret);
      });
    });
  });

  describe('Security Properties', () => {
    it('should generate cryptographically random keys', () => {
      const keyPairs = Array.from({ length: 10 }, () => algorithm.generateKeyPair());

      // Check that all public keys are unique
      const publicKeys = keyPairs.map(kp => Array.from(kp.publicKey).join(','));
      const uniquePublicKeys = new Set(publicKeys);
      expect(uniquePublicKeys.size).toBe(10);

      // Check that all private keys are unique
      const privateKeys = keyPairs.map(kp => Array.from(kp.privateKey).join(','));
      const uniquePrivateKeys = new Set(privateKeys);
      expect(uniquePrivateKeys.size).toBe(10);
    });

    it('should generate different shared secrets for different key pairs', () => {
      const keyPair1 = algorithm.generateKeyPair();
      const keyPair2 = algorithm.generateKeyPair();

      const result1 = algorithm.createSharedSecret(keyPair1.publicKey);
      const result2 = algorithm.createSharedSecret(keyPair2.publicKey);

      // Shared secrets should be different for different key pairs
      expect(result1.sharedSecret).not.toEqual(result2.sharedSecret);
    });

    it('should produce non-zero keys and secrets', () => {
      const keyPair = algorithm.generateKeyPair();
      const result = algorithm.createSharedSecret(keyPair.publicKey);

      // Check that keys are not all zeros
      expect(keyPair.publicKey.some(byte => byte !== 0)).toBe(true);
      expect(keyPair.privateKey.some(byte => byte !== 0)).toBe(true);
      expect(result.sharedSecret.some(byte => byte !== 0)).toBe(true);
      expect(result.cipherText.some(byte => byte !== 0)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should generate keys within reasonable time', () => {
      const start = performance.now();
      algorithm.generateKeyPair();
      const end = performance.now();

      // Should complete within 100ms (generous threshold)
      expect(end - start).toBeLessThan(100);
    });

    it('should perform encapsulation within reasonable time', () => {
      const keyPair = algorithm.generateKeyPair();

      const start = performance.now();
      algorithm.createSharedSecret(keyPair.publicKey);
      const end = performance.now();

      // Should complete within 50ms (generous threshold)
      expect(end - start).toBeLessThan(50);
    });

    it('should perform decapsulation within reasonable time', () => {
      const keyPair = algorithm.generateKeyPair();
      const { sharedSecret: _, cipherText } = algorithm.createSharedSecret(keyPair.publicKey);

      const start = performance.now();
      algorithm.recoverSharedSecret(cipherText, keyPair.privateKey);
      const end = performance.now();

      // Should complete within 50ms (generous threshold)
      expect(end - start).toBeLessThan(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input gracefully', () => {
      expect(() => {
        algorithm.createSharedSecret(new Uint8Array(0));
      }).toThrow();
    });

    it('should handle null/undefined input gracefully', () => {
      expect(() => {
        algorithm.createSharedSecret(null as any);
      }).toThrow();

      expect(() => {
        algorithm.createSharedSecret(undefined as any);
      }).toThrow();
    });

    it('should return different shared secret with malformed key material', () => {
      const keyPair = algorithm.generateKeyPair();
      const { cipherText: validKeyMaterial } = algorithm.createSharedSecret(keyPair.publicKey);

      // Create malformed key material of correct size but invalid content
      const corruptedKeyMaterial = new Uint8Array(1088);
      corruptedKeyMaterial.fill(255); // Fill with invalid data

      // ML-KEM uses implicit rejection - malformed data returns different secret (no error)
      const validSecret = algorithm.recoverSharedSecret(validKeyMaterial, keyPair.privateKey);
      const corruptedSecret = algorithm.recoverSharedSecret(
        corruptedKeyMaterial,
        keyPair.privateKey,
      );

      // Should not throw, but should return different secrets
      expect(validSecret).toHaveLength(32);
      expect(corruptedSecret).toHaveLength(32);
      expect(validSecret).not.toEqual(corruptedSecret);
    });
  });
});
