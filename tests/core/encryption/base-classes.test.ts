import { describe, expect, it } from 'vitest';
import { AsymmetricAlgorithm } from '../../../src/core/encryption/asymmetric/base';
import { SymmetricAlgorithm } from '../../../src/core/encryption/symmetric/base';

// Mock implementations for testing abstract classes
class MockAsymmetricAlgorithm extends AsymmetricAlgorithm {
  constructor(name: string, version: string) {
    super(name, version);
  }

  generateKeyPair() {
    return {
      publicKey: new Uint8Array([1, 2, 3, 4]),
      privateKey: new Uint8Array([5, 6, 7, 8]),
    };
  }

  createSharedSecret(publicKey: Uint8Array, _privateKey?: Uint8Array) {
    return {
      sharedSecret: new Uint8Array([9, 10, 11, 12]),
      keyMaterial: publicKey,
    };
  }

  recoverSharedSecret(_keyMaterial: Uint8Array, _privateKey: Uint8Array) {
    // In a real KEM, this would derive the same shared secret from the key material
    // For mock, we simulate this by returning the expected shared secret
    // Special handling for edge cases (empty key material should return empty)
    if (_keyMaterial.length === 0) {
      return _keyMaterial;
    }
    return new Uint8Array([9, 10, 11, 12]);
  }
}

class MockSymmetricAlgorithm extends SymmetricAlgorithm {
  constructor(name: string, keySize: number) {
    super(name, keySize, 12, true);
  }

  deriveKeyMaterial(sharedSecret: Uint8Array, salt: Uint8Array, info: Uint8Array) {
    return {
      key: sharedSecret,
      nonce: salt.slice(0, this.nonceSize),
      info,
    };
  }

  encrypt(data: Uint8Array, keyMaterial: any) {
    return {
      encryptedData: data,
      nonce: keyMaterial.nonce,
    };
  }

  decrypt(encryptedData: Uint8Array, _keyMaterial: any) {
    return encryptedData;
  }

  getAlgorithmId() {
    return this.name;
  }
}

