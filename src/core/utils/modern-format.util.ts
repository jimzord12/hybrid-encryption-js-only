/**
 * Modern Format Conversion Utilities
 *
 * This module provides utilities for converting between legacy RSA-based formats
 * and modern KEM-based formats, enabling smooth migration during Phase 2.0.0
 */

import { CryptoKeyPair } from '../types/crypto-provider.types';
import { LegacyEncryptedData } from '../types/encryption.types';
import { ModernEncryptedData, ModernKeyPair } from '../types/modern-encryption.types';
import { BufferUtils } from './buffer.util';

/**
 * Conversion utilities for modern format compatibility
 */
export namespace ModernFormatUtils {
  /**
   * Convert CryptoKeyPair to ModernKeyPair format
   */
  export function cryptoToModernKeyPair(crypto: CryptoKeyPair): ModernKeyPair {
    const metadata: ModernKeyPair['metadata'] = {
      version: crypto.version || 1,
      createdAt: crypto.createdAt || new Date(),
    };

    // Only add optional properties if they exist
    if (crypto.expiresAt !== undefined) {
      metadata.expiresAt = crypto.expiresAt;
    }
    if (crypto.keySize !== undefined) {
      metadata.keySize = crypto.keySize;
    }
    if (crypto.curve !== undefined) {
      metadata.curve = crypto.curve;
    }
    if (crypto.parameters !== undefined) {
      metadata.parameters = crypto.parameters;
    }

    return {
      algorithm: crypto.algorithm,
      publicKey: crypto.publicKey,
      privateKey: crypto.privateKey,
      metadata,
    };
  }

  /**
   * Convert ModernKeyPair to CryptoKeyPair format
   */
  export function modernToCryptoKeyPair(modern: ModernKeyPair): CryptoKeyPair {
    const result: CryptoKeyPair = {
      publicKey: modern.publicKey,
      privateKey: modern.privateKey,
      algorithm: modern.algorithm as any, // Type assertion for compatibility
    };

    // Add optional metadata if present
    if (modern.metadata.version !== undefined) result.version = modern.metadata.version;
    if (modern.metadata.createdAt !== undefined) result.createdAt = modern.metadata.createdAt;
    if (modern.metadata.expiresAt !== undefined) result.expiresAt = modern.metadata.expiresAt;
    if (modern.metadata.keySize !== undefined) result.keySize = modern.metadata.keySize;
    if (modern.metadata.curve !== undefined) result.curve = modern.metadata.curve;
    if (modern.metadata.parameters !== undefined) result.parameters = modern.metadata.parameters;

    return result;
  }

  /**
   * Check if a key pair uses modern binary format
   */
  export function isBinaryKeyPair(keyPair: any): keyPair is ModernKeyPair | CryptoKeyPair {
    return (
      typeof keyPair === 'object' &&
      keyPair !== null &&
      keyPair.publicKey instanceof Uint8Array &&
      keyPair.privateKey instanceof Uint8Array
    );
  }

  /**
   * Check if a key pair uses legacy PEM string format
   */
  export function isLegacyKeyPair(keyPair: any): boolean {
    return (
      typeof keyPair === 'object' &&
      keyPair !== null &&
      typeof keyPair.publicKey === 'string' &&
      typeof keyPair.privateKey === 'string' &&
      keyPair.publicKey.includes('BEGIN') // PEM format indicator
    );
  }

  /**
   * Convert binary key to Base64 string for storage/transmission
   */
  export function binaryKeyToBase64(key: Uint8Array): string {
    return BufferUtils.encodeBase64(key);
  }

  /**
   * Convert Base64 string back to binary key
   */
  export function base64ToBinaryKey(base64: string): Uint8Array {
    return BufferUtils.decodeBase64(base64);
  }

  /**
   * Validate modern encrypted data format
   */
  export function validateModernEncryptedData(data: any): data is ModernEncryptedData {
    if (!data || typeof data !== 'object') return false;

    // Check required algorithm object
    if (!data.algorithms || typeof data.algorithms !== 'object') return false;
    if (typeof data.algorithms.asymmetric !== 'string') return false;
    if (typeof data.algorithms.symmetric !== 'string') return false;
    if (typeof data.algorithms.kdf !== 'string') return false;

    // Check required data fields
    if (typeof data.encryptedContent !== 'string') return false;
    if (typeof data.keyMaterial !== 'string') return false;
    if (typeof data.nonce !== 'string') return false;
    if (typeof data.version !== 'string') return false;

    // Optional fields validation
    if (data.authTag !== undefined && typeof data.authTag !== 'string') return false;
    if (data.metadata !== undefined && typeof data.metadata !== 'object') return false;

    return true;
  }

  /**
   * Validate legacy encrypted data format
   */
  export function validateLegacyEncryptedData(data: any): data is LegacyEncryptedData {
    if (!data || typeof data !== 'object') return false;

    // Check required fields for legacy format
    if (typeof data.encryptedContent !== 'string') return false;
    if (typeof data.encryptedAESKey !== 'string') return false;
    if (typeof data.iv !== 'string') return false;
    if (typeof data.authTag !== 'string') return false;
    if (typeof data.version !== 'string') return false;

    return true;
  }

  /**
   * Get algorithm capabilities (placeholder for Phase 1.3)
   */
  export function getAlgorithmInfo(algorithm: string) {
    const algorithms = {
      'ML-KEM-768': {
        type: 'asymmetric',
        isQuantumSafe: true,
        keySize: 768,
        description: 'NIST ML-KEM (Kyber) 768-bit quantum-safe key encapsulation',
      },
      'ML-KEM-1024': {
        type: 'asymmetric',
        isQuantumSafe: true,
        keySize: 1024,
        description: 'NIST ML-KEM (Kyber) 1024-bit quantum-safe key encapsulation',
      },
      'AES-GCM-256': {
        type: 'symmetric',
        isQuantumSafe: false, // Quantum-resistant with sufficient key size
        keySize: 256,
        isAEAD: true,
        description: 'AES-256 in Galois/Counter Mode with authentication',
      },
      'ChaCha20-Poly1305': {
        type: 'symmetric',
        isQuantumSafe: false, // Quantum-resistant
        keySize: 256,
        isAEAD: true,
        description: 'ChaCha20 stream cipher with Poly1305 authentication',
      },
      'HKDF-SHA256': {
        type: 'kdf',
        isQuantumSafe: false, // Quantum-resistant
        description: 'HMAC-based Key Derivation Function using SHA-256',
      },
      'HKDF-SHA512': {
        type: 'kdf',
        isQuantumSafe: false, // Quantum-resistant
        description: 'HMAC-based Key Derivation Function using SHA-512',
      },
    };

    return algorithms[algorithm as keyof typeof algorithms] || null;
  }

  /**
   * Generate secure random bytes for nonces, salts, etc.
   */
  export function getSecureRandomBytes(length: number): Uint8Array {
    return BufferUtils.getSecureRandomBytes(length);
  }

  /**
   * Compare two Uint8Arrays in constant time (side-channel resistant)
   */
  export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
    return BufferUtils.constantTimeEqual(a, b);
  }
}
