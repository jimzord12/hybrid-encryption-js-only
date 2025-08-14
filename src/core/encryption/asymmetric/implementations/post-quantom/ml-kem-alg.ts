import { ml_kem1024, ml_kem768 } from '@noble/post-quantum/ml-kem';
import { DEFAULT_ENCRYPTION_OPTIONS, ML_KEM_STATS } from '../../../../constants';
import { Preset } from '../../../../enums';
import { createAppropriateError } from '../../../../errors';
import { AsymmetricAlgorithm } from '../../../../interfaces/encryption/asymmetric-alg.interface';

/**
 * ML-KEM (Post-Quantum) implementation using Key Encapsulation
 */
export class MLKEMAlgorithm extends AsymmetricAlgorithm {
  constructor(public readonly preset: Preset = DEFAULT_ENCRYPTION_OPTIONS.preset) {
    const keySize = ML_KEM_STATS.keySize[preset];
    super('ML-KEM', keySize);
  }

  generateKeyPair() {
    try {
      const keyPair = this.preset === Preset.DEFAULT ? ml_kem768.keygen() : ml_kem1024.keygen();
      return {
        publicKey: keyPair.publicKey,
        secretKey: keyPair.secretKey,
      };
    } catch (error) {
      throw createAppropriateError('Failed to generate ML-KEM-768 key pair', {
        errorType: 'algorithm-asymmetric',
        operation: 'generateKeyPair',
        preset: this.preset,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  createSharedSecret(publicKey: Uint8Array) {
    // Validate input
    if (!publicKey || !(publicKey instanceof Uint8Array)) {
      throw createAppropriateError('Invalid public key: must be a Uint8Array', {
        errorType: 'algorithm-asymmetric',
        operation: 'createSharedSecret',
        preset: this.preset,
      });
    }

    // ML-KEM-768 public key should be 1184 bytes
    if (
      this.preset === Preset.DEFAULT &&
      publicKey.length !== ML_KEM_STATS.publicKeyLength[Preset.DEFAULT]
    ) {
      throw createAppropriateError('Invalid ML-KEM-768 public key length', {
        errorType: 'algorithm-asymmetric',
        operation: 'createSharedSecret',
        preset: this.preset,
      });
    }

    if (
      this.preset === Preset.HIGH_SECURITY &&
      publicKey.length !== ML_KEM_STATS.publicKeyLength[Preset.HIGH_SECURITY]
    ) {
      throw createAppropriateError('Invalid ML-KEM-1024 public key length', {
        errorType: 'algorithm-asymmetric',
        operation: 'createSharedSecret',
        preset: this.preset,
      });
    }

    try {
      // ML-KEM uses encapsulation - generates random shared secret
      const { cipherText, sharedSecret } =
        this.preset === Preset.DEFAULT
          ? ml_kem768.encapsulate(publicKey)
          : ml_kem1024.encapsulate(publicKey);

      return {
        sharedSecret,
        cipherText, // This is what gets transmitted
      };
    } catch (error) {
      throw createAppropriateError('Failed to create shared secret with ML-KEM-768', {
        errorType: 'algorithm-asymmetric',
        operation: 'createSharedSecret',
        preset: this.preset,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  recoverSharedSecret(keyMaterial: Uint8Array, privateKey: Uint8Array) {
    // Validate inputs
    if (!keyMaterial || !(keyMaterial instanceof Uint8Array)) {
      throw createAppropriateError('Invalid key material', {
        errorType: 'algorithm-asymmetric',
        operation: 'recoverSharedSecret',
        preset: this.preset,
      });
    }

    if (!privateKey || !(privateKey instanceof Uint8Array)) {
      throw createAppropriateError('Invalid private key', {
        errorType: 'algorithm-asymmetric',
        operation: 'recoverSharedSecret',
        preset: this.preset,
      });
    }

    // ML-KEM-768 ciphertext should be 1088 bytes
    if (this.preset === Preset.DEFAULT && keyMaterial.length !== 1088) {
      throw createAppropriateError('Invalid ML-KEM-768 ciphertext length', {
        errorType: 'algorithm-asymmetric',
        operation: 'recoverSharedSecret',
        preset: this.preset,
      });
    }

    if (this.preset === Preset.DEFAULT && privateKey.length !== 2400) {
      throw createAppropriateError('Invalid ML-KEM-768 secret key length', {
        errorType: 'algorithm-asymmetric',
        operation: 'recoverSharedSecret',
        preset: this.preset,
      });
    }

    // ML-KEM-1024 ciphertext should be 1568 bytes
    if (this.preset === Preset.HIGH_SECURITY && keyMaterial.length !== 1568) {
      throw createAppropriateError('Invalid ML-KEM-1024 ciphertext length', {
        errorType: 'algorithm-asymmetric',
        operation: 'recoverSharedSecret',
        preset: this.preset,
      });
    }

    if (this.preset === Preset.HIGH_SECURITY && privateKey.length !== 3168) {
      throw createAppropriateError('Invalid ML-KEM-1024 private key length', {
        errorType: 'algorithm-asymmetric',
        operation: 'recoverSharedSecret',
        preset: this.preset,
      });
    }

    // ML-KEM uses decapsulation to recover the shared secret
    // 🚨 Note: ML-KEM uses "implicit rejection" - it will not throw errors for wrong
    // private keys or malformed ciphertext. Instead, it returns a pseudorandom
    // shared secret that looks valid but is different from the original.
    // This is a security feature to prevent timing attacks.
    const sharedSecret =
      this.preset === Preset.DEFAULT
        ? ml_kem768.decapsulate(keyMaterial, privateKey)
        : ml_kem1024.decapsulate(keyMaterial, privateKey);

    // Validate that we got a valid shared secret
    if (!sharedSecret || sharedSecret.length !== 32) {
      throw createAppropriateError(
        'Failed to recover shared secret: invalid output from decapsulation',
        {
          errorType: 'algorithm-asymmetric',
          operation: 'recoverSharedSecret',
          preset: this.preset,
        },
      );
    }

    return sharedSecret;
  }
}