describe('Algorithm Base Classes', () => {
  describe('AsymmetricAlgorithm', () => {
    let algorithm: MockAsymmetricAlgorithm;

    beforeEach(() => {
      algorithm = new MockAsymmetricAlgorithm('TestAsym', '1.0');
    });

    it('should initialize with correct name and version', () => {
      expect(algorithm.getAlgorithmId()).toContain('TestAsym');
      expect(algorithm.getAlgorithmId()).toContain('1.0');
      expect(algorithm.getAlgorithmId()).toBe('TestAsym-1.0');
    });

    it('should generate correct algorithm ID', () => {
      expect(algorithm.getAlgorithmId()).toBe('TestAsym-1.0');
    });

    it('should have abstract methods implemented by concrete class', () => {
      // Test that abstract methods are implemented and work
      const keyPair = algorithm.generateKeyPair();
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);

      const sharedSecretResult = algorithm.createSharedSecret(keyPair.publicKey);
      expect(sharedSecretResult.sharedSecret).toBeInstanceOf(Uint8Array);
      expect(sharedSecretResult.keyMaterial).toBeInstanceOf(Uint8Array);

      const recoveredSecret = algorithm.recoverSharedSecret(
        sharedSecretResult.keyMaterial,
        keyPair.privateKey,
      );
      expect(recoveredSecret).toBeInstanceOf(Uint8Array);
    });

    it('should support optional private key in createSharedSecret', () => {
      const publicKey = new Uint8Array([1, 2, 3, 4]);
      const privateKey = new Uint8Array([5, 6, 7, 8]);

      // Test without private key
      const result1 = algorithm.createSharedSecret(publicKey);
      expect(result1.sharedSecret).toBeInstanceOf(Uint8Array);

      // Test with private key
      const result2 = algorithm.createSharedSecret(publicKey, privateKey);
      expect(result2.sharedSecret).toBeInstanceOf(Uint8Array);
    });

    it('should work with different algorithm names and versions', () => {
      const algorithms = [
        new MockAsymmetricAlgorithm('RSA', '2048'),
        new MockAsymmetricAlgorithm('ECC', 'P-256'),
        new MockAsymmetricAlgorithm('ML-KEM', '768'),
        new MockAsymmetricAlgorithm('Kyber', '1024'),
      ];

      algorithms.forEach(alg => {
        const algorithmId = alg.getAlgorithmId();
        expect(algorithmId).toBeTruthy();
        expect(algorithmId).toMatch(/^.+-.*$/); // format: name-version
      });
    });
  });

  describe('SymmetricAlgorithm', () => {
    let algorithm: MockSymmetricAlgorithm;

    beforeEach(() => {
      algorithm = new MockSymmetricAlgorithm('TestSym', 32);
    });

    it('should initialize with correct properties', () => {
      expect(algorithm.name).toBe('TestSym');
      expect(algorithm.keySize).toBe(32);
      expect(algorithm.nonceSize).toBe(12);
      expect(algorithm.isAEAD).toBe(true);
    });

    it('should generate algorithm ID from name', () => {
      expect(algorithm.getAlgorithmId()).toBe('TestSym');
    });

    it('should generate nonces of correct size', () => {
      const nonce = algorithm.generateNonce();
      expect(nonce).toBeInstanceOf(Uint8Array);
      expect(nonce.length).toBe(12);
    });

    it('should generate different nonces', () => {
      const nonces = Array.from({ length: 10 }, () => algorithm.generateNonce());
      const uniqueNonces = new Set(nonces.map(n => Array.from(n).join(',')));

      // All nonces should be unique (extremely high probability)
      expect(uniqueNonces.size).toBe(10);
    });

    it('should have abstract methods implemented by concrete class', () => {
      const sharedSecret = new Uint8Array([1, 2, 3, 4]);
      const salt = new Uint8Array([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      const info = new Uint8Array([17, 18, 19, 20]);

      // Test key derivation
      const keyMaterial = algorithm.deriveKeyMaterial(sharedSecret, salt, info);
      expect(keyMaterial.key).toBeInstanceOf(Uint8Array);
      expect(keyMaterial.nonce).toBeInstanceOf(Uint8Array);
      expect(keyMaterial.info).toBe(info);

      // Test encryption
      const plaintext = new Uint8Array([21, 22, 23, 24]);
      const encrypted = algorithm.encrypt(plaintext, keyMaterial);
      expect(encrypted.encryptedData).toBeInstanceOf(Uint8Array);
      expect(encrypted.nonce).toBeInstanceOf(Uint8Array);

      // Test decryption
      const decrypted = algorithm.decrypt(encrypted.encryptedData, keyMaterial);
      expect(decrypted).toBeInstanceOf(Uint8Array);
    });

    it('should support different symmetric algorithm configurations', () => {
      const algorithms = [
        new MockSymmetricAlgorithm('AES-128', 16), // 128-bit key
        new MockSymmetricAlgorithm('AES-192', 24), // 192-bit key
        new MockSymmetricAlgorithm('AES-256', 32), // 256-bit key
        new MockSymmetricAlgorithm('ChaCha20', 32), // 256-bit key
      ];

      algorithms.forEach(alg => {
        expect(alg.name).toBeDefined();
        expect(alg.keySize).toBeGreaterThan(0);
        expect(alg.nonceSize).toBe(12);
        expect(alg.isAEAD).toBe(true);
      });
    });

    it('should support non-AEAD algorithms', () => {
      class NonAEADAlgorithm extends SymmetricAlgorithm {
        constructor() {
          super('AES-CTR', 32, 16, false); // Not AEAD
        }

        deriveKeyMaterial(sharedSecret: Uint8Array, salt: Uint8Array, info: Uint8Array) {
          return { key: sharedSecret, nonce: salt.slice(0, this.nonceSize), info };
        }

        encrypt(data: Uint8Array, keyMaterial: any) {
          return { encryptedData: data, nonce: keyMaterial.nonce };
        }

        decrypt(encryptedData: Uint8Array, _keyMaterial: any) {
          return encryptedData;
        }

        getAlgorithmId() {
          return this.name;
        }
      }

      const nonAeadAlg = new NonAEADAlgorithm();
      expect(nonAeadAlg.isAEAD).toBe(false);
      expect(nonAeadAlg.nonceSize).toBe(16);
    });
  });

  describe('Base Class Interactions', () => {
    it('should work together in a hybrid encryption scenario', () => {
      const asymAlg = new MockAsymmetricAlgorithm('TestAsym', '1.0');
      const symAlg = new MockSymmetricAlgorithm('TestSym', 32);

      // Step 1: Generate key pair
      const keyPair = asymAlg.generateKeyPair();

      // Step 2: Create shared secret
      const sharedSecretResult = asymAlg.createSharedSecret(keyPair.publicKey);

      // Step 3: Derive symmetric key material
      const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      const info = new Uint8Array([17, 18, 19, 20]);
      const keyMaterial = symAlg.deriveKeyMaterial(sharedSecretResult.sharedSecret, salt, info);

      // Step 4: Encrypt data
      const plaintext = new Uint8Array([21, 22, 23, 24, 25]);
      const encrypted = symAlg.encrypt(plaintext, keyMaterial);

      // Step 5: Recover shared secret
      const recoveredSecret = asymAlg.recoverSharedSecret(
        sharedSecretResult.keyMaterial,
        keyPair.privateKey,
      );

      // Step 6: Derive same key material
      const recoveredKeyMaterial = symAlg.deriveKeyMaterial(recoveredSecret, salt, info);

      // Step 7: Decrypt data
      const decrypted = symAlg.decrypt(encrypted.encryptedData, recoveredKeyMaterial);

      // Verify the workflow
      expect(recoveredSecret).toEqual(sharedSecretResult.sharedSecret);
      expect(decrypted).toEqual(plaintext);
    });

    it('should support algorithm identification', () => {
      const asymAlg = new MockAsymmetricAlgorithm('RSA', '4096');
      const symAlg = new MockSymmetricAlgorithm('AES-GCM', 32);

      expect(asymAlg.getAlgorithmId()).toBe('RSA-4096');
      expect(symAlg.getAlgorithmId()).toBe('AES-GCM');

      // Algorithm IDs should be suitable for registry keys
      const algorithmIds = [asymAlg.getAlgorithmId(), symAlg.getAlgorithmId()];
      algorithmIds.forEach(id => {
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
        expect(id).not.toContain(' '); // No spaces for clean registry keys
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle edge cases in asymmetric algorithms', () => {
      const algorithm = new MockAsymmetricAlgorithm('EdgeCase', '1.0');

      // Test with empty arrays
      const emptyPublicKey = new Uint8Array(0);
      const result = algorithm.createSharedSecret(emptyPublicKey);
      expect(result.keyMaterial).toEqual(emptyPublicKey);

      // Test with null-like inputs (implementation dependent)
      const emptyKeyMaterial = new Uint8Array(0);
      const emptyPrivateKey = new Uint8Array(0);
      const recovered = algorithm.recoverSharedSecret(emptyKeyMaterial, emptyPrivateKey);
      expect(recovered).toEqual(emptyKeyMaterial);
    });

    it('should handle edge cases in symmetric algorithms', () => {
      const algorithm = new MockSymmetricAlgorithm('EdgeCase', 32);

      // Test with empty inputs
      const emptyData = new Uint8Array(0);
      const emptyKeyMaterial = {
        key: new Uint8Array(0),
        nonce: new Uint8Array(0),
        info: new Uint8Array(0),
      };

      const encrypted = algorithm.encrypt(emptyData, emptyKeyMaterial);
      expect(encrypted.encryptedData).toEqual(emptyData);

      const decrypted = algorithm.decrypt(encrypted.encryptedData, emptyKeyMaterial);
      expect(decrypted).toEqual(emptyData);
    });
  });

  describe('Type Safety', () => {
    it('should maintain correct types for asymmetric algorithm methods', () => {
      const algorithm = new MockAsymmetricAlgorithm('TypeTest', '1.0');

      // generateKeyPair should return correct structure
      const keyPair = algorithm.generateKeyPair();
      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);

      // createSharedSecret should return correct structure
      const sharedSecretResult = algorithm.createSharedSecret(keyPair.publicKey);
      expect(sharedSecretResult).toHaveProperty('sharedSecret');
      expect(sharedSecretResult).toHaveProperty('keyMaterial');
      expect(sharedSecretResult.sharedSecret).toBeInstanceOf(Uint8Array);
      expect(sharedSecretResult.keyMaterial).toBeInstanceOf(Uint8Array);

      // recoverSharedSecret should return Uint8Array
      const recovered = algorithm.recoverSharedSecret(
        sharedSecretResult.keyMaterial,
        keyPair.privateKey,
      );
      expect(recovered).toBeInstanceOf(Uint8Array);
    });

    it('should maintain correct types for symmetric algorithm methods', () => {
      const algorithm = new MockSymmetricAlgorithm('TypeTest', 32);

      const sharedSecret = new Uint8Array(32);
      const salt = new Uint8Array(16);
      const info = new Uint8Array(8);

      // deriveKeyMaterial should return correct structure
      const keyMaterial = algorithm.deriveKeyMaterial(sharedSecret, salt, info);
      expect(keyMaterial).toHaveProperty('key');
      expect(keyMaterial).toHaveProperty('nonce');
      expect(keyMaterial).toHaveProperty('info');
      expect(keyMaterial.key).toBeInstanceOf(Uint8Array);
      expect(keyMaterial.nonce).toBeInstanceOf(Uint8Array);

      // encrypt should return correct structure
      const plaintext = new Uint8Array([1, 2, 3]);
      const encrypted = algorithm.encrypt(plaintext, keyMaterial);
      expect(encrypted).toHaveProperty('encryptedData');
      expect(encrypted).toHaveProperty('nonce');
      expect(encrypted.encryptedData).toBeInstanceOf(Uint8Array);
      expect(encrypted.nonce).toBeInstanceOf(Uint8Array);

      // decrypt should return Uint8Array
      const decrypted = algorithm.decrypt(encrypted.encryptedData, keyMaterial);
      expect(decrypted).toBeInstanceOf(Uint8Array);
    });
  });
});
