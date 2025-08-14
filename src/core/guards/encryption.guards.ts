/**
 * Type Guards for Modern Encryption System
 *
 * Runtime validation functions for modern encryption interfaces
 * ensuring type safety when working with external data
 */

import { KeyPair } from '../interfaces/common/index.interface.js';
import { Base64 } from '../types/branded-types.types.js';
import type { EncryptedData, KeyGenerationConfig } from '../types/encryption.types.js';
import { decodeBase64 } from '../utils/buffer.util.js';

/**
 * Type guard for ModernEncryptedData
 * Validates the structure of encrypted data from external sources
 */
export function isEncryptedData(obj: any): obj is EncryptedData {
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
export function isKeyPair(obj: any): obj is KeyPair {
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
 * Type guard for ModernKeyGenerationConfig
 * Validates key generation configuration
 */
export function isKeyGenerationConfig(obj: any): obj is KeyGenerationConfig {
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
export function isValidPresetType(algorithm: any): algorithm is string {
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
export function validateEncryptedData(obj: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isEncryptedData(obj)) {
    errors.push('Object does not match EncryptedData interface');
  } else {
    // Additional validation for algorithm names
    if (!isValidPresetType(obj.preset)) {
      errors.push('Invalid preset algorithm name format');
    }

    // Validate Base64 strings
    try {
      decodeBase64(obj.encryptedContent as Base64);
    } catch {
      errors.push('Invalid Base64 format for encryptedContent');
    }

    try {
      decodeBase64(obj.cipherText as Base64);
    } catch {
      errors.push('Invalid Base64 format for cipherText');
    }

    try {
      decodeBase64(obj.nonce as Base64);
    } catch {
      errors.push('Invalid Base64 format for nonce');
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Comprehensive validation for key pairs
 * Combines multiple checks for production use
 */
export function validateKeyPair(obj: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isKeyPair(obj)) {
    errors.push('Object does not match KeyPair interface');
  } else {
    // Additional validation
    if (!isValidPresetType(obj.preset)) {
      errors.push('Invalid preset name format');
    }

    if (!isValidBinaryKey(obj.publicKey)) {
      errors.push('Invalid public key format or size');
    }

    if (!isValidBinaryKey(obj.secretKey)) {
      errors.push('Invalid secret key format or size');
    }
  }

  return { isValid: errors.length === 0, errors };
}
