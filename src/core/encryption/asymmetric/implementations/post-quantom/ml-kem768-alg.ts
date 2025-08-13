import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { AsymmetricAlgorithm } from '../../base';

/**
 * ML-KEM (Post-Quantum) implementation using Key Encapsulation
 */
export class MLKEMAlgorithm extends AsymmetricAlgorithm {
  constructor() {
    super('ML-KEM', '768');
  }

  generateKeyPair() {
    try {
      const keyPair = ml_kem768.keygen();
      return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.secretKey,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate ML-KEM-768 key pair: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  createSharedSecret(publicKey: Uint8Array) {
    // Validate input
    if (!publicKey || !(publicKey instanceof Uint8Array)) {
      throw new Error('Invalid public key: must be a Uint8Array');
    }

    // ML-KEM-768 public key should be 1184 bytes
    if (publicKey.length !== 1184) {
      throw new Error(
        `Invalid ML-KEM-768 public key length: expected 1184 bytes, got ${publicKey.length}`,
      );
    }

    try {
      // ML-KEM uses encapsulation - generates random shared secret
      const { cipherText, sharedSecret } = ml_kem768.encapsulate(publicKey);
      return {
        sharedSecret,
        cipherText, // This is what gets transmitted
      };
    } catch (error) {
      throw new Error(
        `Failed to create shared secret with ML-KEM-768: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  recoverSharedSecret(keyMaterial: Uint8Array, privateKey: Uint8Array) {
    // Validate inputs
    if (!keyMaterial || !(keyMaterial instanceof Uint8Array)) {
      throw new Error('Invalid key material: must be a Uint8Array');
    }

    if (!privateKey || !(privateKey instanceof Uint8Array)) {
      throw new Error('Invalid private key: must be a Uint8Array');
    }

    // ML-KEM-768 ciphertext should be 1088 bytes
    if (keyMaterial.length !== 1088) {
      throw new Error(
        `Invalid ML-KEM-768 ciphertext length: expected 1088 bytes, got ${keyMaterial.length}`,
      );
    }

    // ML-KEM-768 private key should be 2400 bytes
    if (privateKey.length !== 2400) {
      throw new Error(
        `Invalid ML-KEM-768 private key length: expected 2400 bytes, got ${privateKey.length}`,
      );
    }

    // ML-KEM uses decapsulation to recover the shared secret
    // Note: ML-KEM uses "implicit rejection" - it will not throw errors for wrong
    // private keys or malformed ciphertext. Instead, it returns a pseudorandom
    // shared secret that looks valid but is different from the original.
    // This is a security feature to prevent timing attacks.
    const sharedSecret = ml_kem768.decapsulate(keyMaterial, privateKey);

    // Validate that we got a valid shared secret
    if (!sharedSecret || sharedSecret.length !== 32) {
      throw new Error('Failed to recover shared secret: invalid output from decapsulation');
    }

    return sharedSecret;
  }
}
