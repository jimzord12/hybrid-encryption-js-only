import { gcm } from '@noble/ciphers/aes';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha2';
import { KeyMaterial, SymmetricEncryptionResult } from '../../types';
import { SymmetricAlgorithm } from '../base';

/**
 * AES-256-GCM symmetric encryption algorithm implementation
 * Provides authenticated encryption with additional data (AEAD)
 */
export class AES256GCMAlgorithm extends SymmetricAlgorithm {
  constructor() {
    super('AES-GCM-256', 32, 12, true); // 256-bit key, 96-bit nonce, AEAD enabled
  }

  /**
   * Derive key material from shared secret using HKDF
   * @param sharedSecret - The shared secret from key exchange
   * @param salt - Random salt for key derivation
   * @param info - Additional context information
   * @returns Derived key material
   */
  deriveKeyMaterial(sharedSecret: Uint8Array, salt: Uint8Array, info: Uint8Array): KeyMaterial {
    const key = hkdf(sha256, sharedSecret, salt, info, this.keySize);
    const nonce = this.generateNonce();

    return {
      key,
      nonce,
      info,
    } as const;
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param data - The data to encrypt
   * @param keyMaterial - The key material for encryption
   * @returns Encrypted data with authentication tag
   */
  encrypt(data: Uint8Array, keyMaterial: KeyMaterial): SymmetricEncryptionResult {
    // Validate key size for AES-256
    if (keyMaterial.key.length !== 32) {
      throw new Error(`AES-256-GCM requires a 32-byte key, got ${keyMaterial.key.length} bytes`);
    }

    // Validate nonce size for GCM
    if (keyMaterial.nonce.length !== 12) {
      throw new Error(`AES-GCM requires a 12-byte nonce, got ${keyMaterial.nonce.length} bytes`);
    }

    try {
      const cipher = gcm(keyMaterial.key, keyMaterial.nonce);
      const encryptedData = cipher.encrypt(data);

      return {
        encryptedData,
        nonce: keyMaterial.nonce,
        authData: encryptedData.slice(-16), // GCM auth tag is last 16 bytes
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
  decrypt(encryptedData: Uint8Array, keyMaterial: KeyMaterial, _authData?: Uint8Array): Uint8Array {
    // Validate key size for AES-256
    if (keyMaterial.key.length !== 32) {
      throw new Error(`AES-256-GCM requires a 32-byte key, got ${keyMaterial.key.length} bytes`);
    }

    // Validate nonce size for GCM
    if (keyMaterial.nonce.length !== 12) {
      throw new Error(`AES-GCM requires a 12-byte nonce, got ${keyMaterial.nonce.length} bytes`);
    }

    try {
      const cipher = gcm(keyMaterial.key, keyMaterial.nonce);
      return cipher.decrypt(encryptedData);
    } catch (error) {
      throw new Error(
        `AES-256-GCM decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
