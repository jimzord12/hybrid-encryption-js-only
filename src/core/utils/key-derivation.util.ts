import { hkdf } from '@noble/hashes/hkdf';
import { sha256, sha512 } from '@noble/hashes/sha2';
import { randomBytes } from '@noble/hashes/utils';
import { stringToBinary } from '.';
import { Preset } from '../enums';
import { createAppropriateError } from '../errors';

/**
 * Supported key derivation algorithms
 */

/**
 * Key derivation result with metadata
 */
export interface KeyDerivationEncryptionResult {
  /** The derived key */
  key: Uint8Array;
  /** Salt used in derivation */
  salt: Uint8Array;
  /** Algorithm used for derivation */
  preset: Preset;
}

/**
 * Modern key derivation utility using HKDF
 *
 * Implements HMAC-based Key Derivation Function (HKDF) as specified in RFC 5869.
 * Provides secure key derivation from shared secrets for use in hybrid encryption.
 */
export class KeyDerivation {
  /**
   * Default info prefix for hybrid encryption context
   */
  private static readonly DEFAULT_INFO = 'HybridEncryption-v2.0';
  private static readonly DEFAULT_SALT_INFO = 'HKDF-SALT-DERIVATION';

  private static createKey(
    preset: Preset,
    binary: Uint8Array,
    salt: Uint8Array,
    info: Uint8Array,
    keySizeInBytes: number,
  ): Uint8Array {
    const hashFunc = this.getHashFunction(preset);
    return hkdf(hashFunc, binary, salt, info, keySizeInBytes);
  }

  /**
   * Derive a symmetric key from a shared secret using HKDF
   *
   * @param preset - The key derivation preset to use
   * @param sharedSecret - The input key material (shared secret from KEM)
   * @returns The derived key
   */
  static deriveKey(preset: Preset, sharedSecret: Uint8Array): Uint8Array {
    const keySizeInBytes = 32; // Default to 256 bits, high security to 512 bits
    // Validate inputs
    this.validateInputs(sharedSecret, keySizeInBytes, preset);

    // ⚠️ Create deterministic salt derived from shared secret
    const saltFromSharedSecret = KeyDerivation.generateSaltForSharedSecretSalt(
      preset,
      sharedSecret,
    );

    // Generate info if not provided
    const info = this.DEFAULT_INFO;

    // Select hash function based on preset
    const hashFunction = this.getHashFunction(preset);

    try {
      // Perform HKDF key derivation
      const derivedKey = hkdf(
        hashFunction,
        sharedSecret,
        saltFromSharedSecret,
        info,
        keySizeInBytes,
      );

      return derivedKey;
    } catch (error) {
      throw createAppropriateError(`Key derivation failed with ${preset}`, {
        errorType: 'algorithm-kdf',
        preset,
        cause: error instanceof Error ? error : undefined,
        operation: 'deriveKey',
      });
    }
  }

  /**
   * Generate cryptographically secure random salt
   *
   * @param size - Salt size in bytes (default: 32)
   * @returns Random salt
   */
  static generateSalt(preset: Preset): Uint8Array {
    return randomBytes(preset === Preset.DEFAULT ? 32 : 64);
  }

  static generateSaltForSharedSecretSalt(preset: Preset, sharedSecret: Uint8Array): Uint8Array {
    const saltSize = preset === Preset.DEFAULT ? 32 : 64; // Default to 256 bits, high security to 512 bits
    return KeyDerivation.createKey(
      preset,
      sharedSecret,
      new Uint8Array(0),
      stringToBinary(this.DEFAULT_SALT_INFO),
      saltSize,
    );
  }

  /**
   * Generate context info for key derivation
   *
   * @param context - Additional context string (optional)
   * @returns Info bytes for HKDF
   */
  static getInfo(): Uint8Array {
    // Convert string to UTF-8 bytes
    return new TextEncoder().encode(this.DEFAULT_INFO);
  }

  /**
   * Validate key derivation parameters
   */
  private static validateInputs(sharedSecret: Uint8Array, keySize: number, preset: Preset): void {
    if (!sharedSecret || sharedSecret.length === 0) {
      throw new Error('Shared secret cannot be empty');
    }

    if (keySize <= 0 || keySize > 1024) {
      throw new Error(`Invalid key size: ${keySize}. Must be between 1 and 1024 bytes.`);
    }

    if (!Object.values(Preset).includes(preset)) {
      throw new Error(`Unsupported Preset: ${preset}`);
    }

    if (sharedSecret.length < 16) {
      throw new Error(
        `Shared secret too short: ${sharedSecret.length} bytes. Minimum 16 bytes required.`,
      );
    }
  }

  /**
   * Get hash function for the specified preset
   */
  private static getHashFunction(preset: Preset) {
    switch (preset) {
      case Preset.DEFAULT:
        return sha256;
      case Preset.HIGH_SECURITY:
        return sha512;
      default:
        throw new Error(`Unsupported preset: ${preset}`);
    }
  }
}
