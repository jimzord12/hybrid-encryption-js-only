import { ModernEncryptionOptions } from './types/modern-encryption.types';

export const defaults = {
  DEFAULT_KEY_SIZE: 256, // Default AES key size in bits
  DEFAULT_ASYMMETRIC_ALGORITHM: 'ML-KEM-768', // Default post-quantum asymmetric algorithm
  DEFAULT_SYMMETRIC_ALGORITHM: 'AES-GCM-256', // Default symmetric algorithm
  DEFAULT_KDF_ALGORITHM: 'HKDF-SHA256', // Default key derivation function
};

export const options = {
  SUPPORTED_AES_KEY_SIZES: [128, 192, 256], // Supported AES key sizes in bits
  SUPPORTED_ASYMMETRIC_ALGORITHMS: ['ML-KEM-768', 'ML-KEM-1024'], // Supported post-quantum algorithms
  SUPPORTED_SYMMETRIC_ALGORITHMS: [
    'AES-GCM-256',
    'AES-GCM-192',
    'AES-GCM-128',
    'ChaCha20-Poly1305',
  ], // Supported symmetric algorithms
  SUPPORTED_KDF_ALGORITHMS: ['HKDF-SHA256', 'HKDF-SHA512'], // Supported key derivation functions
};

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
