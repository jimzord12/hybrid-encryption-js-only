import { ml_kem1024, ml_kem768 } from '@noble/post-quantum/ml-kem';
import { Preset } from '../../../../common/enums';
import { createAppropriateError } from '../../../../common/errors/encryption.errors';
import { Keys, MlKemSecrets } from '../../../../common/interfaces/keys.interfaces';
import { DEFAULT_ENCRYPTION_OPTIONS } from '../../../constants/defaults.constants';
import { ML_KEM_STATS } from '../../../constants/encryption.constants';
import { AsymmetricAlgorithm } from '../../../interfaces/asymmetric-alg.interfaces';

/**
 * ML-KEM (Post-Quantum) implementation using Key Encapsulation
 */
export class MLKEMAlgorithm extends AsymmetricAlgorithm {
  constructor(public readonly preset: Preset = DEFAULT_ENCRYPTION_OPTIONS.preset) {
    const keySize = ML_KEM_STATS.keySize[preset];
    super('ML-KEM', keySize);
  }

  generateKeyPair(): Keys {
    try {
      const keyPair = this.preset === Preset.NORMAL ? ml_kem768.keygen() : ml_kem1024.keygen();
      return {
        publicKey: keyPair.publicKey,
        secretKey: keyPair.secretKey,
      };
    } catch (error) {
      throw createAppropriateError(
        `Failed to generate ML-KEM-${ML_KEM_STATS.keySize[this.preset]} key pair`,
        {
          errorType: 'algorithm-asymmetric',
          operation: 'generateKeyPair',
          preset: this.preset,
          cause: error instanceof Error ? error : undefined,
        },
      );
    }
  }

  createSharedSecret(publicKey: Uint8Array): MlKemSecrets {
    // Validate input
    if (publicKey == null || !(publicKey instanceof Uint8Array)) {
      throw createAppropriateError('Invalid public key: must be a Uint8Array', {
        errorType: 'algorithm-asymmetric',
        operation: 'createSharedSecret',
        preset: this.preset,
      });
    }

    // ML-KEM-768 public key should be 1184 bytes
    if (
      this.preset === Preset.NORMAL &&
      publicKey.length !== ML_KEM_STATS.publicKeyLength[Preset.NORMAL]
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
        this.preset === Preset.NORMAL
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

  recoverSharedSecret(receivedCipherText: Uint8Array, secretKey: Uint8Array): Uint8Array {
    // Validate inputs
    if (receivedCipherText == null || !(receivedCipherText instanceof Uint8Array)) {
      throw createAppropriateError('Invalid key material', {
        errorType: 'algorithm-asymmetric',
        operation: 'recoverSharedSecret',
        preset: this.preset,
      });
    }

    if (secretKey == null || !(secretKey instanceof Uint8Array)) {
      throw createAppropriateError('Invalid secret key', {
        errorType: 'algorithm-asymmetric',
        operation: 'recoverSharedSecret',
        preset: this.preset,
      });
    }

    // ML-KEM ciphertext length validation using constants
    if (
      this.preset === Preset.NORMAL &&
      receivedCipherText.length !== ML_KEM_STATS.ciphertextLength[Preset.NORMAL]
    ) {
      throw createAppropriateError('Invalid ML-KEM-768 ciphertext length', {
        errorType: 'algorithm-asymmetric',
        operation: 'recoverSharedSecret',
        preset: this.preset,
      });
    }

    if (
      this.preset === Preset.NORMAL &&
      secretKey.length !== ML_KEM_STATS.secretKeyLength[Preset.NORMAL]
    ) {
      throw createAppropriateError('Invalid ML-KEM-768 secret key length', {
        errorType: 'algorithm-asymmetric',
        operation: 'recoverSharedSecret',
        preset: this.preset,
      });
    }

    // ML-KEM-1024 validation using constants
    if (
      this.preset === Preset.HIGH_SECURITY &&
      receivedCipherText.length !== ML_KEM_STATS.ciphertextLength[Preset.HIGH_SECURITY]
    ) {
      throw createAppropriateError('Invalid ML-KEM-1024 ciphertext length', {
        errorType: 'algorithm-asymmetric',
        operation: 'recoverSharedSecret',
        preset: this.preset,
      });
    }

    if (
      this.preset === Preset.HIGH_SECURITY &&
      secretKey.length !== ML_KEM_STATS.secretKeyLength[Preset.HIGH_SECURITY]
    ) {
      throw createAppropriateError('Invalid ML-KEM-1024 secret key length', {
        errorType: 'algorithm-asymmetric',
        operation: 'recoverSharedSecret',
        preset: this.preset,
      });
    }

    // ML-KEM uses decapsulation to recover the shared secret
    // 🚨 Note: ML-KEM uses "implicit rejection" - it will not throw errors for wrong
    // secret keys or malformed ciphertext. Instead, it returns a pseudorandom
    // shared secret that looks valid but is different from the original.
    // This is a security feature to prevent timing attacks.
    const sharedSecret =
      this.preset === Preset.NORMAL
        ? ml_kem768.decapsulate(receivedCipherText, secretKey)
        : ml_kem1024.decapsulate(receivedCipherText, secretKey);

    // Validate that we got a valid shared secret
    if (sharedSecret == null || sharedSecret.length !== 32) {
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
