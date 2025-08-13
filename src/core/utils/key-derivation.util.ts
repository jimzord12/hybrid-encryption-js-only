import { hkdf } from '@noble/hashes/hkdf';
import { sha256, sha512 } from '@noble/hashes/sha2';
import { randomBytes } from '@noble/hashes/utils';

/**
 * Supported key derivation algorithms
 */
export type SupportedKDFAlgorithms = 'HKDF-SHA256' | 'HKDF-SHA512';

/**
 * Key derivation configuration options
 */
export interface KeyDerivationConfig {
  /** The key derivation algorithm to use */
  algorithm: SupportedKDFAlgorithms;
  /** Output key length in bytes */
  keyLength: number;
  /** Salt for key derivation (optional) */
  salt?: Uint8Array;
  /** Info/context data for key derivation (optional) */
  info?: Uint8Array;
}

/**
 * Key derivation result with metadata
 */
export interface KeyDerivationResult {
  /** The derived key */
  key: Uint8Array;
  /** Salt used in derivation */
  salt: Uint8Array;
  /** Info/context used in derivation */
  info: Uint8Array;
  /** Algorithm used for derivation */
  algorithm: SupportedKDFAlgorithms;
}

/**
 * Modern key derivation utility using HKDF
 *
 * Implements HMAC-based Key Derivation Function (HKDF) as specified in RFC 5869.
 * Provides secure key derivation from shared secrets for use in hybrid encryption.
 */
export class KeyDerivation {
  /**
   * Default salt size in bytes
   */
  private static readonly DEFAULT_SALT_SIZE = 32;

  /**
   * Default info prefix for hybrid encryption context
   */
  private static readonly DEFAULT_INFO_PREFIX = 'HybridEncryption-v2.0';

  /**
   * Derive a symmetric key from a shared secret using HKDF
   *
   * @param sharedSecret - The input key material (shared secret from KEM)
   * @param keySize - Desired output key size in bytes
   * @param salt - Salt for key derivation (generated if not provided)
   * @param info - Context/application info (generated if not provided)
   * @param algorithm - Hash algorithm to use (default: HKDF-SHA256)
   * @returns The derived key
   */
  static deriveKey(
    sharedSecret: Uint8Array,
    keySize: number,
    salt?: Uint8Array,
    info?: Uint8Array,
    algorithm: SupportedKDFAlgorithms = 'HKDF-SHA256',
  ): Uint8Array {
    // Validate inputs
    this.validateInputs(sharedSecret, keySize, algorithm);

    // Generate salt if not provided
    const derivationSalt = salt ?? this.generateSalt();

    // Generate info if not provided
    const derivationInfo = info ?? this.generateInfo();

    // Select hash function based on algorithm
    const hashFunction = this.getHashFunction(algorithm);

    try {
      // Perform HKDF key derivation
      const derivedKey = hkdf(hashFunction, sharedSecret, derivationSalt, derivationInfo, keySize);

      return derivedKey;
    } catch (error) {
      throw new Error(
        `Key derivation failed with ${algorithm}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Derive a key with full configuration and return detailed result
   *
   * @param sharedSecret - The input key material
   * @param config - Key derivation configuration
   * @returns Complete key derivation result with metadata
   */
  static deriveKeyWithConfig(
    sharedSecret: Uint8Array,
    config: KeyDerivationConfig,
  ): KeyDerivationResult {
    const salt = config.salt ?? this.generateSalt();
    const info = config.info ?? this.generateInfo();

    const derivedKey = this.deriveKey(sharedSecret, config.keyLength, salt, info, config.algorithm);

    return {
      key: derivedKey,
      salt,
      info,
      algorithm: config.algorithm,
    };
  }

  /**
   * Generate cryptographically secure random salt
   *
   * @param size - Salt size in bytes (default: 32)
   * @returns Random salt
   */
  static generateSalt(size: number = this.DEFAULT_SALT_SIZE): Uint8Array {
    if (size <= 0 || size > 256) {
      throw new Error(`Invalid salt size: ${size}. Must be between 1 and 256 bytes.`);
    }

    // Use @noble/hashes randomBytes for secure cryptographic random generation
    return randomBytes(size);
  }

  /**
   * Generate context info for key derivation
   *
   * @param context - Additional context string (optional)
   * @returns Info bytes for HKDF
   */
  static generateInfo(context?: string): Uint8Array {
    const baseInfo = this.DEFAULT_INFO_PREFIX;
    const fullInfo = context ? `${baseInfo}-${context}` : baseInfo;

    // Convert string to UTF-8 bytes
    return new TextEncoder().encode(fullInfo);
  }

  /**
   * Create info from multiple components
   *
   * @param components - Array of strings to concatenate
   * @returns Combined info bytes
   */
  static createInfoFromComponents(components: string[]): Uint8Array {
    const combinedInfo = components.join('-');
    return this.generateInfo(combinedInfo);
  }

  /**
   * Validate key derivation parameters
   */
  private static validateInputs(
    sharedSecret: Uint8Array,
    keySize: number,
    algorithm: SupportedKDFAlgorithms,
  ): void {
    if (!sharedSecret || sharedSecret.length === 0) {
      throw new Error('Shared secret cannot be empty');
    }

    if (keySize <= 0 || keySize > 1024) {
      throw new Error(`Invalid key size: ${keySize}. Must be between 1 and 1024 bytes.`);
    }

    if (!['HKDF-SHA256', 'HKDF-SHA512'].includes(algorithm)) {
      throw new Error(`Unsupported KDF algorithm: ${algorithm}`);
    }

    if (sharedSecret.length < 16) {
      throw new Error(
        `Shared secret too short: ${sharedSecret.length} bytes. Minimum 16 bytes required.`,
      );
    }
  }

  /**
   * Get hash function for the specified algorithm
   */
  private static getHashFunction(algorithm: SupportedKDFAlgorithms) {
    switch (algorithm) {
      case 'HKDF-SHA256':
        return sha256;
      case 'HKDF-SHA512':
        return sha512;
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
  }

  /**
   * Get recommended key sizes for different symmetric algorithms
   */
  static getRecommendedKeySize(symmetricAlgorithm: string): number {
    switch (symmetricAlgorithm.toLowerCase()) {
      case 'aes-gcm-128':
      case 'aes-128':
        return 16; // 128 bits
      case 'aes-gcm-192':
      case 'aes-192':
        return 24; // 192 bits
      case 'aes-gcm-256':
      case 'aes-256':
        return 32; // 256 bits
      case 'chacha20-poly1305':
      case 'chacha20':
        return 32; // 256 bits
      default:
        return 32; // Default to 256 bits for unknown algorithms
    }
  }

  /**
   * Check if an algorithm is supported
   */
  static isSupportedAlgorithm(algorithm: string): algorithm is SupportedKDFAlgorithms {
    return ['HKDF-SHA256', 'HKDF-SHA512'].includes(algorithm as SupportedKDFAlgorithms);
  }

  /**
   * Get all supported KDF algorithms
   */
  static getSupportedAlgorithms(): SupportedKDFAlgorithms[] {
    return ['HKDF-SHA256', 'HKDF-SHA512'];
  }
}
