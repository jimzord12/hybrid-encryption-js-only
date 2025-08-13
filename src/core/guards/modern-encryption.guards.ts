/**
 * Type Guards for Modern Encryption System
 *
 * Runtime validation functions for modern encryption interfaces
 * ensuring type safety when working with external data
 */

import type {
  ModernEncryptedData,
  ModernEncryptionOptions,
  ModernKeyGenerationConfig,
  ModernKeyPair,
} from '../types/modern-encryption.types.js';

/**
 * Type guard for ModernEncryptedData
 * Validates the structure of encrypted data from external sources
 */
export function isModernEncryptedData(obj: any): obj is ModernEncryptedData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.algorithms === 'object' &&
    typeof obj.algorithms.asymmetric === 'string' &&
    typeof obj.algorithms.symmetric === 'string' &&
    typeof obj.algorithms.kdf === 'string' &&
    typeof obj.encryptedContent === 'string' &&
    typeof obj.keyMaterial === 'string' &&
    typeof obj.nonce === 'string' &&
    typeof obj.version === 'string' &&
    // Optional fields
    (obj.authTag === undefined || typeof obj.authTag === 'string') &&
    (obj.metadata === undefined || (typeof obj.metadata === 'object' && obj.metadata !== null))
  );
}

/**
 * Type guard for ModernKeyPair
 * Validates the structure of key pairs including binary key validation
 */
export function isModernKeyPair(obj: any): obj is ModernKeyPair {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.algorithm === 'string' &&
    obj.publicKey instanceof Uint8Array &&
    obj.privateKey instanceof Uint8Array &&
    typeof obj.metadata === 'object' &&
    obj.metadata !== null &&
    typeof obj.metadata.version === 'number' &&
    obj.metadata.createdAt instanceof Date &&
    // Optional metadata fields
    (obj.metadata.expiresAt === undefined || obj.metadata.expiresAt instanceof Date) &&
    (obj.metadata.keySize === undefined || typeof obj.metadata.keySize === 'number') &&
    (obj.metadata.curve === undefined || typeof obj.metadata.curve === 'string') &&
    (obj.metadata.parameters === undefined ||
      (typeof obj.metadata.parameters === 'object' && obj.metadata.parameters !== null))
  );
}

/**
 * Type guard for ModernEncryptionOptions
 * Validates encryption options before processing
 */
export function isModernEncryptionOptions(obj: any): obj is ModernEncryptionOptions {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    // All fields are optional
    (obj.asymmetricAlgorithm === undefined || typeof obj.asymmetricAlgorithm === 'string') &&
    (obj.symmetricAlgorithm === undefined || typeof obj.symmetricAlgorithm === 'string') &&
    (obj.keyDerivation === undefined || typeof obj.keyDerivation === 'string') &&
    (obj.keySize === undefined || typeof obj.keySize === 'number') &&
    (obj.associatedData === undefined || obj.associatedData instanceof Uint8Array) &&
    (obj.metadata === undefined || (typeof obj.metadata === 'object' && obj.metadata !== null))
  );
}

/**
 * Type guard for ModernKeyGenerationConfig
 * Validates key generation configuration
 */
export function isModernKeyGenerationConfig(obj: any): obj is ModernKeyGenerationConfig {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.algorithm === 'string' &&
    // Optional fields
    (obj.keySize === undefined || typeof obj.keySize === 'number') &&
    (obj.parameters === undefined ||
      (typeof obj.parameters === 'object' && obj.parameters !== null)) &&
    (obj.metadata === undefined || (typeof obj.metadata === 'object' && obj.metadata !== null))
  );
}

/**
 * Validates that a Uint8Array represents a valid key
 * Basic validation - non-empty and reasonable size bounds
 */
export function isValidBinaryKey(key: any): key is Uint8Array {
  return (
    key instanceof Uint8Array && key.length > 0 && key.length <= 65536 // Reasonable upper bound (64KB)
  );
}

/**
 * Validates algorithm string format
 * Ensures algorithm names follow expected patterns
 */
export function isValidAlgorithmName(algorithm: any): algorithm is string {
  return (
    typeof algorithm === 'string' &&
    algorithm.length > 0 &&
    algorithm.length <= 64 && // Reasonable length limit
    /^[A-Za-z0-9\-_]+$/.test(algorithm) // Alphanumeric, hyphens, underscores only
  );
}

/**
 * Validates that an object can be safely serialized to JSON
 * Prevents circular references and ensures compatibility
 */
export function isSerializable(obj: any): boolean {
  try {
    JSON.stringify(obj);
    return true;
  } catch {
    return false;
  }
}

/**
 * Comprehensive validation for encrypted data
 * Combines multiple checks for production use
 */
export function validateModernEncryptedData(obj: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isModernEncryptedData(obj)) {
    errors.push('Object does not match ModernEncryptedData interface');
  } else {
    // Additional validation for algorithm names
    if (!isValidAlgorithmName(obj.algorithms.asymmetric)) {
      errors.push('Invalid asymmetric algorithm name format');
    }
    if (!isValidAlgorithmName(obj.algorithms.symmetric)) {
      errors.push('Invalid symmetric algorithm name format');
    }
    if (!isValidAlgorithmName(obj.algorithms.kdf)) {
      errors.push('Invalid KDF algorithm name format');
    }

    // Validate Base64 strings
    try {
      atob(obj.encryptedContent);
    } catch {
      errors.push('Invalid Base64 format for encryptedContent');
    }

    try {
      atob(obj.keyMaterial);
    } catch {
      errors.push('Invalid Base64 format for keyMaterial');
    }

    try {
      atob(obj.nonce);
    } catch {
      errors.push('Invalid Base64 format for nonce');
    }

    if (obj.authTag) {
      try {
        atob(obj.authTag);
      } catch {
        errors.push('Invalid Base64 format for authTag');
      }
    }

    // Validate metadata serializability
    if (obj.metadata && !isSerializable(obj.metadata)) {
      errors.push('Metadata contains non-serializable content');
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Comprehensive validation for key pairs
 * Combines multiple checks for production use
 */
export function validateModernKeyPair(obj: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isModernKeyPair(obj)) {
    errors.push('Object does not match ModernKeyPair interface');
  } else {
    // Additional validation
    if (!isValidAlgorithmName(obj.algorithm)) {
      errors.push('Invalid algorithm name format');
    }

    if (!isValidBinaryKey(obj.publicKey)) {
      errors.push('Invalid public key format or size');
    }

    if (!isValidBinaryKey(obj.privateKey)) {
      errors.push('Invalid private key format or size');
    }

    // Validate metadata
    if (obj.metadata.version < 1) {
      errors.push('Key version must be >= 1');
    }

    if (obj.metadata.expiresAt && obj.metadata.expiresAt <= obj.metadata.createdAt) {
      errors.push('Expiration date must be after creation date');
    }

    if (obj.metadata.keySize && obj.metadata.keySize < 128) {
      errors.push('Key size must be >= 128 bits');
    }

    if (obj.metadata.parameters && !isSerializable(obj.metadata.parameters)) {
      errors.push('Key parameters contain non-serializable content');
    }
  }

  return { isValid: errors.length === 0, errors };
}
