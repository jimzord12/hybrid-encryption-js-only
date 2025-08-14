import { gcm } from '@noble/ciphers/aes';
import { AES_GCM_STATS, DEFAULT_ENCRYPTION_OPTIONS } from '../../../constants';
import { Preset } from '../../../enums';
import { createAppropriateError } from '../../../errors';
import {
  AEADParams,
  SymmetricAlgorithm,
  SymmetricEncryptionResult,
} from '../../../interfaces/encryption/symmetric-alg.interface';

/**
 * AES-256-GCM symmetric encryption algorithm implementation
 * Provides authenticated encryption with additional data (AEAD)
 */
export class AESGCMAlgorithm extends SymmetricAlgorithm {
  constructor(public readonly preset: Preset = DEFAULT_ENCRYPTION_OPTIONS.preset) {
    const { keySizeBits, nonceLength } = AES_GCM_STATS;
    const keySizeBytes = keySizeBits[preset] / 8;

    super('AES-GCM', keySizeBytes, nonceLength[preset], true); // 256-bit key, 96-bit nonce, AEAD enabled
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param data - The data to encrypt
   * @param keyMaterial - The key material for encryption
   * @returns Encrypted data with authentication tag
   */
  encrypt(data: Uint8Array, keyMaterials: AEADParams): SymmetricEncryptionResult {
    const { key, nonce } = keyMaterials;

    // Validate key size based on preset
    const expectedKeySize = AES_GCM_STATS.keySizeBits[this.preset] / 8;
    if (key.length !== expectedKeySize) {
      throw createAppropriateError(
        `AES-256-GCM requires a ${expectedKeySize}-byte key, got ${key.length} bytes`,
        {
          errorType: 'algorithm-symmetric',
          preset: this.preset,
          operation: 'encrypt',
        },
      );
    }

    // Validate nonce size based on preset
    const expectedNonceSize = AES_GCM_STATS.nonceLength[this.preset];
    if (nonce.length !== expectedNonceSize) {
      throw createAppropriateError(
        `AES-GCM requires a ${expectedNonceSize}-byte nonce, got ${nonce.length} bytes`,
        {
          errorType: 'algorithm-symmetric',
          preset: this.preset,
          operation: 'encrypt',
        },
      );
    }

    try {
      const cipher = gcm(key, nonce);
      const encryptedData = cipher.encrypt(data);

      return {
        encryptedData,
        nonce,
      } as const;
    } catch (error) {
      throw createAppropriateError('AES-256-GCM encryption failed', {
        errorType: 'algorithm-symmetric',
        preset: this.preset,
        operation: 'encrypt',
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param encryptedData - The encrypted data with auth tag
   * @param keyMaterial - The key material for decryption
   * @param authData - Optional additional authenticated data (unused in this implementation)
   * @returns Decrypted plaintext data
   */
  decrypt(
    preset: Preset,
    encryptedData: Uint8Array,
    key: Uint8Array,
    nonce: Uint8Array,
  ): Uint8Array {
    this.validateInput(preset, key, nonce);

    try {
      const cipher = gcm(key, nonce);
      return cipher.decrypt(encryptedData);
    } catch (error) {
      throw createAppropriateError('AES-256-GCM decryption failed', {
        errorType: 'algorithm-symmetric',
        preset,
        operation: 'decrypt',
      });
    }
  }

  validateInput(preset: Preset, key: Uint8Array, nonce: Uint8Array): void {
    // Validate key size - both presets use 256-bit keys according to constants
    const expectedKeySize = AES_GCM_STATS.keySizeBits[preset] / 8;
    if (key.length !== expectedKeySize) {
      throw createAppropriateError(
        `AES-256-GCM requires a ${expectedKeySize}-byte key, got ${key.length} bytes`,
        {
          errorType: 'algorithm-symmetric',
          preset,
          operation: 'decrypt',
        },
      );
    }

    // Validate nonce size based on preset
    const expectedNonceSize = AES_GCM_STATS.nonceLength[preset];
    if (nonce.length !== expectedNonceSize) {
      throw createAppropriateError(
        `AES-GCM requires a ${expectedNonceSize}-byte nonce, got ${nonce.length} bytes`,
        {
          errorType: 'algorithm-symmetric',
          preset,
          operation: 'decrypt',
        },
      );
    }
  }

  /**
   * Get algorithm identifier
   * @returns The algorithm identifier string
   */
  getAlgorithmId(): string {
    return 'AES-GCM-256';
  }
}
