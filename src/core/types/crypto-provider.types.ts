// Generic Cryptographic Provider Types
// This file defines the interfaces for algorithm-agnostic key management

// Post-quantum and modern cryptographic algorithms
export type SupportedAlgorithms = 'ml-kem-768';
/**
 * Modern crypto key pair interface - compatible with ModernKeyPair
 * Uses binary format and supports multiple algorithms
 */
export interface CryptoKeyPair {
  algorithm: SupportedAlgorithms; // Updated to supported algorithms
  publicKey: Uint8Array; // Changed to binary format
  privateKey?: Uint8Array; // Optional: RSA/ECC style private key
  secretKey?: Uint8Array; // Optional: ML-KEM style secret key (at least one of privateKey/secretKey required)
  version?: number;
  createdAt?: Date;
  expiresAt?: Date;
  keySize?: number;
  curve?: string; // For ECC algorithms
  parameters?: Record<string, any>; // Algorithm-specific parameters
}

// export interface ModernKeyPair {
//   algorithm: string; // Algorithm identifier (e.g., 'ML-KEM-768')
//   publicKey: Uint8Array; // Always binary format - no PEM
//   privateKey: Uint8Array; // Always binary format - no PEM
//   metadata: {
//     version: number; // Key format version
//     createdAt: Date; // When the key was generated
//     expiresAt?: Date; // Optional expiration
//     keySize?: number; // Key size in bits (if applicable)
//     curve?: string; // Curve name (for ECC algorithms)
//     parameters?: Record<string, any>; // Algorithm-specific parameters
//   }

export interface KeyGenerationConfig {
  algorithm: SupportedAlgorithms;
  keySize?: number;
  curve?: string; // For ECC (e.g., 'P-256', 'P-384', 'P-521')
  expiryMonths?: number;
  // [key: string]: any;
}

export interface SerializedKeyMetadata {
  algorithm: SupportedAlgorithms;
  keySize?: number;
  curve?: string;
  version?: number;
  createdAt?: string;
  expiresAt?: string;
  parameters?: Record<string, any>; // Algorithm-specific parameters
}

/**
 * Serialized keys interface - for storage and transmission
 * Keys are Base64 encoded for storage in JSON/text formats
 */
export interface SerializedKeys {
  publicKey: string; // Base64 encoded binary key
  privateKey: string; // Base64 encoded binary key
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

// /**
//  * Utility namespace for key format conversions
//  */
// export namespace KeyFormatUtils {
//   /**
//    * Convert CryptoKeyPair to SerializedKeys for storage
//    */
//   export function serializeKeyPair(keyPair: CryptoKeyPair): SerializedKeys {
//     const metadata: SerializedKeyMetadata = {
//       algorithm: keyPair.algorithm,
//     };

//     // Only add optional properties if they exist
//     if (keyPair.keySize !== undefined) metadata.keySize = keyPair.keySize;
//     if (keyPair.curve !== undefined) metadata.curve = keyPair.curve;
//     if (keyPair.version !== undefined) metadata.version = keyPair.version;
//     if (keyPair.createdAt !== undefined) metadata.createdAt = keyPair.createdAt.toISOString();
//     if (keyPair.expiresAt !== undefined) metadata.expiresAt = keyPair.expiresAt.toISOString();
//     if (keyPair.parameters !== undefined) metadata.parameters = keyPair.parameters;

//     return {
//       publicKey: Buffer.from(keyPair.publicKey).toString('base64'),
//       privateKey: Buffer.from(keyPair.privateKey).toString('base64'),
//       metadata,
//     };
//   }

//   /**
//    * Convert SerializedKeys to CryptoKeyPair from storage
//    */
//   export function deserializeKeyPair(data: SerializedKeys): CryptoKeyPair {
//     const publicKeyBytes = Uint8Array.from(atob(data.publicKey), c => c.charCodeAt(0));
//     const privateKeyBytes = Uint8Array.from(atob(data.privateKey), c => c.charCodeAt(0));

//     const result: CryptoKeyPair = {
//       publicKey: publicKeyBytes,
//       privateKey: privateKeyBytes,
//       algorithm: data.metadata.algorithm,
//     };

//     // Only add optional properties if they exist in metadata
//     if (data.metadata.keySize !== undefined) result.keySize = data.metadata.keySize;
//     if (data.metadata.curve !== undefined) result.curve = data.metadata.curve;
//     if (data.metadata.version !== undefined) result.version = data.metadata.version;
//     if (data.metadata.createdAt !== undefined) result.createdAt = new Date(data.metadata.createdAt);
//     if (data.metadata.expiresAt !== undefined) result.expiresAt = new Date(data.metadata.expiresAt);
//     if (data.metadata.parameters !== undefined) result.parameters = data.metadata.parameters;

//     return result;
//   }

//   /**
//    * Check if two key pairs are equivalent
//    */
//   export function areKeyPairsEqual(a: CryptoKeyPair, b: CryptoKeyPair): boolean {
//     return (
//       a.algorithm === b.algorithm &&
//       a.publicKey.length === b.publicKey.length &&
//       a.privateKey.length === b.privateKey.length &&
//       a.publicKey.every((byte, index) => byte === b.publicKey[index]) &&
//       a.privateKey.every((byte, index) => byte === b.privateKey[index])
//     );
//   }
// }
