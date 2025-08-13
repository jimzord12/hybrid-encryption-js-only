import { ModernEncryptionOptions } from './types/modern-encryption.types';

/**
 * Constants for modern encryption
 */

export const DEFAULT_MODERN_OPTIONS: Required<
  Omit<ModernEncryptionOptions, 'associatedData' | 'metadata'>
> = {
  asymmetricAlgorithm: 'ML-KEM-768',
  symmetricAlgorithm: 'AES-GCM-256',
  keyDerivation: 'HKDF-SHA256',
  keySize: 256,
};
