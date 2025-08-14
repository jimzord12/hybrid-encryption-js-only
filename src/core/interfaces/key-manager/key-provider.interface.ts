import { SupportedAlgorithms } from '../..';
import { KeyGenerationConfig, SerializedKeys } from '../../providers';
import { KeyPair } from '../common/index.interface';

/**
 * Generic interface for cryptographic key providers
 * This allows the KeyManager to work with different algorithms (RSA, ECC, Ed25519, etc.)
 */
export interface KeyProvider {
  /**
   * Generate a new key pair
   */
  generateKeyPair(config: KeyGenerationConfig): KeyPair;

  /**
   * Validate that a key pair works correctly (encryption/decryption round trip)
   */
  validateKeyPair(keyPair: KeyPair): boolean;

  /**
   * Check if a key pair has expired
   */
  isKeyPairExpired(keyPair: KeyPair): boolean;

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
  serializeKeyPair(keyPair: KeyPair): SerializedKeys;

  /**
   * Deserialize key pair from storage
   */
  deserializeKeyPair(data: SerializedKeys): KeyPair;

  /**
   * Validate configuration parameters for this algorithm
   * returns an array of error messages, or an empty array if valid
   */
  validateConfig(config: KeyGenerationConfig): string[];
}
