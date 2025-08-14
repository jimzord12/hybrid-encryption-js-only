import { gcm } from '@noble/ciphers/aes';
import { DEFAULT_ENCRYPTION_OPTIONS } from '../../../constants';
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
    super('AES-GCM', 32, 12, true); // 256-bit key, 96-bit nonce, AEAD enabled
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param data - The data to encrypt
   * @param keyMaterial - The key material for encryption
   * @returns Encrypted data with authentication tag
   */
  encrypt(data: Uint8Array, keyMaterials: AEADParams): SymmetricEncryptionResult {
    const { key, nonce } = keyMaterials;
    // Validate key size for AES-256
    if (key.length !== 32) {
      throw new Error(`AES-256-GCM requires a 32-byte key, got ${key.length} bytes`);
    }

    // Validate nonce size for GCM
    if (nonce.length !== 12) {
      throw new Error(`AES-GCM requires a 12-byte nonce, got ${nonce.length} bytes`);
    }

    try {
      const cipher = gcm(key, nonce);
      const encryptedData = cipher.encrypt(data);

      return {
        encryptedData,
        nonce,
      } as const;
    } catch (error) {
      throw new Error(
        `AES-256-GCM encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
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
    // Validate key size
    if (preset === Preset.DEFAULT && key.length !== 32) {
      throw createAppropriateError(`AES-256-GCM requires a 32-byte key, got ${key.length} bytes`, {
        errorType: 'algorithm-symmetric',
        preset,
        operation: 'decrypt',
      });
    }

    if (preset === Preset.HIGH_SECURITY && key.length !== 64) {
      throw createAppropriateError(`AES-512-GCM requires a 64-byte key, got ${key.length} bytes`, {
        errorType: 'algorithm-symmetric',
        preset,
        operation: 'decrypt',
      });
    }

    // Validate nonce size for GCM
    if (nonce.length !== 12) {
      throw createAppropriateError(`AES-GCM requires a 12-byte nonce, got ${nonce.length} bytes`, {
        errorType: 'algorithm-symmetric',
        preset,
        operation: 'decrypt',
      });
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
