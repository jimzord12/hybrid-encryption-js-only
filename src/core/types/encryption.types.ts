/**
 * Legacy Encryption Types - Will be deprecated in favor of modern types
 * 
 * These interfaces are maintained for backward compatibility during the transition
 * to modern, algorithm-agnostic encryption in Phase 2.0.0
 */

import { ModernEncryptedData, ModernEncryptionOptions } from './modern-encryption.types';

/**
 * @deprecated Use ModernEncryptedData instead
 * Legacy encrypted data format using RSA + AES approach
 */
export interface LegacyEncryptedData {
  encryptedContent: string; // Base64 encoded AES-GCM encrypted data
  encryptedAESKey: string; // Base64 encoded RSA encrypted AES key (DEPRECATED)
  iv: string; // Base64 encoded initialization vector (use 'nonce' in modern format)
  authTag: string; // Base64 encoded GCM authentication tag
  version: string; // For future compatibility
}

/**
 * @deprecated Use ModernEncryptionOptions instead
 * Legacy encryption options - limited to AES configuration only
 */
export interface LegacyEncryptionOptions {
  keySize?: 128 | 192 | 256; // AES key size in bits
}

/**
 * Migration utilities for converting between legacy and modern formats
 */
export namespace EncryptionMigration {
  /**
   * Convert modern encryption options to legacy (lossy conversion)
   */
  export function modernToLegacyOptions(modern: ModernEncryptionOptions): LegacyEncryptionOptions {
    return {
      keySize: modern.keySize as (128 | 192 | 256) || 256,
    };
  }

  /**
   * Convert legacy encryption options to modern (with defaults)
   */
  export function legacyToModernOptions(legacy: LegacyEncryptionOptions): ModernEncryptionOptions {
    return {
      asymmetricAlgorithm: 'ML-KEM-768', // Default modern asymmetric
      symmetricAlgorithm: `AES-GCM-${legacy.keySize || 256}`, // Preserve key size
      keyDerivation: 'HKDF-SHA256', // Default KDF
      keySize: legacy.keySize || 256,
    };
  }

  /**
   * Check if data format is legacy or modern
   */
  export function isLegacyFormat(data: any): data is LegacyEncryptedData {
    return (
      typeof data === 'object' &&
      data !== null &&
      'encryptedAESKey' in data && // Legacy has RSA-encrypted AES key
      'iv' in data && // Legacy uses 'iv' instead of 'nonce'
      !('algorithms' in data) // Modern has algorithms object
    );
  }

  /**
   * Check if data format is modern
   */
  export function isModernFormat(data: any): data is ModernEncryptedData {
    return (
      typeof data === 'object' &&
      data !== null &&
      'algorithms' in data && // Modern has algorithms object
      'keyMaterial' in data && // Modern has KEM key material
      'nonce' in data && // Modern uses 'nonce' instead of 'iv'
      !('encryptedAESKey' in data) // Legacy has RSA-encrypted AES key
    );
  }
}

// Legacy type aliases for backward compatibility during transition
export type EncryptedData = LegacyEncryptedData;
export type EncryptionOptions = LegacyEncryptionOptions;
