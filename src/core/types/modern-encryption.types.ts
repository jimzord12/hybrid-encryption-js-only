/**
 * Modern Encryption Types - Version 2.0.0
 *
 * These interfaces represent the modernized, algorithm-agnostic encryption system
 * that will replace the legacy RSA-based interfaces in Phase 2.0.0
 */

/**
 * Modern encrypted data format using KEM + AEAD approach
 * Replaces the legacy RSA + AES approach with post-quantum security
 */
export interface ModernEncryptedData {
  algorithms: {
    asymmetric: string; // 'ML-KEM-768', 'ML-KEM-1024', etc.
    symmetric: string; // 'AES-GCM-256', 'ChaCha20-Poly1305', etc.
    kdf: string; // 'HKDF-SHA256', 'HKDF-SHA512', etc.
  };
  encryptedContent: string; // Base64 encrypted data
  keyMaterial: string; // Base64 KEM ciphertext/key material
  nonce: string; // Base64 nonce/IV
  authTag?: string; // Base64 auth tag (for AEAD algorithms)
  metadata?: Record<string, any>; // Extensible metadata
  version: string; // '2.0.0' - for format versioning
}

/**
 * Universal key pair interface supporting multiple algorithms
 * Uses binary format (Uint8Array) for all keys - algorithm agnostic
 */
export interface ModernKeyPair {
  algorithm: string; // Algorithm identifier (e.g., 'ML-KEM-768')
  publicKey: Uint8Array; // Always binary format - no PEM
  privateKey: Uint8Array; // Always binary format - no PEM
  metadata: {
    version: number; // Key format version
    createdAt: Date; // When the key was generated
    expiresAt?: Date; // Optional expiration
    keySize?: number; // Key size in bits (if applicable)
    curve?: string; // Curve name (for ECC algorithms)
    parameters?: Record<string, any>; // Algorithm-specific parameters
  };
}

/**
 * Modern encryption options for algorithm selection and configuration
 * Replaces legacy EncryptionOptions with modern algorithm choices
 */
export interface ModernEncryptionOptions {
  asymmetricAlgorithm?: string; // Default: 'ML-KEM-768'
  symmetricAlgorithm?: string; // Default: 'AES-GCM-256'
  keyDerivation?: string; // Default: 'HKDF-SHA256'
  keySize?: number; // For symmetric algorithms (128, 192, 256)
  associatedData?: Uint8Array; // Additional authenticated data for AEAD
  metadata?: Record<string, any>; // Custom metadata to include
}

/**
 * Modern key generation configuration
 * Extends the existing KeyGenerationConfig with modern options
 */
export interface ModernKeyGenerationConfig {
  algorithm: string; // Target algorithm
  keySize?: number; // Key size for applicable algorithms
  parameters?: Record<string, any>; // Algorithm-specific parameters
  metadata?: Record<string, any>; // Custom metadata
}

/**
 * Modern key derivation configuration
 * For HKDF and other key derivation functions
 */
export interface ModernKeyDerivationConfig {
  algorithm: 'HKDF-SHA256' | 'HKDF-SHA512' | 'PBKDF2-SHA256' | 'PBKDF2-SHA512';
  keyLength: number; // Desired output key length in bytes
  salt?: Uint8Array; // Optional salt (random if not provided)
  info?: Uint8Array; // Optional context info for HKDF
  iterations?: number; // For PBKDF2 algorithms
}

/**
 * Algorithm capabilities interface
 * Describes what each algorithm supports
 */
export interface AlgorithmCapabilities {
  name: string;
  type: 'asymmetric' | 'symmetric' | 'kdf';
  isQuantumSafe: boolean;
  isAEAD?: boolean; // For symmetric algorithms
  supportedKeySizes: number[];
  recommendedKeySize: number;
  description: string;
}

/**
 * Constants for modern encryption
 */
export const MODERN_ENCRYPTION_VERSION = '2.0.0';

export const DEFAULT_MODERN_OPTIONS: Required<
  Omit<ModernEncryptionOptions, 'associatedData' | 'metadata'>
> = {
  asymmetricAlgorithm: 'ML-KEM-768',
  symmetricAlgorithm: 'AES-GCM-256',
  keyDerivation: 'HKDF-SHA256',
  keySize: 256,
};
