// Generic Cryptographic Provider Types
// This file defines the interfaces for algorithm-agnostic key management
export type SupportedAlgorithms = 'rsa' | 'ecc' | 'ed25519';

export interface CryptoKeyPair {
  publicKey: string;
  privateKey: string;
  algorithm: 'rsa' | 'ecc' | 'ed25519';
  version?: number;
  createdAt?: Date;
  expiresAt?: Date;
  keySize?: number;
  curve?: string; // For ECC algorithms
}

export interface KeyGenerationConfig {
  algorithm: SupportedAlgorithms;
  keySize?: number;
  curve?: string; // For ECC (e.g., 'P-256', 'P-384', 'P-521')
  expiryMonths?: number;
  [key: string]: any;
}

export interface SerializedKeyMetadata {
  algorithm: SupportedAlgorithms;
  keySize?: number;
  curve?: string;
  version?: number;
  createdAt?: string;
  expiresAt?: string;
}

export interface SerializedKeys {
  publicKey: string;
  privateKey: string;
  metadata: SerializedKeyMetadata;
}

export interface KeyValidationResult {
  isValid: boolean;
  errors: string[];
  publicKeyValid: boolean;
  privateKeyValid: boolean;
  keyPairMatches: boolean;
  notExpired: boolean;
}

/**
 * Generic interface for cryptographic key providers
 * This allows the KeyManager to work with different algorithms (RSA, ECC, Ed25519, etc.)
 */
export interface KeyProvider {
  /**
   * Generate a new key pair
   */
  generateKeyPair(config: KeyGenerationConfig): CryptoKeyPair;

  /**
   * Validate that a key pair works correctly (encryption/decryption round trip)
   */
  validateKeyPair(keyPair: CryptoKeyPair): boolean;

  /**
   * Check if a key pair has expired
   */
  isKeyPairExpired(keyPair: CryptoKeyPair): boolean;

  /**
   * Get the expected private key format identifier (for validation)
   */
  getPrivateKeyFormat(): string;

  /**
   * Get the minimum recommended key size for this algorithm
   */
  getMinKeySize(): number;

  /**
   * Get the algorithm name
   */
  getAlgorithm(): SupportedAlgorithms;

  /**
   * Serialize key pair for storage
   */
  serializeKeyPair(keyPair: CryptoKeyPair): SerializedKeys;

  /**
   * Deserialize key pair from storage
   */
  deserializeKeyPair(data: SerializedKeys): CryptoKeyPair;

  /**
   * Validate configuration parameters for this algorithm
   */
  validateConfig(config: KeyGenerationConfig): string[];
}
